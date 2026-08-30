const express = require('express');
const { requireAuth } = require('../auth');
const users = require('../users');
const settingsManager = require('../settings');
const vaultsStore = require('../vaults');
const sharesStore = require('../shares');
const syncRulesStore = require('../syncRules');
const dbManager = require('../db');

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

// --------------------------- Database Multi-Engine Management ---------------------------

// GET /api/settings/database - retrieve active database engine status and records count
router.get('/database', (req, res) => {
  const status = dbManager.getStatus();
  const allUsers = users.getRawUsers() || [];
  const allVaults = vaultsStore.getRawVaults() || [];
  const allShares = sharesStore.getRawShares() || [];
  const allTokens = settingsManager.getAllTokens() || [];
  const allRules = syncRulesStore.getAllRules() || {};

  res.json({
    ok: true,
    status,
    stats: {
      usersCount: allUsers.length,
      vaultsCount: allVaults.length,
      sharesCount: allShares.length,
      tokensCount: allTokens.length,
      rulesCount: Object.keys(allRules).length,
    },
    supportedEngines: [
      {
        type: 'json',
        name: 'JSON 本地文件存储',
        desc: '默认免配置，轻量快速，数据保存在数据目录 JSON 文件中，适合单机/轻量级使用',
        fields: [],
      },
      {
        type: 'sqlite',
        name: 'SQLite 嵌入式数据库',
        desc: '单文件轻量级关系数据库，零网络延迟开销，自动启用 WAL 并发模式',
        fields: ['sqlitePath'],
      },
      {
        type: 'postgres',
        name: 'PostgreSQL 企业级关系数据库',
        desc: '适合高并发、多实例部署或云数据库（如 Supabase, Neon, AWS RDS, GCP Cloud SQL）',
        fields: ['connectionString', 'host', 'port', 'user', 'password', 'database', 'ssl'],
      },
      {
        type: 'mysql',
        name: 'MySQL / MariaDB 关系数据库',
        desc: '经典高性能关系型数据库，支持集群主从复制与企业级分库分表扩展',
        fields: ['host', 'port', 'user', 'password', 'database'],
      },
    ],
  });
});

// POST /api/settings/database/test - test connection to target database
router.post('/database/test', async (req, res) => {
  const config = req.body || {};
  try {
    const result = await dbManager.testConnection(config);
    if (!result.ok) {
      return res.status(400).json({ ok: false, error: result.error || '数据库连接测试失败' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/settings/database/switch - switch and update active database engine (with optional auto-migration)
router.post('/database/switch', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '只有管理员有权限切换与更新数据库配置' });
  }

  const { targetConfig, migrate = true } = req.body || {};
  if (!targetConfig || !targetConfig.type) {
    return res.status(400).json({ error: '请提供目标数据库配置' });
  }

  try {
    // 1. Gather all current in-memory dataset
    const dataset = {
      users: users.getRawUsers(),
      vaults: vaultsStore.getRawVaults(),
      shares: sharesStore.getRawShares(),
      syncRules: syncRulesStore.getAllRules(),
      systemSettings: settingsManager.getSystemSettings(),
      apiTokens: settingsManager.getAllTokens(),
    };

    // 2. Perform switch and data migration
    const result = await dbManager.switchAndMigrate(targetConfig, dataset, Boolean(migrate));

    // 3. Reload cache from newly active database
    await users.loadFromDb();
    await vaultsStore.loadFromDb();
    await sharesStore.loadFromDb();
    await syncRulesStore.loadFromDb();
    await settingsManager.loadFromDb();

    res.json({
      ok: true,
      result,
      message: result.message,
    });
  } catch (err) {
    console.error('[DB Switch Error]', err);
    // Fallback reload
    try {
      await users.loadFromDb();
      await vaultsStore.loadFromDb();
    } catch {}
    res.status(500).json({ error: `数据库引擎切换失败: ${err.message}` });
  }
});

// --------------------------- Device / API Tokens ---------------------------
const jwt = require('jsonwebtoken');

function parseTokenInfo(token, createdAt) {
  let expiresAt = null;
  let durationText = '1 年 (365 天)';
  let isExpired = false;
  if (token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        expiresAt = decoded.exp * 1000;
        isExpired = Date.now() > expiresAt;
        const totalSecs = decoded.iat ? decoded.exp - decoded.iat : Math.round((expiresAt - (createdAt || Date.now())) / 1000);
        const days = Math.round(totalSecs / 86400);
        if (days >= 3600) {
          durationText = '永久有效 (10 年)';
        } else if (days >= 350) {
          durationText = '1 年 (365 天)';
        } else if (days >= 80 && days <= 100) {
          durationText = '90 天';
        } else if (days >= 25 && days <= 35) {
          durationText = '30 天';
        } else {
          durationText = `${days} 天`;
        }
      }
    } catch (e) {}
  }
  return { expiresAt, durationText, isExpired };
}

