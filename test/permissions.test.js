const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// 必须在 require 任何 src 模块之前设置好 DATA_DIR，用一个全新的临时目录，
// 不会碰到真实的 data/ 目录。这个测试需要 uuid/bcryptjs 等真实依赖，
// 在没有 npm install 的沙箱环境里跑不起来（和 auth.test.js 一样），
// 但逻辑本身是完整的集成测试，装好依赖后应该可以直接跑。
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'nimbus-test-permissions-'));

const vaults = require('../src/vaults');
const vaultMembers = require('../src/vaultMembers');
const permissions = require('../src/permissions');

function makeUser(id, role = 'user') {
  return { id, role };
}

test('assertReadAccess/assertWriteAccess/assertOwnerAccess: 所有者三项权限全部通过', async () => {
  const owner = makeUser('owner-1');
  const vault = vaults.create(owner.id, 'Owner Vault');

  assert.doesNotThrow(() => permissions.assertReadAccess(owner, vault.id));
  assert.doesNotThrow(() => permissions.assertWriteAccess(owner, vault.id));
  assert.doesNotThrow(() => permissions.assertOwnerAccess(owner, vault.id));
});

test('assertReadAccess/assertWriteAccess/assertOwnerAccess: read-write 协作者能读能写，但不是所有者', async () => {
  const owner = makeUser('owner-2');
  const collaborator = makeUser('collab-rw');
  const vault = vaults.create(owner.id, 'Shared Vault RW');
  await vaultMembers.addOrUpdateMember(vault.id, collaborator.id, 'read-write');

  assert.doesNotThrow(() => permissions.assertReadAccess(collaborator, vault.id));
  assert.doesNotThrow(() => permissions.assertWriteAccess(collaborator, vault.id));
  assert.throws(
    () => permissions.assertOwnerAccess(collaborator, vault.id),
    permissions.PermissionError
  );
});

test('assertReadAccess/assertWriteAccess/assertOwnerAccess: read-only 协作者只能读，写和所有者都应该被拒绝', async () => {
  const owner = makeUser('owner-3');
  const viewer = makeUser('collab-ro');
  const vault = vaults.create(owner.id, 'Shared Vault RO');
  await vaultMembers.addOrUpdateMember(vault.id, viewer.id, 'read-only');

  assert.doesNotThrow(() => permissions.assertReadAccess(viewer, vault.id));
  assert.throws(() => permissions.assertWriteAccess(viewer, vault.id), permissions.PermissionError);
  assert.throws(() => permissions.assertOwnerAccess(viewer, vault.id), permissions.PermissionError);
});

test('assertReadAccess: 完全无关的陌生人应该被拒绝', async () => {
  const owner = makeUser('owner-4');
  const stranger = makeUser('stranger-1');
  const vault = vaults.create(owner.id, 'Private Vault');

  assert.throws(() => permissions.assertReadAccess(stranger, vault.id), permissions.PermissionError);
});

test('assertOwnerAccess: 管理员可以豁免所有者检查', async () => {
  const owner = makeUser('owner-5');
  const admin = makeUser('admin-1', 'admin');
  const vault = vaults.create(owner.id, 'Vault Needing Admin Override');

  assert.doesNotThrow(() => permissions.assertOwnerAccess(admin, vault.id));
});
