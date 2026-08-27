const express = require('express');
const { requireAuth, requireAdmin } = require('../auth');
const users = require('../users');
const vaultsStore = require('../vaults');
const vaultMembers = require('../vaultMembers');
const sharesStore = require('../shares');
const syncRulesStore = require('../syncRules');
const settingsManager = require('../settings');
const syncLogger = require('../syncLogger');
const dbManager = require('../db');

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get('/users', (req, res) => {
  const allUsers = users.listAll();
  const allVaults = vaultsStore.getRawVaults();
  const vaultMap = Object.fromEntries(allVaults.map((v) => [v.id, v.name]));

  const usersWithVaults = allUsers.map((u) => {
    const memberships = vaultMembers.listForUser(u.id).map((m) => ({
      vaultId: m.vaultId,
      vaultName: vaultMap[m.vaultId] || m.vaultId,
      permission: m.permission,
    }));
    const owned = allVaults.filter((v) => v.ownerId === u.id).map((v) => ({
      vaultId: v.id,
      vaultName: v.name,
      permission: 'owner',
    }));
    return {
      ...u,
      memberships,
      ownedVaults: owned,
      totalAccessibleVaults: memberships.length + owned.length,
    };
  });

  res.json({ users: usersWithVaults });
});

router.post('/users', async (req, res) => {
  const { username, password, role, vaultAssignments } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  try {
    const user = users.createUser(username, password, role === 'admin' ? 'admin' : 'user');

    if (Array.isArray(vaultAssignments) && vaultAssignments.length > 0) {
      for (const item of vaultAssignments) {
        if (item && item.vaultId) {
          const perm = item.permission === 'read-only' ? 'read-only' : 'read-write';
          await vaultMembers.addOrUpdateMember(item.vaultId, user.id, perm);
        }
      }
    }

    res.json({ user });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/users/:userId', async (req, res) => {
  const { userId } = req.params;
  const { password, role, vaultAssignments } = req.body || {};
  const user = users.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Self-demotion check: prevent admin from accidentally removing their own admin role
  if (userId === req.user.id && role && role !== 'admin') {
    return res.status(400).json({ error: 'Cannot demote your own admin account' });
  }

  try {
    const updatedUser = users.updateUser(userId, {
      password: password && password.trim() ? password.trim() : undefined,
      role: role === 'admin' ? 'admin' : (role === 'user' ? 'user' : undefined),
    });

    // If vaultAssignments provided, update vault memberships as well
    if (Array.isArray(vaultAssignments)) {
      const current = vaultMembers.listForUser(userId);
      for (const c of current) {
        await vaultMembers.removeMember(c.vaultId, userId);
      }
      for (const item of vaultAssignments) {
        if (item && item.vaultId) {
          const v = vaultsStore.getById(item.vaultId);
          if (v && v.ownerId !== userId) {
            const perm = item.permission === 'read-only' ? 'read-only' : 'read-write';
            await vaultMembers.addOrUpdateMember(item.vaultId, userId, perm);
          }
        }
      }
    }

    res.json({ ok: true, user: updatedUser });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/users/:userId/vaults', (req, res) => {
  const { userId } = req.params;
  const user = users.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const allVaults = vaultsStore.getRawVaults();
  const memberships = vaultMembers.listForUser(userId);
  const memMap = Object.fromEntries(memberships.map((m) => [m.vaultId, m.permission]));

  const vaultsList = allVaults.map((v) => ({
    id: v.id,
    name: v.name,
    ownerId: v.ownerId,
    isOwner: v.ownerId === userId,
    assigned: v.ownerId === userId || !!memMap[v.id],
    permission: v.ownerId === userId ? 'owner' : (memMap[v.id] || 'read-write'),
  }));

  res.json({ user, vaults: vaultsList });
});

router.put('/users/:userId/vaults', async (req, res) => {
  const { userId } = req.params;
  const { vaultAssignments } = req.body || {};
  const user = users.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const current = vaultMembers.listForUser(userId);
  for (const c of current) {
    await vaultMembers.removeMember(c.vaultId, userId);
  }

  if (Array.isArray(vaultAssignments)) {
    for (const item of vaultAssignments) {
      if (item && item.vaultId) {
        const v = vaultsStore.getById(item.vaultId);
        if (v && v.ownerId !== userId) {
          const perm = item.permission === 'read-only' ? 'read-only' : 'read-write';
          await vaultMembers.addOrUpdateMember(item.vaultId, userId, perm);
        }
      }
    }
  }

  res.json({ ok: true, memberships: vaultMembers.listForUser(userId) });
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
  const all = vaultsStore.getRawVaults();
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
