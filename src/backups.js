const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');
const vaults = require('./vaults');
const storage = require('./storage');
const webhooks = require('./webhooks');

function backupsDir(vaultId) {
  const dir = path.join(vaults.vaultRoot(vaultId), 'backups');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function backupsIndexPath(vaultId) {
  return path.join(vaults.vaultRoot(vaultId), 'backups-index.json');
}

function loadIndex(vaultId) {
  const p = backupsIndexPath(vaultId);
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return [];
  }
}

function saveIndex(vaultId, list) {
  fs.writeFileSync(backupsIndexPath(vaultId), JSON.stringify(list, null, 2));
}

function listBackups(vaultId) {
  const dir = backupsDir(vaultId);
  const indexList = loadIndex(vaultId);
  const existingFiles = fs.readdirSync(dir);

  // Sync actual files
  const valid = indexList.filter((item) => existingFiles.includes(item.filename));

  // Add any unindexed zip files
  for (const f of existingFiles) {
    if (f.endsWith('.zip') && !valid.some((v) => v.filename === f)) {
      const stat = fs.statSync(path.join(dir, f));
      valid.push({
        id: crypto.randomBytes(6).toString('hex'),
        filename: f,
        size: stat.size,
        createdAt: stat.mtimeMs,
        label: '自动快照',
      });
    }
  }

  valid.sort((a, b) => b.createdAt - a.createdAt);
  saveIndex(vaultId, valid);
  return valid;
}

async function createBackup(vaultId, label = '手动快照') {
  const dir = backupsDir(vaultId);
  const vault = vaults.getById(vaultId);
  const vaultName = vault ? vault.name : vaultId;
  const id = crypto.randomBytes(6).toString('hex');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${vaultName}-snapshot-${stamp}-${id}.zip`;
  const fullPath = path.join(dir, filename);

  const stats = storage.getVaultStats(vaultId);
  const output = fs.createWriteStream(fullPath);
  const archive = archiver('zip', { zlib: { level: 6 } });

  await new Promise((resolve, reject) => {
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);

    const root = vaults.vaultFilesRoot(vaultId);
    if (fs.existsSync(root)) {
      archive.directory(root, false);
    }
    archive.finalize();
  });

  const fileStat = fs.statSync(fullPath);
  const record = {
    id,
    filename,
    label: label || '手动快照',
    size: fileStat.size,
    notesCount: stats.notesCount,
    totalFiles: stats.totalFiles,
    createdAt: Date.now(),
  };

  const list = [record, ...loadIndex(vaultId)];
  saveIndex(vaultId, list);

  // Trigger webhook notification
  webhooks.trigger('backup.created', {
    vaultId,
    vaultName,
    filename,
    size: fileStat.size,
  }).catch(() => {});

  return record;
}

function deleteBackup(vaultId, backupId) {
  const dir = backupsDir(vaultId);
  const list = loadIndex(vaultId);
  const item = list.find((b) => b.id === backupId || b.filename === backupId);
  if (!item) return false;

  const full = path.join(dir, item.filename);
  if (fs.existsSync(full)) {
    fs.unlinkSync(full);
  }

  saveIndex(vaultId, list.filter((b) => b.id !== item.id));
  return true;
}

function getBackupFilePath(vaultId, backupId) {
  const dir = backupsDir(vaultId);
  const list = loadIndex(vaultId);
  const item = list.find((b) => b.id === backupId || b.filename === backupId);
  if (!item) return null;
  const full = path.join(dir, item.filename);
  if (!fs.existsSync(full)) return null;
  return { fullPath: full, filename: item.filename };
}

module.exports = {
  listBackups,
  createBackup,
  deleteBackup,
  getBackupFilePath,
};
