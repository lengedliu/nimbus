const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { DATA_DIR, JWT_SECRET } = require('./config');
const JsonDb = require('./jsonDb');
const dbManager = require('./db');
const webhooks = require('./webhooks');

const jsonDb = new JsonDb(path.join(DATA_DIR, 'devices.json'), []);

let devicesCache = [];

function refreshCacheFromJson() {
  try {
    devicesCache = jsonDb.read() || [];
  } catch {
    devicesCache = [];
  }
}

async function loadFromDb() {
  if (dbManager.type === 'json') {
    refreshCacheFromJson();
    return;
  }
  try {
    const rows = await dbManager.queryAll(
      'SELECT id, user_id, device_name, platform, client_ip, user_agent, token, created_at, last_active_at, status FROM api_tokens'
    );
    devicesCache = rows.map((r) => ({
      id: r.id,
      userId: r.user_id || r.userId,
      deviceName: r.device_name || r.deviceName || r.label || 'Obsidian Device',
      platform: r.platform || 'Unknown',
      clientIp: r.client_ip || r.clientIp || '',
      userAgent: r.user_agent || r.userAgent || '',
      token: r.token,
      createdAt: Number(r.created_at || r.createdAt || Date.now()),
      lastActiveAt: Number(r.last_active_at || r.last_used_at || r.lastActiveAt || Date.now()),
      status: r.status || 'active',
    }));
  } catch (err) {
    refreshCacheFromJson();
  }
}

function listForUser(userId) {
  return devicesCache
    .filter((d) => d.userId === userId && d.status !== 'revoked')
    .sort((a, b) => (b.lastActiveAt || b.createdAt) - (a.lastActiveAt || a.createdAt));
}

function listAll() {
  return devicesCache
    .filter((d) => d.status !== 'revoked')
    .sort((a, b) => (b.lastActiveAt || b.createdAt) - (a.lastActiveAt || a.createdAt));
}

function generateDeviceToken(user, deviceName = 'Obsidian Client', platform = 'desktop', expiresInDays = 365) {
  const id = crypto.randomBytes(8).toString('hex');
  const durationDays = Number(expiresInDays) > 0 ? Number(expiresInDays) : 365;
  // Long-lived token for dedicated device sync
  const token = jwt.sign(
    { sub: user.id, username: user.username, deviceId: id, deviceName: (deviceName || 'Obsidian Device').trim(), type: 'device' },
    JWT_SECRET,
    { expiresIn: durationDays > 0 ? `${durationDays}d` : '3650d' }
  );

  const now = Date.now();
  const record = {
    id,
    userId: user.id,
    deviceName: (deviceName || 'Obsidian Device').trim(),
    platform: platform || 'desktop',
    clientIp: '',
    userAgent: '',
    token,
    createdAt: now,
    lastActiveAt: now,
    status: 'active',
  };

  devicesCache = [record, ...devicesCache];

  if (dbManager.type === 'json') {
    jsonDb.update((list) => [record, ...(Array.isArray(list) ? list : [])]);
  } else {
    dbManager
      .execute(
        'INSERT INTO api_tokens (id, user_id, label, token, created_at, last_used_at) VALUES (?, ?, ?, ?, ?, ?)',
        [record.id, record.userId, record.deviceName, record.token, record.createdAt, record.lastActiveAt]
      )
      .catch((err) => console.error('[Devices] DB insert token error:', err));
  }

  return record;
}

function recordActivity(deviceIdOrToken, { clientIp, userAgent, deviceName } = {}) {
  const now = Date.now();
  let updated = false;

  devicesCache = devicesCache.map((d) => {
    if (d.id === deviceIdOrToken || d.token === deviceIdOrToken) {
      updated = true;
      return {
        ...d,
        deviceName: deviceName || d.deviceName,
        clientIp: clientIp || d.clientIp,
        userAgent: userAgent || d.userAgent,
        lastActiveAt: now,
      };
    }
    return d;
  });

  if (updated) {
    if (dbManager.type === 'json') {
      jsonDb.update((list) =>
        (Array.isArray(list) ? list : []).map((d) => {
          if (d.id === deviceIdOrToken || d.token === deviceIdOrToken) {
            return {
              ...d,
              deviceName: deviceName || d.deviceName,
              clientIp: clientIp || d.clientIp,
              userAgent: userAgent || d.userAgent,
              lastActiveAt: now,
            };
          }
          return d;
        })
      );
    }
  }
}

