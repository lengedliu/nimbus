const vaultsStore = require('./vaults');
const vaultMembers = require('./vaultMembers');

/**
 * 核心权限判定函数（单一真理来源 Single Source of Truth）
 * @param {object} user - 请求上下文用户对象 { id, username, role }
 * @param {string} vaultId - 目标 Vault ID
 * @param {'read' | 'write' | 'owner'} requiredLevel - 访问级别
 * @param {object} options - 控制参数，如 { allowAdmin: true }
 * @returns {{ ok: boolean, vault?: object, permission?: string, error?: string, status?: number }}
 */
function checkVaultAccess(user, vaultId, requiredLevel = 'read', options = {}) {
  const allowAdmin = options.allowAdmin !== false;
  if (!user || !user.id) {
    return { ok: false, error: 'Unauthorized: missing user context', status: 401 };
  }

  const cleanVaultId = (vaultId || '').trim();
  if (!cleanVaultId) {
    return { ok: false, error: 'Vault ID is required', status: 400 };
  }

  const vault = vaultsStore.getById(cleanVaultId);
  if (!vault) {
    return { ok: false, error: 'Vault not found', status: 404 };
  }

  // 1. 拥有者 (Owner) 拥有最高控制权限
  if (vault.ownerId === user.id) {
    return { ok: true, vault, permission: 'owner' };
  }

  // 2. 系统管理员 (Admin) 默认具备管理豁免
  if (allowAdmin && user.role === 'admin') {
    return { ok: true, vault, permission: 'admin' };
  }

  // 3. 如果要求必须是 Owner（例如删除整个库、修改成员、生成公共分享等敏感操作）
  if (requiredLevel === 'owner') {
    return { ok: false, error: 'Only the vault owner can perform this operation', status: 403 };
  }

  // 4. 检查协作者成员记录
  const member = vaultMembers.getMember(cleanVaultId, user.id);
  if (!member) {
    // 未授权者统一返回 404，防止探测/枚举其他用户的 Vault 存在性
    return { ok: false, error: 'Not found or no access to this vault', status: 404 };
  }

  const perm = member.permission || 'read-write';

  // 5. 读级别检查
  if (requiredLevel === 'read') {
    return { ok: true, vault, permission: perm };
  }

  // 6. 写级别检查
  if (requiredLevel === 'write') {
    if (perm === 'read-write') {
      return { ok: true, vault, permission: 'read-write' };
    }
    return { ok: false, error: '此笔记库仅支持只读访问，无写入修改权限', status: 403 };
  }

  return { ok: false, error: 'Forbidden', status: 403 };
}

/**
 * Express 统一权限中间件
 * @param {'read' | 'write' | 'owner'} requiredLevel
 * @param {object} options
 */
function requireVaultAccess(requiredLevel = 'read', options = {}) {
  return (req, res, next) => {
    const vaultId = req.params.vaultId || req.body?.vaultId || req.query?.vaultId;
    const result = checkVaultAccess(req.user, vaultId, requiredLevel, options);
    if (!result.ok) {
      return res.status(result.status || 403).json({ error: result.error });
    }
    req.vault = result.vault;
    req.vaultPermission = result.permission;
    next();
  };
}

/**
 * 为 MCP 工具统一解析 Vault ID，保证与 REST 接口权限严格一致
 * @param {object} user - 用户对象
 * @param {string} input - 传入的 vaultId 或 vaultName
 * @param {string} defaultVaultId - 可选默认 vault
 * @param {'read' | 'write' | 'owner'} requiredLevel - 所需权限
 * @returns {string} 校验通过的合法 vaultId
 */
function resolveVaultForUser(user, input, defaultVaultId, requiredLevel = 'read') {
  const target = (input || defaultVaultId || '').trim();
  if (!target) {
    throw new Error(
      'No vault specified. Pass a vaultId (UUID or vault name), set the X-Default-Vault-Name header, or call list_vaults first.'
    );
  }

  const isAdmin = user.role === 'admin';
  const userVaults = vaultsStore.listForUser(user.id, isAdmin);

  // 优先精确匹配 ID
  let found = userVaults.find((v) => v.id === target);
  // 其次匹配名称
  if (!found) {
    found = userVaults.find((v) => v.name === target);
  }
  // 忽略大小写匹配
  if (!found) {
    const lower = target.toLowerCase();
    found = userVaults.find(
      (v) => (v.name || '').toLowerCase() === lower || (v.id || '').toLowerCase() === lower
    );
  }

  if (!found) {
    throw new Error(
      `Vault "${target}" not found or unauthorized for this account. Available vaults: ${userVaults.map((v) => `"${v.name}" (${v.id})`).join(', ') || 'none'}`
    );
  }

  // 走统一的 checkVaultAccess 进行权限校验
  const check = checkVaultAccess(user, found.id, requiredLevel, {
    allowAdmin: requiredLevel !== 'owner',
  });
  if (!check.ok) {
    throw new Error(check.error || 'Permission denied');
  }

  return found.id;
}

/**
 * Express 路由请求兼容辅助函数
 * 直接在已有路由 handler 内部调用：if (!checkAccess(req, res, requireWrite)) return;
 */
function checkAccess(req, res, requireWrite = false) {
  const vaultId = req.params.vaultId || req.body?.vaultId || req.query?.vaultId;
  const result = checkVaultAccess(req.user, vaultId, requireWrite ? 'write' : 'read');
  if (!result.ok) {
    res.status(result.status || 403).json({ error: result.error });
    return false;
  }
  req.vault = result.vault;
  req.vaultPermission = result.permission;
  return true;
}

module.exports = {
  checkVaultAccess,
  requireVaultAccess,
  resolveVaultForUser,
  checkAccess,
};
