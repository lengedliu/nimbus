require('dotenv').config();
const path = require('path');
const pkg = require('../package.json');

const APP_VERSION = process.env.APP_VERSION || pkg.version || '1.2.0';
const DATA_DIR = path.resolve(process.cwd(), process.env.DATA_DIR || './data');

module.exports = {
  VERSION: APP_VERSION,
  APP_VERSION,
  PORT: parseInt(process.env.PORT || '3000', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-insecure-secret',
  TOKEN_TTL: process.env.TOKEN_TTL || '30d',
  DATA_DIR,
  VAULTS_DIR: path.join(DATA_DIR, 'vaults'),
  USERS_FILE: path.join(DATA_DIR, 'users.json'),
  VAULTS_FILE: path.join(DATA_DIR, 'vaults.json'),
  // Optional: if both are set, the server listens over HTTPS/WSS using these
  // files. If either is missing, it falls back to plain HTTP/WS.
  TLS_CERT_PATH: process.env.TLS_CERT_PATH || '',
  TLS_KEY_PATH: process.env.TLS_KEY_PATH || '',
  // 只有部署在 Nginx/Caddy/Traefik 等反向代理之后时才应该打开——
  // 打开后 req.ip 会信任 X-Forwarded-For 头，直接裸暴露公网时打开这个反而会
  // 让恶意客户端伪造该头绕过限流。默认关闭，按需用 TRUST_PROXY=1 显式开启。
  TRUST_PROXY: process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true',
};
