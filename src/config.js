require('dotenv').config();
const path = require('path');

const DATA_DIR = path.resolve(process.cwd(), process.env.DATA_DIR || './data');

module.exports = {
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
  // 部署在 Nginx/Caddy/Traefik/Cloud Run 等反向代理之后时启用（默认开启）。
  // 开启后 req.ip 会信任 X-Forwarded-For 头；若在无前置反代的环境下，可配置 TRUST_PROXY=0 关闭。
  TRUST_PROXY: process.env.TRUST_PROXY !== '0' && process.env.TRUST_PROXY !== 'false',
  // 跨域允许的域名白名单，逗号分隔，例如: https://notes.example.com
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS || '',
};
