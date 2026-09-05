const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

// 必须在 require('../src/storage') 之前设置好 DATA_DIR，
// 让这次测试用一个全新的临时目录，不会碰到真实的 data/ 目录。
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'nimbus-test-storage-'));

const storage = require('../src/storage');

const VAULT_ID = 'test-vault-1';

test('writeFile + readFile: 写入后能原样读回', () => {
  const content = Buffer.from('Hello Nimbus\n第一行内容');
  const result = storage.writeFile(VAULT_ID, 'note.md', content);
  assert.equal(result.written, true);
  assert.equal(result.conflict, null);

  const readBack = storage.readFile(VAULT_ID, 'note.md');
  assert.equal(readBack.toString('utf8'), content.toString('utf8'));
});

test('writeFile: 相同内容重复写入不应报冲突', () => {
  const content = Buffer.from('unchanged content');
  const first = storage.writeFile(VAULT_ID, 'same.md', content);
  const second = storage.writeFile(VAULT_ID, 'same.md', content, { baseHash: first.currentHash });
  assert.equal(second.written, true);
  assert.equal(second.conflict, null);
  assert.equal(second.currentHash, first.currentHash);
});

test('writeFile: baseHash 落后于服务器实际内容时应生成冲突副本，不覆盖原文件', () => {
  const original = storage.writeFile(VAULT_ID, 'conflict.md', Buffer.from('version A'));
  // 模拟另一台设备已经把内容改成了 version B
  storage.writeFile(VAULT_ID, 'conflict.md', Buffer.from('version B'));

  // 当前设备还拿着旧的 baseHash（version A 的 hash），尝试写入 version C
  const result = storage.writeFile(VAULT_ID, 'conflict.md', Buffer.from('version C'), {
    baseHash: original.currentHash,
  });

  assert.equal(result.written, false);
  assert.ok(result.conflict, '应该返回冲突副本路径');

  // 原文件应该还是 version B，没有被 version C 覆盖
  const stillB = storage.readFile(VAULT_ID, 'conflict.md');
  assert.equal(stillB.toString('utf8'), 'version B');
});

test('writeFileFromPath: 流式写入路径下的行为应该和 writeFile 一致（含冲突检测）', () => {
  storage.writeFile(VAULT_ID, 'stream.md', Buffer.from('stream version A'));

  const tempPath = storage.createUploadTempPath(VAULT_ID);
  const newContent = Buffer.from('stream version B (from another device)');
  fs.writeFileSync(tempPath, newContent);
  const hash = crypto.createHash('sha256').update(newContent).digest('hex');

  const result = storage.writeFileFromPath(VAULT_ID, 'stream.md', tempPath, hash, {});
  assert.equal(result.written, true);

  const readBack = storage.readFile(VAULT_ID, 'stream.md');
  assert.equal(readBack.toString('utf8'), newContent.toString('utf8'));

  // 临时文件应该已经被 rename 走，不应该再残留在原地
  assert.equal(fs.existsSync(tempPath), false);

  // 旧版本应该被存进了历史记录里
  const history = storage.listHistory(VAULT_ID, 'stream.md');
  assert.ok(history.length >= 1, '覆盖写入应该留下至少一条历史记录');
});

test('writeFileFromPath: 检测到冲突时临时文件应该被移动为 .conflict 副本，而不是丢弃或覆盖', () => {
  const base = storage.writeFile(VAULT_ID, 'stream-conflict.md', Buffer.from('A'));
  storage.writeFile(VAULT_ID, 'stream-conflict.md', Buffer.from('B')); // 服务器上已经变成 B

  const tempPath = storage.createUploadTempPath(VAULT_ID);
  const staleWrite = Buffer.from('C (来自还停留在旧版本的设备)');
  fs.writeFileSync(tempPath, staleWrite);
  const hash = crypto.createHash('sha256').update(staleWrite).digest('hex');

  const result = storage.writeFileFromPath(VAULT_ID, 'stream-conflict.md', tempPath, hash, {
    baseHash: base.currentHash, // 落后的 baseHash，触发冲突
  });

  assert.equal(result.written, false);
  assert.ok(result.conflict);

  // 原文件不受影响，还是 B
  assert.equal(storage.readFile(VAULT_ID, 'stream-conflict.md').toString('utf8'), 'B');
  // 冲突副本里应该是这次尝试写入的内容 C
  const conflictContent = storage.readFile(VAULT_ID, result.conflict);
  assert.equal(conflictContent.toString('utf8'), staleWrite.toString('utf8'));
});

test('searchVault: 能搜到文件名与文件内容里的关键词', async () => {
  storage.writeFile(VAULT_ID, 'search-target.md', Buffer.from('这里面提到了 Nimbus 的独特关键词 zzyzx123'));
  const results = await storage.searchVault(VAULT_ID, 'zzyzx123');
  assert.ok(results.some((r) => r.path === 'search-target.md'));
});

test('deleteFile: 删除后 readFile 应该返回 null，manifest 里也不再出现', () => {
  storage.writeFile(VAULT_ID, 'to-delete.md', Buffer.from('bye'));
  storage.deleteFile(VAULT_ID, 'to-delete.md');
  assert.equal(storage.readFile(VAULT_ID, 'to-delete.md'), null);
  const manifest = storage.getManifest(VAULT_ID);
  assert.equal(Object.prototype.hasOwnProperty.call(manifest, 'to-delete.md'), false);
});

test('safeJoin: 任何路径段是 .git 的请求都应该被拒绝，即使直接指定路径', () => {
  assert.throws(() => storage.readFile(VAULT_ID, '.git/config'));
  assert.throws(() => storage.readFile(VAULT_ID, 'sub/.git/config'));
  assert.throws(() => storage.writeFile(VAULT_ID, '.git/hooks/post-commit', Buffer.from('x')));
});

test('getManifest: .git 目录不应该出现在 manifest 里', () => {
  const filesRoot = path.join(process.env.DATA_DIR, 'vaults', VAULT_ID, 'files');
  const gitDir = path.join(filesRoot, '.git');
  fs.mkdirSync(gitDir, { recursive: true });
  fs.writeFileSync(path.join(gitDir, 'config'), '[core]\n\ttoken = super-secret-value\n');

  const manifest = storage.getManifest(VAULT_ID, true); // forceRefresh 触发重新 walk
  const gitPaths = Object.keys(manifest).filter((p) => p.startsWith('.git/'));
  assert.deepEqual(gitPaths, [], '.git 目录下的文件不应该出现在 manifest 里');
});
