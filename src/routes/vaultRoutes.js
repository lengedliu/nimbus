const express = require('express');
const { requireAuth } = require('../auth');
const vaults = require('../vaults');
const vaultMembers = require('../vaultMembers');
const users = require('../users');
const storage = require('../storage');

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

router.delete('/:vaultId', async (req, res) => {
  const { vaultId } = req.params;
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && !vaults.userOwnsVault(req.user.id, vaultId)) {
    return res.status(403).json({ error: 'Only vault owner or admin can delete this vault' });
  }
  await vaults.remove(vaultId);
  res.json({ ok: true });
});

// Full manifest: path -> {size, mtime, hash}. Used by the client to diff against local state.
router.get('/:vaultId/manifest', (req, res) => {
  const { vaultId } = req.params;
  const isAdmin = req.user.role === 'admin';
  if (!vaults.hasReadAccess(req.user.id, vaultId, isAdmin)) {
    return res.status(404).json({ error: 'Not found or no read permission' });
  }
  res.json({ manifest: storage.getManifest(vaultId) });
});

// GET /api/vaults/search?q=keyword - Global search across all accessible vaults (filename and note contents)
router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.json({ results: [] });
  const isAdmin = req.user.role === 'admin';
  const userVaults = vaults.listForUser(req.user.id, isAdmin);
  const results = [];

  for (const v of userVaults) {
    const matches = storage.searchVault(v.id, q.trim(), 50);
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
});

// GET /api/vaults/:vaultId/search?q=keyword - Vault-level search
router.get('/:vaultId/search', (req, res) => {
  const { vaultId } = req.params;
  const { q } = req.query;
  const isAdmin = req.user.role === 'admin';
  if (!vaults.hasReadAccess(req.user.id, vaultId, isAdmin)) {
    return res.status(404).json({ error: 'Not found or no read permission' });
  }
  const results = storage.searchVault(vaultId, q || '', 50);
  res.json({ results });
});

// ------------------------- Member & Permission Management -------------------------

// GET /api/vaults/:vaultId/permissions
router.get('/:vaultId/permissions', (req, res) => {
  const { vaultId } = req.params;
  const isAdmin = req.user.role === 'admin';
  const vault = vaults.getById(vaultId);
  if (!vault) return res.status(404).json({ error: 'Vault not found' });

  const myPermission = vaults.getUserPermission(req.user.id, vaultId, isAdmin);
  if (!myPermission) return res.status(403).json({ error: 'No access to this vault' });

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
router.post('/:vaultId/permissions', async (req, res) => {
  const { vaultId } = req.params;
  const { userId, username, permission } = req.body || {};
  const isAdmin = req.user.role === 'admin';
  const vault = vaults.getById(vaultId);

  if (!vault) return res.status(404).json({ error: 'Vault not found' });
  if (!isAdmin && vault.ownerId !== req.user.id) {
    return res.status(403).json({ error: '只有 Vault 创建者或管理员可修改成员权限' });
  }

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
});

// DELETE /api/vaults/:vaultId/permissions/:userId (revoke access)
router.delete('/:vaultId/permissions/:userId', async (req, res) => {
  const { vaultId, userId } = req.params;
  const isAdmin = req.user.role === 'admin';
  const vault = vaults.getById(vaultId);

  if (!vault) return res.status(404).json({ error: 'Vault not found' });
  if (!isAdmin && vault.ownerId !== req.user.id) {
    return res.status(403).json({ error: '只有 Vault 创建者或管理员可移除权限' });
  }

  await vaultMembers.removeMember(vaultId, userId);
  res.json({ ok: true });
});

// POST /api/vaults/:vaultId/history/cleanup (Trigger retention cleanup)
router.post('/:vaultId/history/cleanup', (req, res) => {
  const { vaultId } = req.params;
  const { maxDays, maxVersions } = req.body || {};
  const isAdmin = req.user.role === 'admin';
  const vault = vaults.getById(vaultId);

  if (!vault) return res.status(404).json({ error: 'Vault not found' });
  if (!isAdmin && vault.ownerId !== req.user.id) {
    return res.status(403).json({ error: '只有 Vault 创建者或管理员可清理历史版本' });
  }

  const result = storage.cleanupOldHistoryVersions(
    vaultId,
    Number(maxDays) > 0 ? Number(maxDays) : 30,
    Number(maxVersions) > 0 ? Number(maxVersions) : 20
  );

  res.json({ ok: true, ...result, message: `已清理 ${result.cleanedCount} 个历史版本，释放 ${(result.freedBytes / 1024).toFixed(1)} KB 空间` });
});

module.exports = router;

