const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const JsonDb = require('./jsonDb');
const { USERS_FILE } = require('./config');

const db = new JsonDb(USERS_FILE, { users: [] });

function findByUsername(username) {
  return db.read().users.find(u => u.username === username);
}

function findById(id) {
  return db.read().users.find(u => u.id === id);
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
  db.update(data => {
    data.users.push(user);
    return data;
  });
  return { id: user.id, username: user.username, role: user.role };
}

function verifyPassword(username, password) {
  const user = findByUsername(username);
  if (!user) return null;
  const ok = bcrypt.compareSync(password, user.passwordHash);
  return ok ? { id: user.id, username: user.username, role: user.role || 'user' } : null;
}

function listAll() {
  return db.read().users.map(u => ({ id: u.id, username: u.username, role: u.role || 'user', createdAt: u.createdAt }));
}

function remove(userId) {
  db.update(data => {
    data.users = data.users.filter(u => u.id !== userId);
    return data;
  });
}

function hasAnyUser() {
  return db.read().users.length > 0;
}

module.exports = { findByUsername, findById, createUser, verifyPassword, hasAnyUser, listAll, remove };
