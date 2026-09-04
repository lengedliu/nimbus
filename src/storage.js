const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');
const { vaultFilesRoot, vaultRoot } = require('./vaults');
const gitSync = require('./gitSync');

/*
 * Layout inside a vault's data folder:
 *   files/                the actual synced note/attachment tree (this is
 *                          the only part reflected in getManifest() / synced
 *                          to Obsidian clients)
 *   manifest-cache.json    hash cache, keyed by path (sibling of files/)
 *   history/               snapshots of overwritten file content
 *   history-index.json     [{id, path, size, savedAt}]
 *   trash/                  soft-deleted files, kept until purged
 *   trash-index.json        [{id, path, size, deletedAt}]
 */

const MAX_HISTORY_VERSIONS_PER_PATH = 20;

/** Prevent path traversal: resolve relPath against root and ensure it stays inside root. */
function safeJoin(root, relPath) {
  const normalized = path.normalize(relPath).replace(/^(\.\.[/\\])+/, '');
  const full = path.join(root, normalized);
  if (!full.startsWith(path.resolve(root) + path.sep) && full !== path.resolve(root)) {
    throw new Error('Invalid path (outside vault root)');
  }
  return full;
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function randomId() {
  return crypto.randomBytes(8).toString('hex');
}

/** Rename, falling back to copy+unlink if src/dest are on different filesystems (EXDEV). */
function moveFile(src, dest) {
  try {
    fs.renameSync(src, dest);
  } catch (err) {
    if (err && err.code === 'EXDEV') {
      fs.copyFileSync(src, dest);
      fs.unlinkSync(src);
    } else {
      throw err;
    }
  }
}

// ------------------------------- manifest cache -------------------------------

function manifestCachePath(vaultId) {
  return path.join(vaultRoot(vaultId), 'manifest-cache.json');
}

function loadCache(vaultId) {
  const p = manifestCachePath(vaultId);
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

// In-memory manifest cache: vaultId -> { manifest, lastScanned }
const inMemoryManifestCache = new Map();

function invalidateManifestCache(vaultId) {
  inMemoryManifestCache.delete(vaultId);
  contentCache.delete(vaultId);
}

function updateManifestEntry(vaultId, relPath, meta) {
  const cachedMem = inMemoryManifestCache.get(vaultId);
  if (cachedMem && cachedMem.manifest) {
    if (meta === null) {
      delete cachedMem.manifest[relPath];
    } else {
      cachedMem.manifest[relPath] = meta;
    }
  }
}

function saveCache(vaultId, cache) {
  const p = manifestCachePath(vaultId);
  const tmp = p + '.tmp.' + Date.now();
  try {
    fs.writeFileSync(tmp, JSON.stringify(cache));
    fs.renameSync(tmp, p);
  } catch {
    try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch {}
  }
}

/** Recursively list all files under a vault's files/ dir. */
function walk(dir, base, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full).split(path.sep).join('/');
    if (entry.isDirectory()) {
      walk(full, base, out);
    } else if (entry.isFile()) {
      out.push(rel);
    }
  }
  return out;
}

/** Build a manifest: { path: { size, mtimeMs, hash } }, cached in memory and on disk. */
function getManifest(vaultId, forceRefresh = false) {
  const cachedMem = inMemoryManifestCache.get(vaultId);
  if (!forceRefresh && cachedMem && cachedMem.manifest) {
    return cachedMem.manifest;
  }

  const root = vaultFilesRoot(vaultId);
  const cache = loadCache(vaultId);
  const nextCache = {};
  const manifest = {};

  for (const rel of walk(root, root)) {
    const full = path.join(root, rel);
    try {
      const stat = fs.statSync(full);
      const cached = cache[rel];
      let hash;
      if (cached && cached.size === stat.size && cached.mtimeMs === stat.mtimeMs) {
        hash = cached.hash;
      } else {
        hash = sha256(fs.readFileSync(full));
      }
      const ctime = (stat.birthtimeMs && stat.birthtimeMs > 0) ? stat.birthtimeMs : (stat.ctimeMs || stat.mtimeMs);
      nextCache[rel] = { size: stat.size, mtimeMs: stat.mtimeMs, ctimeMs: ctime, hash };
      manifest[rel] = { size: stat.size, mtime: stat.mtimeMs, ctime, hash };
    } catch {
      // File could be deleted or locked concurrently
    }
  }

  saveCache(vaultId, nextCache);
  inMemoryManifestCache.set(vaultId, { manifest, lastScanned: Date.now() });
  return manifest;
}

