const vaultsStore = require('./vaults');

/**
 * 单一权限判定入口。
 *
 * 在这次修复之前，REST 路由（好几个文件里各自的 checkAccess/checkOwnerAccess）
 * 和 MCP 工具（buildMcpServer 内部的 resolveVaultId 系列）是两套完全独立的实现，
 * 这次审查里发现的好几个漏洞（webhook/数据库越权、MCP 写权限缺失、git RCE 的权限
 * 部分）本质上都是"同一件事有两份实现，改了一份忘了另一份"。
 *
 * 现在 REST 和 MCP 都只从这一个模块里判定"这个用户对这个 vault 有没有权限"，
 * 以后新增任何入口（第三个客户端、新的自动化脚本……）也应该调用这里，而不是
 * 重新拼一遍 hasReadAccess/hasWriteAccess/userOwnsVault 的组合逻辑。
 */

class PermissionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'PermissionError';
    this.code = code; // 'NOT_FOUND' | 'WRITE_REQUIRED' | 'OWNER_REQUIRED'
  }
}

function isAdminUser(user) {
  return Boolean(user) && user.role === 'admin';
}

/** 用户对这个 vault 连读权限都没有时抛出（对外表现为"不存在"，不暴露 vault 是否存在）。 */
function assertReadAccess(user, vaultId) {
  if (!vaultsStore.hasReadAccess(user.id, vaultId, isAdminUser(user))) {
    throw new PermissionError('NOT_FOUND', 'Vault not found or you do not have access to it.');
  }
}

/** 用户只有只读权限（或完全没有权限）时抛出——写/删/移动/上传类操作都应该先过这一关。 */
function assertWriteAccess(user, vaultId) {
  if (!vaultsStore.hasWriteAccess(user.id, vaultId, isAdminUser(user))) {
    throw new PermissionError(
      'WRITE_REQUIRED',
      'You only have read-only access to this vault and cannot make changes to it.'
    );
  }
}

/**
 * 用户不是这个 vault 的所有者时抛出（管理员豁免）。
 * 用于风险明显高于普通编辑的操作：创建对外公开的分享链接、配置/触发 Git 远程同步。
 */
function assertOwnerAccess(user, vaultId) {
  if (!isAdminUser(user) && !vaultsStore.userOwnsVault(user.id, vaultId)) {
    throw new PermissionError(
      'OWNER_REQUIRED',
      'This action is restricted to the vault owner (or an admin).'
    );
  }
}

// ------------------------- Express 适配层 -------------------------
// 三个判定函数是框架无关的（MCP 工具直接用上面那几个 assert* 函数），
// 下面这三个是专给 Express 路由用的薄封装：校验失败时直接把响应发出去、
// 返回 false，调用方沿用原来 `if (!requireXxxAccess(req, res)) return;` 的写法。

function requireReadAccess(req, res, vaultId = req.params.vaultId) {
  try {
    assertReadAccess(req.user, vaultId);
    return true;
  } catch (err) {
    res.status(404).json({ error: err.message });
    return false;
  }
}

function requireWriteAccess(req, res, vaultId = req.params.vaultId) {
  try {
    assertWriteAccess(req.user, vaultId);
    return true;
  } catch (err) {
    res.status(403).json({ error: err.message });
    return false;
  }
}

function requireOwnerAccess(req, res, vaultId = req.params.vaultId) {
  try {
    assertOwnerAccess(req.user, vaultId);
    return true;
  } catch (err) {
    res.status(403).json({ error: err.message });
    return false;
  }
}

module.exports = {
  PermissionError,
  isAdminUser,
  assertReadAccess,
  assertWriteAccess,
  assertOwnerAccess,
  requireReadAccess,
  requireWriteAccess,
  requireOwnerAccess,
};
