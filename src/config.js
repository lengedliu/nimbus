require('dotenv').config();
const path = require('path');

const DATA_DIR = path.resolve(process.cwd(), process.env.DATA_DIR || './data');

module.exports = {
  PORT: parseInt(process.env.PORT || '8787', 10),
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
};
