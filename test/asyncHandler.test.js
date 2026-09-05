const test = require('node:test');
const assert = require('node:assert/strict');
const { asyncHandler } = require('../src/utils/asyncHandler');

test('asyncHandler: 正常返回时不调用 next', async () => {
  let nextCalled = false;
  const handler = asyncHandler(async (req, res) => {
    res.json({ ok: true });
  });
  await handler({}, { json: () => {} }, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
});

test('asyncHandler: 内部抛出同步异常会被转交给 next(err)', async () => {
  const handler = asyncHandler(async () => {
    throw new Error('boom');
  });
  const receivedErr = await new Promise((resolve) => {
    handler({}, {}, resolve);
  });
  assert.ok(receivedErr instanceof Error);
  assert.equal(receivedErr.message, 'boom');
});

test('asyncHandler: 内部 Promise reject 也会被转交给 next(err)，不会挂起', async () => {
  const handler = asyncHandler(async () => {
    await Promise.reject(new Error('async boom'));
  });
  const receivedErr = await new Promise((resolve) => {
    handler({}, {}, resolve);
  });
  assert.equal(receivedErr.message, 'async boom');
});
