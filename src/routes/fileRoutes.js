const express = require('express');
const fs = require('fs');
const { pipeline, Transform } = require('stream');
const crypto = require('crypto');
const { requireAuth } = require('../auth');
const storage = require('../storage');
const syncLogger = require('../syncLogger');
const webhooks = require('../webhooks');
const { requireReadAccess, requireWriteAccess } = require('../permissions');

const router = express.Router();
router.use(requireAuth);

// 单次上传大小上限（字节），可用 MAX_UPLOAD_MB 环境变量覆盖。
// 流式写入之后，这个上限只是"防止无限占用磁盘"的安全阀，不再等价于"这么大都要先进内存"。
const MAX_UPLOAD_BYTES = parseInt(process.env.MAX_UPLOAD_MB || '500', 10) * 1024 * 1024;

// GET file content — 流式下载，不再把整个文件先读进内存。
router.get('/:vaultId/files/*', (req, res) => {
  if (!requireReadAccess(req, res)) return;
  let relPath = req.params[0] || '';
  try {
    relPath = decodeURIComponent(relPath);
  } catch (e) {}

  let fileInfo;
  try {
    fileInfo = storage.readFileStream(req.params.vaultId, relPath);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  if (fileInfo === null) return res.status(404).json({ error: 'File not found' });

  syncLogger.recordLog({
    vaultId: req.params.vaultId,
    userId: req.user.id,
    username: req.user.username,
    deviceName: req.headers['x-device-name'] || 'REST / Web',
    clientIp: req.ip || req.connection.remoteAddress,
    action: 'pull',
    path: relPath,
    size: fileInfo.size,
    status: 'success',
    detail: '读取笔记文件',
  });

  res.set('Content-Type', 'application/octet-stream');
  res.set('Content-Length', String(fileInfo.size));
  fileInfo.stream.on('error', (err) => {
    console.error('[FileRoutes] read stream error:', err.message);
    if (!res.headersSent) res.status(500).end();
    else res.destroy();
  });
  fileInfo.stream.pipe(res);
});

// PUT (create/update) file content. Body = raw bytes, streamed straight to disk.
// Headers: X-Mtime (ms since epoch, optional), X-Base-Hash (hash client last knew, optional — used for conflict detection)
router.put('/:vaultId/files/*', (req, res) => {
  if (!requireWriteAccess(req, res)) return;
  let relPath = req.params[0] || '';
  try {
    relPath = decodeURIComponent(relPath);
  } catch (e) {}

  const mtime = req.headers['x-mtime'] ? parseInt(req.headers['x-mtime'], 10) : undefined;
  const baseHash = req.headers['x-base-hash'] || undefined;
  const deviceName = req.headers['x-device-name'] || 'REST / Web Client';
  const declaredLength = req.headers['content-length'] ? parseInt(req.headers['content-length'], 10) : null;

  if (declaredLength && declaredLength > MAX_UPLOAD_BYTES) {
    return res.status(413).json({ error: `文件超过单次上传上限（${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB）` });
  }

  let tempPath;
  try {
    tempPath = storage.createUploadTempPath(req.params.vaultId);
  } catch (e) {
    return res.status(500).json({ error: `无法创建临时文件: ${e.message}` });
  }

  const hash = crypto.createHash('sha256');
  let totalBytes = 0;
  let aborted = false;

  const cleanupTemp = () => {
    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch {}
  };

  // 边接收边写盘、边算哈希，而不是等 body-parser 把整份请求体先攒成一个 Buffer。
  const hashingPass = new Transform({
    transform(chunk, enc, cb) {
      totalBytes += chunk.length;
      if (totalBytes > MAX_UPLOAD_BYTES) {
        aborted = true;
        return cb(new Error(`文件超过单次上传上限（${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB）`));
      }
      hash.update(chunk);
      cb(null, chunk);
    },
  });

  const writeStream = fs.createWriteStream(tempPath);

  pipeline(req, hashingPass, writeStream, (err) => {
    if (err) {
      cleanupTemp();
      const status = aborted ? 413 : 400;
      const message = err.message || '上传失败';
      syncLogger.recordLog({
        vaultId: req.params.vaultId,
        userId: req.user.id,
        username: req.user.username,
        deviceName,
        clientIp: req.ip || req.connection.remoteAddress,
        action: 'update',
        path: relPath,
        size: totalBytes,
        status: 'error',
        detail: `写入失败: ${message}`,
      });
      if (!res.headersSent) res.status(status).json({ error: message });
      return;
    }

    try {
      const incomingHash = hash.digest('hex');
      const result = storage.writeFileFromPath(req.params.vaultId, relPath, tempPath, incomingHash, { mtime, baseHash });
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
          size: totalBytes,
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
          size: totalBytes,
          hash: result.currentHash,
          status: 'success',
          detail: '成功写入并同步文件',
        });
      }

      res.json(result);
    } catch (e) {
      cleanupTemp();
      syncLogger.recordLog({
        vaultId: req.params.vaultId,
        userId: req.user.id,
        username: req.user.username,
        deviceName,
        clientIp: req.ip || req.connection.remoteAddress,
        action: 'update',
        path: relPath,
        size: totalBytes,
        status: 'error',
        detail: `写入失败: ${e.message}`,
      });
      res.status(400).json({ error: e.message });
    }
  });
});

// DELETE file
router.delete('/:vaultId/files/*', (req, res) => {
  if (!requireWriteAccess(req, res)) return;
  let relPath = req.params[0] || '';
  try {
    relPath = decodeURIComponent(relPath);
  } catch (e) {}
  const deviceName = req.headers['x-device-name'] || 'REST / Web Client';
  const ok = storage.deleteFile(req.params.vaultId, relPath);
  req.app.get('fnsHub').broadcastFileDelete(req.params.vaultId, relPath, req.user.id);

  if (ok) {
    webhooks.trigger('file.deleted', {
      vaultId: req.params.vaultId,
      path: relPath,
      userId: req.user.id,
      username: req.user.username,
    }).catch(() => {});
  }

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
