const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { vaultFilesRoot, vaultRoot, listForUser, getById } = require('./vaults');
const { encryptField, decryptField } = require('./utils/crypto');

/**
 * Git Auto-Backup and Remote Sync Engine for Nimbus Vault Sync
 * Modeled after haierkeys/fast-note-sync-service Git Automation:
 * - Auto-initializes git repository in vault notes root
 * - Supports GitHub / Gitee / GitLab / self-hosted Git repositories (HTTPS with Token / Password)
 * - Real-time debounced auto-commit & push on vault note changes
 * - Scheduled periodic backups
 * - Status inspection, remote connectivity test, pull & push, and commit history logs
 */

const debounceTimers = new Map(); // vaultId -> NodeJS.Timeout

function getGitConfigFile(vaultId) {
  return path.join(vaultRoot(vaultId), 'git-config.json');
}

const DEFAULT_CONFIG = {
  enabled: false,
  remoteUrl: '',
  branch: 'main',
  username: '',
  token: '',
  authorName: 'Nimbus Sync',
  authorEmail: 'sync@nimbus.local',
  autoPushOnChange: false,
  debounceSeconds: 15,
  scheduleInterval: 'off', // 'off' | 'hourly' | 'daily'
  commitMsgTemplate: 'Auto sync: {files_count} files changed [{datetime}]',
  pullBeforePush: true,
};

function loadConfig(vaultId) {
  const p = getGitConfigFile(vaultId);
  if (!fs.existsSync(p)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    const config = { ...DEFAULT_CONFIG, ...raw };
    if (config.token) {
      config.token = decryptField(config.token);
    }
    return config;
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig(vaultId, config) {
  const p = getGitConfigFile(vaultId);
  const current = loadConfig(vaultId);
  const updated = { ...current, ...config };

  if (updated.remoteUrl) {
    updated.remoteUrl = validateRemoteUrl(updated.remoteUrl);
  }
  if (updated.branch) {
    updated.branch = validateBranch(updated.branch);
  }

  // 敏感凭据落盘加密：写盘前使用 AES-256-GCM 对 token 进行加密存储
  const diskPayload = { ...updated };
  if (diskPayload.token) {
    diskPayload.token = encryptField(diskPayload.token);
  }

  fs.writeFileSync(p, JSON.stringify(diskPayload, null, 2), 'utf8');
  return updated;
}

function isGitRepo(vaultId) {
  const repoDir = vaultFilesRoot(vaultId);
  const gitDir = path.join(repoDir, '.git');
  return fs.existsSync(gitDir);
}

/**
 * 严格校验并清洗 remoteUrl，彻底阻断协议注入（ext::, file://, ssh://）和参数注入（-oProxyCommand, --upload-pack 等）
 */
function validateRemoteUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') {
    throw new Error('仓库地址不能为空');
  }
  const trimmed = urlStr.trim();
  if (!trimmed) {
    throw new Error('仓库地址不能为空');
  }
  // 严禁以 '-' 开头（防 Argument / Flag Injection）
  if (trimmed.startsWith('-')) {
    throw new Error('非法仓库地址：不能以 "-" 开头');
  }
  // 严禁换行符或空字符（防命令或响应拆分）
  if (/[\r\n\0]/.test(trimmed)) {
    throw new Error('非法仓库地址：包含非法控制字符');
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('仓库地址格式无效，请提供标准 HTTP/HTTPS 协议地址（如 https://github.com/user/repo.git）');
  }

  // 严格协议白名单：仅允许 https: 和 http:
  const proto = parsed.protocol.toLowerCase();
  if (proto !== 'https:' && proto !== 'http:') {
    throw new Error(`不支持的 Git 协议 "${parsed.protocol}"。出于系统安全保护，仅支持 https:// 或 http:// 协议`);
  }

  if (!parsed.hostname || parsed.hostname.startsWith('-')) {
    throw new Error('仓库地址无效：主机名不合法');
  }

  return trimmed;
}

/**
 * 校验分支名称，防止参数注入或路径穿越
 */
function validateBranch(branchStr) {
  if (!branchStr || typeof branchStr !== 'string') return 'main';
  const trimmed = branchStr.trim();
  if (!trimmed) return 'main';
  if (trimmed.startsWith('-')) {
    throw new Error('分支名称不能以 "-" 开头');
  }
  // Git 分支标准合法字符检查，不允许包含 ..、~、^、:、?、*、[、\、@{、空格、换行
  if (!/^[a-zA-Z0-9_\-\./]+$/.test(trimmed) || trimmed.includes('..') || trimmed.endsWith('.lock') || trimmed.endsWith('/')) {
    throw new Error('分支名称包含非法字符');
  }
  return trimmed;
}