router.get('/tokens', (req, res) => {
  const devicesStore = require('../devices');
  const devs = devicesStore.listForUser(req.user.id);
  const tokens = devs.map((d) => {
    const { expiresAt, durationText, isExpired } = parseTokenInfo(d.token, d.createdAt);
    return {
      id: d.id,
      label: d.deviceName || d.label || 'Obsidian Client',
      token: d.token,
      createdAt: d.createdAt,
      lastUsedAt: d.lastActiveAt,
      expiresAt,
      durationText,
      isExpired,
      maskedToken: d.token ? `${d.token.slice(0, 10)}...${d.token.slice(-6)}` : '',
    };
  });
  res.json({ tokens });
});

router.post('/tokens', (req, res) => {
  const { label, expiresInDays } = req.body || {};
  if (!label || !label.trim()) {
    return res.status(400).json({ error: '请输入设备或令牌名称' });
  }

  const devicesStore = require('../devices');
  const record = devicesStore.generateDeviceToken(
    req.user,
    label.trim(),
    'desktop',
    expiresInDays ? parseInt(expiresInDays, 10) : 365
  );

  const { expiresAt, durationText, isExpired } = parseTokenInfo(record.token, record.createdAt);

  res.json({
    ok: true,
    token: {
      id: record.id,
      label: record.deviceName,
      token: record.token,
      createdAt: record.createdAt,
      lastUsedAt: record.lastActiveAt,
      expiresAt,
      durationText,
      isExpired,
      maskedToken: record.token ? `${record.token.slice(0, 10)}...${record.token.slice(-6)}` : '',
    },
    message: '设备令牌创建成功',
  });
});

router.post('/tokens/:tokenId/regenerate', (req, res) => {
  const { expiresInDays } = req.body || {};
  const devicesStore = require('../devices');
  const record = devicesStore.regenerateDeviceToken(
    req.params.tokenId,
    req.user,
    expiresInDays ? parseInt(expiresInDays, 10) : 365,
    req.user.role === 'admin'
  );

  if (!record) {
    return res.status(404).json({ error: '令牌未找到或无权操作' });
  }

  const { expiresAt, durationText, isExpired } = parseTokenInfo(record.token, record.createdAt);

  res.json({
    ok: true,
    token: {
      id: record.id,
      label: record.deviceName,
      token: record.token,
      createdAt: record.createdAt,
      lastUsedAt: record.lastActiveAt,
      expiresAt,
      durationText,
      isExpired,
      maskedToken: record.token ? `${record.token.slice(0, 10)}...${record.token.slice(-6)}` : '',
    },
    message: '令牌已重新生成',
  });
});

router.post('/tokens/:tokenId/extend', (req, res) => {
  const { extendDays } = req.body || {};
  const devicesStore = require('../devices');
  const record = devicesStore.extendDeviceToken(
    req.params.tokenId,
    req.user,
    extendDays ? parseInt(extendDays, 10) : 365,
    req.user.role === 'admin'
  );

  if (!record) {
    return res.status(404).json({ error: '令牌未找到或无权操作' });
  }

  const { expiresAt, durationText, isExpired } = parseTokenInfo(record.token, record.createdAt);

  res.json({
    ok: true,
    token: {
      id: record.id,
      label: record.deviceName,
      token: record.token,
      createdAt: record.createdAt,
      lastUsedAt: record.lastActiveAt,
      expiresAt,
      durationText,
      isExpired,
      maskedToken: record.token ? `${record.token.slice(0, 10)}...${record.token.slice(-6)}` : '',
    },
    message: '令牌有效期已成功延长',
  });
});

router.delete('/tokens/:tokenId', (req, res) => {
  const devicesStore = require('../devices');
  const ok = devicesStore.revokeDevice(req.params.tokenId, req.user.id, req.user.role === 'admin');
  res.json({ ok });
});

// ----------------------- Webhook Settings -----------------------
const webhooks = require('../webhooks');

router.get('/webhooks', (req, res) => {
  const config = webhooks.getWebhookConfig();
  res.json({ ok: true, config, webhooks: config });
});

const handleSaveWebhooks = (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '只有管理员有权限配置全局 Webhook' });
  }
  const updated = webhooks.saveWebhookConfig(req.body || {});
  res.json({ ok: true, config: updated, webhooks: updated, message: 'Webhook 设置已更新' });
};

router.put('/webhooks', handleSaveWebhooks);
router.post('/webhooks', handleSaveWebhooks);

router.post('/webhooks/test', async (req, res) => {
  try {
    const result = await webhooks.testWebhook(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// ----------------------- Plugin Config Generation -----------------------

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