function regenerateDeviceToken(id, user, expiresInDays = 365, isAdmin = false) {
  const durationDays = Number(expiresInDays) > 0 ? Number(expiresInDays) : 365;
  const now = Date.now();
  let updatedRecord = null;

  devicesCache = devicesCache.map((d) => {
    if (d.id === id && (isAdmin || d.userId === user.id)) {
      const newToken = jwt.sign(
        { sub: d.userId, username: user.username, deviceId: d.id, deviceName: d.deviceName, type: 'device' },
        JWT_SECRET,
        { expiresIn: durationDays > 0 ? `${durationDays}d` : '3650d' }
      );
      updatedRecord = {
        ...d,
        token: newToken,
        createdAt: now,
        status: 'active',
      };
      return updatedRecord;
    }
    return d;
  });

  if (updatedRecord) {
    if (dbManager.type === 'json') {
      jsonDb.update((list) =>
        (Array.isArray(list) ? list : []).map((d) =>
          d.id === id && (isAdmin || d.userId === user.id) ? updatedRecord : d
        )
      );
    } else {
      dbManager
        .execute(
          'UPDATE api_tokens SET token = ?, created_at = ? WHERE id = ?' + (!isAdmin ? ' AND user_id = ?' : ''),
          !isAdmin ? [updatedRecord.token, updatedRecord.createdAt, id, user.id] : [updatedRecord.token, updatedRecord.createdAt, id]
        )
        .catch((err) => console.error('[Devices] DB update token error:', err));
    }
  }

  return updatedRecord;
}

function extendDeviceToken(id, user, extendDays = 365, isAdmin = false) {
  const addDays = Number(extendDays) > 0 ? Number(extendDays) : 365;
  let updatedRecord = null;

  devicesCache = devicesCache.map((d) => {
    if (d.id === id && (isAdmin || d.userId === user.id)) {
      let remainingSecs = 0;
      try {
        const decoded = jwt.decode(d.token);
        if (decoded && decoded.exp) {
          const expMs = decoded.exp * 1000;
          if (expMs > Date.now()) {
            remainingSecs = Math.max(0, Math.round((expMs - Date.now()) / 1000));
          }
        }
      } catch (e) {}

      const totalSecs = remainingSecs + addDays * 86400;
      const newToken = jwt.sign(
        { sub: d.userId, username: user.username, deviceId: d.id, deviceName: d.deviceName, type: 'device' },
        JWT_SECRET,
        { expiresIn: `${totalSecs}s` }
      );

      updatedRecord = {
        ...d,
        token: newToken,
        status: 'active',
      };
      return updatedRecord;
    }
    return d;
  });

  if (updatedRecord) {
    if (dbManager.type === 'json') {
      jsonDb.update((list) =>
        (Array.isArray(list) ? list : []).map((d) =>
          d.id === id && (isAdmin || d.userId === user.id) ? updatedRecord : d
        )
      );
    } else {
      dbManager
        .execute(
          'UPDATE api_tokens SET token = ? WHERE id = ?' + (!isAdmin ? ' AND user_id = ?' : ''),
          !isAdmin ? [updatedRecord.token, id, user.id] : [updatedRecord.token, id]
        )
        .catch((err) => console.error('[Devices] DB update token error:', err));
    }
  }

  return updatedRecord;
}

function revokeDevice(id, userId, isAdmin = false) {
  let found = false;
  devicesCache = devicesCache.map((d) => {
    if (d.id === id && (isAdmin || d.userId === userId)) {
      found = true;
      return { ...d, status: 'revoked' };
    }
    return d;
  });

  if (found) {
    if (dbManager.type === 'json') {
      jsonDb.update((list) =>
        (Array.isArray(list) ? list : []).map((d) =>
          d.id === id && (isAdmin || d.userId === userId) ? { ...d, status: 'revoked' } : d
        )
      );
    } else {
      dbManager
        .execute('DELETE FROM api_tokens WHERE id = ?' + (!isAdmin && userId ? ' AND user_id = ?' : ''), !isAdmin && userId ? [id, userId] : [id])
        .catch((err) => console.error('[Devices] DB delete token error:', err));
    }
  }

  return found;
}

function isTokenRevoked(token) {
  const record = devicesCache.find((d) => d.token === token);
  if (record && record.status === 'revoked') return true;
  return false;
}

refreshCacheFromJson();

module.exports = {
  listForUser,
  listAll,
  generateDeviceToken,
  regenerateDeviceToken,
  extendDeviceToken,
  recordActivity,
  revokeDevice,
  isTokenRevoked,
  loadFromDb,
};
