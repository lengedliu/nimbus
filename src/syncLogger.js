const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DATA_DIR } = require('./config');
const dbManager = require('./db');

const SYNC_LOGS_FILE = path.join(DATA_DIR, 'sync_logs.json');
const MAX_LOGS_PER_VAULT = 500;

// In-memory cache: vaultId -> Array of Log entries
// Log entry: { id, vaultId, userId, username, deviceName, clientIp, action, path, size, hash, status, detail, timestamp }
const logsCache = new Map();
let globalLogs = []; // Array of recent logs across all vaults

function randomLogId() {
  return 'log_' + Date.now().toString(36) + '_' + crypto.randomBytes(4).toString('hex');
}

function loadFromFile() {
  if (!fs.existsSync(SYNC_LOGS_FILE)) return;
  try {
    const raw = JSON.parse(fs.readFileSync(SYNC_LOGS_FILE, 'utf8'));
    if (Array.isArray(raw)) {
      logsCache.clear();
      globalLogs = raw.slice(0, 1000);
      for (const item of raw) {
        if (!logsCache.has(item.vaultId)) {
          logsCache.set(item.vaultId, []);
        }
        logsCache.get(item.vaultId).push(item);
      }
    }
  } catch (err) {
    console.error('[SyncLog] Failed to parse sync_logs.json:', err.message);
  }
}

function saveToFile() {
  try {
    fs.mkdirSync(path.dirname(SYNC_LOGS_FILE), { recursive: true });
    // Gather all logs
    const all = [];
    for (const list of logsCache.values()) {
      all.push(...list);
    }
    all.sort((a, b) => b.timestamp - a.timestamp);
    // Keep max 2000 in file
    const sliced = all.slice(0, 2000);
    fs.writeFileSync(SYNC_LOGS_FILE, JSON.stringify(sliced, null, 2));
  } catch (err) {
    console.error('[SyncLog] Failed to write sync_logs.json:', err.message);
  }
}

async function loadFromDb() {
  if (dbManager.type === 'json') {
    loadFromFile();
    return;
  }

  try {
    const rows = await dbManager.queryAll(
      'SELECT id, vault_id as vaultId, user_id as userId, username, device_name as deviceName, client_ip as clientIp, action, file_path as path, file_size as size, file_hash as hash, status, detail, timestamp FROM sync_logs ORDER BY timestamp DESC LIMIT 2000'
    );
    logsCache.clear();
    globalLogs = rows || [];
    for (const r of globalLogs) {
      if (!logsCache.has(r.vaultId)) {
        logsCache.set(r.vaultId, []);
      }
      logsCache.get(r.vaultId).push(r);
    }
    console.log(`[SyncLog] Loaded ${globalLogs.length} sync logs from DB (${dbManager.type.toUpperCase()})`);
  } catch (err) {
    console.error('[SyncLog] Failed to load from database:', err.message);
    loadFromFile();
  }
}

/**
 * Record a sync log entry
 * @param {Object} logData
 * {
 *   vaultId: string,
 *   userId: string,
 *   username?: string,
 *   deviceName?: string,
 *   clientIp?: string,
 *   action: 'create' | 'update' | 'delete' | 'conflict' | 'pull' | 'restore' | 'ignore',
 *   path: string,
 *   size?: number,
 *   hash?: string,
 *   status?: 'success' | 'conflict' | 'ignored' | 'error',
 *   detail?: string
 * }
 */
async function recordLog(logData) {
  const entry = {
    id: randomLogId(),
    vaultId: logData.vaultId,
    userId: logData.userId || 'system',
    username: logData.username || 'unknown',
    deviceName: logData.deviceName || 'Web/REST Client',
    clientIp: logData.clientIp || '',
    action: logData.action || 'update',
    path: logData.path || '',
    size: typeof logData.size === 'number' ? logData.size : 0,
    hash: logData.hash || '',
    status: logData.status || 'success',
    detail: logData.detail || '',
    timestamp: Date.now(),
  };

  // Add to memory cache
  if (!logsCache.has(entry.vaultId)) {
    logsCache.set(entry.vaultId, []);
  }
  const vaultList = logsCache.get(entry.vaultId);
  vaultList.unshift(entry);
  if (vaultList.length > MAX_LOGS_PER_VAULT) {
    vaultList.pop();
  }

  globalLogs.unshift(entry);
  if (globalLogs.length > 2000) {
    globalLogs.pop();
  }

  // Persist
  if (dbManager.type === 'json') {
    saveToFile();
  } else {
    try {
      await dbManager.execute(
        `INSERT INTO sync_logs (id, vault_id, user_id, username, device_name, client_ip, action, file_path, file_size, file_hash, status, detail, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.id,
          entry.vaultId,
          entry.userId,
          entry.username,
          entry.deviceName,
          entry.clientIp,
          entry.action,
          entry.path,
          entry.size,
          entry.hash,
          entry.status,
          entry.detail,
          entry.timestamp,
        ]
      );
    } catch (err) {
      console.error('[SyncLog DB Write Error]:', err.message);
    }
  }

  return entry;
}

/**
 * Query sync logs for a specific vault or globally
 */
function getLogs({ vaultId = null, action = null, status = null, search = null, limit = 50, offset = 0 } = {}) {
  let list = vaultId ? (logsCache.get(vaultId) || []) : globalLogs;

  if (action && action !== 'all') {
    list = list.filter((l) => l.action === action);
  }
  if (status && status !== 'all') {
    list = list.filter((l) => l.status === status);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (l) =>
        (l.path && l.path.toLowerCase().includes(q)) ||
        (l.username && l.username.toLowerCase().includes(q)) ||
        (l.deviceName && l.deviceName.toLowerCase().includes(q)) ||
        (l.detail && l.detail.toLowerCase().includes(q))
    );
  }

  const total = list.length;
  const page = list.slice(offset, offset + limit);

  return {
    total,
    logs: page,
    offset,
    limit,
  };
}

/**
 * Clear sync logs for a vault
 */
async function clearVaultLogs(vaultId) {
  logsCache.delete(vaultId);
  globalLogs = globalLogs.filter((l) => l.vaultId !== vaultId);

  if (dbManager.type === 'json') {
    saveToFile();
  } else {
    try {
      await dbManager.execute('DELETE FROM sync_logs WHERE vault_id = ?', [vaultId]);
    } catch (err) {
      console.error('[SyncLog DB Delete Error]:', err.message);
    }
  }
  return true;
}

/**
 * Export all raw logs for migration
 */
function getRawLogs() {
  return globalLogs;
}

module.exports = {
  recordLog,
  getLogs,
  clearVaultLogs,
  loadFromDb,
  getRawLogs,
};
