const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { vaultFilesRoot, vaultRoot } = require('./vaults');

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

function saveCache(vaultId, cache) {
  fs.writeFileSync(manifestCachePath(vaultId), JSON.stringify(cache));
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

/** Build a manifest: { path: { size, mtimeMs, hash } }, cached by size+mtimeMs to avoid re-hashing unchanged files. */
function getManifest(vaultId) {
  const root = vaultFilesRoot(vaultId);
  const cache = loadCache(vaultId);
  const nextCache = {};
  const manifest = {};

  for (const rel of walk(root, root)) {
    const full = path.join(root, rel);
    const stat = fs.statSync(full);
    const cached = cache[rel];
    let hash;
    if (cached && cached.size === stat.size && cached.mtimeMs === stat.mtimeMs) {
      hash = cached.hash;
    } else {
      hash = sha256(fs.readFileSync(full));
    }
    nextCache[rel] = { size: stat.size, mtimeMs: stat.mtimeMs, hash };
    manifest[rel] = { size: stat.size, mtime: stat.mtimeMs, hash };
  }

  saveCache(vaultId, nextCache);
  return manifest;
}

function readFile(vaultId, relPath) {
  const full = safeJoin(vaultFilesRoot(vaultId), relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full);
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
  fs.writeFileSync(p, JSON.stringify(entries));
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
  return { written: true, conflict: null, currentHash: hash };
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

  return true;
}

module.exports = {
  getManifest,
  readFile,
  writeFile,
  deleteFile,
  sha256,
  safeJoin,
  listHistory,
  readHistoryVersion,
  listTrash,
  restoreFromTrash,
  purgeTrash,
};
