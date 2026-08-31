const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { DATA_DIR, JWT_SECRET } = require('./config');
const JsonDb = require('./jsonDb');
const dbManager = require('./db');

const DEFAULT_SYSTEM_SETTINGS = {
  serverName: 'Nimbus Vault Sync',
  publicUrl: '',
  wsHeartbeatInterval: 30, // seconds
  conflictStrategy: 'conflict_copy', // 'conflict_copy' | 'overwrite_latest' | 'server_win'
  conflictSuffixFormat: '.conflict-YYYYMMDD-HHmmss',
  maxFileSizeMb: 100,
  chunkSizeMb: 5,
  versionRetentionCount: 30,
  versionRetentionDays: 30,
  trashRetentionDays: 30,
  syncHiddenConfig: true,
  syncAttachments: true,
  autoPurgeTrash: false,
  webhook_config: {
    enabled: false,
    platform: 'custom',
    url: '',
    secret: '',
    events: ['conflict.detected', 'conflict.resolved', 'backup.created', 'device.connected', 'file.deleted'],
  },
  defaultIgnorePatterns: [
    '.obsidian/workspace.json',
    '.obsidian/workspace-mobile.json',
    '**/*.tmp',
    '**/.DS_Store',
    '**/Thumbs.db',
    '**/.git/**',
    '**/.trash/**',
  ],
};

const settingsJsonDb = new JsonDb(path.join(DATA_DIR, 'settings.json'), DEFAULT_SYSTEM_SETTINGS);
const tokensJsonDb = new JsonDb(path.join(DATA_DIR, 'api_tokens.json'), []);

let cachedSettings = { ...DEFAULT_SYSTEM_SETTINGS };
let cachedTokens = [];

function refreshCacheFromJson() {
  try {
    cachedSettings = { ...DEFAULT_SYSTEM_SETTINGS, ...(settingsJsonDb.read() || {}) };
  } catch {
    cachedSettings = { ...DEFAULT_SYSTEM_SETTINGS };
  }
  try {
    cachedTokens = tokensJsonDb.read() || [];
  } catch {
    cachedTokens = [];
  }
}

async function loadFromDb() {
  if (dbManager.type === 'json') {
    refreshCacheFromJson();
    return;
  }

  try {
    const rows = await dbManager.queryAll('SELECT setting_key, value_json FROM system_settings');
    const dbSettings = {};
    for (const r of rows) {
      try {
        dbSettings[r.setting_key || r.settingKey] = JSON.parse(r.value_json || r.valueJson);
      } catch {}
    }
    cachedSettings = { ...DEFAULT_SYSTEM_SETTINGS, ...dbSettings };
  } catch (err) {
    console.error('[Settings] Error loading system settings from DB:', err.message);
    refreshCacheFromJson();
  }

  try {
    const tokenRows = await dbManager.queryAll('SELECT id, user_id, label, token, created_at, last_used_at FROM api_tokens');
    cachedTokens = tokenRows.map((r) => ({
      id: r.id,
      userId: r.user_id || r.userId,
      label: r.label,
      token: r.token,
      createdAt: Number(r.created_at || r.createdAt),
      lastUsedAt: r.last_used_at || r.lastUsedAt ? Number(r.last_used_at || r.lastUsedAt) : null,
    }));
  } catch (err) {
    console.error('[Settings] Error loading API tokens from DB:', err.message);
  }
}

function getSystemSettings() {
  return { ...cachedSettings };
}

function updateSystemSettings(updates) {
  cachedSettings = { ...cachedSettings, ...updates };

  if (dbManager.type === 'json') {
    settingsJsonDb.update(() => cachedSettings);
  } else {
    // Save to DB
    const now = Date.now();
    for (const [key, val] of Object.entries(updates)) {
      const jsonVal = JSON.stringify(val);
      if (dbManager.type === 'sqlite') {
        dbManager
          .execute('INSERT OR REPLACE INTO system_settings (setting_key, value_json, updated_at) VALUES (?, ?, ?)', [
            key,
            jsonVal,
            now,
          ])
          .catch((err) => console.error('[Settings] SQLite save error:', err));
      } else if (dbManager.type === 'postgres') {
        dbManager
          .execute(
            'INSERT INTO system_settings (setting_key, value_json, updated_at) VALUES (?, ?, ?) ON CONFLICT (setting_key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_at = EXCLUDED.updated_at',
            [key, jsonVal, now]
          )
          .catch((err) => console.error('[Settings] Postgres save error:', err));
      } else if (dbManager.type === 'mysql') {
        dbManager
          .execute(
            'INSERT INTO system_settings (setting_key, value_json, updated_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value_json = VALUES(value_json), updated_at = VALUES(updated_at)',
            [key, jsonVal, now]
          )
          .catch((err) => console.error('[Settings] MySQL save error:', err));
      }
    }
  }

  return cachedSettings;
}