function execGit(vaultId, args, env = {}) {
  const cwd = vaultFilesRoot(vaultId);
  if (!fs.existsSync(cwd)) {
    fs.mkdirSync(cwd, { recursive: true });
  }

  return new Promise((resolve) => {
    const defaultEnv = {
      ...process.env,
      GIT_TERMINAL_PROMPT: '0',
      GIT_ALLOW_PROTOCOL: 'https:http',
      GIT_OPTIONAL_LOCKS: '0',
      LANG: 'en_US.UTF-8',
      ...env,
    };

    execFile('git', args, { cwd, env: defaultEnv, maxBuffer: 10 * 1024 * 1024, timeout: 60000 }, (error, stdout, stderr) => {
      resolve({
        success: !error,
        code: error ? error.code : 0,
        stdout: (stdout || '').trim(),
        stderr: (stderr || '').trim(),
      });
    });
  });
}

function formatCommitMessage(template, filesCount) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const datetime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  
  let msg = template || DEFAULT_CONFIG.commitMsgTemplate;
  msg = msg.replace('{files_count}', String(filesCount || 1));
  msg = msg.replace('{datetime}', datetime);
  msg = msg.replace('{timestamp}', String(Date.now()));
  return msg;
}

/** Build authenticated remote URL if username/token are provided */
function buildAuthUrl(remoteUrl, username, token) {
  if (!remoteUrl) return '';
  const cleanUrl = validateRemoteUrl(remoteUrl);
  if (!username && !token) return cleanUrl;

  const urlObj = new URL(cleanUrl);
  if (token && username) {
    urlObj.username = encodeURIComponent(username);
    urlObj.password = encodeURIComponent(token);
  } else if (token) {
    urlObj.username = 'oauth2';
    urlObj.password = encodeURIComponent(token);
  }
  return urlObj.toString();
}

/** Mask password/token in URL or text for safe display/logging */
function maskSecrets(text) {
  if (!text) return '';
  return text.replace(/(https?:\/\/)([^:@\s]+):([^@\s]+)@/g, '$1$2:***@');
}

/**
 * Initialize Git repository in vault files root
 */
async function initRepo(vaultId) {
  const config = loadConfig(vaultId);
  const cwd = vaultFilesRoot(vaultId);
  if (!fs.existsSync(cwd)) {
    fs.mkdirSync(cwd, { recursive: true });
  }

  // Create default .gitignore if not present
  const gitignorePath = path.join(cwd, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    const gitignoreContent = [
      '# OS generated files',
      '.DS_Store',
      '.DS_Store?',
      '._*',
      '.Spotlight-V100',
      '.Trashes',
      'ehthumbs.db',
      'Thumbs.db',
      '# Temp files',
      '*.tmp',
      '*.sync-conflict-*',
      '',
    ].join('\n');
    fs.writeFileSync(gitignorePath, gitignoreContent, 'utf8');
  }

  // git init
  await execGit(vaultId, ['init', '-b', config.branch || 'main']);

  // Configure author
  await execGit(vaultId, ['config', 'user.name', config.authorName || 'Nimbus Sync']);
  await execGit(vaultId, ['config', 'user.email', config.authorEmail || 'sync@nimbus.local']);
  await execGit(vaultId, ['config', 'core.quotepath', 'false']);
  await execGit(vaultId, ['config', 'pull.rebase', 'true']);

  // Set remote origin if configured
  if (config.remoteUrl) {
    await updateRemoteUrl(vaultId, config);
  }

  return { ok: true, initialized: true };
}

async function updateRemoteUrl(vaultId, config) {
  if (!config.remoteUrl) return;
  const authUrl = buildAuthUrl(config.remoteUrl, config.username, config.token);
  const remotesRes = await execGit(vaultId, ['remote']);
  const hasOrigin = remotesRes.stdout.split('\n').map((s) => s.trim()).includes('origin');

  if (hasOrigin) {
    await execGit(vaultId, ['remote', 'set-url', 'origin', '--', authUrl]);
  } else if (authUrl) {
    await execGit(vaultId, ['remote', 'add', 'origin', '--', authUrl]);
  }
}

/**
 * Get comprehensive Git status for vault
 */
