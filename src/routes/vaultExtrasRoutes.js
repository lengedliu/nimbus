const express = require('express');
const { requireAuth } = require('../auth');
const vaultsStore = require('../vaults');
const storage = require('../storage');
const syncRules = require('../syncRules');
const syncLogger = require('../syncLogger');

const router = express.Router();
router.use(requireAuth);

function checkAccess(req, res, requireWrite = false) {
  const { vaultId } = req.params;
  const isAdmin = req.user.role === 'admin';
  if (requireWrite) {
    if (!vaultsStore.hasWriteAccess(req.user.id, vaultId, isAdmin)) {
      res.status(403).json({ error: '此笔记库仅具有只读权限，无写入/修改权限' });
      return false;
    }
  } else {
    if (!vaultsStore.hasReadAccess(req.user.id, vaultId, isAdmin)) {
      res.status(404).json({ error: 'Not found or no access' });
      return false;
    }
  }
  return true;
}

// ------------------------------- history --------------------------------------

// GET /api/vaults/:vaultId/history?path=notes/a.md  -> list of versions for that path
router.get('/:vaultId/history', (req, res) => {
  if (!checkAccess(req, res, false)) return;
  const { path: relPath } = req.query;
  if (!relPath) return res.status(400).json({ error: 'path query param required' });
  res.json({ history: storage.listHistory(req.params.vaultId, relPath) });
});

// GET /api/vaults/:vaultId/history/:versionId -> raw content of that version
router.get('/:vaultId/history/:versionId', (req, res) => {
  if (!checkAccess(req, res, false)) return;
  const result = storage.readHistoryVersion(req.params.vaultId, req.params.versionId);
  if (!result) return res.status(404).json({ error: 'Version not found' });
  res.set('Content-Type', 'application/octet-stream');
  res.send(result.buffer);
});

// POST /api/vaults/:vaultId/history/:versionId/restore -> makes this version the current content
router.post('/:vaultId/history/:versionId/restore', (req, res) => {
  if (!checkAccess(req, res, true)) return;
  const { vaultId, versionId } = req.params;
  const result = storage.readHistoryVersion(vaultId, versionId);
  if (!result) return res.status(404).json({ error: 'Version not found' });

  const writeResult = storage.writeFile(vaultId, result.entry.path, result.buffer, { mtime: Date.now() });
  if (writeResult.written) {
    req.app.get('fnsHub').broadcastFileChange(vaultId, result.entry.path, writeResult, req.user.id, true);
  }
  res.json({ path: result.entry.path, ...writeResult });
});

// ---------------------------------- trash ---------------------------------------

router.get('/:vaultId/trash', (req, res) => {
  if (!checkAccess(req, res, false)) return;
  res.json({ trash: storage.listTrash(req.params.vaultId) });
});

router.get('/:vaultId/trash/:trashId', (req, res) => {
  if (!checkAccess(req, res, false)) return;
  const result = storage.readTrashVersion(req.params.vaultId, req.params.trashId);
  if (!result) return res.status(404).json({ error: 'Trash item not found' });
  res.set('Content-Type', 'application/octet-stream');
  res.send(result.buffer);
});

router.post('/:vaultId/trash/:trashId/restore', (req, res) => {
  if (!checkAccess(req, res, true)) return;
  const { vaultId, trashId } = req.params;
  const restoredPath = storage.restoreFromTrash(vaultId, trashId);
  if (!restoredPath) return res.status(404).json({ error: 'Trash item not found' });

  const manifest = storage.getManifest(vaultId);
  const meta = manifest[restoredPath];
  if (meta) {
    req.app.get('fnsHub').broadcastFileChange(vaultId, restoredPath, { currentHash: meta.hash }, req.user.id, true);
  }
  res.json({ restored: restoredPath });
});

router.delete('/:vaultId/trash/:trashId', (req, res) => {
  if (!checkAccess(req, res, true)) return;
  const ok = storage.purgeTrash(req.params.vaultId, req.params.trashId);
  res.json({ purged: ok });
});

router.post('/:vaultId/trash/purge-all', (req, res) => {
  if (!checkAccess(req, res, true)) return;
  const count = storage.purgeAllTrash(req.params.vaultId);
  res.json({ purgedCount: count });
});

// ---------------------------------- stats & activity -----------------------------

router.get('/:vaultId/stats', (req, res) => {
  if (!checkAccess(req, res, false)) return;
  const { vaultId } = req.params;
  const hub = req.app.get('fnsHub');
  const stats = storage.getVaultStats(vaultId);
  const activeClients = hub ? hub.getClientCount(vaultId) : 0;
  const connectedDevices = hub ? hub.getClients(vaultId) : [];
  const recentActivity = hub ? hub.getActivityLogs(vaultId) : [];

  res.json({
    stats: {
      ...stats,
      activeClients,
    },
    connectedDevices,
    activity: recentActivity,
  });
});

