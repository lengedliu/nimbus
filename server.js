const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const { PORT, DATA_DIR, VAULTS_DIR, TLS_CERT_PATH, TLS_KEY_PATH, TRUST_PROXY } = require('./src/config');
const authRoutes = require('./src/routes/authRoutes');
const vaultRoutes = require('./src/routes/vaultRoutes');
const fileRoutes = require('./src/routes/fileRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const mcpRoutes = require('./src/routes/mcpRoutes');
const vaultExtrasRoutes = require('./src/routes/vaultExtrasRoutes');
const shareRoutes = require('./src/routes/shareRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');
const deviceRoutes = require('./src/routes/deviceRoutes');
const docsRoutes = require('./src/routes/docsRoutes');
const sponsorRoutes = require('./src/routes/sponsorRoutes');
const fnsHub = require('./src/wsHub');
const dbManager = require('./src/db');
const users = require('./src/users');
const vaultsStore = require('./src/vaults');
const sharesStore = require('./src/shares');
const syncRulesStore = require('./src/syncRules');
const settingsManager = require('./src/settings');
const syncLogger = require('./src/syncLogger');
const vaultMembers = require('./src/vaultMembers');
const devicesStore = require('./src/devices');
const storage = require('./src/storage');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(VAULTS_DIR, { recursive: true });
storage.cleanupAllStaleUploadTemps();

// Initialize database
(async () => {
  try {
    await dbManager.init();
    await users.loadFromDb();
    await vaultsStore.loadFromDb();
    await vaultMembers.loadFromDb();
    await sharesStore.loadFromDb();
    await syncRulesStore.loadFromDb();
    await settingsManager.loadFromDb();
    await syncLogger.loadFromDb();
    await devicesStore.loadFromDb();
  } catch (err) {
    console.error('[DB] Initial startup load error:', err);
  }
})();

const app = express();
app.set('fnsHub', fnsHub);
if (TRUST_PROXY) {
  app.set('trust proxy', 1);
}
app.use(cors());
app.use(compression()); // 文本类响应（JSON/HTML/笔记内容）走 gzip；八进制流的文件下载会被自动跳过
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 全局限流：保护同步/搜索这类同步阻塞型接口不被单个来源短时间内打爆。
// 阈值给得比较宽松，正常的 Obsidian 多设备同步不会碰到；
// 登录接口另有更严格的专用限流（见 authRoutes.js），这里不重复限制登录。
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' },
});
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => res.json({ ok: true, name: 'nimbus-server' }));
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api', shareRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/vaults', vaultRoutes);
app.use('/api/vaults', fileRoutes);
app.use('/api/vaults', vaultExtrasRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mcp', mcpRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/sponsors', sponsorRoutes);

// Public share page
app.get('/share/:shareId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'share.html'));
});

// Web management dashboard (login, browse/edit vaults, admin panel).
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'public')));

let server;
let usingTls = false;
if (TLS_CERT_PATH && TLS_KEY_PATH) {
  try {
    const tlsOptions = {
      cert: fs.readFileSync(TLS_CERT_PATH),
      key: fs.readFileSync(TLS_KEY_PATH),
    };
    server = https.createServer(tlsOptions, app);
    usingTls = true;
  } catch (e) {
    console.error(`Failed to load TLS cert/key (${e.message}). Falling back to plain HTTP.`);
    server = http.createServer(app);
  }
} else {
  server = http.createServer(app);
}
fnsHub.init(server);

const scheme = usingTls ? 'https' : 'http';
const wsScheme = usingTls ? 'wss' : 'ws';
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Nimbus server listening on ${scheme}://0.0.0.0:${PORT}`);
  console.log(`Management dashboard: ${scheme}://0.0.0.0:${PORT}/admin`);
  console.log(`WebSocket sync endpoint: ${wsScheme}://0.0.0.0:${PORT}/ws`);
  console.log(`Data dir: ${DATA_DIR}`);
  if (!usingTls) {
    console.log('TLS not configured (TLS_CERT_PATH/TLS_KEY_PATH) — serving plain HTTP/WS.');
  }
});
