# Nimbus Vault Sync — 自托管全能 Obsidian 云端同步与知识管理平台

[简体中文](README.md) | [English](README_en.md) | [繁體中文](README_zh-TW.md) | [日本語](README_ja.md) | [한국어](README_ko.md)

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](package.json)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![WebSocket](https://img.shields.io/badge/WebSocket-Realtime-010101?style=flat&logo=socketdotio&logoColor=white)](https://github.com/websockets/ws)
[![MCP](https://img.shields.io/badge/MCP-22_Tools-8A2BE2?style=flat&logo=anthropic&logoColor=white)](https://modelcontextprotocol.io)
[![Git Sync](https://img.shields.io/badge/Git-Auto_Backup-F05032?style=flat&logo=git&logoColor=white)](#-git-自动备份与远程同步)
[![Obsidian](https://img.shields.io/badge/Obsidian-Plugin-7C3AED?style=flat&logo=obsidian&logoColor=white)](https://obsidian.md)
[![Database](https://img.shields.io/badge/Database-JSON%20%7C%20SQLite%20%7C%20Postgres%20%7C%20MySQL-4479A1?style=flat&logo=sqlite&logoColor=white)](#-多数据库引擎与在线平滑迁移)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com)
[![i18n](https://img.shields.io/badge/i18n-5_Languages-00C49F?style=flat)](#-原生多语言支持-i18n)
[![License](https://img.shields.io/badge/License-MIT-F59E0B?style=flat&logo=opensourceinitiative&logoColor=white)](LICENSE)

**Nimbus Vault Sync** 是一款轻量级、高安全性、全功能的私有化自托管 Obsidian 知识库云端同步与协作管理中枢。它不仅支持桌面端与移动端（iOS / Android / Mac / Windows / Linux）毫秒级双向实时同步，更深度集成了 **22 项标准 Model Context Protocol (MCP) AI 工具**、**原生 Git 自动备份**、**D3 双链知识图谱**、**交互式任务看板**、**三方可视化冲突解决**及**安全外链分享**。

---

## 🌟 核心特色与架构优势

- ⚡ **WebSocket 毫秒级极速实时同步**
  - 多设备、多笔记库双向实时广播，即时传递文件增量变更。
  - 内置 SHA-256 乐观并发锁机制，告别多端并发覆盖。
- 🤖 **全面赋能的 22 项 MCP (Model Context Protocol) AI 核心工具**
  - 原生支持 **StreamableHTTP** 协议，支持 **Cursor、Cherry Studio、Claude Desktop、Cline、Roo Code、VSCode** 等 AI 客户端直连。
  - AI 可直接执行全文语义检索、笔记读取、追加与局部 Patch、日记沉淀、双链与标签分析、附件上传、历史版本溯源及 Git 远程同步。
- 🌿 **原生 Git 自动备份与远程同步**
  - 支持将笔记库直接与 GitHub、GitLab、Gitee 或自建 Git 仓库关联。
  - 文件修改后自动防抖（Debounce）提交（Commit）与推送（Push），支持自定义提交信息模板与分支管理。
- 📊 **交互式看板与待办任务智能扫描**
  - 每库独立可视化看板，支持自定义任务泳道与拖拽排序。
  - 全库秒级扫描 Markdown 任务语法（`- [ ]` / `- [x]`），在 Web 端一键勾选完成并直达源文档。
- 🕸️ **D3 交互式双向链接知识图谱**
  - 基于 D3.js 2D 力导向网络图，动态呈现文档引用网状脉络、孤立笔记、中心度权重与标签聚类。
- 🔀 **可视化三方差异比对与冲突解决**
  - 当离线编辑产生冲突时自动保留 `.conflict` 副本，绝不丢失数据。
  - Web 控制台提供行级 3-Way 差异比对、合并编辑器与一键采纳策略。
- 👥 **细粒度 RBAC 权限与多成员协作**
  - 支持所有者（Owner）、读写编辑（Editor）、只读浏览（Viewer）权限隔离。
  - 支持按用户与设备生成独立 API Token，支持设备在线感知与一键强制踢出。
- 📢 **全功能 Webhook 实时告警通知**
  - 支持 **Discord、Slack、飞书 (Feishu)、钉钉 (DingTalk)、企业微信 (WeCom)** 及自定义 Webhook。
  - 覆盖文件删除、冲突产生、版本恢复、备份创建与设备登录等多类运维事件。
- 🔗 **安全外链公开分享**
  - 一键将 Markdown 笔记发布为独立 Web 阅读页，支持访问密码、到期时间与禁止复制保护。
- 🕘 **全版本历史快照与安全回收站**
  - 每次保存自动归档历史快照，支持时间轴溯源与一键回滚。
  - 误删文件自动进入回收站软删除，支持单文件还原与保留周期自动轮替。
- 🗄️ **多数据库引擎与在线平滑迁移**
  - 开箱即用纯 JSON 文件存储（零配置依赖），同时原生支持 **SQLite、PostgreSQL 与 MySQL**。
  - 支持在 Web 控制台一键将历史数据无损在线迁移至目标数据库。
- 🌍 **原生多语言支持 (i18n)**
  - 完美适配 **简体中文、繁體中文、English、日本語、한국어** 5 种语言，实时切换无缝持久化。
- 📖 **交互式 REST API 开发者文档**
  - 内置 OpenAPI Spec 规范，Web 控制台自带自动注入 Token 的交互式调试终端与 cURL 快速生成。

---

## 📁 目录结构

```
nimbus-vault-sync/
├── server.js                # 入口服务：REST API + WebSocket Hub + MCP 协议端点 + 静态托管
├── obsidian-plugin/         # 配套 Obsidian 官方规范双向同步插件
│   ├── manifest.json
│   ├── main.js
│   ├── styles.css
│   └── README.md
├── src/
│   ├── config.js            # 集中配置中心（从 package.json / 环境变量统一读取版本与参数）
│   ├── db.js                # 多数据库引擎（JSON / SQLite / PostgreSQL / MySQL）与在线迁移
│   ├── mcp.js               # 22 个 MCP 标准工具集实现与 StreamableHTTP 处理器
│   ├── wsHub.js             # WebSocket 实时多端同步广播中心
│   ├── storage.js           # 文件读写、历史快照、回收站软删除、冲突管理
│   ├── gitSync.js           # 原生 Git 自动提交流水线与远程仓库协同
│   ├── webhooks.js          # 多平台 Webhook 告警与通知调度器
│   ├── users.js             # 用户账户体系与 RBAC 权限
│   ├── vaults.js            # 笔记库元数据存储与访问校验
│   ├── vaultMembers.js      # 多用户协作成员与权限矩阵
│   ├── devices.js           # 接入设备鉴权与在线状态感知
│   ├── shares.js            # 外链加密分享与访问控制
│   ├── syncRules.js         # 同步过滤规则（忽略模式与扩展名）
│   ├── health.js            # 磁盘、内存与数据库实时健康探针
│   └── routes/              # 模块化 RESTful 路由
├── public/                  # 现代化响应式 Web 控制台（极速纯原生，无需打包构建）
│   ├── index.html           # 主控制台单页应用
│   ├── share.html           # 优雅外链阅读页
│   ├── style.css            # 响应式自适应主题系统
│   ├── app.js               # 前端状态机与核心交互
│   └── i18n.js              # 5 国语言国际化字典
└── data/                    # 运行时持久化数据卷（笔记库、配置、快照、回收站、备份）
```

---

## 🚀 快速开始

### 方式一：Node.js / Bun 本地运行

```bash
# 1. 克隆代码仓库
git clone https://github.com/your-org/nimbus-vault-sync.git
cd nimbus-vault-sync

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 可按需修改 PORT、JWT_SECRET 等参数

# 4. 启动服务
npm start
```

服务启动后，在浏览器访问 **`http://localhost:3000`** 即可进入 Web 管理控制台。  
首次启动若无用户，系统将引导创建全局初始管理员（Admin）账号。

---

### 方式二：Docker & Docker Compose 一键部署

#### 使用 Docker Compose（推荐）

```bash
# 复制配置文件
cp .env.example .env

# 后台构建并启动服务
docker compose up -d --build
```

#### 使用原生 Docker 运行

```bash
docker build -t nimbus-vault-sync .
docker run -d -p 3000:3000 \
  -e JWT_SECRET=your_super_strong_random_secret \
  -v $(pwd)/data:/app/data \
  --name nimbus-vault-sync nimbus-vault-sync
```

- **Web 控制台**：`http://localhost:3000`
- **WebSocket 实时端点**：`ws://localhost:3000/ws`
- **MCP AI 接口端点**：`http://localhost:3000/api/mcp`
- **健康检查探针**：`http://localhost:3000/api/health`

---

## 🔌 配套 Obsidian 插件安装与配置

1. 打开你的 Obsidian 笔记库，进入 **「设置」->「第三方插件」**，关闭安全模式。
2. 将本仓库中的 [`obsidian-plugin`](./obsidian-plugin) 文件夹复制至你的笔记库目录：
   `.obsidian/plugins/nimbus-sync/`
3. 重新加载 Obsidian 插件列表，启用 **Nimbus Sync**。
4. 登录 Nimbus Web 控制台，在 **「设置与 Token」** 面板生成专属 API Token，或点击 **「一键复制插件配置」**。
5. 在 Obsidian 插件设置面板粘贴配置，即可开启极速双向实时同步。

---

## 🤖 Model Context Protocol (MCP) AI 助手接入

Nimbus 原生内置 **StreamableHTTP** 协议的 MCP 接口，AI 客户端无需在本地运行复杂的子进程，通过标准 HTTP POST 即可直接连接。

### 1. 客户端配置文件 (`mcp.json`)

在 Web 控制台左侧点击 **「🤖 AI / MCP」**，可快速选择笔记库并一键复制以下配置：

```json
{
  "mcpServers": {
    "nimbus-vault-sync": {
      "url": "http://<你的服务器地址>:3000/api/mcp",
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

### 2. 内置 22 项 MCP 标准工具清单

| 类别 | 工具名称 | 参数及说明 | 典型应用场景 |
| :--- | :--- | :--- | :--- |
| **库管理与体检** | `list_vaults` | 获取当前用户所有授权笔记库及权限角色 | 多库感知与切换 |
| | `get_vault_stats` | `vaultId?`：获取文档数、附件统计、Top 20 标签与修改概况 | 知识库全量体检 |
| **检索与元数据** | `list_notes` | `folder?`, `extension?`, `sortBy?`, `sortOrder?`, `limit?` | 结构化目录检索 |
| | `get_note_metadata` | `path`, `vaultId?`：提取字数、Frontmatter、双链 `[[Link]]`、标签与大纲 | 笔记深度语义分析 |
| **读写与局部修改** | `read_note` | `path`, `vaultId?`：读取笔记原始内容 | 阅读全文 |
| | `write_note` | `path`, `content`, `baseHash?`, `vaultId?`：创建或覆盖笔记，自动记录版本快照并推送多端 | AI 新建/重构文档 |
| | `append_note` | `path`, `content`, `heading?`, `withTimestamp?`：在末尾或指定标题下追加 | 会议纪要增补、随手记 |
| | `prepend_note` | `path`, `content`, `withTimestamp?`：在顶部插入（保留 YAML 属性） | 插入核心摘要或置顶 |
| | `patch_note` | `path`, `search`, `replace`, `replaceAll?`：局部精准匹配替换 | 小范围精准修改 |
| **附件管理** | `upload_attachment` | `path`, `sourceUrl?`, `base64Data?`, `vaultId?`：通过 URL 或 Base64 直传图片与附件 | 网页图片转存到库 |
| | `get_attachment_base64` | `path`, `vaultId?`：获取图片/附件的 Base64 编码与 MIME 类型 | 多模态 AI 图片理解 |
| **日记流与随手记** | `get_daily_note` | `date?`, `folder?`, `createIfMissing?`：获取或初始化当天日记 | 日记查询 |
| | `append_daily_note` | `content`, `date?`, `folder?`, `heading?`, `withTimestamp?`：追加碎片思考 | 日常灵感沉淀 |
| **搜索与标签树** | `search_notes` | `query`, `folder?`, `limit?`, `useRegex?`, `caseSensitive?`：带上下文行号的全文检索 | 快速定位知识点 |
| | `list_tags` | `folder?`, `vaultId?`：统计全库 Obsidian 标签与词频 | 标签体系梳理 |
| **文件组织与删除** | `move_note` | `oldPath`, `newPath`, `overwrite?`：重命名或移动笔记 | 知识库归档重组 |
| | `delete_note` | `path`, `vaultId?`：安全删除（移入回收站软删除）并同步全端 | 笔记清理 |
| **版本快照与溯源** | `get_note_history` | `path`, `vaultId?`：查询单篇笔记的所有历史备份版本 | 变更历史回溯 |
| | `read_history_version` | `versionId`, `vaultId?`：读取指定历史快照原始内容 | 版本对比与回滚 |
| **外链分享** | `create_share_link` | `path`, `title?`, `password?`, `expiresDays?`, `allowCopy?`：生成加密阅读外链 | 一键发布文章 |
| **Git 远程同步** | `get_vault_git_status` | `vaultId?`：查看 Git 分支、未提交变更与远程同步状态 | Git 状态监测 |
| | `git_sync_vault` | `vaultId?`, `commitMessage?`, `pullFirst?`：触发 Git 自动提交并双向同步远程 | AI 自动触发远程推送 |

---

## 📊 方案对比

| 功能特性 | **Nimbus Vault Sync** | **Obsidian Official Sync** | **fast-note-sync-service (Go)** |
| :--- | :---: | :---: | :---: |
| **私有化自托管** | ✅ **完全自主可控** | ❌ 商业闭源云端 | ✅ 自托管 |
| **MCP AI 原生深度集成** | ✅ **22 个全功能工具** | ❌ 无 | ⚠️ 基础只读/简单写入 |
| **多语言界面支持** | ✅ **5 种语言原生支持** | ⚠️ 客户端内置 | ❌ 单一语言 |
| **原生 Git 自动远程备份** | ✅ **内置 GitHub/GitLab 同步** | ❌ 无 | ❌ 无 |
| **可视化 D3 知识图谱** | ✅ **Web 端交互式 2D 力导向图** | ⚠️ 仅客户端本地 | ❌ 无 |
| **任务看板与 Markdown 待办扫描** | ✅ **内置交互式看板与全库扫描** | ❌ 无 | ❌ 无 |
| **3-Way 可视化差异比对与冲突解决** | ✅ **内置 Diff & Merge 编辑器** | ⚠️ 简单版本选择 | ⚠️ 仅冲突副本保留 |
| **多数据库支持与平滑迁移** | ✅ **JSON / SQLite / PG / MySQL** | ❌ 专有格式 | ⚠️ SQLite / PG / MySQL |
| **外链公开分享** | ✅ **密码 + 防复制 + 有效期** | ❌ 需另购 Obsidian Publish | ⚠️ 基础分享 |
| **交互式 REST API 开发者文档** | ✅ **内置交互式控制台与规范** | ❌ 无公开 API | ❌ 无交互文档 |
| **多平台 Webhook 告警调度** | ✅ **Discord/Slack/飞书/钉钉/企微** | ❌ 无 | ❌ 无 |

---

## 🔒 生产环境安全与运维建议

1. **强随机密钥**：生产部署时务必修改 `.env` 中的 `JWT_SECRET`，使用 `openssl rand -base64 32` 生成高强度密钥。
2. **反向代理与 HTTPS/WSS**：建议通过 Nginx / Caddy / Cloudflare 等反向代理暴露服务，开启 SSL/TLS 加密，并在启用反向代理时设置 `TRUST_PROXY=1`。
3. **CORS 收紧**：在固定域名下部署时，建议配置 `CORS_ALLOWED_ORIGINS=https://your-domain.com` 收紧跨域策略。
4. **定期数据备份**：Nimbus 所有笔记、快照、回收站与系统配置均存储在 `./data` 目录中，定期备份该目录即可完整保护数据资产。

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 许可证开源。
