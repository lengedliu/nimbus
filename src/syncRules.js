const fs = require('fs');
const path = require('path');
const { vaultRoot } = require('./vaults');
const dbManager = require('./db');

const DEFAULT_RULES = {
  ignorePatterns: [
    '.obsidian/workspace.json',
    '.obsidian/workspace-mobile.json',
    '**/*.tmp',
    '**/.DS_Store',
    '**/Thumbs.db',
    '**/.git/**',
  ],
  maxFileSizeMb: 100,
  syncAttachments: true,
  syncConfig: true,
};

const rulesCache = new Map();

function rulesPath(vaultId) {
  return path.join(vaultRoot(vaultId), 'sync-rules.json');
}

function getRules(vaultId) {
  if (rulesCache.has(vaultId)) {
    return { ...DEFAULT_RULES, ...rulesCache.get(vaultId) };
  }

  const p = rulesPath(vaultId);
  if (fs.existsSync(p)) {
    try {
      const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
      const merged = { ...DEFAULT_RULES, ...raw };
      rulesCache.set(vaultId, merged);
      return merged;
    } catch {}
  }
  return { ...DEFAULT_RULES };
}

async function loadFromDb() {
  if (dbManager.type === 'json') return;
  try {
    const rows = await dbManager.queryAll('SELECT vault_id, rules_json FROM sync_rules');
    for (const r of rows) {
      try {
        const parsed = JSON.parse(r.rules_json || '{}');
        rulesCache.set(r.vault_id || r.vaultId, { ...DEFAULT_RULES, ...parsed });
      } catch {}
    }
  } catch (err) {
    console.error('[SyncRules] Error loading rules from DB:', err.message);
  }
}

function saveRules(vaultId, rules) {
  const merged = { ...DEFAULT_RULES, ...rules };
  rulesCache.set(vaultId, merged);

  // Also save to disk for backwards compatibility / local vault portability
  try {
    const p = rulesPath(vaultId);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(merged, null, 2));
  } catch {}

  if (dbManager.type !== 'json') {
    const jsonStr = JSON.stringify(merged);
    const now = Date.now();
    if (dbManager.type === 'sqlite') {
      dbManager
        .execute('INSERT OR REPLACE INTO sync_rules (vault_id, rules_json, updated_at) VALUES (?, ?, ?)', [
          vaultId,
          jsonStr,
          now,
        ])
        .catch((err) => console.error('[SyncRules] SQLite save error:', err));
    } else if (dbManager.type === 'postgres') {
      dbManager
        .execute(
          'INSERT INTO sync_rules (vault_id, rules_json, updated_at) VALUES (?, ?, ?) ON CONFLICT (vault_id) DO UPDATE SET rules_json = EXCLUDED.rules_json, updated_at = EXCLUDED.updated_at',
          [vaultId, jsonStr, now]
        )
        .catch((err) => console.error('[SyncRules] Postgres save error:', err));
    } else if (dbManager.type === 'mysql') {
      dbManager
        .execute(
          'INSERT INTO sync_rules (vault_id, rules_json, updated_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE rules_json = VALUES(rules_json), updated_at = VALUES(updated_at)',
          [vaultId, jsonStr, now]
        )
        .catch((err) => console.error('[SyncRules] MySQL save error:', err));
    }
  }

  return merged;
}

function matchPattern(relPath, pattern) {
  const normPath = relPath.replace(/\\/g, '/');
  const normPat = pattern.trim().replace(/\\/g, '/');
  if (!normPat) return false;

  const regexStr =
    '^' +
    normPat
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '.*')
      .replace(/(?<!\.)\*/g, '[^/]*')
      .replace(/\?/g, '.') +
    '$';

  try {
    const reg = new RegExp(regexStr);
    return reg.test(normPath);
  } catch {
    return normPath.includes(normPat);
  }
}

function isPathIgnored(vaultId, relPath) {
  const rules = getRules(vaultId);
  for (const pat of rules.ignorePatterns || []) {
    if (matchPattern(relPath, pat)) return true;
  }
  return false;
}

module.exports = {
  getRules,
  saveRules,
  isPathIgnored,
  DEFAULT_RULES,
  loadFromDb,
  getRawRules: () => {
    const res = {};
    for (const [k, v] of rulesCache.entries()) {
      res[k] = v;
    }
    return res;
  },
  getAllRules: () => {
    const res = {};
    for (const [k, v] of rulesCache.entries()) {
      res[k] = v;
    }
    return res;
  },
};
