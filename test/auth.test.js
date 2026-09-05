const test = require('node:test');
const assert = require('node:assert/strict');

process.env.DATA_DIR = require('node:fs').mkdtempSync(
  require('node:path').join(require('node:os').tmpdir(), 'nimbus-test-auth-')
);
process.env.JWT_SECRET = 'test-secret-for-unit-tests-only';

const { signToken, verifyToken } = require('../src/auth');

test('signToken/verifyToken: 合法 token 能正确解出用户信息', () => {
  const token = signToken({ id: 'u1', username: 'alice' });
  const payload = verifyToken(token);
  assert.equal(payload.sub, 'u1');
  assert.equal(payload.username, 'alice');
});

test('verifyToken: 篡改过的 token 应该校验失败返回 null', () => {
  const token = signToken({ id: 'u1', username: 'alice' });
  const tampered = token.slice(0, -2) + (token.slice(-2) === 'aa' ? 'bb' : 'aa');
  assert.equal(verifyToken(tampered), null);
});

test('verifyToken: 完全无效的字符串应该返回 null 而不是抛异常', () => {
  assert.equal(verifyToken('not-a-jwt-at-all'), null);
});
