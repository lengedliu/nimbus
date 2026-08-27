const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');
const JsonDb = require('./jsonDb');
const { VAULTS_FILE, VAULTS_DIR } = require('./config');
const dbManager = require('./db');
const vaultMembers = require('./vaultMembers');

const jsonDb = new JsonDb(VAULTS_FILE, { vaults: [] });

let vaultsCache = [];

function refreshCacheFromJson() {
  try {
    vaultsCache = jsonDb.read().vaults || [];
  } catch {
    vaultsCache = [];
  }
}

async function loadFromDb() {
  if (dbManager.type === 'json') {
    refreshCacheFromJson();
    return;
  }
  try {
    const rows = await dbManager.queryAll('SELECT id, owner_id, name, created_at FROM vaults');
    vaultsCache = rows.map((r) => ({
      id: r.id,
      ownerId: r.owner_id || r.ownerId,
      name: r.name,
      createdAt: r.created_at || r.createdAt,
    }));
  } catch (err) {
    console.error('[Vaults] Error loading vaults from SQL database, fallback to JSON:', err.message);
    refreshCacheFromJson();
  }
}

function listForUser(userId, isAdmin = false) {
  if (isAdmin) {
    return vaultsCache.map((v) => ({
      ...v,
      myPermission: v.ownerId === userId ? 'owner' : 'admin',
      isOwner: v.ownerId === userId,
    }));
  }

  const owned = vaultsCache
    .filter((v) => v.ownerId === userId)
    .map((v) => ({ ...v, myPermission: 'owner', isOwner: true }));

  const memberRecords = vaultMembers.listForUser(userId);
  const shared = [];
  for (const m of memberRecords) {
    const v = getById(m.vaultId);
    if (v && v.ownerId !== userId) {
      shared.push({
        ...v,
        myPermission: m.permission || 'read-write',
        isOwner: false,
      });
    }
  }

  return [...owned, ...shared];
}

function getById(vaultId) {
  return vaultsCache.find((v) => v.id === vaultId);
}

function getUserPermission(userId, vaultId, isAdmin = false) {
  const v = getById(vaultId);
  if (!v) return null;
  if (v.ownerId === userId) return 'owner';
  if (isAdmin) return 'admin';
  const m = vaultMembers.getMember(vaultId, userId);
  return m ? m.permission : null;
}

function hasReadAccess(userId, vaultId, isAdmin = false) {
  const perm = getUserPermission(userId, vaultId, isAdmin);
  return !!perm;
}

function hasWriteAccess(userId, vaultId, isAdmin = false) {
  const perm = getUserPermission(userId, vaultId, isAdmin);
  return perm === 'owner' || perm === 'admin' || perm === 'read-write';
}

function create(ownerId, name) {
  const vault = { id: uuid(), ownerId, name, createdAt: new Date().toISOString() };
  vaultsCache.push(vault);

  if (dbManager.type === 'json') {
    jsonDb.update((data) => {
      data.vaults = data.vaults || [];
      data.vaults.push(vault);
      return data;
    });
  } else {
    dbManager
      .execute('INSERT INTO vaults (id, owner_id, name, created_at) VALUES (?, ?, ?, ?)', [
        vault.id,
        vault.ownerId,
        vault.name,
        vault.createdAt,
      ])
      .catch((err) => console.error('[Vaults] DB insert vault error:', err));
  }

  const root = vaultFilesRoot(vault.id);
  fs.mkdirSync(root, { recursive: true });
  return vault;
}

async function remove(vaultId) {
  vaultsCache = vaultsCache.filter((v) => v.id !== vaultId);
  await vaultMembers.removeAllForVault(vaultId);

  if (dbManager.type === 'json') {
    jsonDb.update((data) => {
      data.vaults = (data.vaults || []).filter((v) => v.id !== vaultId);
      return data;
    });
  } else {
    dbManager
      .execute('DELETE FROM vaults WHERE id = ?', [vaultId])
      .catch((err) => console.error('[Vaults] DB delete vault error:', err));
  }
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

refreshCacheFromJson();

module.exports = {
  listForUser,
  getById,
  create,
  remove,
  vaultRoot,
  vaultFilesRoot,
  userOwnsVault,
  getUserPermission,
  hasReadAccess,
  hasWriteAccess,
  loadFromDb,
  getRawVaults: () => vaultsCache,
};
