const express = require('express');
const { requireAuth } = require('../auth');
const devicesStore = require('../devices');
const users = require('../users');

const router = express.Router();
router.use(requireAuth);

function detectPlatform(userAgent = '') {
  const ua = userAgent.toLowerCase();
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) return 'ios';
  if (ua.includes('android')) return 'android';
  if (ua.includes('macintosh') || ua.includes('mac os')) return 'macos';
  if (ua.includes('windows')) return 'windows';
  if (ua.includes('linux')) return 'linux';
  return 'desktop';
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || '127.0.0.1';
}

// GET /api/devices - List devices for current user (or all if admin)
router.get('/', (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const { all } = req.query;

  let list = isAdmin && all === 'true' ? devicesStore.listAll() : devicesStore.listForUser(req.user.id);
  const fnsHub = req.app.get('fnsHub');
  const clientIp = getClientIp(req);
  const userAgent = req.headers['user-agent'] || '';

  // If user has no devices yet, auto-provision their current initial device
  if (list.length === 0) {
    const platform = detectPlatform(userAgent);
    const platformName = platform === 'macos' ? 'MacBook / macOS' : platform === 'windows' ? 'Windows PC' : platform === 'ios' ? 'iPhone' : platform === 'android' ? 'Android Device' : platform === 'linux' ? 'Linux Workstation' : '主工作台终端';
    const initialDev = devicesStore.generateDeviceToken(req.user, `${platformName} (默认设备)`, platform);
    devicesStore.recordActivity(initialDev.id, { clientIp, userAgent, deviceName: initialDev.deviceName });
    list = isAdmin && all === 'true' ? devicesStore.listAll() : devicesStore.listForUser(req.user.id);
  }

  // Enrich with online status from fnsHub rooms and add any active WS clients
  const activeWsClients = [];
  if (fnsHub && fnsHub.rooms) {
    for (const [vId, room] of fnsHub.rooms.entries()) {
      for (const client of room) {
        if (isAdmin || client.userId === req.user.id) {
          activeWsClients.push({
            vaultId: vId,
            userId: client.userId,
            username: client.username,
            deviceId: client.deviceId,
            deviceName: client.deviceName || 'Obsidian Client',
            connectedAt: client.connectedAt,
          });
        }
      }
    }
  }

  const enriched = list.map((dev) => {
    let isOnline = false;
    for (const c of activeWsClients) {
      if (c.userId === dev.userId && (c.deviceId === dev.id || c.deviceName === dev.deviceName)) {
        isOnline = true;
        break;
      }
    }

    const u = users.findById(dev.userId);
    const rawToken = dev.token || '';
    const tokenPreview = rawToken.length > 16 ? `${rawToken.slice(0, 10)}...${rawToken.slice(-6)}` : rawToken || '••••••••••••';

    return {
      id: dev.id,
      deviceId: dev.id,
      name: dev.deviceName || 'Obsidian Client',
      deviceName: dev.deviceName || 'Obsidian Client',
      platform: dev.platform || 'desktop',
      clientIp: dev.clientIp || clientIp,
      lastIp: dev.clientIp || clientIp,
      userAgent: dev.userAgent || userAgent,
      token: rawToken,
      tokenPreview,
      createdAt: dev.createdAt,
      lastActiveAt: dev.lastActiveAt || dev.createdAt,
      status: dev.status || 'active',
      username: u ? u.username : 'Unknown',
      isOnline,
    };
  });

  res.json({ devices: enriched, activeWsClients });
});

// POST /api/devices - Generate a dedicated device token
router.post('/', (req, res) => {
  const name = req.body.name || req.body.deviceName || req.body.label;
  const platform = req.body.platform || detectPlatform(req.headers['user-agent'] || '');
  const expiresInDays = req.body.expiresInDays ? parseInt(req.body.expiresInDays, 10) : 365;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: '请输入设备名称 (例如: iPhone 15 Pro, MacBook M3)' });
  }

  const record = devicesStore.generateDeviceToken(req.user, name.trim(), platform, expiresInDays);
  const clientIp = getClientIp(req);
  devicesStore.recordActivity(record.id, { clientIp, userAgent: req.headers['user-agent'] || '', deviceName: record.deviceName });

  res.json({
    ok: true,
    device: {
      ...record,
      name: record.deviceName,
      deviceId: record.id,
      lastIp: clientIp,
      token: record.token,
      tokenPreview: `${record.token.slice(0, 10)}...${record.token.slice(-6)}`,
      isOnline: false,
    },
    message: '设备令牌创建成功',
  });
});

// DELETE /api/devices/:deviceId - Revoke device token
router.delete('/:deviceId', (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const ok = devicesStore.revokeDevice(req.params.deviceId, req.user.id, isAdmin);

  // Disconnect WebSocket if connected
  const fnsHub = req.app.get('fnsHub');
  if (fnsHub && fnsHub.rooms) {
    for (const [vId, room] of fnsHub.rooms.entries()) {
      for (const client of room) {
        if (client.deviceId === req.params.deviceId) {
          try {
            client.ws.close(4001, 'Device revoked');
          } catch {}
        }
      }
    }
  }

  res.json({ ok, message: ok ? '设备已注销并吊销令牌' : '设备未找到' });
});

module.exports = router;

