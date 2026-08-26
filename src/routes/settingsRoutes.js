const express = require('express');
const { requireAuth } = require('../auth');
const users = require('../users');
const settingsManager = require('../settings');
const vaultsStore = require('../vaults');

const router = express.Router();
router.use(requireAuth);

// GET /api/settings - retrieve system & sync settings
router.get('/', (req, res) => {
  const currentSettings = settingsManager.getSystemSettings();
  res.json({
    settings: currentSettings,
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
    },
  });
});

// PUT /api/settings - update system settings (admin only for server-wide params)
router.put('/', (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '只有管理员有权限修改全局系统同步设置' });
  }

  const updates = req.body || {};
  const updated = settingsManager.updateSystemSettings(updates);
  res.json({ ok: true, settings: updated, message: '系统设置保存成功' });
});

// POST /api/settings/change-password - modify own password
router.post('/change-password', (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '请输入原密码与新密码' });
  }
  if (newPassword.length < 4) {
    return res.status(400).json({ error: '新密码长度至少需要4位' });
  }

  const verified = users.verifyPassword(req.user.username, oldPassword);
  if (!verified) {
    return res.status(400).json({ error: '原密码验证不正确' });
  }

  try {
    users.updatePassword(req.user.id, newPassword);
    res.json({ ok: true, message: '密码修改成功，请牢记新密码' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------- Device / API Tokens ---------------------------

router.get('/tokens', (req, res) => {
  const tokens = settingsManager.listTokensForUser(req.user.id);
  res.json({ tokens });
});

router.post('/tokens', (req, res) => {
  const { label, expiresInDays } = req.body || {};
  if (!label || !label.trim()) {
    return res.status(400).json({ error: '请输入设备或令牌名称' });
  }

  const tokenEntry = settingsManager.createTokenForUser(
    req.user.id,
    req.user.username,
    label.trim(),
    expiresInDays ? parseInt(expiresInDays, 10) : 365
  );

  res.json({ ok: true, token: tokenEntry, message: '设备令牌创建成功' });
});

router.delete('/tokens/:tokenId', (req, res) => {
  const ok = settingsManager.revokeToken(req.params.tokenId, req.user.id);
  res.json({ ok });
});

// ----------------------- Fast Note Sync Plugin Config -----------------------

router.post('/plugin-config', (req, res) => {
  const { vaultId, serverUrl, deviceName, token } = req.body || {};
  if (!vaultId) {
    return res.status(400).json({ error: '请选择 Vault' });
  }

  const vault = vaultsStore.getById(vaultId);
  if (!vault || (vault.ownerId !== req.user.id && req.user.role !== 'admin')) {
    return res.status(404).json({ error: 'Vault 不存在或无访问权限' });
  }

  const protocol = req.protocol;
  const host = req.get('host');
  const defaultServer = `${protocol}://${host}`;
  const effectiveServer = (serverUrl || defaultServer).replace(/\/+$/, '');

  const config = settingsManager.generatePluginConfig({
    serverUrl: effectiveServer,
    vaultId,
    token: token || req.headers.authorization?.replace(/^Bearer\s+/i, '') || '',
    deviceName: deviceName || `${req.user.username}-Client`,
  });

  res.json({ ok: true, config, vaultName: vault.name });
});

module.exports = router;
