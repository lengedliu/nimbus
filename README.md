# Nimbus Vault Sync — self-hosted Obsidian 同步 + 管理 + MCP + 开放 API 服务

[简体中文](README.md) / [English](README_en.md) / [日本語](README_ja.md) / [한국어](README_ko.md) / [繁體中文](README_zh-TW.md)

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.19-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com)
[![WebSocket](https://img.shields.io/badge/WebSocket-Realtime-010101?style=flat&logo=socketdotio&logoColor=white)](https://github.com/websockets/ws)
[![MCP](https://img.shields.io/badge/MCP-18_Tools-8A2BE2?style=flat&logo=anthropic&logoColor=white)](https://modelcontextprotocol.io)
[![Obsidian](https://img.shields.io/badge/Obsidian-Plugin-7C3AED?style=flat&logo=obsidian&logoColor=white)](https://obsidian.md)
[![Database](https://img.shields.io/badge/Database-SQLite%20%7C%20MySQL%20%7C%20Postgres-4479A1?style=flat&logo=sqlite&logoColor=white)](#)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-MIT-F59E0B?style=flat&logo=opensourceinitiative&logoColor=white)](LICENSE)

**Nimbus Vault Sync** 是一个轻量级、自托管、全功能的 Obsidian 云端同步与知识管理服务端：

- 📡 **WebSocket 毫秒级实时同步** — 多设备/多 vault 协同，带版本防冲突乐观锁与实时状态广播
- 🖥 **现代化 Web 管理后台** — 支持多笔记库切换、全文检索、在线 Markdown 编辑预览、多端协同与回收站
- 🤖 **全面扩展的 MCP (Model Context Protocol)** — 内置 18 项标准 MCP 工具，让 Cursor、Cherry Studio、Claude Desktop、Cline 等 AI 客户端直接读写与整理笔记，变更秒级同步到手机与桌面客户端
- 📖 **交互式 REST API 开发者文档** — 内置完整 API Spec 规范，Web 端一键复制带 Token 的 cURL 请求
- 🔗 **优雅的笔记外链分享** — 为笔记一键生成 Web 阅读外链，支持访问密码、有效期天数与防复制保护
- 📱 **多设备管理与协同** — 查看在线状态、IP、客户端系统类型，支持远程踢出与权限控制
- 🕘 **笔记版本历史快照** — 每次保存自动归档历史快照，随时查看差异、一键回滚还原
- 🗑 **安全回收站机制** — 所有删除操作自动移入回收站软删除，防止误删，支持单文件还原或一键清空
- 🗄 **多数据库引擎支持** — 原生支持 JSON 文件、SQLite、MySQL 及 PostgreSQL，支持平滑迁移
- 🐳 **Docker 一键部署** — 自带 `Dockerfile` / `docker-compose.yml`，持久化数据卷

配套的 Obsidian 插件已内置在仓库的 [`obsidian-plugin`](./obsidian-plugin) 目录中。

---

## 目录结构

```
nimbus-vault-sync/
├── server.js                # 入口：REST API + WebSocket Hub + MCP 协议端点 + 静态资源
├── obsidian-plugin/         # 配套 Obsidian 双向同步插件 (可复制到 .obsidian/plugins/nimbus-sync)
│   ├── manifest.json
│   ├── main.js
│   ├── styles.css
│   └── README.md
├── src/
│   ├── config.js            # 环境变量与系统配置
│   ├── db.js                # 多数据库引擎管理（JSON / SQLite / PostgreSQL / MySQL）
│   ├── users.js             # 用户体系（admin / user 角色及多库授权）
│   ├── vaults.js            # 笔记库数据存储与权限校验
│   ├── auth.js              # JWT 验证与 requireAuth / requireAdmin 中间件
│   ├── storage.js           # 笔记文件读写、历史快照、回收站、冲突管理
│   ├── mcpServer.js         # 18 个 MCP 标准工具实现与 StreamableHTTP 处理器
│   ├── wsHub.js             # WebSocket 实时多端同步广播中心
│   └── routes/
│       ├── authRoutes.js    # 注册、登录、系统状态
│       ├── vaultRoutes.js   # 笔记库列表、创建、删除、Manifest
│       ├── fileRoutes.js    # 文件增量读写、删除
│       ├── vaultExtrasRoutes.js # 历史版本、回收站、冲突、快照备份、协作成员、审计日志
│       ├── shareRoutes.js   # 外链分享创建与公开阅读
│       ├── deviceRoutes.js  # 关联设备列表与管理
│       ├── settingsRoutes.js# 同步配置、密码修改、数据库引擎切换
│       ├── adminRoutes.js   # 超管专属：全库、全用户管理
│       ├── mcpRoutes.js     # MCP StreamableHTTP 接口及 /tools 自省接口
│       └── docsRoutes.js    # REST API 文档与规范端点
├── public/                  # Web 管理后台（纯原生 HTML/CSS/JS，无需构建打包）
│   ├── index.html           # 主管理控制台
│   ├── share.html           # 公开外链优雅阅读页
│   ├── style.css            # 现代化主题样式系统
│   └── app.js               # 前端核心交互逻辑
└── data/                    # 运行时持久化数据：用户库、历史快照、回收站、备份压缩包
```

---

## 快速开始

```bash
cd nimbus-vault-sync
npm install
cp .env.example .env       # 按需修改 PORT / JWT_SECRET
npm start
```

打开浏览器访问 **`http://localhost:8787/admin`** 即进入 Web 管理后台。

首次启动没有任何用户时，创建管理员账号有两种方式：
1. 打开网页管理后台，直接在界面上完成初始管理员账号设置。
2. 或调用系统注册接口 `POST /api/auth/register`（仅在无用户时开放）。

---

## Docker 一键部署

```bash
cd nimbus-vault-sync
cp .env.example .env    # 修改 JWT_SECRET 为强随机字符串
docker compose up -d --build
```

- 数据持久化在宿主机的 `./data` 目录（挂载卷），备份此目录即可备份所有笔记与配置。
- 管理后台：`http://localhost:8787/admin`
- WebSocket 同步端点：`ws://localhost:8787/ws`
- MCP 服务端点：`http://localhost:8787/api/mcp`
- 常用单独 Dockerfile 运行：
  ```bash
  docker build -t nimbus-vault-sync .
  docker run -d -p 8787:8787 \
    -e JWT_SECRET=your_jwt_secret_string \
    -v $(pwd)/data:/app/data \
    --name nimbus-vault-sync nimbus-vault-sync
  ```

---

## 🤖 Model Context Protocol (MCP) AI 助手接入

Nimbus 原生内置了 **StreamableHTTP** 协议的 MCP 接口，AI 客户端（Cursor、Cherry Studio、Claude Desktop、Cline、Roo Code 等）无需在本地启动子进程，通过标准 HTTP POST 即可直接连接。

### 1. 客户端接入配置 (mcp.json)

在 Web 后台点击左侧 **「🤖 AI / MCP 接口配置」**，可动态选择笔记库并复制以下配置：

```json
{
  "mcpServers": {
    "nimbus-fast-note-sync": {
      "url": "http://<你的服务器地址>/api/mcp",
      "type": "http",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer <你的JWT令牌>",
        "X-Default-Vault-Name": "我的知识库"
      }
    }
  }
}
```

### 2. 内置 18 个 MCP 标准工具清单

| 类别 | 工具名称 | 参数及说明 | 典型场景 |
| :--- | :--- | :--- | :--- |
| **库管理与统计** | `list_vaults` | 获取当前用户所有可用笔记库及权限 | 库信息概览 |
| | `get_vault_stats` | `vaultId?`：获取 Markdown/HTML/附件统计、Top 20 热门标签及最近修改 | 知识库现状体检 |
| **笔记检索与元数据** | `list_notes` | `folder?`, `extension?`, `sortBy?`, `sortOrder?`, `limit?`, `includeMetadata?` | 按时间/扩展名检索文件 |
| | `get_note_metadata`| `path`, `vaultId?`：提取字数、YAML Frontmatter、双链 `[[Link]]`、`#tag` 与大纲 | 笔记结构深层分析 |
| **读取与写入** | `read_note` | `path`, `vaultId?`：读取笔记全文 | 阅读文章内容 |
| | `write_note` | `path`, `content`, `baseHash?`, `vaultId?`：创建或覆盖笔记，自动维护历史并实时推送多端 | AI 新建/重构笔记 |
| | `append_note` | `path`, `content`, `heading?`, `withTimestamp?`：在文档末尾或指定标题下追加 | 会议纪要增补、随手记 |
| | `prepend_note` | `path`, `content`, `withTimestamp?`：在顶部插入（保留 YAML 属性） | 插入核心摘要/置顶 |
| | `patch_note` | `path`, `search`, `replace`, `replaceAll?`：局部精准搜索替换 | 局部小修，无需传输全篇 |
| **日记与日志** | `get_daily_note` | `date?`, `folder?`, `createIfMissing?`：获取或初始化当天日记 | 日记查询 |
| | `append_daily_note`| `content`, `date?`, `folder?`, `heading?`, `withTimestamp?`：追加日记（带时间戳） | 碎片思考/待办流沉淀 |
| **全文搜索与标签** | `search_notes` | `query`, `folder?`, `limit?`, `useRegex?`, `caseSensitive?`：带上下文行号的全文检索 | 快速定位知识点 |
| | `list_tags` | `folder?`, `vaultId?`：聚合所有 Obsidian 标签与嵌套标签词频 | 标签树梳理 |
| **组织与管理** | `move_note` | `oldPath`, `newPath`, `overwrite?`：重命名或移动笔记 | 目录整理归档 |
| | `delete_note` | `path`, `vaultId?`：安全删除（移入回收站保护）并广播至客户端 | 笔记清理 |
| **版本历史** | `get_note_history` | `path`, `vaultId?`：查询单篇笔记的所有历史备份版本 | 溯源变更记录 |
| | `read_history_version`| `versionId`, `vaultId?`：读取特定历史快照原始内容 | 版本对比与回退 |
| **外链分享** | `create_share_link`| `path`, `title?`, `password?`, `expiresDays?`, `allowCopy?`：生成公开网页外链 | AI 一键发布文章 |

---

## 📖 REST API 概览与接口说明

在 Web 管理后台左侧点击 **「📖 REST API 开发者文档」**，可直接查看已注入当前 Token 与 Vault ID 的交互式 cURL 命令。系统同时提供 `GET /api/docs/spec` 接口规范定义。

### 常用核心端点速查

| 分类 | 方法 | 路径 | 说明 |
| :--- | :--- | :--- | :--- |
| **认证** | `POST` | `/api/auth/login` | 登录，获取 JWT Token |
| | `GET` | `/api/health` | 服务健康检查 |
| **笔记库** | `GET` | `/api/vaults` | 获取当前用户所有笔记库及权限 |
| | `POST` | `/api/vaults` | 创建新笔记库 |
| | `GET` | `/api/vaults/:vaultId/manifest` | 全量文件清单与 SHA-256 哈希 |
| | `GET` | `/api/vaults/search?q=关键词` | 跨库文件名与正文检索 |
| **文件读写** | `GET` | `/api/vaults/:vaultId/files/*` | 读取笔记或附件内容 |
| | `PUT` | `/api/vaults/:vaultId/files/*` | 写入文件（支持 `X-Base-Hash` 乐观锁防冲突并实时广播） |
| | `DELETE`| `/api/vaults/:vaultId/files/*` | 删除文件（软删除至回收站） |
| **历史快照** | `GET` | `/api/vaults/:vaultId/history?path=...` | 查看历史版本列表 |
| | `POST` | `/api/vaults/:vaultId/history/:versionId/restore` | 回滚还原历史版本 |
| **回收站** | `GET` | `/api/vaults/:vaultId/trash` | 获取回收站文件列表 |
| | `POST` | `/api/vaults/:vaultId/trash/:trashId/restore` | 从回收站还原文件 |
| **备份与冲突** | `POST` | `/api/vaults/:vaultId/backups` | 创建全库快照备份 |
| | `GET` | `/api/vaults/:vaultId/export` | 打包下载整库 ZIP |
| | `POST` | `/api/vaults/:vaultId/conflicts/resolve` | 提交冲突解决策略 |
| **外链分享** | `POST` | `/api/vaults/:vaultId/shares` | 创建公开分享外链 |
| | `GET` | `/api/public/shares/:shareId` | 读者端获取公开文章正文 |
| **MCP** | `GET` | `/api/mcp/tools` | 自省 18 个 MCP 工具列表与参数规则 |
| | `POST` | `/api/mcp` | 接收 AI 客户端的标准 JSON-RPC 请求 |

---

## 📡 WebSocket 实时同步协议

- **连接端点**：`ws://<host>/ws?token=<jwt>&vaultId=<vaultId>`
- **双向广播**：
  - 客户端连接后立即下发 `init` 全量 manifest 比对。
  - 发生修改或删除时向同库在线设备广播 `change` / `deleted` 消息。
  - 支持 `baseHash` 冲突检测，避免多端离线后并发覆盖，冲突时自动生成 `.conflict` 副本。

---

## 📊 与 fast-note-sync-service (FNS) 对比

| 功能特性 | Nimbus Vault Sync | FNS (haierkeys) |
|---|---|---|
| **实时同步 (WebSocket)** | ✅ 毫秒级双向广播 | ✅ |
| **Web 管理后台** | ✅ 现代化单页应用 (含在线编辑/搜索) | ✅ |
| **MCP 工具数量与深度** | ✅ **18 个标准工具** (含日记、外链、元数据、快照) | ✅ 基础工具集 |
| **REST API 交互文档** | ✅ **内置交互式文档与一键 cURL** (`/api/docs/spec`) | ❌ |
| **笔记版本历史与回退** | ✅ 自动归档、支持随时回滚 | ✅ |
| **回收站安全机制** | ✅ 软删除、支持单文件恢复与清空 | ✅ |
| **公开外链分享** | ✅ 带密码保护、有效期与优雅阅读页 | ✅ |
| **多设备接入审计** | ✅ 在线状态/系统类型/远程踢出 | ✅ |
| **多存储/数据库引擎** | ✅ JSON / SQLite / MySQL / PostgreSQL 平滑切换 | ✅ SQLite / MySQL / PostgreSQL |
| **轻量级与二次开发** | ✅ 纯 Node.js，零复杂构建链，易维护易定制 | Go 语言构建 |

---

## 🔒 安全与运维建议

1. **强密钥**：请务必将 `.env` 中的 `JWT_SECRET` 设置为随机强字符串。
2. **反向代理与 HTTPS**：生产环境中推荐在 Nginx、Caddy 或 Cloudflare 后面运行，启用 HTTPS/WSS。
3. **数据备份**：所有笔记和系统数据存储在 `./data` 目录下，定期备份此目录或通过 Web 后台「一键备份」即可完整保留数据。

---

## 💖 Sponsorship & Support / 赞助与支持

- If you find this project useful and would like it to continue development, please support us in the following ways. Thank you for supporting open-source software!
- 如果您觉得本项目对您有所帮助并希望它持续迭代与更新，欢迎通过以下方式赞助支持作者，感谢您对开源软件的认可与鼓励：

| Ko-fi *Non-China Region* | | WeChat Pay *China Region* |
| :---: | :---: | :---: |
| <a href="https://ko-fi.com/lengedliu" target="_blank"><img src="https://storage.ko-fi.com/cdn/kofi2.png?v=3" width="220" alt="Support me on Ko-fi" /></a> | or | <img src="./public/wechat-reward.jpg" width="190" alt="WeChat Pay 微信打赏" /> |

---