async function getStatus(vaultId) {
  const config = loadConfig(vaultId);
  const initialized = isGitRepo(vaultId);

  if (!initialized) {
    return {
      initialized: false,
      config: { ...config, token: config.token ? '********' : '' },
      branch: config.branch || 'main',
      remoteUrl: config.remoteUrl,
      uncommittedCount: 0,
      changedFiles: [],
      lastCommit: null,
      lastPush: config.lastPush || null,
      statusText: 'Git 仓库未初始化',
    };
  }

  // Branch
  const branchRes = await execGit(vaultId, ['branch', '--show-current']);
  const currentBranch = branchRes.stdout || config.branch || 'main';

  // Status porcelain
  const statusRes = await execGit(vaultId, ['status', '--porcelain', '-uall']);
  const changedFiles = [];
  if (statusRes.stdout) {
    const lines = statusRes.stdout.split('\n').filter(Boolean);
    for (const line of lines) {
      const code = line.slice(0, 2).trim();
      const filePath = line.slice(3).trim().replace(/^"|"$/g, '');
      changedFiles.push({ code, path: filePath });
    }
  }

  // Last commit
  const logRes = await execGit(vaultId, ['log', '-1', '--pretty=format:%H%x00%an%x00%ar%x00%s%x00%ad']);
  let lastCommit = null;
  if (logRes.success && logRes.stdout) {
    const [hash, author, relativeTime, message, date] = logRes.stdout.split('\x00');
    lastCommit = { hash, shortHash: hash ? hash.slice(0, 7) : '', author, relativeTime, message, date };
  }

  // Unpushed count if remote exists
  let unpushedCommits = 0;
  if (config.remoteUrl) {
    const unpushedRes = await execGit(vaultId, ['rev-list', `origin/${currentBranch}..HEAD`, '--count']);
    if (unpushedRes.success) {
      unpushedCommits = parseInt(unpushedRes.stdout, 10) || 0;
    }
  }

  return {
    initialized: true,
    config: { ...config, token: config.token ? '********' : '' },
    branch: currentBranch,
    remoteUrl: maskSecrets(config.remoteUrl),
    uncommittedCount: changedFiles.length,
    changedFiles: changedFiles.slice(0, 100),
    unpushedCommits,
    lastCommit,
    lastPush: config.lastPush || null,
    statusText: changedFiles.length > 0 ? `有 ${changedFiles.length} 个未提交变更` : '工作区干净，所有文件已提交',
  };
}

/**
 * Test remote connection using git ls-remote
 */
async function testConnection(vaultId, testParams = {}) {
  const current = loadConfig(vaultId);
  const rawRemoteUrl = testParams.remoteUrl !== undefined ? testParams.remoteUrl : current.remoteUrl;

  if (!rawRemoteUrl) {
    return { ok: false, error: '请先填写远端 Git 仓库地址 (URL)' };
  }

  let remoteUrl;
  try {
    remoteUrl = validateRemoteUrl(rawRemoteUrl);
  } catch (err) {
    return { ok: false, error: err.message };
  }

  let branch = 'main';
  try {
    branch = validateBranch(testParams.branch || current.branch || 'main');
  } catch (err) {
    return { ok: false, error: err.message };
  }

  const username = testParams.username !== undefined ? testParams.username : current.username;

  // 安全防御：如果用户传入了新的 remoteUrl，且未显式提供 token，
  // 严禁将库主之前保存的 token 发送给可能未知的第三方 URL（防止凭据窃取）
  let token = testParams.token;
  if (token === undefined) {
    if (!testParams.remoteUrl || testParams.remoteUrl.trim() === (current.remoteUrl || '').trim()) {
      token = current.token;
    } else {
      token = '';
    }
  }

  let authUrl;
  try {
    authUrl = buildAuthUrl(remoteUrl, username, token);
  } catch (err) {
    return { ok: false, error: err.message };
  }

  const result = await execGit(vaultId, ['ls-remote', '-h', '--', authUrl, branch]);

  if (result.success) {
    return {
      ok: true,
      message: `连通性测试成功！已成功连接到远端仓库分支 ${branch}`,
      branchFound: result.stdout.includes(branch),
      output: maskSecrets(result.stdout),
    };
  } else {
    return {
      ok: false,
      error: maskSecrets(result.stderr || result.stdout || '连接失败，请检查 URL、分支名与访问凭证 (Token/Password)'),
    };
  }
}

/**
 * Stage all changes, commit, and push to remote
 */
