const fs = require('fs');
const path = require('path');
const storage = require('./storage');
const vaults = require('./vaults');
const webhooks = require('./webhooks');

/**
 * Identify all conflict files in a vault.
 * Standard format: <dir>/<name>.conflict-<timestamp>.<ext>
 */
function findConflictsInDir(dir, baseDir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(baseDir, full).split(path.sep).join('/');
    if (entry.isDirectory()) {
      findConflictsInDir(full, baseDir, out);
    } else if (entry.isFile()) {
      if (/\.conflict-[^/]+$/i.test(entry.name) || entry.name.includes('.conflict-')) {
        out.push(rel);
      }
    }
  }
  return out;
}

/** Parse base file path from a conflict relative path. */
function getBasePathFromConflict(conflictRelPath) {
  // e.g. "Notes/Daily.conflict-2026-08-27T07-20-00.md" -> "Notes/Daily.md"
  const ext = path.extname(conflictRelPath);
  const withoutExt = conflictRelPath.slice(0, conflictRelPath.length - ext.length);
  const conflictMarkerIdx = withoutExt.lastIndexOf('.conflict-');
  if (conflictMarkerIdx !== -1) {
    return withoutExt.slice(0, conflictMarkerIdx) + ext;
  }
  return null;
}

function listConflicts(vaultId) {
  const root = vaults.vaultFilesRoot(vaultId);
  const conflictPaths = findConflictsInDir(root, root);
  const manifest = storage.getManifest(vaultId);

  return conflictPaths.map((conflictPath) => {
    const fullConflict = storage.safeJoin(root, conflictPath);
    const conflictStat = fs.existsSync(fullConflict) ? fs.statSync(fullConflict) : null;
    const basePath = getBasePathFromConflict(conflictPath);
    const fullBase = basePath ? storage.safeJoin(root, basePath) : null;
    const baseExists = fullBase && fs.existsSync(fullBase);
    const baseStat = baseExists ? fs.statSync(fullBase) : null;

    return {
      conflictPath,
      basePath,
      baseExists,
      conflictSize: conflictStat ? conflictStat.size : 0,
      conflictMtime: conflictStat ? conflictStat.mtimeMs : 0,
      baseSize: baseStat ? baseStat.size : 0,
      baseMtime: baseStat ? baseStat.mtimeMs : 0,
    };
  });
}

function getConflictDiff(vaultId, conflictPath) {
  const root = vaults.vaultFilesRoot(vaultId);
  const basePath = getBasePathFromConflict(conflictPath);
  if (!basePath) throw new Error('无法解析冲突文件的原始路径');

  const fullConflict = storage.safeJoin(root, conflictPath);
  const fullBase = storage.safeJoin(root, basePath);

  if (!fs.existsSync(fullConflict)) throw new Error('冲突文件不存在');

  const conflictBuf = fs.readFileSync(fullConflict);
  const baseBuf = fs.existsSync(fullBase) ? fs.readFileSync(fullBase) : Buffer.from('');

  const isText = /\.(md|txt|json|js|ts|css|html|yaml|yml|csv|canvas)$/i.test(conflictPath);

  if (!isText) {
    return {
      isText: false,
      conflictPath,
      basePath,
      conflictSize: conflictBuf.length,
      baseSize: baseBuf.length,
    };
  }

  const baseText = baseBuf.toString('utf8');
  const conflictText = conflictBuf.toString('utf8');

  // Simple smart 3-way combined preview
  const mergedPreview = `<<<<<<< [当前版本 (服务端已存)]\n${baseText}\n=======\n${conflictText}\n>>>>>>> [冲突版本 (客户端上传)]`;

  return {
    isText: true,
    conflictPath,
    basePath,
    baseContent: baseText,
    conflictContent: conflictText,
    mergedPreview,
    baseSize: baseBuf.length,
    conflictSize: conflictBuf.length,
  };
}

async function resolveConflict(vaultId, { conflictPath, resolution, customContent, userId, fnsHub }) {
  const root = vaults.vaultFilesRoot(vaultId);
  const basePath = getBasePathFromConflict(conflictPath);
  if (!basePath) throw new Error('无效的冲突文件路径');

  const fullConflict = storage.safeJoin(root, conflictPath);
  const fullBase = storage.safeJoin(root, basePath);

  if (!fs.existsSync(fullConflict)) throw new Error('冲突文件已被移除或不存在');

  let resolvedBuffer = null;

  if (resolution === 'keep-current') {
    // Keep server current version -> simply delete conflict copy
    if (fs.existsSync(fullConflict)) fs.unlinkSync(fullConflict);
  } else if (resolution === 'keep-conflict') {
    // Keep conflict version -> overwrite base with conflict file, delete conflict file
    const buf = fs.readFileSync(fullConflict);
    resolvedBuffer = buf;
    storage.writeFile(vaultId, basePath, buf, { mtime: Date.now() });
    if (fs.existsSync(fullConflict)) fs.unlinkSync(fullConflict);
  } else if (resolution === 'merge-both') {
    // Merge both with conflict markers
    const baseBuf = fs.existsSync(fullBase) ? fs.readFileSync(fullBase) : Buffer.from('');
    const conflictBuf = fs.readFileSync(fullConflict);
    const combined = `<<<<<<< [当前版本 (服务端)]\n${baseBuf.toString('utf8')}\n=======\n${conflictBuf.toString('utf8')}\n>>>>>>> [冲突版本 (客户端)]\n`;
    resolvedBuffer = Buffer.from(combined, 'utf8');
    storage.writeFile(vaultId, basePath, resolvedBuffer, { mtime: Date.now() });
    if (fs.existsSync(fullConflict)) fs.unlinkSync(fullConflict);
  } else if (resolution === 'custom') {
    if (typeof customContent !== 'string') throw new Error('缺少自定义合并内容');
    resolvedBuffer = Buffer.from(customContent, 'utf8');
    storage.writeFile(vaultId, basePath, resolvedBuffer, { mtime: Date.now() });
    if (fs.existsSync(fullConflict)) fs.unlinkSync(fullConflict);
  } else {
    throw new Error('未知的冲突解决策略 (可选: keep-current, keep-conflict, merge-both, custom)');
  }

  // Broadcast resolved changes to all connected clients
  if (fnsHub) {
    const manifest = storage.getManifest(vaultId);
    const meta = manifest[basePath];
    if (meta) {
      fnsHub.broadcastFileChange(vaultId, basePath, { currentHash: meta.hash }, userId);
    }
    // Also broadcast deletion of the conflict file to clean up clients
    fnsHub.broadcastFileDelete(vaultId, conflictPath, userId);
  }

  // Trigger webhook notification
  webhooks.trigger('conflict.resolved', {
    vaultId,
    conflictPath,
    basePath,
    resolution,
    resolvedByUserId: userId,
  }).catch(() => {});

  return { ok: true, basePath, resolution };
}

module.exports = {
  listConflicts,
  getConflictDiff,
  resolveConflict,
  getBasePathFromConflict,
};