// ------------------------------ Device / API Tokens ------------------------------

function listTokensForUser(userId) {
  return cachedTokens.filter((t) => t.userId === userId).map((t) => ({
    id: t.id,
    label: t.label,
    token: t.token,
    createdAt: t.createdAt,
    lastUsedAt: t.lastUsedAt,
    // mask token for preview display
    maskedToken: t.token ? `${t.token.slice(0, 10)}...${t.token.slice(-6)}` : '',
  }));
}

function createTokenForUser(userId, username, label = 'Obsidian Device', expiresInDays = 365) {
  const tokenId = crypto.randomBytes(8).toString('hex');
  const token = jwt.sign(
    { sub: userId, username, tid: tokenId, label },
    JWT_SECRET,
    { expiresIn: expiresInDays > 0 ? `${expiresInDays}d` : '3650d' }
  );

  const entry = {
    id: tokenId,
    userId,
    label: label || 'Obsidian Client',
    token,
    createdAt: Date.now(),
    lastUsedAt: null,
  };

  cachedTokens.unshift(entry);

  if (dbManager.type === 'json') {
    tokensJsonDb.update((list) => [entry, ...(Array.isArray(list) ? list : [])]);
  } else {
    dbManager
      .execute(
        'INSERT INTO api_tokens (id, user_id, label, token, created_at, last_used_at) VALUES (?, ?, ?, ?, ?, ?)',
        [entry.id, entry.userId, entry.label, entry.token, entry.createdAt, entry.lastUsedAt]
      )
      .catch((err) => console.error('[Settings] DB insert token error:', err));
  }

  return {
    id: entry.id,
    label: entry.label,
    token: entry.token,
    createdAt: entry.createdAt,
  };
}

function revokeToken(tokenId, userId) {
  let found = false;
  cachedTokens = cachedTokens.filter((t) => {
    if (t.id === tokenId && (!userId || t.userId === userId)) {
      found = true;
      return false;
    }
    return true;
  });

  if (dbManager.type === 'json') {
    tokensJsonDb.update((list) =>
      (Array.isArray(list) ? list : []).filter((t) => {
        if (t.id === tokenId && (!userId || t.userId === userId)) return false;
        return true;
      })
    );
  } else {
    dbManager
      .execute('DELETE FROM api_tokens WHERE id = ?' + (userId ? ' AND user_id = ?' : ''), userId ? [tokenId, userId] : [tokenId])
      .catch((err) => console.error('[Settings] DB delete token error:', err));
  }

  return found;
}

// ------------------------- Plugin Config Generation -------------------------

function generatePluginConfig({ serverUrl, vaultId, token, deviceName = 'Obsidian Client' }) {
  const cleanServer = (serverUrl || '').replace(/\/+$/, '');
  const wsUrl = cleanServer.replace(/^http:\/\//i, 'ws://').replace(/^https:\/\//i, 'wss://') + '/ws';
  const settings = getSystemSettings();

  return {
    plugin: 'fast-note-sync',
    version: '1.0.0',
    data: {
      serverUrl: cleanServer,
      wsUrl: `${wsUrl}?vaultId=${vaultId}&token=${token}&deviceId=${encodeURIComponent(deviceName)}`,
      vaultId,
      authToken: token,
      deviceName,
      autoSyncOnStartup: true,
      syncIntervalSeconds: settings.wsHeartbeatInterval || 30,
      conflictStrategy: settings.conflictStrategy || 'conflict_copy',
      chunkSizeMb: settings.chunkSizeMb || 5,
      maxFileSizeMb: settings.maxFileSizeMb || 100,
      syncHiddenFiles: Boolean(settings.syncHiddenConfig),
      syncAttachments: Boolean(settings.syncAttachments),
      ignoredPatterns: settings.defaultIgnorePatterns || [],
    },
  };
}

refreshCacheFromJson();

function get(key) {
  return cachedSettings[key];
}

function set(key, val) {
  updateSystemSettings({ [key]: val });
  return val;
}

module.exports = {
  DEFAULT_SYSTEM_SETTINGS,
  getSystemSettings,
  getAll: getSystemSettings,
  updateSystemSettings,
  get,
  set,
  listTokensForUser,
  createTokenForUser,
  revokeToken,
  generatePluginConfig,
  loadFromDb,
  getAllTokens: () => cachedTokens,
  listAllTokens: () => cachedTokens,
};
