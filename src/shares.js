const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { DATA_DIR } = require('./config');
const JsonDb = require('./jsonDb');
const dbManager = require('./db');

const jsonDb = new JsonDb(path.join(DATA_DIR, 'shares.json'), []);

let sharesCache = [];

function refreshCacheFromJson() {
  try {
    sharesCache = jsonDb.read() || [];
  } catch {
    sharesCache = [];
  }
}

async function loadFromDb() {
  if (dbManager.type === 'json') {
    refreshCacheFromJson();
    return;
  }
  try {
    const rows = await dbManager.queryAll(
      'SELECT id, vault_id, user_id, file_path, title, has_password, password_hash, allow_copy, created_at, expires_at, view_count FROM shares'
    );
    sharesCache = rows.map((r) => ({
      id: r.id,
      vaultId: r.vault_id || r.vaultId,
      userId: r.user_id || r.userId,
      filePath: r.file_path || r.filePath,
      title: r.title,
      hasPassword: Boolean(r.has_password || r.hasPassword),
      passwordHash: r.password_hash || r.passwordHash,
      allowCopy: Boolean(r.allow_copy !== undefined ? r.allow_copy : r.allowCopy),
      createdAt: Number(r.created_at || r.createdAt),
      expiresAt: r.expires_at || r.expiresAt ? Number(r.expires_at || r.expiresAt) : null,
      viewCount: Number(r.view_count || r.viewCount || 0),
    }));
  } catch (err) {
    console.error('[Shares] Error loading shares from SQL database, fallback to JSON:', err.message);
    refreshCacheFromJson();
  }
}

function randomShareId() {
  return crypto.randomBytes(6).toString('base64url');
}

function listForUser(userId) {
  return sharesCache.filter((s) => s.userId === userId);
}

function listForVault(vaultId) {
  return sharesCache.filter((s) => s.vaultId === vaultId);
}

function getById(id) {
  const share = sharesCache.find((s) => s.id === id);
  if (!share) return null;
  if (share.expiresAt && Date.now() > share.expiresAt) {
    return null;
  }
  return share;
}

async function create({ vaultId, userId, filePath, title, password, expiresDays, allowCopy = true }) {
  const id = randomShareId();
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;
  const expiresAt = expiresDays && expiresDays > 0 ? Date.now() + expiresDays * 24 * 60 * 60 * 1000 : null;

  const record = {
    id,
    vaultId,
    userId,
    filePath,
    title: title || path.basename(filePath),
    hasPassword: Boolean(passwordHash),
    passwordHash,
    allowCopy: Boolean(allowCopy),
    createdAt: Date.now(),
    expiresAt,
    viewCount: 0,
  };

  sharesCache = [record, ...sharesCache];

  if (dbManager.type === 'json') {
    jsonDb.update((list) => [record, ...(Array.isArray(list) ? list : [])]);
  } else {
    dbManager
      .execute(
        'INSERT INTO shares (id, vault_id, user_id, file_path, title, has_password, password_hash, allow_copy, created_at, expires_at, view_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          record.id,
          record.vaultId,
          record.userId,
          record.filePath,
          record.title,
          record.hasPassword ? 1 : 0,
          record.passwordHash,
          record.allowCopy ? 1 : 0,
          record.createdAt,
          record.expiresAt,
          record.viewCount,
        ]
      )
      .catch((err) => console.error('[Shares] DB insert error:', err));
  }

  return {
    id: record.id,
    vaultId: record.vaultId,
    filePath: record.filePath,
    title: record.title,
    hasPassword: record.hasPassword,
    allowCopy: record.allowCopy,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
    viewCount: record.viewCount,
  };
}

async function verifyPassword(shareId, password) {
  const share = sharesCache.find((s) => s.id === shareId);
  if (!share || !share.hasPassword || !share.passwordHash) return false;
  return bcrypt.compare(password || '', share.passwordHash);
}

function remove(id, userId) {
  let found = false;
  sharesCache = sharesCache.filter((s) => {
    if (s.id === id && (!userId || s.userId === userId)) {
      found = true;
      return false;
    }
    return true;
  });

  if (dbManager.type === 'json') {
    jsonDb.update((list) =>
      (Array.isArray(list) ? list : []).filter((s) => {
        if (s.id === id && (!userId || s.userId === userId)) return false;
        return true;
      })
    );
  } else {
    dbManager
      .execute('DELETE FROM shares WHERE id = ?' + (userId ? ' AND user_id = ?' : ''), userId ? [id, userId] : [id])
      .catch((err) => console.error('[Shares] DB delete error:', err));
  }

  return found;
}

function recordView(id) {
  sharesCache = sharesCache.map((s) => (s.id === id ? { ...s, viewCount: (s.viewCount || 0) + 1 } : s));

  if (dbManager.type === 'json') {
    jsonDb.update((list) =>
      (Array.isArray(list) ? list : []).map((s) => (s.id === id ? { ...s, viewCount: (s.viewCount || 0) + 1 } : s))
    );
  } else {
    dbManager
      .execute('UPDATE shares SET view_count = view_count + 1 WHERE id = ?', [id])
      .catch((err) => console.error('[Shares] DB update view_count error:', err));
  }
}

refreshCacheFromJson();

module.exports = {
  listForUser,
  listForVault,
  getById,
  create,
  verifyPassword,
  remove,
  recordView,
  loadFromDb,
  getRawShares: () => sharesCache,
};
