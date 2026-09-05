const net = require('node:net');

/**
 * 判断一个 IPv4/IPv6 地址是否落在内网/本机/链路本地/云主机元数据等
 * 不该被服务器主动发起请求访问的范围内。
 *
 * 独立成一个零依赖模块，方便单元测试，也方便未来任何"服务器代用户去请求
 * 一个用户提供的 URL"的功能（webhook、附件抓取等）复用同一份判断逻辑。
 */
function isPrivateOrReservedIp(ip) {
  const kind = net.isIP(ip);
  if (kind === 4) {
    const parts = ip.split('.').map(Number);
    const [a, b] = parts;
    if (a === 127) return true; // loopback
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 169 && b === 254) return true; // link-local, includes cloud metadata 169.254.169.254
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 carrier-grade NAT
    return false;
  }
  if (kind === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::1') return true; // loopback
    if (/^fe[89ab][0-9a-f]:/.test(lower)) return true; // fe80::/10 link-local
    if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true; // fc00::/7 unique local
    if (lower.startsWith('::ffff:')) {
      // IPv4-mapped IPv6, e.g. ::ffff:127.0.0.1 — unwrap and check the embedded IPv4.
      const mapped = lower.slice('::ffff:'.length);
      if (net.isIP(mapped) === 4) return isPrivateOrReservedIp(mapped);
    }
    return false;
  }
  return true; // couldn't parse — fail closed
}

module.exports = { isPrivateOrReservedIp };
