const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const { PORT, DATA_DIR, VAULTS_DIR, TLS_CERT_PATH, TLS_KEY_PATH, TRUST_PROXY, JWT_SECRET, VERSION } = require('./src/config');
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
const dashboardRoutes = require('./src/routes/dashboardRoutes');
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

// JWT_SECRET 用默认值等于把后门钥匙公开在仓库里的 .env.example 里——
// docker-compose.yml 那条部署路径已经靠 ${JWT_SECRET:?...} 语法强制要求设置，
// 但直接 `node server.js` 或用 systemd 跑的话没人拦着，这里做统一兜底：
// 生产环境下直接拒绝启动；非生产环境下只打印醒目警告，不阻断本地开发调试。
const INSECURE_DEFAULT_JWT_SECRET = 'dev-only-insecure-secret';
if (JWT_SECRET === INSECURE_DEFAULT_JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error(
      '[FATAL] JWT_SECRET 仍然是默认值，生产环境下拒绝启动。' +
      '请在 .env 或环境变量里设置一个随机长字符串，例如: openssl rand -hex 32'
    );
    process.exit(1);
  } else {
    console.warn(
      '[WARN] JWT_SECRET 使用的是默认值，任何知道这个默认值的人都可以伪造登录令牌。' +
      '仅适合本地开发调试，正式部署前务必设置一个随机的 JWT_SECRET。'
    );
  }
}

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

// 默认对所有来源开放（等价于原来的 cors()，避免默认就打破现有的 Web 客户端/插件），
// 但支持用 CORS_ALLOWED_ORIGINS（逗号分隔）收紧到指定域名——自己部署 Web 面板在固定
// 域名下时，强烈建议配置这个变量，把 CORS 收紧到只信任自己的前端。
const allowedOriginsEnv = (process.env.CORS_ALLOWED_ORIGINS || '').trim();
if (allowedOriginsEnv) {
  const allowedOrigins = allowedOriginsEnv.split(',').map((s) => s.trim()).filter(Boolean);
  app.use(
    cors({
      origin(origin, callback) {
        // 没有 Origin 头的请求（比如 Obsidian 插件、curl、服务器到服务器调用）直接放行
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} 不在允许列表内`));
      },
    })
  );
} else {
  console.warn(
    '[WARN] 未设置 CORS_ALLOWED_ORIGINS，当前允许任意来源跨域访问 API。' +
    '如果你的 Web 管理面板部署在固定域名下，建议设置该变量收紧 CORS。'
  );
  app.use(cors());
}
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

app.get('/api/health', (req, res) => res.json({ ok: true, name: 'nimbus-server', version: VERSION }));
app.get('/api/version', (req, res) => res.json({ ok: true, name: 'nimbus-server', version: VERSION }));
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
app.use('/api/dashboard', dashboardRoutes);

// Public share page
app.get('/share/:shareId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'share.html'));
});

// Web management dashboard (login, browse/edit vaults, admin panel).
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'public')));

// 全局错误处理中间件：兜底捕获所有路由抛出/reject 的异常（配合各路由用的
// asyncHandler），统一返回 JSON 错误而不是 Express 默认的 HTML 错误页
// （默认错误页在没有显式设置 NODE_ENV=production 时会把堆栈信息直接展示给客户端）。
// 必须放在所有路由和静态文件中间件之后。
app.use((err, req, res, next) => {
  console.error(`[HTTP ${req.method} ${req.originalUrl}] Unhandled error:`, err);
  if (res.headersSent) return next(err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    error: isProd ? '服务器内部错误' : err.message || '服务器内部错误',
  });
});

// 双保险：就算某处漏包了 asyncHandler，也不能让一个请求的异常悄无声息地
// 挂起，或者让一次 reject 直接带崩整个进程（Node 较新版本对未处理的
// rejection 默认就是崩进程）。这里只负责记录日志、不主动退出——
// 真正需要修的是产生这个 reject 的具体路由。
process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled promise rejection:', reason);
});

// uncaughtException 意味着代码状态可能已经不可信了，继续跑风险更大——
// 记录日志后主动退出，交给 Docker/ systemd 的重启策略拉起一个干净的新进程，
// 比带着损坏状态硬撑下去更安全。
process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught exception, shutting down:', err);
  process.exit(1);
});

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

// 优雅关闭：容器/进程被停止时，先停止接受新连接、给在飞请求（比如正在流式
// 上传的一次大文件、正在 debounce 等待落盘的 Git 提交）一个窗口跑完，
// 而不是被 SIGKILL 硬中断。超时兜底 10 秒后强制退出，避免关不掉。
let shuttingDown = false;
function gracefulShutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[Server] Received ${signal}, shutting down gracefully...`);

  const forceExitTimer = setTimeout(() => {
    console.warn('[Server] Graceful shutdown timed out, forcing exit.');
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  server.close(async () => {
    try {
      await dbManager.close();
    } catch (e) {
      console.warn('[Server] Error closing database connection:', e.message);
    }
    clearTimeout(forceExitTimer);
    console.log('[Server] Shutdown complete.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
