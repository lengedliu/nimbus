const express = require('express');
const { requireAuth, requireAdmin } = require('../auth');
const users = require('../users');
const vaultsStore = require('../vaults');
const sharesStore = require('../shares');
const syncRulesStore = require('../syncRules');
const settingsManager = require('../settings');
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
    const currentUsers = users.getRawUsers();
    const currentVaults = vaultsStore.getRawVaults();
    const currentShares = sharesStore.getRawShares();

    // Initialize new database engine
    await dbManager.init(config);

    // If migrating existing in-memory data to the new DB engine
    if (migrateExisting && dbManager.type !== 'json') {
      console.log(`[DB] Migrating ${currentUsers.length} users, ${currentVaults.length} vaults, ${currentShares.length} shares to ${dbManager.type}...`);
      for (const u of currentUsers) {
        try {
          await dbManager.execute(
            'INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)',
            [u.id, u.username, u.passwordHash, u.role, u.createdAt]
          );
        } catch {}
      }
      for (const v of currentVaults) {
        try {
          await dbManager.execute(
            'INSERT INTO vaults (id, owner_id, name, created_at) VALUES (?, ?, ?, ?)',
            [v.id, v.ownerId, v.name, v.createdAt]
          );
        } catch {}
      }
      for (const s of currentShares) {
        try {
          await dbManager.execute(
            'INSERT INTO shares (id, vault_id, user_id, file_path, title, has_password, password_hash, allow_copy, created_at, expires_at, view_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              s.id,
              s.vaultId,
              s.userId,
              s.filePath,
              s.title,
              s.hasPassword ? 1 : 0,
              s.passwordHash,
              s.allowCopy ? 1 : 0,
              s.createdAt,
              s.expiresAt,
              s.viewCount,
            ]
          );
        } catch {}
      }
    }

    // Refresh memory cache from the newly selected DB
    await users.loadFromDb();
    await vaultsStore.loadFromDb();
    await sharesStore.loadFromDb();
    await syncRulesStore.loadFromDb();
    await settingsManager.loadFromDb();

    res.json({
      ok: true,
      message: `已成功切换数据库引擎至 ${dbManager.type.toUpperCase()}`,
      status: dbManager.getStatus(),
    });
  } catch (err) {
    console.error('[DB Switch Error]', err);
    res.status(500).json({ error: `数据库切换失败: ${err.message}` });
  }
});

module.exports = router;
