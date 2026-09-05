const test = require('node:test');
const assert = require('node:assert/strict');
const gitSync = require('../src/gitSync');
const storage = require('../src/storage');

test('validateRemoteUrl: 合法 HTTPS/HTTP 地址正常通过', () => {
  assert.equal(
    gitSync.validateRemoteUrl('https://github.com/example/notes.git'),
    'https://github.com/example/notes.git'
  );
  assert.equal(
    gitSync.validateRemoteUrl('http://git.internal.corp/team/notes.git'),
    'http://git.internal.corp/team/notes.git'
  );
});

test('validateRemoteUrl: 彻底拦截 ext:: 协议注入 RCE', () => {
  assert.throws(
    () => gitSync.validateRemoteUrl('ext::sh -c "whoami > /tmp/pwn"'),
    /不支持的 Git 协议/
  );
});

test('validateRemoteUrl: 拦截 file:// 本地文件协议与 ssh://', () => {
  assert.throws(
    () => gitSync.validateRemoteUrl('file:///etc/passwd'),
    /不支持的 Git 协议/
  );
  assert.throws(
    () => gitSync.validateRemoteUrl('ssh://git@github.com/user/repo.git'),
    /不支持的 Git 协议/
  );
});

test('validateRemoteUrl: 拦截以 "-" 开头的参数注入 (Flag/Option Injection)', () => {
  assert.throws(
    () => gitSync.validateRemoteUrl('-oProxyCommand="sh -c touch /tmp/pwn"'),
    /不能以 "-" 开头/
  );
  assert.throws(
    () => gitSync.validateRemoteUrl('--upload-pack=touch /tmp/pwn'),
    /不能以 "-" 开头/
  );
});

test('validateRemoteUrl: 拦截回车换行与非法字符', () => {
  assert.throws(
    () => gitSync.validateRemoteUrl("https://github.com/repo\n-oProxyCommand=..."),
    /包含非法控制字符/
  );
});

test('validateBranch: 合法分支名通过，非法与参数注入拦截', () => {
  assert.equal(gitSync.validateBranch('main'), 'main');
  assert.equal(gitSync.validateBranch('feature/sync-v2'), 'feature/sync-v2');

  assert.throws(() => gitSync.validateBranch('-oProxyCommand'), /不能以 "-" 开头/);
  assert.throws(() => gitSync.validateBranch('../escape'), /包含非法字符/);
  assert.throws(() => gitSync.validateBranch('feat*invalid'), /包含非法字符/);
});

test('buildAuthUrl: 安全转义 Token 与用户名', () => {
  const authUrl = gitSync.buildAuthUrl(
    'https://github.com/user/notes.git',
    'myuser',
    'token#123@special'
  );
  assert.equal(
    authUrl,
    'https://myuser:token%23123%40special@github.com/user/notes.git'
  );
});

test('safeJoin: 严禁直接通过路径访问 .git 内部文件', () => {
  assert.throws(
    () => storage.safeJoin('/tmp/vault', '.git/config'),
    /Access to \.git directory is forbidden/
  );
  assert.throws(
    () => storage.safeJoin('/tmp/vault', 'subfolder/.git/HEAD'),
    /Access to \.git directory is forbidden/
  );
});
