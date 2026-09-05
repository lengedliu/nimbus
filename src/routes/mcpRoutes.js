const express = require('express');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { requireAuth } = require('../auth');
const vaultsStore = require('../vaults');
const { buildMcpServer } = require('../mcp');
const { asyncHandler } = require('../utils/asyncHandler');
const { VERSION } = require('../config');

const router = express.Router();
router.use(requireAuth);

/** Resolve X-Default-Vault-Name or X-Default-Vault-Id to a vault id accessible by the user. */
function resolveDefaultVaultId(req) {
  const directId = (req.headers['x-default-vault-id'] || '').trim();
  const userVaults = vaultsStore.listForUser(req.user.id, req.user.role === 'admin');
  if (directId) {
    const foundDirect = userVaults.find((v) => v.id === directId || (v.id || '').toLowerCase() === directId.toLowerCase());
    if (foundDirect) return foundDirect.id;
  }
  const name = (req.headers['x-default-vault-name'] || '').trim();
  if (!name) return undefined;
  const lower = name.toLowerCase();
  const vault = userVaults.find((v) => v.name === name || (v.name || '').toLowerCase() === lower || v.id === name || (v.id || '').toLowerCase() === lower);
  return vault?.id;
}

// Endpoint to inspect list of available MCP tools and capabilities for UI documentation
router.get('/tools', (req, res) => {
  const tools = [
    {
      name: 'list_vaults',
      category: '库管理与统计',
      description: '获取当前用户账户下所有 Obsidian 笔记库列表（包含库ID、名称、文件数、容量及权限信息）。',
      parameters: {},
    },
    {
      name: 'get_vault_stats',
      category: '库管理与统计',
      description: '获取笔记库的全面统计信息（Markdown笔记数、HTML网页数、附件容量、热门标签 Top 20 及最近修改文件）。',
      parameters: { vaultId: '可选，笔记库ID' },
    },
    {
      name: 'list_notes',
      category: '笔记与文件检索',
      description: '多维度检索笔记与文件，支持文件夹过滤、文件扩展名（md/html/media/config）、时间排序（创建时间/修改时间）及元数据模式。',
      parameters: { vaultId: '可选', folder: '可选目录前缀', extension: 'all | md | html | media | config', sortBy: 'ctime | mtime | name | size', sortOrder: 'desc | asc', limit: '默认100', includeMetadata: '布尔值' },
    },
    {
      name: 'get_note_metadata',
      category: '笔记与文件检索',
      description: '提取单篇笔记的深层结构元数据，包含字数、阅读时长、YAML Frontmatter、Obsidian标签(#tag)、双向链接([[Link]])及大纲目录。',
      parameters: { path: '必填，笔记相对路径', vaultId: '可选' },
    },
    {
      name: 'read_note',
      category: '读取与写入',
      description: '读取笔记或文件的完整 UTF-8 文本内容。',
      parameters: { path: '必填，笔记路径，如 "Projects/idea.md"', vaultId: '可选' },
    },
    {
      name: 'write_note',
      category: '读取与写入',
      description: '创建或覆盖笔记，具备冲突检测与历史版本快照，保存后实时通过 WebSocket 广播推送到所有连接的 Obsidian 客户端。',
      parameters: { path: '必填', content: '必填，完整内容', baseHash: '可选，乐观锁防冲突', vaultId: '可选' },
    },
    {
      name: 'append_note',
      category: '读取与写入',
      description: '向已有笔记末尾（或指定标题下方）追加内容，支持自动追加时间戳，常用于 AI 会议记录、随手记、文献摘要或待办增补。',
      parameters: { path: '必填', content: '必填', heading: '可选标题（如 "## AI 记录"）', withTimestamp: '可选布尔值', vaultId: '可选' },
    },
    {
      name: 'prepend_note',
      category: '读取与写入',
      description: '在笔记顶部（保持 YAML Frontmatter 结构不变）插入内容，常用于插入 AI 生成的核心摘要或置顶提醒。',
      parameters: { path: '必填', content: '必填', withTimestamp: '可选布尔值', vaultId: '可选' },
    },
    {
      name: 'patch_note',
      category: '读取与写入',
      description: '精准局部搜索并替换笔记文本，无需重传整篇文件，修改即时广播同步。',
      parameters: { path: '必填', search: '待查找文本', replace: '替换文本', replaceAll: '可选布尔值', vaultId: '可选' },
    },
    {
      name: 'upload_attachment',
      category: '附件与多媒体',
      description: '上传图片、PDF、音频或二进制附件到笔记库（支持 Base64 数据或指定网络图片 URL 自动下载存储），自动广播同步并返回 ![[附件名]] 双链语法。',
      parameters: { path: '必填相对路径（如 "_resources/image.png"）', contentBase64: '可选 Base64 字符串', sourceUrl: '可选网络下载 URL', overwrite: '可选布尔值', vaultId: '可选' },
    },
    {
      name: 'get_attachment_base64',
      category: '附件与多媒体',
      description: '将笔记库中的图片/附件读取为 Base64 编码，供 AI 视觉分析或多模态理解。',
      parameters: { path: '必填附件路径', vaultId: '可选' },
    },
    {
      name: 'get_daily_note',
      category: '日记与日志 (Daily Note)',
      description: '获取今日（或指定日期）的 Obsidian 日记。若日记不存在可自动按规范初始化。',
      parameters: { date: '可选 "YYYY-MM-DD"', folder: '可选 "Daily"', createIfMissing: '默认 true', vaultId: '可选' },
    },
    {
      name: 'append_daily_note',
      category: '日记与日志 (Daily Note)',
      description: '快速将思考碎片、任务或会议纪要追加记录到今日（或指定日期）的日记中，默认附加 [HH:mm:ss] 时间戳。',
      parameters: { content: '必填记录文本', date: '可选', folder: '可选', heading: '可选分类标题', withTimestamp: '默认 true', vaultId: '可选' },
    },
    {
      name: 'search_notes',
      category: '全文检索与标签',
      description: '在所有 Markdown 与 HTML 笔记中执行全文搜索，返回匹配上下文片段、行号及文件路径，支持正则搜索与大小写匹配。',
      parameters: { query: '必填关键词或正则表达式', folder: '可选', limit: '默认20', useRegex: '可选布尔值', caseSensitive: '可选布尔值', vaultId: '可选' },
    },
    {
      name: 'list_tags',
      category: '全文检索与标签',
      description: '自动扫描并聚合笔记库中所有 Obsidian 标签（#tag 及 #父/子 嵌套标签），统计词频与关联笔记路径。',
      parameters: { folder: '可选目录过滤', vaultId: '可选' },
    },
    {
      name: 'move_note',
      category: '组织与管理',
      description: '重命名或移动笔记/附件至新目录，自动维护索引并广播实时同步。',
      parameters: { oldPath: '原路径', newPath: '新路径', overwrite: '可选布尔值', vaultId: '可选' },
    },
    {
      name: 'delete_note',
      category: '组织与管理',
      description: '安全删除笔记（自动移入笔记库回收站，可随时还原），即时推送到 Obsidian。',
      parameters: { path: '必填路径', vaultId: '可选' },
    },
    {
      name: 'get_note_history',
      category: '版本历史',
      description: '查询单篇笔记的所有历史备份快照列表与时间戳。',
      parameters: { path: '必填路径', vaultId: '可选' },
    },
    {
      name: 'read_history_version',
      category: '版本历史',
      description: '读取笔记特定历史版本快照的原始内容。',
      parameters: { versionId: '必填版本ID', vaultId: '可选' },
    },
    {
      name: 'create_share_link',
      category: '外链分享',
      description: '直接通过 AI 为笔记生成公开外链分享地址（支持密码保护与有效期设定）。',
      parameters: { path: '必填笔记路径', title: '可选标题', password: '可选密码', expiresDays: '可选天数', allowCopy: '默认 true', vaultId: '可选' },
    },
    {
      name: 'get_vault_git_status',
      category: 'Git 自动化备份',
      description: '自省当前笔记库的 Git 版本控制与远端同步状态（当前分支、未提交文件数、未推送提交、最近提交快照及远端仓库地址）。',
      parameters: { vaultId: '可选笔记库ID' },
    },
    {
      name: 'git_sync_vault',
      category: 'Git 自动化备份',
      description: '执行 Git 仓库自动化操作：提交并推送到远端 Git 仓库 (GitHub/Gitee/GitLab)、从远端拉取更新或测试连通性。',
      parameters: { vaultId: '可选', action: 'commit_and_push | pull | test_connection', commitMessage: '可选自定义提交信息' },
    },
  ];

  res.json({
    name: 'nimbus-fast-note-sync',
    version: VERSION,
    protocol: 'Model Context Protocol (MCP) Streamable HTTP',
    toolsCount: tools.length,
    tools,
  });
});

// StreamableHTTP — the modern, recommended MCP transport (single endpoint,
// works over plain HTTP POST). Run in *stateless* mode: a fresh McpServer +
// transport per request, so there's no server-side session to manage or
// leak between users. This is fully spec-compliant and is what most current
// MCP clients (Claude Code, Cursor, Cherry Studio's HTTP mode, etc.) expect.
router.post('/', asyncHandler(async (req, res) => {
  try {
    const defaultVaultId = resolveDefaultVaultId(req);
    const server = buildMcpServer(req.user, defaultVaultId);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (e) {
    if (!res.headersSent) {
      res.status(500).json({ error: e.message });
    }
  }
}));

// No persistent session in stateless mode, so there's nothing to stream on
// GET or terminate on DELETE — reply politely instead of a bare 404.
router.get('/', (req, res) => {
  res
    .status(405)
    .json({ error: 'This MCP endpoint runs in stateless mode: send tool calls via POST only. Visit GET /api/mcp/tools for interface documentation.' });
});
router.delete('/', (req, res) => {
  res.json({ ok: true });
});

module.exports = router;

