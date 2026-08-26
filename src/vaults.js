const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');
const JsonDb = require('./jsonDb');
const { VAULTS_FILE, VAULTS_DIR } = require('./config');

const db = new JsonDb(VAULTS_FILE, { vaults: [] });

function listForUser(userId) {
  return db.read().vaults.filter(v => v.ownerId === userId);
}

function getById(vaultId) {
  return db.read().vaults.find(v => v.id === vaultId);
}

function create(ownerId, name) {
  const vault = { id: uuid(), ownerId, name, createdAt: new Date().toISOString() };
  db.update(data => {
    data.vaults.push(vault);
    return data;
  });
  const root = vaultFilesRoot(vault.id);
  fs.mkdirSync(root, { recursive: true });
  return vault;
}

function remove(vaultId) {
  db.update(data => {
    data.vaults = data.vaults.filter(v => v.id !== vaultId);
    return data;
  });
}

function vaultRoot(vaultId) {
  return path.join(VAULTS_DIR, vaultId);
}

function vaultFilesRoot(vaultId) {
  return path.join(vaultRoot(vaultId), 'files');
}

function userOwnsVault(userId, vaultId) {
  const v = getById(vaultId);
  return !!v && v.ownerId === userId;
}

module.exports = {
  listForUser,
  getById,
  create,
  remove,
  vaultRoot,
  vaultFilesRoot,
  userOwnsVault,
};
