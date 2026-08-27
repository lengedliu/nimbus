const express = require('express');
const { requireAuth, requireAdmin } = require('../auth');
const users = require('../users');
const vaultsStore = require('../vaults');
const sharesStore = require('../shares');
const syncRulesStore = require('../syncRules');
const settingsManager = require('../settings');
const syncLogger = require('../syncLogger');
const dbManager = require('../db');

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get('/users', (req, res) => {
  res.json({ users: users.listAll() });
});

router.post('/users', (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  try {
    const user = users.createUser(username, password, role === 'admin' ? 'admin' : 'user');
    res.json({ user });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/users/:userId', (req, res) => {
  if (req.params.userId === req.user.id) {
    return res.status(400).json({ error: "You can't delete your own account here." });
  }
  users.remove(req.params.userId);
  res.json({ ok: true });
});

// All vaults across all users, with owner username attached — for the admin dashboard.
router.get('/vaults', (req, res) => {
  const allUsers = users.listAll();
  const byId = Object.fromEntries(allUsers.map((u) => [u.id, u.username]));
  const all = allUsers.flatMap((u) => vaultsStore.listForUser(u.id));
  const withOwner = all.map((v) => ({ ...v, ownerUsername: byId[v.ownerId] || '(unknown)' }));
  res.json({ vaults: withOwner });
});

// ---------------------- Database Management Endpoints ----------------------

router.get('/database/status', async (req, res) => {
  try {
    const status = dbManager.getStatus();
    const stats = {
      usersCount: users.listAll().length,
      vaultsCount: users.listAll().flatMap((u) => vaultsStore.listForUser(u.id)).length,
      sharesCount: sharesStore.getRawShares().length,
    };
    res.json({ ...status, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/database/test', async (req, res) => {
  const config = req.body || {};
  try {
    const result = await dbManager.testConnection(config);
    res.json(result);
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/database/switch', async (req, res) => {
  const config = req.body || {};
  const migrateExisting = Boolean(req.body.migrateExisting);

  try {
    // Snapshot current memory state before switching if migration requested
    const dataset = {
      users: users.getRawUsers(),
      vaults: vaultsStore.getRawVaults(),
      shares: sharesStore.getRawShares(),
      syncRules: syncRulesStore.getRawRules(),
      systemSettings: settingsManager.getAll(),
      apiTokens: settingsManager.listAllTokens ? settingsManager.listAllTokens() : [],
      syncLogs: syncLogger.getRawLogs ? syncLogger.getRawLogs() : [],
    };

    const result = await dbManager.switchAndMigrate(config, dataset, migrateExisting);

    // Refresh memory cache from the newly selected DB
    await users.loadFromDb();
    await vaultsStore.loadFromDb();
    await sharesStore.loadFromDb();
    await syncRulesStore.loadFromDb();
    await settingsManager.loadFromDb();
    await syncLogger.loadFromDb();

    res.json({
      ok: true,
      message: result.message || `已成功切换数据库引擎至 ${dbManager.type.toUpperCase()}`,
      status: dbManager.getStatus(),
      migrated: result.migrated,
      counts: result.counts,
    });
  } catch (err) {
    console.error('[DB Switch Error]', err);
    res.status(500).json({ error: `数据库切换失败: ${err.message}` });
  }
});

// Admin global sync logs endpoint
router.get('/sync-logs', (req, res) => {
  const { vaultId, action, status, search, limit, offset } = req.query;
  const result = syncLogger.getLogs({
    vaultId: vaultId || null,
    action: action || null,
    status: status || null,
    search: search || null,
    limit: limit ? parseInt(limit, 10) : 100,
    offset: offset ? parseInt(offset, 10) : 0,
  });
  res.json(result);
});

module.exports = router;