async function commitAndPush(vaultId, { customMessage, author } = {}) {
  if (!isGitRepo(vaultId)) {
    await initRepo(vaultId);
  }

  const config = loadConfig(vaultId);
  const branch = validateBranch(config.branch || 'main');

  // Ensure remote origin is configured
  if (config.remoteUrl) {
    await updateRemoteUrl(vaultId, config);
  }

  // 1. Stage all changes
  await execGit(vaultId, ['add', '-A']);

  // 2. Check if there are changes to commit
  const statusRes = await execGit(vaultId, ['status', '--porcelain']);
  const hasChanges = Boolean(statusRes.stdout && statusRes.stdout.trim());
  const changedLines = hasChanges ? statusRes.stdout.trim().split('\n').length : 0;

  let commitHash = null;
  if (hasChanges) {
    const commitMsg = customMessage || formatCommitMessage(config.commitMsgTemplate, changedLines);
    const authorEnv = {};
    if (author) {
      authorEnv.GIT_AUTHOR_NAME = author;
      authorEnv.GIT_COMMITTER_NAME = author;
    }

    const commitRes = await execGit(vaultId, ['commit', '-m', commitMsg], authorEnv);
    if (!commitRes.success) {
      return { ok: false, stage: 'commit', error: maskSecrets(commitRes.stderr || commitRes.stdout) };
    }

    const hashRes = await execGit(vaultId, ['rev-parse', 'HEAD']);
    commitHash = hashRes.stdout.trim();
  }

  // 3. Push to remote if remote URL configured
  if (config.remoteUrl) {
    // Optional pull rebase before pushing
    if (config.pullBeforePush) {
      const pullRes = await execGit(vaultId, ['pull', '--rebase', 'origin', '--', branch]);
      if (!pullRes.success && !pullRes.stderr.includes('Couldn\'t find remote ref')) {
        // Log warning but try push or return
      }
    }

    const pushRes = await execGit(vaultId, ['push', '-u', 'origin', '--', branch]);
    if (!pushRes.success) {
      const errorMsg = maskSecrets(pushRes.stderr || pushRes.stdout);
      saveConfig(vaultId, {
        lastPush: {
          success: false,
          time: Date.now(),
          error: errorMsg,
        },
      });
      return {
        ok: false,
        stage: 'push',
        committed: hasChanges,
        commitHash,
        error: errorMsg,
      };
    }

    saveConfig(vaultId, {
      lastPush: {
        success: true,
        time: Date.now(),
        commitHash,
      },
    });

    return {
      ok: true,
      committed: hasChanges,
      pushed: true,
      commitHash,
      filesChanged: changedLines,
      message: hasChanges ? `已成功提交 ${changedLines} 个文件变更并推送到远端 ${branch} 分支` : `工作区无新变更，已与远端 ${branch} 保持同步`,
    };
  }

  return {
    ok: true,
    committed: hasChanges,
    pushed: false,
    commitHash,
    filesChanged: changedLines,
    message: hasChanges ? `已成功生成本地 Git 提交 (${changedLines} 个文件)` : '工作区无变更，无需提交',
  };
}

/**
 * Pull latest changes from remote
 */
async function pull(vaultId) {
  if (!isGitRepo(vaultId)) {
    await initRepo(vaultId);
  }

  const config = loadConfig(vaultId);
  if (!config.remoteUrl) {
    return { ok: false, error: '未配置远端 Git 仓库地址' };
  }

  await updateRemoteUrl(vaultId, config);
  const branch = validateBranch(config.branch || 'main');

  const pullRes = await execGit(vaultId, ['pull', 'origin', '--', branch]);
  if (!pullRes.success) {
    return { ok: false, error: maskSecrets(pullRes.stderr || pullRes.stdout) };
  }

  return {
    ok: true,
    message: `拉取成功：${pullRes.stdout || '已是最新状态'}`,
    output: maskSecrets(pullRes.stdout),
  };
}

/**
 * Get commit history logs
 */
async function getLogs(vaultId, limit = 25) {
  if (!isGitRepo(vaultId)) {
    return [];
  }

  const result = await execGit(vaultId, [
    'log',
    `-n${limit}`,
    '--pretty=format:%H%x00%an%x00%ar%x00%s%x00%ad%x00%ae',
  ]);

  if (!result.success || !result.stdout) {
    return [];
  }

  const commits = [];
  const entries = result.stdout.split('\n').filter(Boolean);
  for (const entry of entries) {
    const [hash, author, relativeTime, message, date, email] = entry.split('\x00');
    commits.push({
      hash,
      shortHash: hash ? hash.slice(0, 7) : '',
      author,
      email,
      relativeTime,
      message,
      date,
    });
  }
  return commits;
}

/**
 * Notify that a file in the vault has been modified/deleted.
 * If autoPushOnChange is enabled, debounces and pushes to Git!
 */
function notifyChange(vaultId) {
  const config = loadConfig(vaultId);
  if (!config.enabled || !config.autoPushOnChange || !config.remoteUrl) {
    return;
  }

  if (debounceTimers.has(vaultId)) {
    clearTimeout(debounceTimers.get(vaultId));
  }

  const delayMs = Math.max(3, config.debounceSeconds || 15) * 1000;
  const timer = setTimeout(async () => {
    debounceTimers.delete(vaultId);
    try {
      console.log(`[GitSync] Debounce triggered auto-push for vault ${vaultId}`);
      await commitAndPush(vaultId);
    } catch (err) {
      console.error(`[GitSync] Auto-push error for vault ${vaultId}:`, err.message);
    }
  }, delayMs);

  debounceTimers.set(vaultId, timer);
}

module.exports = {
  loadConfig,
  saveConfig,
  isGitRepo,
  initRepo,
  getStatus,
  testConnection,
  commitAndPush,
  pull,
  getLogs,
  notifyChange,
  validateRemoteUrl,
  validateBranch,
  buildAuthUrl,
  maskSecrets,
};
