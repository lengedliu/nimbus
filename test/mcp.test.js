const test = require('node:test');
const assert = require('node:assert/strict');
const { isPrivateOrReservedIp } = require('../src/utils/ssrfGuard');

test('isPrivateOrReservedIp: 应该拦截常见内网/本机/元数据地址', () => {
  const shouldBlock = [
    '127.0.0.1',
    '127.0.0.53',
    '10.0.0.1',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '169.254.169.254', // 云主机元数据接口
    '0.0.0.0',
    '100.64.0.1',
    '::1',
    'fe80::1',
    'fc00::1',
    'fd12:3456::1',
    '::ffff:127.0.0.1',
  ];
  for (const ip of shouldBlock) {
    assert.equal(isPrivateOrReservedIp(ip), true, `${ip} 应该被判定为内网/保留地址`);
  }
});

test('isPrivateOrReservedIp: 不应该拦截公网地址', () => {
  const shouldAllow = ['8.8.8.8', '1.1.1.1', '93.184.216.34', '172.15.0.1', '172.32.0.1', '2606:4700:4700::1111'];
  for (const ip of shouldAllow) {
    assert.equal(isPrivateOrReservedIp(ip), false, `${ip} 不应该被拦截`);
  }
});
