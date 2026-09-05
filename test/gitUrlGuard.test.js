const test = require('node:test');
const assert = require('node:assert/strict');
const { validateGitRemoteUrl } = require('../src/utils/gitUrlGuard');

test('validateGitRemoteUrl: 允许标准 http(s)/git/ssh URL 与 SCP 短语法', () => {
  const allowed = [
    '',
    undefined,
    'https://github.com/user/repo.git',
    'http://gitea.internal.example.com/user/repo.git',
    'ssh://git@example.com:2222/user/repo.git',
    'git://example.com/user/repo.git',
    'git@github.com:user/repo.git',
    'git@gitlab.example.com:group/sub-group/repo.git',
  ];
  for (const url of allowed) {
    assert.doesNotThrow(() => validateGitRemoteUrl(url), `应该允许: ${url}`);
  }
});

test('validateGitRemoteUrl: 拒绝 ext:: / file:// 等危险协议', () => {
  const blocked = [
    'ext::sh -c "touch /tmp/pwned"',
    'ext::sh${IFS}-c${IFS}id',
    'file:///etc/passwd',
    'file:///app/data/vaults/other-vault-id/files',
    'fd::1',
    'ftp://example.com/repo.git',
  ];
  for (const url of blocked) {
    assert.throws(() => validateGitRemoteUrl(url), `应该拒绝: ${url}`);
  }
});

test('validateGitRemoteUrl: 拒绝包含换行符或明显不是地址的字符串', () => {
  assert.throws(() => validateGitRemoteUrl('https://example.com/repo.git\nrm -rf /'));
  assert.throws(() => validateGitRemoteUrl('--upload-pack=/bin/sh'));
  assert.throws(() => validateGitRemoteUrl('not a url at all'));
});