// ---------------------------------- search ---------------------------------------

router.get('/:vaultId/search', (req, res) => {
  if (!checkAccess(req, res, false)) return;
  const { vaultId } = req.params;
  const { q } = req.query;
  const results = storage.searchVault(vaultId, q);
  res.json({ results });
});

// ---------------------------------- sync rules -----------------------------------

router.get('/:vaultId/rules', (req, res) => {
  if (!checkAccess(req, res, false)) return;
  const rules = syncRules.getRules(req.params.vaultId);
  res.json({ rules });
});

router.put('/:vaultId/rules', (req, res) => {
  if (!checkAccess(req, res, true)) return;
  const updated = syncRules.saveRules(req.params.vaultId, req.body || {});
  res.json({ rules: updated });
});

const conflicts = require('../conflicts');
const backups = require('../backups');

// ---------------------------------- conflicts ------------------------------------

router.get('/:vaultId/conflicts', (req, res) => {
  if (!checkAccess(req, res, false)) return;
  const list = conflicts.listConflicts(req.params.vaultId);
  res.json({ conflicts: list });
});

router.get('/:vaultId/conflicts/diff', (req, res) => {
  if (!checkAccess(req, res, false)) return;
  const { conflictPath } = req.query;
  if (!conflictPath) return res.status(400).json({ error: 'conflictPath required' });
  try {
    const diff = conflicts.getConflictDiff(req.params.vaultId, conflictPath);
    res.json(diff);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:vaultId/conflicts/resolve', async (req, res) => {
  if (!checkAccess(req, res, true)) return;
  const { conflictPath, resolution, customContent } = req.body || {};
  if (!conflictPath || !resolution) {
    return res.status(400).json({ error: 'conflictPath and resolution required' });
  }

  try {
    const result = await conflicts.resolveConflict(req.params.vaultId, {
      conflictPath,
      resolution,
      customContent,
      userId: req.user.id,
      fnsHub: req.app.get('fnsHub'),
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------------------------- backups / snapshots --------------------------

router.get('/:vaultId/backups', (req, res) => {
  if (!checkAccess(req, res, false)) return;
  const list = backups.listBackups(req.params.vaultId);
  res.json({ backups: list });
});

router.post('/:vaultId/backups', async (req, res) => {
  if (!checkAccess(req, res, true)) return;
  const { label } = req.body || {};
  try {
    const record = await backups.createBackup(req.params.vaultId, label);
    res.json({ ok: true, backup: record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:vaultId/backups/:backupId/download', (req, res) => {
  if (!checkAccess(req, res, false)) return;
  const fileInfo = backups.getBackupFilePath(req.params.vaultId, req.params.backupId);
  if (!fileInfo) return res.status(404).json({ error: 'Backup not found' });

  res.set({
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="${encodeURIComponent(fileInfo.filename)}"`,
  });
  const stream = require('fs').createReadStream(fileInfo.fullPath);
  stream.pipe(res);
});

router.delete('/:vaultId/backups/:backupId', (req, res) => {
  if (!checkAccess(req, res, true)) return;
  const ok = backups.deleteBackup(req.params.vaultId, req.params.backupId);
  res.json({ ok });
});

// ---------------------------------- export zip -----------------------------------

router.get('/:vaultId/export', (req, res) => {
  if (!checkAccess(req, res, false)) return;
  const { vaultId } = req.params;
  const vault = vaultsStore.getById(vaultId);
  const filename = `${vault ? vault.name : vaultId}-backup-${new Date().toISOString().slice(0, 10)}.zip`;

  res.set({
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
  });

  storage.exportVaultZip(vaultId, res).catch((err) => {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  });
});

// ---------------------------------- sync logs ------------------------------------

router.get('/:vaultId/sync-logs', (req, res) => {
  if (!checkAccess(req, res)) return;
  const { vaultId } = req.params;
  const { action, status, search, limit, offset } = req.query;

  const result = syncLogger.getLogs({
    vaultId,
    action: action || null,
    status: status || null,
    search: search || null,
    limit: limit ? parseInt(limit, 10) : 50,
    offset: offset ? parseInt(offset, 10) : 0,
  });

  res.json(result);
});

router.delete('/:vaultId/sync-logs', async (req, res) => {
  if (!checkAccess(req, res)) return;
  const { vaultId } = req.params;
  await syncLogger.clearVaultLogs(vaultId);
  res.json({ ok: true });
});

module.exports = router;
