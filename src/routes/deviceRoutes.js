const express = require('express');
const { requireAuth } = require('../auth');
const devicesStore = require('../devices');
const users = require('../users');

const router = express.Router();
router.use(requireAuth);

// GET /api/devices - List devices for current user (or all if admin)
router.get('/', (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const { all } = req.query;

  const list = isAdmin && all === 'true' ? devicesStore.listAll() : devicesStore.listForUser(req.user.id);
  const fnsHub = req.app.get('fnsHub');

  // Enrich with online status from fnsHub rooms
  const enriched = list.map((dev) => {
    let isOnline = false;
    if (fnsHub && fnsHub.rooms) {
      for (const [vId, room] of fnsHub.rooms.entries()) {
        for (const client of room) {
          if (client.userId === dev.userId && (client.deviceId === dev.id || client.deviceName === dev.deviceName)) {
            isOnline = true;
            break;
          }
        }
        if (isOnline) break;
      }
    }

    const u = users.findById(dev.userId);
    return {
      ...dev,
      username: u ? u.username : 'Unknown',
      isOnline,
    };
  });

  res.json({ devices: enriched });
});

// POST /api/devices - Generate a dedicated device token
router.post('/', (req, res) => {
  const { deviceName, platform } = req.body || {};
  if (!deviceName || !deviceName.trim()) {
    return res.status(400).json({ error: '请输入设备名称 (例如: iPhone 15 Pro, MacBook M3)' });
  }

  const record = devicesStore.generateDeviceToken(req.user, deviceName.trim(), platform || 'desktop');
  res.json({ ok: true, device: record, message: '设备令牌创建成功' });
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
