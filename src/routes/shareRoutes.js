const express = require('express');
const path = require('path');
const { requireAuth } = require('../auth');
const vaultsStore = require('../vaults');
const storage = require('../storage');
const shares = require('../shares');

const router = express.Router();

// --------------------------- Authenticated API ---------------------------

router.get('/vaults/:vaultId/shares', requireAuth, (req, res) => {
  const { vaultId } = req.params;
  if (!vaultsStore.userOwnsVault(req.user.id, vaultId)) {
    return res.status(404).json({ error: 'Not found' });
  }
  const list = shares.listForVault(vaultId).map((s) => ({
    id: s.id,
    vaultId: s.vaultId,
    filePath: s.filePath,
    title: s.title,
    hasPassword: s.hasPassword,
    allowCopy: s.allowCopy,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    viewCount: s.viewCount || 0,
  }));
  res.json({ shares: list });
});

router.post('/vaults/:vaultId/shares', requireAuth, (req, res) => {
  const { vaultId } = req.params;
  if (!vaultsStore.userOwnsVault(req.user.id, vaultId)) {
    return res.status(404).json({ error: 'Not found' });
  }
  const { filePath, title, password, expiresDays, allowCopy } = req.body || {};
  if (!filePath) return res.status(400).json({ error: 'filePath is required' });

  // verify file exists
  const buf = storage.readFile(vaultId, filePath);
  if (buf === null) return res.status(404).json({ error: 'File not found in vault' });

  const record = shares.create({
    vaultId,
    userId: req.user.id,
    filePath,
    title,
    password,
    expiresDays: expiresDays ? parseInt(expiresDays, 10) : 0,
    allowCopy: allowCopy !== false,
  });

  res.json({ share: record });
});

router.delete('/vaults/:vaultId/shares/:shareId', requireAuth, (req, res) => {
  const { vaultId, shareId } = req.params;
  if (!vaultsStore.userOwnsVault(req.user.id, vaultId)) {
    return res.status(404).json({ error: 'Not found' });
  }
  const ok = shares.remove(shareId, req.user.id);
  res.json({ deleted: ok });
});

// --------------------------- Public Share API ---------------------------

router.get('/public/shares/:shareId', (req, res) => {
  const { shareId } = req.params;
  const share = shares.getById(shareId);
  if (!share) return res.status(404).json({ error: 'Share link not found or expired' });

  const password = req.query.password || req.headers['x-share-password'];
  if (share.hasPassword) {
    if (!password || !shares.verifyPassword(shareId, password)) {
      return res.status(401).json({
        error: 'Password required',
        needsPassword: true,
        title: share.title,
      });
    }
  }

  const buf = storage.readFile(share.vaultId, share.filePath);
  if (buf === null) return res.status(404).json({ error: 'Target file no longer exists in vault' });

  shares.recordView(shareId);

  res.json({
    id: share.id,
    title: share.title,
    filePath: share.filePath,
    allowCopy: share.allowCopy,
    createdAt: share.createdAt,
    expiresAt: share.expiresAt,
    content: buf.toString('utf8'),
  });
});

module.exports = router;
