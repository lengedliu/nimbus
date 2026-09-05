const test = require('node:test');
const assert = require('node:assert/strict');
const permissions = require('../src/permissions');
const { encryptField, decryptField } = require('../src/utils/crypto');
const { getHealthStatus } = require('../src/health');
const vaultsStore = require('../src/vaults');
const vaultMembers = require('../src/vaultMembers');

test('Crypto: 敏感字段对称加密与解密', () => {
  const original = 'ghp_secret_token_1234567890';
  const encrypted = encryptField(original);

  assert.ok(encrypted.startsWith('enc:v1:'), '加密字符串必须以 enc:v1: 开头');
  assert.notEqual(encrypted, original, '磁盘存储不能包含原始明文');

  const decrypted = decryptField(encrypted);
  assert.equal(decrypted, original, '解密后内容必须原样还原');

  // 向后兼容未加密文本
  assert.equal(decryptField('plain_legacy_token'), 'plain_legacy_token');
});

test('Permissions: 权限模块归一化判决', async () => {
  const ownerUser = { id: 'owner-u1', username: 'alice', role: 'user' };
  const adminUser = { id: 'admin-u1', username: 'admin', role: 'admin' };
  const roUser = { id: 'ro-u1', username: 'bob', role: 'user' };
  const rwUser = { id: 'rw-u1', username: 'carol', role: 'user' };
  const stranger = { id: 'stranger-u1', username: 'eve', role: 'user' };

  // 创建测试 Vault
  const vault = vaultsStore.create(ownerUser.id, 'Test Arch Vault');

  // 配置协作者
  await vaultMembers.addOrUpdateMember(vault.id, roUser.id, 'read-only');
  await vaultMembers.addOrUpdateMember(vault.id, rwUser.id, 'read-write');

  // 1. 拥有者测试
  const ownerCheck = permissions.checkVaultAccess(ownerUser, vault.id, 'owner');
  assert.equal(ownerCheck.ok, true);
  assert.equal(ownerCheck.permission, 'owner');

  // 2. 管理员读写测试
  const adminCheck = permissions.checkVaultAccess(adminUser, vault.id, 'write');
  assert.equal(adminCheck.ok, true);
  assert.equal(adminCheck.permission, 'admin');

  // 3. 只读协作者测试
  const roReadCheck = permissions.checkVaultAccess(roUser, vault.id, 'read');
  assert.equal(roReadCheck.ok, true);
  const roWriteCheck = permissions.checkVaultAccess(roUser, vault.id, 'write');
  assert.equal(roWriteCheck.ok, false);
  assert.equal(roWriteCheck.status, 403);

  // 4. 读写协作者测试
  const rwWriteCheck = permissions.checkVaultAccess(rwUser, vault.id, 'write');
  assert.equal(rwWriteCheck.ok, true);
  const rwOwnerCheck = permissions.checkVaultAccess(rwUser, vault.id, 'owner');
  assert.equal(rwOwnerCheck.ok, false);
  assert.equal(rwOwnerCheck.status, 403);

  // 5. 陌生人访问返回 404 防止信息探测
  const strangerCheck = permissions.checkVaultAccess(stranger, vault.id, 'read');
  assert.equal(strangerCheck.ok, false);
  assert.equal(strangerCheck.status, 404);

  // 清理
  await vaultsStore.remove(vault.id);
});

test('Health: 生产级探针检查数据库与存储空间', async () => {
  const health = await getHealthStatus();
  assert.equal(health.ok, true);
  assert.equal(health.status, 'healthy');
  assert.equal(health.database.connected, true);
  assert.equal(health.storage.writable, true);
  assert.ok(typeof health.storage.freeMb === 'number');
  assert.ok(health.uptimeSeconds >= 0);
});