function readFile(vaultId, relPath) {
  const full = safeJoin(vaultFilesRoot(vaultId), relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full);
}

/**
 * 拿一个可读流用于下载，而不是把整份文件读进内存再 res.send(buf)。
 * 对大附件（视频、PDF、压缩包……）来说，流式传输能显著降低单次请求的内存占用，
 * 也不会因为同步 readFileSync 而卡住事件循环。
 */
function readFileStream(vaultId, relPath) {
  const full = safeJoin(vaultFilesRoot(vaultId), relPath);
  if (!fs.existsSync(full)) return null;
  const stat = fs.statSync(full);
  return { stream: fs.createReadStream(full), size: stat.size };
}

function tmpUploadDir(vaultId) {
  return path.join(vaultRoot(vaultId), '.tmp-uploads');
}

/**
 * 服务器重启前如果正好有上传在进行中，进程一退出这些临时文件必然是半成品、
 * 不可能再被续传完成——启动时统一清一遍，避免每次重启都留一堆垃圾文件占磁盘。
 */
function cleanupAllStaleUploadTemps() {
  const { VAULTS_DIR } = require('./config');
  if (!fs.existsSync(VAULTS_DIR)) return;
  let vaultDirs;
  try {
    vaultDirs = fs.readdirSync(VAULTS_DIR, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of vaultDirs) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(VAULTS_DIR, entry.name, '.tmp-uploads');
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch (e) {
        console.warn(`[Storage] Failed to clean stale upload temp dir ${dir}:`, e.message);
      }
    }
  }
}

/** 生成一个供上传流写入的临时文件路径（调用方负责在出错时清理）。 */
function createUploadTempPath(vaultId) {
  const dir = tmpUploadDir(vaultId);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `upload-${Date.now()}-${randomId()}.part`);
}

function touchMtime(full, mtimeMs) {
  if (!mtimeMs) return;
  const d = new Date(mtimeMs);
  fs.utimesSync(full, d, d);
}

// ---------------------------------- history ------------------------------------

function historyDir(vaultId) {
  return path.join(vaultRoot(vaultId), 'history');
}
function historyIndexPath(vaultId) {
  return path.join(vaultRoot(vaultId), 'history-index.json');
}
function loadIndex(p) {
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return [];
  }
}
function saveIndex(p, entries) {
  const tmp = p + '.tmp.' + Date.now();
  try {
    fs.writeFileSync(tmp, JSON.stringify(entries, null, 2));
    fs.renameSync(tmp, p);
  } catch {
    try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch {}
  }
}

