const express = require('express');
const { requireAuth } = require('../auth');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireReadAccess, requireWriteAccess, isAdminUser } = require('../permissions');
const vaultsStore = require('../vaults');
const storage = require('../storage');
const devicesStore = require('../devices');
const syncLogger = require('../syncLogger');
const conflictsStore = require('../conflicts');
const gitSync = require('../gitSync');
const dbManager = require('../db');
const { VERSION } = require('../config');

const router = express.Router();
router.use(requireAuth);

/**
 * GET /api/dashboard/overview
 * 返回聚合看板核心数据：概览指标、各 Vault 状态与健康度、活跃设备、最近同步动态流
 */
router.get('/overview', asyncHandler(async (req, res) => {
  const isAdmin = isAdminUser(req.user);
  const userVaults = vaultsStore.listForUser(req.user.id, isAdmin);
  const fnsHub = req.app.get('fnsHub');

  let totalFiles = 0;
  let totalNotes = 0;
  let totalAttachments = 0;
  let totalBytes = 0;
  let totalConflicts = 0;
  let totalTrash = 0;
  let totalHistory = 0;

  const vaultItems = [];

  for (const v of userVaults) {
    let stats = {
      totalFiles: 0,
      notesCount: 0,
      attachmentsCount: 0,
      configsCount: 0,
      totalBytes: 0,
      trashCount: 0,
      historyCount: 0,
    };

    try {
      stats = storage.getVaultStats(v.id);
    } catch {
      // safe fallback if storage read encounters issue
    }

    totalFiles += stats.totalFiles;
    totalNotes += stats.notesCount;
    totalAttachments += stats.attachmentsCount;
    totalBytes += stats.totalBytes;
    totalTrash += stats.trashCount;
    totalHistory += stats.historyCount;

    let conflictsCount = 0;
    try {
      conflictsCount = conflictsStore.listConflicts(v.id).length;
    } catch {}
    totalConflicts += conflictsCount;

    const isGit = gitSync.isGitRepo(v.id);
    const gitConfig = gitSync.loadConfig(v.id);
    const clientCount = fnsHub ? fnsHub.getClientCount(v.id) : 0;

    vaultItems.push({
      id: v.id,
      name: v.name,
      ownerId: v.ownerId,
      isOwner: v.isOwner,
      myPermission: v.myPermission,
      createdAt: v.createdAt,
      stats,
      conflictsCount,
      isGit,
      gitEnabled: !!gitConfig.enabled,
      clientCount,
    });
  }

  // 接入设备统计
  const userDevices = isAdmin ? devicesStore.listAll() : devicesStore.listForUser(req.user.id);
  let onlineClientCount = 0;
  if (fnsHub && fnsHub.rooms) {
    for (const [vId, room] of fnsHub.rooms.entries()) {
      if (userVaults.some((v) => v.id === vId)) {
        onlineClientCount += room.size;
      }
    }
  }

  // 最近同步动态日志
  let recentLogs = [];
  try {
    const result = syncLogger.getLogs ? syncLogger.getLogs({ limit: 15 }) : null;
    recentLogs = (result && Array.isArray(result.logs)) ? result.logs : [];
  } catch {
    recentLogs = [];
  }

  res.json({
    ok: true,
    version: VERSION,
    stats: {
      version: VERSION,
      totalVaults: userVaults.length,
      totalFiles,
      totalNotes,
      totalAttachments,
      totalBytes,
      totalConflicts,
      totalTrash,
      totalHistory,
      totalDevices: userDevices.length,
      onlineClients: onlineClientCount,
      dbType: dbManager.type || 'sqlite',
      serverTime: new Date().toISOString(),
    },
    vaults: vaultItems,
    recentLogs,
  });
}));

/**
 * GET /api/dashboard/kanban/:vaultId
 * 获取指定 Vault 的看板卡片与泳道配置（存储于 .nimbus-kanban.json）
 */
