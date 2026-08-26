const express = require('express');
const { requireAuth } = require('../auth');
const vaultsStore = require('../vaults');
const storage = require('../storage');

const router = express.Router();
router.use(requireAuth);

function checkAccess(req, res) {
  if (!vaultsStore.userOwnsVault(req.user.id, req.params.vaultId)) {
    res.status(404).json({ error: 'Not found' });
    return false;
  }
  return true;
}

// ------------------------------- history --------------------------------------

// GET /api/vaults/:vaultId/history?path=notes/a.md  -> list of versions for that path
router.get('/:vaultId/history', (req, res) => {
  if (!checkAccess(req, res)) return;
  const { path: relPath } = req.query;
  if (!relPath) return res.status(400).json({ error: 'path query param required' });
  res.json({ history: storage.listHistory(req.params.vaultId, relPath) });
});

// GET /api/vaults/:vaultId/history/:versionId -> raw content of that version
router.get('/:vaultId/history/:versionId', (req, res) => {
  if (!checkAccess(req, res)) return;
  const result = storage.readHistoryVersion(req.params.vaultId, req.params.versionId);
  if (!result) return res.status(404).json({ error: 'Version not found' });
  res.set('Content-Type', 'application/octet-stream');
  res.send(result.buffer);
});

// POST /api/vaults/:vaultId/history/:versionId/restore -> makes this version the current content
router.post('/:vaultId/history/:versionId/restore', (req, res) => {
  if (!checkAccess(req, res)) return;
  const { vaultId, versionId } = req.params;
  const result = storage.readHistoryVersion(vaultId, versionId);
  if (!result) return res.status(404).json({ error: 'Version not found' });

  // writeFile() itself snapshots whatever is currently live before replacing
  // it, so restoring is non-destructive too — the pre-restore state becomes
  // a new history entry.
  const writeResult = storage.writeFile(vaultId, result.entry.path, result.buffer, { mtime: Date.now() });
  if (writeResult.written) {
    req.app.get('fnsHub').broadcastFileChange(vaultId, result.entry.path, writeResult, req.user.id, true);
  }
  res.json({ path: result.entry.path, ...writeResult });
});

// ---------------------------------- trash ---------------------------------------

router.get('/:vaultId/trash', (req, res) => {
  if (!checkAccess(req, res)) return;
  res.json({ trash: storage.listTrash(req.params.vaultId) });
});

router.post('/:vaultId/trash/:trashId/restore', (req, res) => {
  if (!checkAccess(req, res)) return;
  const { vaultId, trashId } = req.params;
  const restoredPath = storage.restoreFromTrash(vaultId, trashId);
  if (!restoredPath) return res.status(404).json({ error: 'Trash item not found' });

  const manifest = storage.getManifest(vaultId);
  const meta = manifest[restoredPath];
  if (meta) {
    req.app.get('fnsHub').broadcastFileChange(vaultId, restoredPath, { currentHash: meta.hash }, req.user.id, true);
  }
  res.json({ restored: restoredPath });
});

router.delete('/:vaultId/trash/:trashId', (req, res) => {
  if (!checkAccess(req, res)) return;
  const ok = storage.purgeTrash(req.params.vaultId, req.params.trashId);
  res.json({ purged: ok });
});

module.exports = router;