/** Snapshot the current (about-to-be-overwritten) content of a file into history. */
function snapshotBeforeOverwrite(vaultId, relPath, oldBuffer) {
  fs.mkdirSync(historyDir(vaultId), { recursive: true });
  const id = randomId();
  fs.writeFileSync(path.join(historyDir(vaultId), id), oldBuffer);

  const idxPath = historyIndexPath(vaultId);
  let entries = loadIndex(idxPath);
  entries.push({ id, path: relPath, size: oldBuffer.length, savedAt: Date.now() });

  // Cap history per path so it can't grow unbounded.
  const forThisPath = entries.filter((e) => e.path === relPath).sort((a, b) => a.savedAt - b.savedAt);
  if (forThisPath.length > MAX_HISTORY_VERSIONS_PER_PATH) {
    const toDrop = forThisPath.slice(0, forThisPath.length - MAX_HISTORY_VERSIONS_PER_PATH);
    const dropIds = new Set(toDrop.map((e) => e.id));
    for (const e of toDrop) {
      const f = path.join(historyDir(vaultId), e.id);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    entries = entries.filter((e) => !dropIds.has(e.id));
  }

  saveIndex(idxPath, entries);
}

/**
 * 同上，但直接从磁盘上的已有文件复制到 history/，不把旧内容读进内存。
 * 流式上传路径（writeFileFromPath）用这个版本，避免"只是为了存历史快照"
 * 而把一份可能很大的旧文件整个 Buffer 化。
 */
function snapshotBeforeOverwriteFromFile(vaultId, relPath, existingFullPath, existingSize) {
  fs.mkdirSync(historyDir(vaultId), { recursive: true });
  const id = randomId();
  fs.copyFileSync(existingFullPath, path.join(historyDir(vaultId), id));

  const idxPath = historyIndexPath(vaultId);
  let entries = loadIndex(idxPath);
  entries.push({ id, path: relPath, size: existingSize, savedAt: Date.now() });

  const forThisPath = entries.filter((e) => e.path === relPath).sort((a, b) => a.savedAt - b.savedAt);
  if (forThisPath.length > MAX_HISTORY_VERSIONS_PER_PATH) {
    const toDrop = forThisPath.slice(0, forThisPath.length - MAX_HISTORY_VERSIONS_PER_PATH);
    const dropIds = new Set(toDrop.map((e) => e.id));
    for (const e of toDrop) {
      const f = path.join(historyDir(vaultId), e.id);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    entries = entries.filter((e) => !dropIds.has(e.id));
  }

  saveIndex(idxPath, entries);
}

function listHistory(vaultId, relPath) {
  return loadIndex(historyIndexPath(vaultId))
    .filter((e) => e.path === relPath)
    .sort((a, b) => b.savedAt - a.savedAt);
}

function readHistoryVersion(vaultId, versionId) {
  const entry = loadIndex(historyIndexPath(vaultId)).find((e) => e.id === versionId);
  if (!entry) return null;
  const full = path.join(historyDir(vaultId), versionId);
  if (!fs.existsSync(full)) return null;
  return { entry, buffer: fs.readFileSync(full) };
}

// ------------------------------------ trash --------------------------------------

function trashDir(vaultId) {
  return path.join(vaultRoot(vaultId), 'trash');
}
function trashIndexPath(vaultId) {
  return path.join(vaultRoot(vaultId), 'trash-index.json');
}

function listTrash(vaultId) {
  return loadIndex(trashIndexPath(vaultId)).sort((a, b) => b.deletedAt - a.deletedAt);
}

/** Restore a trashed file back to its original path (overwrites anything currently there). */
function restoreFromTrash(vaultId, trashId) {
  const idxPath = trashIndexPath(vaultId);
  const entries = loadIndex(idxPath);
  const entry = entries.find((e) => e.id === trashId);
  if (!entry) return null;

  const trashFull = path.join(trashDir(vaultId), trashId);
  if (!fs.existsSync(trashFull)) return null;
  const buffer = fs.readFileSync(trashFull);

  const destFull = safeJoin(vaultFilesRoot(vaultId), entry.path);
  fs.mkdirSync(path.dirname(destFull), { recursive: true });
  fs.writeFileSync(destFull, buffer);

  fs.unlinkSync(trashFull);
  saveIndex(idxPath, entries.filter((e) => e.id !== trashId));
  const hash = sha256(buffer);
  const now = Date.now();
  updateManifestEntry(vaultId, entry.path, { size: buffer.length, mtime: now, ctime: now, hash });
  invalidateContentCacheEntry(vaultId, entry.path);
  try {
    gitSync.notifyChange(vaultId);
  } catch {}
  return entry.path;
}

/** Permanently delete a trashed item (no way back after this). */
function purgeTrash(vaultId, trashId) {
  const idxPath = trashIndexPath(vaultId);
  const entries = loadIndex(idxPath);
  const entry = entries.find((e) => e.id === trashId);
  if (!entry) return false;
  const f = path.join(trashDir(vaultId), trashId);
  if (fs.existsSync(f)) fs.unlinkSync(f);
  saveIndex(idxPath, entries.filter((e) => e.id !== trashId));
  return true;
}

/** Purge all items in trash. */
function purgeAllTrash(vaultId) {
  const idxPath = trashIndexPath(vaultId);
  const entries = loadIndex(idxPath);
  for (const entry of entries) {
    const f = path.join(trashDir(vaultId), entry.id);
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  saveIndex(idxPath, []);
  return entries.length;
}

/** Read content of a trashed file for preview. */
function readTrashVersion(vaultId, trashId) {
  const idxPath = trashIndexPath(vaultId);
  const entries = loadIndex(idxPath);
  const entry = entries.find((e) => e.id === trashId);
  if (!entry) return null;
  const trashFull = path.join(trashDir(vaultId), trashId);
  if (!fs.existsSync(trashFull)) return null;
  return { entry, buffer: fs.readFileSync(trashFull) };
}

// -------------------------------- write / delete ----------------------------------

/**
 * Write a file, with:
 *  - conflict-copy protection: if the file changed on the server since the
 *    caller last knew about it (baseHash mismatch), save a `.conflict-*`
 *    copy instead of silently overwriting.
 *  - automatic history snapshot: any real overwrite saves the previous
 *    content into history/ first, so it can be recovered later.
 */
function writeFile(vaultId, relPath, buffer, { mtime, baseHash } = {}) {
  const root = vaultFilesRoot(vaultId);
  const full = safeJoin(root, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });

  if (fs.existsSync(full)) {
    const existingBuf = fs.readFileSync(full);
    const existingHash = sha256(existingBuf);
    const incomingHash = sha256(buffer);

    if (existingHash === incomingHash) {
      // No real change — just acknowledge, no history entry needed.
      if (mtime) touchMtime(full, mtime);
      return { written: true, conflict: null, currentHash: incomingHash };
    }

    if (baseHash && existingHash !== baseHash) {
      // Someone else changed the file since this client last synced it — real conflict.
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const ext = path.extname(relPath);
      const base = relPath.slice(0, relPath.length - ext.length);
      const conflictRel = `${base}.conflict-${stamp}${ext}`;
      const conflictFull = safeJoin(root, conflictRel);
      fs.writeFileSync(conflictFull, buffer);
      // Don't touch the existing (server) version in this case.
      return { written: false, conflict: conflictRel, currentHash: existingHash };
    }

    snapshotBeforeOverwrite(vaultId, relPath, existingBuf);
  }

  fs.writeFileSync(full, buffer);
  if (mtime) touchMtime(full, mtime);
  const hash = sha256(buffer);
  const mtimeVal = mtime || Date.now();
  updateManifestEntry(vaultId, relPath, { size: buffer.length, mtime: mtimeVal, ctime: mtimeVal, hash });
  invalidateContentCacheEntry(vaultId, relPath);
  try {
    gitSync.notifyChange(vaultId);
  } catch {}
  return { written: true, conflict: null, currentHash: hash };
}

/**
 * 流式版本的 writeFile：调用方已经把上传内容写到磁盘上的临时文件 tempFilePath，
 * 并且在流式接收的同时算好了 incomingHash（不需要在这里再整份读一遍新内容）。
 * 判断"服务器上现有内容"是否相同时，直接用 manifest 缓存里已经算好的 hash，
 * 而不是重新读盘+重新 sha256——这是这条路径相对 writeFile() 省掉的第二处整读整算。
 * 最终落盘用 rename（同分区下几乎零成本），而不是再写一次 Buffer。
 */
function writeFileFromPath(vaultId, relPath, tempFilePath, incomingHash, { mtime, baseHash } = {}) {
  const root = vaultFilesRoot(vaultId);
  const full = safeJoin(root, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });

  const manifest = getManifest(vaultId);
  const existingMeta = manifest[relPath];

  if (existingMeta && fs.existsSync(full)) {
    const existingHash = existingMeta.hash;

    if (existingHash === incomingHash) {
      // 内容没有实际变化，丢弃临时文件，只在需要时touch一下 mtime。
      try { fs.unlinkSync(tempFilePath); } catch {}
      if (mtime) touchMtime(full, mtime);
      return { written: true, conflict: null, currentHash: incomingHash };
    }

    if (baseHash && existingHash !== baseHash) {
      // 服务器上的版本在这期间被别的设备改过——生成冲突副本，不动现有文件。
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const ext = path.extname(relPath);
      const base = relPath.slice(0, relPath.length - ext.length);
      const conflictRel = `${base}.conflict-${stamp}${ext}`;
      const conflictFull = safeJoin(root, conflictRel);
      moveFile(tempFilePath, conflictFull);
      return { written: false, conflict: conflictRel, currentHash: existingHash };
    }

    // 真实覆盖：把旧文件直接拷贝进 history/（不读进内存），再用临时文件替换它。
    snapshotBeforeOverwriteFromFile(vaultId, relPath, full, existingMeta.size);
  }

  moveFile(tempFilePath, full);
  if (mtime) touchMtime(full, mtime);
  const stat = fs.statSync(full);
  const mtimeVal = mtime || Date.now();
  updateManifestEntry(vaultId, relPath, { size: stat.size, mtime: mtimeVal, ctime: mtimeVal, hash: incomingHash });
  invalidateContentCacheEntry(vaultId, relPath);
  try {
    gitSync.notifyChange(vaultId);
  } catch {}
  return { written: true, conflict: null, currentHash: incomingHash };
}

/** Soft-delete: move the file into trash/ instead of unlinking it outright. */
function deleteFile(vaultId, relPath) {
  const full = safeJoin(vaultFilesRoot(vaultId), relPath);
  if (!fs.existsSync(full)) return false;

  fs.mkdirSync(trashDir(vaultId), { recursive: true });
  const id = randomId();
  fs.renameSync(full, path.join(trashDir(vaultId), id));

  const idxPath = trashIndexPath(vaultId);
  const entries = loadIndex(idxPath);
  entries.push({ id, path: relPath, size: fs.statSync(path.join(trashDir(vaultId), id)).size, deletedAt: Date.now() });
  saveIndex(idxPath, entries);
  updateManifestEntry(vaultId, relPath, null);
  invalidateContentCacheEntry(vaultId, relPath);
  try {
    gitSync.notifyChange(vaultId);
  } catch {}

  return true;
}

// ------------------------------ search & stats -----------------------------------

// 每个 vault 一份文本内容缓存：relPath -> { mtimeMs, size, content }
// 命中缓存就不用再同步读盘，是重复搜索时最大的一块开销来源。
const contentCache = new Map();

function getContentCache(vaultId) {
  if (!contentCache.has(vaultId)) contentCache.set(vaultId, new Map());
  return contentCache.get(vaultId);
}

/** 文件被写入/删除时，让内容缓存跟着失效——避免搜索命中过期内容。 */
function invalidateContentCacheEntry(vaultId, relPath) {
  const cache = contentCache.get(vaultId);
  if (cache) cache.delete(relPath);
}

const SEARCHABLE_EXT_RE = /\.(md|txt|json|js|ts|css|html|yaml|yml|csv|canvas)$/i;
// 每处理这么多个文件就让出一次事件循环，避免大 vault 全文搜索长时间卡住整个进程
const SEARCH_YIELD_BATCH_SIZE = 40;

function yieldToEventLoop() {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * 读取文本文件内容并使用内存缓存（以 mtimeMs 与 size 为 cache key）。
 * 避免频繁重复读取磁盘，减少全库扫描时的磁盘 I/O 压力。
 */
function readCachedText(vaultId, relPath, meta = null) {
  const cache = getContentCache(vaultId);
  const cached = cache.get(relPath);
  const expectedMtime = meta ? meta.mtime : null;
  const expectedSize = meta ? meta.size : null;

  if (cached && (expectedMtime === null || cached.mtimeMs === expectedMtime) && (expectedSize === null || cached.size === expectedSize)) {
    return cached.content;
  }

  const buf = readFile(vaultId, relPath);
  if (!buf) return null;
  const text = buf.toString('utf8');
  cache.set(relPath, {
    mtimeMs: expectedMtime || Date.now(),
    size: expectedSize !== null ? expectedSize : buf.length,
    content: text,
  });
  return text;
}

/**
 * 搜索文件名与文本内容。
 * 现在是 async 的：一是可以复用内容缓存少读盘，二是每处理一批文件就
 * 主动让出一次事件循环，这样一次大范围搜索不会把其他用户的请求、
 * WebSocket 同步消息完全卡住，只是自己跑得稍微久一点。
 */
async function searchVault(vaultId, query, limit = 50) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const manifest = getManifest(vaultId);
  const paths = Object.keys(manifest).sort();
  const results = [];

  let processed = 0;
  for (const relPath of paths) {
    if (results.length >= limit) break;
    const meta = manifest[relPath];
    const pathLower = relPath.toLowerCase();
    const isPathMatch = pathLower.includes(q);

    let snippet = '';
    let matchesCount = 0;

    if (SEARCHABLE_EXT_RE.test(relPath)) {
      const text = readCachedText(vaultId, relPath, meta);

      if (text) {
        const lowerText = text.toLowerCase();
        let idx = lowerText.indexOf(q);
        while (idx !== -1 && matchesCount < 5) {
          matchesCount++;
          if (!snippet) {
            const start = Math.max(0, idx - 40);
            const end = Math.min(text.length, idx + q.length + 60);
            snippet = (start > 0 ? '…' : '') + text.slice(start, end).replace(/[\r\n]+/g, ' ') + (end < text.length ? '…' : '');
          }
          idx = lowerText.indexOf(q, idx + q.length);
        }
      }
    }

    if (isPathMatch || matchesCount > 0) {
      results.push({
        path: relPath,
        size: meta.size,
        mtime: meta.mtime,
        isPathMatch,
        matchesCount,
        snippet,
      });
    }

    processed++;
    if (processed % SEARCH_YIELD_BATCH_SIZE === 0) {
      await yieldToEventLoop();
    }
  }

  return results;
}

/** Vault statistics summary. */
function getVaultStats(vaultId) {
  const manifest = getManifest(vaultId);
  const paths = Object.keys(manifest);
  let totalBytes = 0;
  let notesCount = 0;
  let attachmentsCount = 0;
  let configsCount = 0;

  for (const p of paths) {
    const meta = manifest[p];
    totalBytes += meta.size;
    if (p.toLowerCase().endsWith('.md')) {
      notesCount++;
    } else if (p.startsWith('.obsidian/')) {
      configsCount++;
    } else {
      attachmentsCount++;
    }
  }

  const trashEntries = loadIndex(trashIndexPath(vaultId));
  const historyEntries = loadIndex(historyIndexPath(vaultId));

  return {
    totalFiles: paths.length,
    notesCount,
    attachmentsCount,
    configsCount,
    totalBytes,
    trashCount: trashEntries.length,
    historyCount: historyEntries.length,
  };
}

/** Stream a ZIP archive of all files in vault's files/ folder. */
function exportVaultZip(vaultId, outputStream) {
  const archive = archiver('zip', { zlib: { level: 6 } });
  archive.pipe(outputStream);
  const root = vaultFilesRoot(vaultId);
  if (fs.existsSync(root)) {
    archive.directory(root, false);
  }
  return archive.finalize();
}

/**
 * Clean up old history versions according to retention policy:
 * - Keep all versions within maxDays (default 30 days)
 * - Cap max versions per file (default 20)
 * Returns { cleanedCount, freedBytes }
 */
function cleanupOldHistoryVersions(vaultId, maxDays = 30, maxVersionsPerPath = 20) {
  const idxPath = historyIndexPath(vaultId);
  let entries = loadIndex(idxPath);
  if (!entries.length) return { cleanedCount: 0, freedBytes: 0 };

  const cutoff = Date.now() - maxDays * 24 * 60 * 60 * 1000;
  const byPath = new Map();

  for (const entry of entries) {
    if (!byPath.has(entry.path)) byPath.set(entry.path, []);
    byPath.get(entry.path).push(entry);
  }

  const toKeep = [];
  const toDrop = [];

  for (const [filePath, fileEntries] of byPath.entries()) {
    // Sort newest first
    fileEntries.sort((a, b) => b.savedAt - a.savedAt);
    fileEntries.forEach((entry, idx) => {
      // Keep at least 1 most recent version even if older than cutoff
      if (idx === 0) {
        toKeep.push(entry);
      } else if (idx >= maxVersionsPerPath || entry.savedAt < cutoff) {
        toDrop.push(entry);
      } else {
        toKeep.push(entry);
      }
    });
  }

  let freedBytes = 0;
  for (const drop of toDrop) {
    const full = path.join(historyDir(vaultId), drop.id);
    try {
      if (fs.existsSync(full)) {
        freedBytes += drop.size || 0;
        fs.unlinkSync(full);
      }
    } catch {}
  }

  saveIndex(idxPath, toKeep);
  return { cleanedCount: toDrop.length, freedBytes };
}

module.exports = {
  getManifest,
  invalidateManifestCache,
  readFile,
  readFileStream,
  readCachedText,
  yieldToEventLoop,
  invalidateContentCacheEntry,
  createUploadTempPath,
  writeFile,
  writeFileFromPath,
  deleteFile,
  sha256,
  safeJoin,
  listHistory,
  readHistoryVersion,
  cleanupOldHistoryVersions,
  listTrash,
  readTrashVersion,
  restoreFromTrash,
  purgeTrash,
  purgeAllTrash,
  searchVault,
  getVaultStats,
  exportVaultZip,
  cleanupAllStaleUploadTemps,
};
