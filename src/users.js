const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const JsonDb = require('./jsonDb');
const { USERS_FILE } = require('./config');
const dbManager = require('./db');

const jsonDb = new JsonDb(USERS_FILE, { users: [] });

// Sync in-memory cache for fast lookups and auth tokens
let usersCache = [];

function refreshCacheFromJson() {
  try {
    usersCache = jsonDb.read().users || [];
  } catch {
    usersCache = [];
  }
}

async function loadFromDb() {
  if (dbManager.type === 'json') {
    refreshCacheFromJson();
    return;
  }
  try {
    const rows = await dbManager.queryAll('SELECT id, username, password_hash, role, created_at FROM users');
    usersCache = rows.map((r) => ({
      id: r.id,
      username: r.username,
      passwordHash: r.password_hash || r.passwordHash,
      role: r.role,
      createdAt: r.created_at || r.createdAt,
    }));
  } catch (err) {
    console.error('[Users] Error loading users from SQL database, falling back to JSON:', err.message);
    refreshCacheFromJson();
  }
}

function findByUsername(username) {
  return usersCache.find((u) => u.username === username);
}

function findById(id) {
  return usersCache.find((u) => u.id === id);
}

function createUser(username, password, role) {
  if (findByUsername(username)) {
    throw new Error(`User "${username}" already exists`);
  }
  const isFirstUser = !hasAnyUser();
  const passwordHash = bcrypt.hashSync(password, 10);
  const user = {
    id: uuid(),
    username,
    passwordHash,
    role: role || (isFirstUser ? 'admin' : 'user'),
    createdAt: new Date().toISOString(),
  };

  usersCache.push(user);

  // Write through to active DB backend
  if (dbManager.type === 'json') {
    jsonDb.update((data) => {
      data.users = data.users || [];
      data.users.push(user);
      return data;
    });
  } else {
    dbManager
      .execute(
        'INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)',
        [user.id, user.username, user.passwordHash, user.role, user.createdAt]
      )
      .catch((err) => console.error('[Users] DB insert user error:', err));
  }

  return { id: user.id, username: user.username, role: user.role };
}

function verifyPassword(username, password) {
  const user = findByUsername(username);
  if (!user) return null;
  const ok = bcrypt.compareSync(password, user.passwordHash);
  return ok ? { id: user.id, username: user.username, role: user.role || 'user' } : null;
}

function updatePassword(userId, newPassword) {
  const user = findById(userId);
  if (!user) throw new Error('User not found');
  const passwordHash = bcrypt.hashSync(newPassword, 10);
  user.passwordHash = passwordHash;

  if (dbManager.type === 'json') {
    jsonDb.update((data) => {
      data.users = (data.users || []).map((u) => (u.id === userId ? { ...u, passwordHash } : u));
      return data;
    });
  } else {
    dbManager
      .execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId])
      .catch((err) => console.error('[Users] DB update password error:', err));
  }
  return true;
}

function listAll() {
  return usersCache.map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role || 'user',
    createdAt: u.createdAt,
  }));
}

function remove(userId) {
  usersCache = usersCache.filter((u) => u.id !== userId);

  if (dbManager.type === 'json') {
    jsonDb.update((data) => {
      data.users = (data.users || []).filter((u) => u.id !== userId);
      return data;
    });
  } else {
    dbManager
      .execute('DELETE FROM users WHERE id = ?', [userId])
      .catch((err) => console.error('[Users] DB delete user error:', err));
  }
}

function hasAnyUser() {
  return usersCache.length > 0;
}

// Initial sync on module load
refreshCacheFromJson();

module.exports = {
  findByUsername,
  findById,
  createUser,
  verifyPassword,
  updatePassword,
  hasAnyUser,
  listAll,
  remove,
  loadFromDb,
  getRawUsers: () => usersCache,
};
