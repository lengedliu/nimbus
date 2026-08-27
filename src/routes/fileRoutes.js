const express = require('express');
const { requireAuth } = require('../auth');
const vaults = require('../vaults');
const storage = require('../storage');
const syncLogger = require('../syncLogger');

const router = express.Router();
router.use(requireAuth);

function checkAccess(req, res, requireWrite = false) {
  const { vaultId } = req.params;
  const isAdmin = req.user.role === 'admin';
  if (requireWrite) {
    if (!vaults.hasWriteAccess(req.user.id, vaultId, isAdmin)) {
      res.status(403).json({ error: '此笔记库仅支持只读访问，无写入修改权限' });
      return false;
    }
  } else {
    if (!vaults.hasReadAccess(req.user.id, vaultId, isAdmin)) {
      res.status(404).json({ error: 'Not found or no access' });
      return false;
    }
  }
  return true;
}

// GET file content
router.get('/:vaultId/files/*', (req, res) => {
  if (!checkAccess(req, res, false)) return;
  const relPath = req.params[0];
  const buf = storage.readFile(req.params.vaultId, relPath);
  if (buf === null) return res.status(404).json({ error: 'File not found' });

  // Optional pull log (debug/trace level)
  syncLogger.recordLog({
    vaultId: req.params.vaultId,
    userId: req.user.id,
    username: req.user.username,
    deviceName: req.headers['x-device-name'] || 'REST / Web',
    clientIp: req.ip || req.connection.remoteAddress,
    action: 'pull',
    path: relPath,
    size: buf.length,
    status: 'success',
    detail: '读取笔记文件',
  });

  res.set('Content-Type', 'application/octet-stream');
  res.send(buf);
});

// PUT (create/update) file content. Body = raw bytes.
// Headers: X-Mtime (ms since epoch, optional), X-Base-Hash (hash client last knew, optional — used for conflict detection)
router.put(
  '/:vaultId/files/*',
  express.raw({ type: '*/*', limit: '50mb' }),
  (req, res) => {
    if (!checkAccess(req, res, true)) return;
    const relPath = req.params[0];
    const mtime = req.headers['x-mtime'] ? parseInt(req.headers['x-mtime'], 10) : undefined;
    const baseHash = req.headers['x-base-hash'] || undefined;
    const deviceName = req.headers['x-device-name'] || 'REST / Web Client';
    const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
    try {
      const result = storage.writeFile(req.params.vaultId, relPath, buffer, { mtime, baseHash });
      req.app.get('fnsHub').broadcastFileChange(req.params.vaultId, relPath, result, req.user.id);

      if (!result.written && result.conflict) {
        syncLogger.recordLog({
          vaultId: req.params.vaultId,
          userId: req.user.id,
          username: req.user.username,
          deviceName,
          clientIp: req.ip || req.connection.remoteAddress,
          action: 'conflict',
          path: relPath,
          size: buffer.length,
          hash: result.currentHash,
          status: 'conflict',
          detail: `版本冲突，已自动生成冲突副本: ${result.conflict}`,
        });
      } else {
        syncLogger.recordLog({
          vaultId: req.params.vaultId,
          userId: req.user.id,
          username: req.user.username,
          deviceName,
          clientIp: req.ip || req.connection.remoteAddress,
          action: 'update',
          path: relPath,
          size: buffer.length,
          hash: result.currentHash,
          status: 'success',
          detail: '成功写入并同步文件',
        });
      }

      res.json(result);
    } catch (e) {
      syncLogger.recordLog({
        vaultId: req.params.vaultId,
        userId: req.user.id,
        username: req.user.username,
        deviceName,
        clientIp: req.ip || req.connection.remoteAddress,
        action: 'update',
        path: relPath,
        size: buffer.length,
        status: 'error',
        detail: `写入失败: ${e.message}`,
      });
      res.status(400).json({ error: e.message });
    }
  }
);

// DELETE file
router.delete('/:vaultId/files/*', (req, res) => {
  if (!checkAccess(req, res, true)) return;
  const relPath = req.params[0];
  const deviceName = req.headers['x-device-name'] || 'REST / Web Client';
  const ok = storage.deleteFile(req.params.vaultId, relPath);
  req.app.get('fnsHub').broadcastFileDelete(req.params.vaultId, relPath, req.user.id);

  syncLogger.recordLog({
    vaultId: req.params.vaultId,
    userId: req.user.id,
    username: req.user.username,
    deviceName,
    clientIp: req.ip || req.connection.remoteAddress,
    action: 'delete',
    path: relPath,
    status: ok ? 'success' : 'error',
    detail: ok ? '移入回收站 (软删除)' : '文件不存在或删除失败',
  });

  res.json({ deleted: ok });
});

module.exports = router;
