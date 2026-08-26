const express = require('express');
const { requireAuth } = require('../auth');
const vaults = require('../vaults');
const storage = require('../storage');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  res.json({ vaults: vaults.listForUser(req.user.id) });
});

router.post('/', (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const vault = vaults.create(req.user.id, name);
  res.json({ vault });
});

router.delete('/:vaultId', (req, res) => {
  const { vaultId } = req.params;
  if (!vaults.userOwnsVault(req.user.id, vaultId)) return res.status(404).json({ error: 'Not found' });
  vaults.remove(vaultId);
  res.json({ ok: true });
});

// Full manifest: path -> {size, mtime, hash}. Used by the client to diff against local state.
router.get('/:vaultId/manifest', (req, res) => {
  const { vaultId } = req.params;
  if (!vaults.userOwnsVault(req.user.id, vaultId)) return res.status(404).json({ error: 'Not found' });
  res.json({ manifest: storage.getManifest(vaultId) });
});

module.exports = router;