router.get('/kanban/:vaultId', asyncHandler(async (req, res) => {
  const { vaultId } = req.params;
  if (!requireReadAccess(req, res)) return;

  const defaultBoard = {
    columns: [
      { id: 'todo', title: '📌 待办 (To Do)', color: '#58a6ff' },
      { id: 'in_progress', title: '🚀 进行中 (In Progress)', color: '#e3b341' },
      { id: 'review', title: '🔍 归纳复盘 (Review)', color: '#a371f7' },
      { id: 'done', title: '✅ 已完成 (Done)', color: '#3fb950' },
    ],
    cards: [],
  };

  try {
    const raw = storage.readFile(vaultId, '.nimbus-kanban.json');
    if (!raw) {
      return res.json({ ok: true, board: defaultBoard });
    }
    const parsed = JSON.parse(raw.toString('utf8'));
    if (!parsed.columns || !Array.isArray(parsed.columns)) {
      parsed.columns = defaultBoard.columns;
    }
    if (!parsed.cards || !Array.isArray(parsed.cards)) {
      parsed.cards = defaultBoard.cards;
    }
    return res.json({ ok: true, board: parsed });
  } catch {
    return res.json({ ok: true, board: defaultBoard });
  }
}));

/**
 * PUT /api/dashboard/kanban/:vaultId
 * 保存指定 Vault 的看板配置与任务卡片
 */
router.put('/kanban/:vaultId', asyncHandler(async (req, res) => {
  const { vaultId } = req.params;
  if (!requireWriteAccess(req, res)) return;

  const { columns, cards } = req.body || {};
  if (!Array.isArray(columns) || !Array.isArray(cards)) {
    return res.status(400).json({ error: 'Invalid board data: columns and cards arrays required' });
  }

  const cleanBoard = {
    updatedAt: new Date().toISOString(),
    updatedBy: req.user.username,
    columns: columns.map((c) => ({
      id: String(c.id || '').trim() || 'todo',
      title: String(c.title || '').trim() || '未命名列',
      color: String(c.color || '#58a6ff'),
    })),
    cards: cards.map((card, idx) => ({
      id: card.id || `card-${Date.now()}-${idx}`,
      columnId: card.columnId || 'todo',
      title: String(card.title || '').trim() || '未命名任务',
      description: String(card.description || '').trim(),
      priority: ['high', 'medium', 'low'].includes(card.priority) ? card.priority : 'medium',
      tags: Array.isArray(card.tags) ? card.tags.map((t) => String(t).trim()).filter(Boolean) : [],
      notePath: card.notePath ? String(card.notePath).trim() : null,
      dueDate: card.dueDate ? String(card.dueDate).trim() : null,
      createdAt: card.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
  };

  const buffer = Buffer.from(JSON.stringify(cleanBoard, null, 2), 'utf8');
  storage.writeFile(vaultId, '.nimbus-kanban.json', buffer);

  res.json({ ok: true, message: '看板已保存', board: cleanBoard });
}));

/**
 * GET /api/dashboard/kanban/:vaultId/scan-tasks
 * 扫描指定 Vault 中的所有 Markdown 笔记，提取 `- [ ]` 与 `- [x]` 待办任务
 */
router.get('/kanban/:vaultId/scan-tasks', asyncHandler(async (req, res) => {
  const { vaultId } = req.params;
  if (!requireReadAccess(req, res)) return;

  const manifest = storage.getManifest(vaultId);
  const mdPaths = Object.keys(manifest).filter((p) => p.toLowerCase().endsWith('.md'));

  const tasks = [];
  const taskRegex = /^[ \t]*- \[( |x|X)\][ \t]+(.*)$/gm;

  // 扫描前 100 篇 markdown 笔记以保证极速响应
  const targetPaths = mdPaths.slice(0, 100);

  for (const relPath of targetPaths) {
    const buf = storage.readFile(vaultId, relPath);
    if (!buf) continue;
    const content = buf.toString('utf8');
    let match;
    taskRegex.lastIndex = 0;
    while ((match = taskRegex.exec(content)) !== null) {
      const isDone = match[1].toLowerCase() === 'x';
      const text = match[2].trim();
      if (!text) continue;

      tasks.push({
        id: `scanned-${Buffer.from(relPath + ':' + text).toString('base64').slice(0, 16)}`,
        title: text,
        notePath: relPath,
        completed: isDone,
        suggestedColumn: isDone ? 'done' : 'todo',
      });
      if (tasks.length >= 150) break;
    }
    if (tasks.length >= 150) break;
  }

  res.json({ ok: true, count: tasks.length, tasks });
}));

module.exports = router;
