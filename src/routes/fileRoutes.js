const express = require('express');
const { requireAuth } = require('../auth');
const vaults = require('../vaults');
const storage = require('../storage');

const router = express.Router();
router.use(requireAuth);

function checkAccess(req, res) {
  const { vaultId } = req.params;
  if (!vaults.userOwnsVault(req.user.id, vaultId)) {
    res.status(404).json({ error: 'Not found' });
    return false;
  }
  return true;
}

// GET file content
router.get('/:vaultId/files/*', (req, res) => {
  if (!checkAccess(req, res)) return;
  const relPath = req.params[0];
  const buf = storage.readFile(req.params.vaultId, relPath);
  if (buf === null) return res.status(404).json({ error: 'File not found' });
  res.set('Content-Type', 'application/octet-stream');
  res.send(buf);
});

// PUT (create/update) file content. Body = raw bytes.
// Headers: X-Mtime (ms since epoch, optional), X-Base-Hash (hash client last knew, optional — used for conflict detection)
router.put(
  '/:vaultId/files/*',
  express.raw({ type: '*/*', limit: '50mb' }),
  (req, res) => {
    if (!checkAccess(req, res)) return;
    const relPath = req.params[0];
    const mtime = req.headers['x-mtime'] ? parseInt(req.headers['x-mtime'], 10) : undefined;
    const baseHash = req.headers['x-base-hash'] || undefined;
    const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
    try {
      const result = storage.writeFile(req.params.vaultId, relPath, buffer, { mtime, baseHash });
      req.app.get('fnsHub').broadcastFileChange(req.params.vaultId, relPath, result, req.user.id);
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);

// DELETE file
router.delete('/:vaultId/files/*', (req, res) => {
  if (!checkAccess(req, res)) return;
  const relPath = req.params[0];
  const ok = storage.deleteFile(req.params.vaultId, relPath);
  req.app.get('fnsHub').broadcastFileDelete(req.params.vaultId, relPath, req.user.id);
  res.json({ deleted: ok });
});

module.exports = router;
