const express = require('express');
const { requireAuth } = require('../auth');
const vaults = require('../vaults');
const vaultMembers = require('../vaultMembers');
const users = require('../users');
const storage = require('../storage');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireReadAccess, requireOwnerAccess } = require('../permissions');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const isAdmin = req.user.role === 'admin';
  res.json({ vaults: vaults.listForUser(req.user.id, isAdmin) });
});

router.post('/', (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const vault = vaults.create(req.user.id, name);
  res.json({ vault });
});

router.delete('/:vaultId', asyncHandler(async (req, res) => {
  const { vaultId } = req.params;
  if (!requireOwnerAccess(req, res)) return;
  await vaults.remove(vaultId);
  res.json({ ok: true });
}));

// Full manifest: path -> {size, mtime, hash}. Used by the client to diff against local state.
router.get('/:vaultId/manifest', (req, res) => {
  const { vaultId } = req.params;
  if (!requireReadAccess(req, res)) return;
  res.json({ manifest: storage.getManifest(vaultId) });
});

// GET /api/vaults/search?q=keyword - Global search across all accessible vaults (filename and note contents)
router.get('/search', asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.json({ results: [] });
  const isAdmin = req.user.role === 'admin';
  const userVaults = vaults.listForUser(req.user.id, isAdmin);
  const results = [];

  // 依次搜索每个 vault（而不是 Promise.all 并发跑全部）：
  // searchVault 内部本来就会周期性让出事件循环，顺序执行既能避免多个大 vault
  // 同时抢事件循环导致互相拖慢，也让"让出"的间隙能真正被其他请求利用到。
  for (const v of userVaults) {
    const matches = await storage.searchVault(v.id, q.trim(), 50);
    for (const m of matches) {
      results.push({
        vaultId: v.id,
        vaultName: v.name,
        path: m.path,
        size: m.size,
        mtime: m.mtime,
        isPathMatch: m.isPathMatch,
        matchesCount: m.matchesCount,
        snippet: m.snippet || '',
      });
    }
  }

  res.json({ results });
}));

// GET /api/vaults/:vaultId/search?q=keyword - Vault-level search
router.get('/:vaultId/search', asyncHandler(async (req, res) => {
  const { vaultId } = req.params;
  const { q } = req.query;
  if (!requireReadAccess(req, res)) return;
  const results = await storage.searchVault(vaultId, q || '', 50);
  res.json({ results });
}));

// ------------------------- Member & Permission Management -------------------------

// GET /api/vaults/:vaultId/permissions
router.get('/:vaultId/permissions', (req, res) => {
  const { vaultId } = req.params;
  if (!requireReadAccess(req, res)) return;
  const isAdmin = req.user.role === 'admin';
  const vault = vaults.getById(vaultId);

  const owner = users.findById(vault.ownerId);
  const rawMembers = vaultMembers.listForVault(vaultId);
  const members = rawMembers.map((m) => {
    const u = users.findById(m.userId);
    return {
      id: m.id,
      userId: m.userId,
      username: u ? u.username : 'Unknown',
      role: u ? u.role : 'user',
      permission: m.permission,
      createdAt: m.createdAt,
    };
  });

  const allUsers = isAdmin || vault.ownerId === req.user.id
    ? users.listAll().map((u) => ({ id: u.id, username: u.username, role: u.role }))
    : [];

  res.json({
    vault: {
      id: vault.id,
      name: vault.name,
      ownerId: vault.ownerId,
      ownerUsername: owner ? owner.username : 'Unknown',
      createdAt: vault.createdAt,
    },
    myPermission,
    isOwner: vault.ownerId === req.user.id,
    isAdmin,
    members,
    allUsers,
  });
});

// POST /api/vaults/:vaultId/permissions (add or update member permission)
router.post('/:vaultId/permissions', asyncHandler(async (req, res) => {
  const { vaultId } = req.params;
  const { userId, username, permission } = req.body || {};
  const vault = vaults.getById(vaultId);

  if (!vault) return res.status(404).json({ error: 'Vault not found' });
  if (!requireOwnerAccess(req, res)) return;

  let targetUserId = userId;
  if (!targetUserId && username) {
    const targetUser = users.findByUsername(username);
    if (!targetUser) return res.status(400).json({ error: `用户 "${username}" 不存在` });
    targetUserId = targetUser.id;
  }

  if (!targetUserId) return res.status(400).json({ error: 'userId 或 username 参数必填' });

  if (targetUserId === vault.ownerId) {
    return res.status(400).json({ error: '所有者默认拥有全部权限，无需额外授权' });
  }

  const validPerms = ['read-write', 'read-only'];
  const perm = validPerms.includes(permission) ? permission : 'read-write';

  const member = await vaultMembers.addOrUpdateMember(vaultId, targetUserId, perm);
  const targetUserObj = users.findById(targetUserId);

  res.json({
    ok: true,
    member: {
      id: member.id,
      userId: member.userId,
      username: targetUserObj ? targetUserObj.username : 'Unknown',
      permission: member.permission,
      createdAt: member.createdAt,
    },
  });
}));

// DELETE /api/vaults/:vaultId/permissions/:userId (revoke access)
router.delete('/:vaultId/permissions/:userId', asyncHandler(async (req, res) => {
  const { vaultId, userId } = req.params;
  const vault = vaults.getById(vaultId);

  if (!vault) return res.status(404).json({ error: 'Vault not found' });
  if (!requireOwnerAccess(req, res)) return;

  await vaultMembers.removeMember(vaultId, userId);
  res.json({ ok: true });
}));

// POST /api/vaults/:vaultId/history/cleanup (Trigger retention cleanup)
router.post('/:vaultId/history/cleanup', (req, res) => {
  const { vaultId } = req.params;
  const { maxDays, maxVersions } = req.body || {};
  const vault = vaults.getById(vaultId);

  if (!vault) return res.status(404).json({ error: 'Vault not found' });
  if (!requireOwnerAccess(req, res)) return;

  const result = storage.cleanupOldHistoryVersions(
    vaultId,
    Number(maxDays) > 0 ? Number(maxDays) : 30,
    Number(maxVersions) > 0 ? Number(maxVersions) : 20
  );

  res.json({ ok: true, ...result, message: `已清理 ${result.cleanedCount} 个历史版本，释放 ${(result.freedBytes / 1024).toFixed(1)} KB 空间` });
});

module.exports = router;

