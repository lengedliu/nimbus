const express = require('express');
const cors = require('cors');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const { PORT, DATA_DIR, VAULTS_DIR, TLS_CERT_PATH, TLS_KEY_PATH } = require('./src/config');
const authRoutes = require('./src/routes/authRoutes');
const vaultRoutes = require('./src/routes/vaultRoutes');
const fileRoutes = require('./src/routes/fileRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const mcpRoutes = require('./src/routes/mcpRoutes');
const vaultExtrasRoutes = require('./src/routes/vaultExtrasRoutes');
const shareRoutes = require('./src/routes/shareRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');
const fnsHub = require('./src/wsHub');
const dbManager = require('./src/db');
const users = require('./src/users');
const vaultsStore = require('./src/vaults');
const sharesStore = require('./src/shares');
const syncRulesStore = require('./src/syncRules');
const settingsManager = require('./src/settings');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(VAULTS_DIR, { recursive: true });

// Initialize database
(async () => {
  try {
    await dbManager.init();
    await users.loadFromDb();
    await vaultsStore.loadFromDb();
    await sharesStore.loadFromDb();
    await syncRulesStore.loadFromDb();
    await settingsManager.loadFromDb();
  } catch (err) {
    console.error('[DB] Initial startup load error:', err);
  }
})();

const app = express();
app.set('fnsHub', fnsHub);
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, name: 'nimbus-server' }));
app.use('/api/auth', authRoutes);
app.use('/api', shareRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/vaults', vaultRoutes);
app.use('/api/vaults', fileRoutes);
app.use('/api/vaults', vaultExtrasRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mcp', mcpRoutes);

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
