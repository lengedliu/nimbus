# Nimbus Vault Sync — Self-Hosted Obsidian Sync + Web Admin + MCP Server + Open REST API

[简体中文](README.md) / [English](README_en.md) / [日本語](README_ja.md) / [한국어](README_ko.md) / [繁體中文](README_zh-TW.md)

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.19-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com)
[![WebSocket](https://img.shields.io/badge/WebSocket-Realtime-010101?style=flat&logo=socketdotio&logoColor=white)](https://github.com/websockets/ws)
[![MCP](https://img.shields.io/badge/MCP-18_Tools-8A2BE2?style=flat&logo=anthropic&logoColor=white)](https://modelcontextprotocol.io)
[![Obsidian](https://img.shields.io/badge/Obsidian-Plugin-7C3AED?style=flat&logo=obsidian&logoColor=white)](https://obsidian.md)
[![Database](https://img.shields.io/badge/Database-SQLite%20%7C%20MySQL%20%7C%20Postgres-4479A1?style=flat&logo=sqlite&logoColor=white)](#)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-MIT-F59E0B?style=flat&logo=opensourceinitiative&logoColor=white)](LICENSE)

**Nimbus Vault Sync** (formerly FNS / Fast Note Sync) is a lightweight, self-hosted, full-featured Obsidian cloud synchronization and knowledge management backend service:

- 📡 **Millisecond-Level WebSocket Real-Time Sync** — Multi-device & multi-vault collaboration with optimistic concurrency control, conflict prevention, and real-time state broadcasting.
- 🖥 **Modern Web Admin Console** — Multi-vault switcher, full-text fuzzy search, online Markdown editor & preview, device management, and trash bin.
- 🤖 **Comprehensive Model Context Protocol (MCP)** — 18 standard built-in MCP tools enabling AI clients (Cursor, Cherry Studio, Claude Desktop, Cline, Roo Code) to directly read, write, and organize notes with real-time sync across mobile and desktop.
- 📖 **Interactive REST API Documentation** — Full OpenAPI Spec with one-click cURL code generation (pre-injected with current JWT & Vault ID).
- 🔗 **Elegant Public Note Sharing** — Generate web reading links with password protection, expiration days, and anti-copy security.
- 📱 **Multi-Device Management** — Monitor client platforms, IP addresses, online statuses, dedicated auth tokens, and remote revocation.
- 🕘 **Version History Snapshots** — Automatic archiving of previous document versions on save, diff inspection, and one-click rollback.
- 🗑 **Safe Trash Bin Mechanism** — Soft deletions moved to trash bin to prevent accidental data loss, with individual restore and batch purge.
- 🗄 **Multi-Database Engine Support** — Native support for JSON files, SQLite, PostgreSQL, and MySQL with seamless migration.
- 🐳 **One-Click Docker Deployment** — Production-ready `Dockerfile` and `docker-compose.yml` with persistent storage volume mounts.

The companion Obsidian plugin is located in the [`obsidian-plugin`](./obsidian-plugin) directory.

---

## 📁 Directory Structure

```
nimbus-vault-sync/
├── server.js                # Entry point: REST API + WebSocket Hub + MCP endpoint + Static files
├── obsidian-plugin/         # Companion Obsidian bidirectional sync plugin (.obsidian/plugins/nimbus-sync)
│   ├── manifest.json
│   ├── main.js
│   ├── styles.css
│   └── README.md
├── src/
│   ├── config.js            # Environment variables & system configuration
│   ├── db.js                # Multi-database manager (JSON / SQLite / PostgreSQL / MySQL)
│   ├── users.js             # User accounts & RBAC permissions (Admin / Regular User)
│   ├── vaults.js            # Vault storage & access verification
│   ├── auth.js              # JWT authentication & requireAuth / requireAdmin middlewares
│   ├── storage.js           # Note file I/O, historical snapshots, trash, conflict resolution
│   ├── mcpServer.js         # 18 Standard MCP tool implementations & StreamableHTTP handler
│   ├── wsHub.js             # WebSocket real-time multi-client broadcasting hub
│   └── routes/
│       ├── authRoutes.js    # Login, registration, system status
│       ├── vaultRoutes.js   # Vault list, creation, deletion, manifest
│       ├── fileRoutes.js    # Incremental file read/write, deletion
│       ├── vaultExtrasRoutes.js # History, trash, conflicts, backups, collaborators, audit logs
│       ├── shareRoutes.js   # Share links creation & public reader
│       ├── deviceRoutes.js  # Connected devices list & token management
│       ├── settingsRoutes.js# Sync settings, password change, DB engine switch
│       ├── adminRoutes.js   # Superadmin: global vault & user management
│       ├── mcpRoutes.js     # MCP StreamableHTTP endpoint & /tools introspection
│       └── docsRoutes.js    # REST API interactive docs & spec endpoints
├── public/                  # Web Admin Console (Native HTML/CSS/JS, zero-build required)
│   ├── index.html           # Main management dashboard
│   ├── share.html           # Elegant public note reading page
│   ├── style.css            # Modern theme styling system
│   └── app.js               # Frontend interactive application logic
└── data/                    # Persistent storage: notes, history snapshots, trash, backups
```

---

## 🚀 Quick Start

```bash
cd nimbus-vault-sync
npm install
cp .env.example .env       # Modify PORT / JWT_SECRET as desired
npm start
```

Open your browser and navigate to **`http://localhost:8787/admin`** to access the Web Admin Console.

When starting with an empty database, create the initial administrator account by:
1. Opening the Web Console in your browser and completing the setup prompt.
2. Or sending a request to `POST /api/auth/register` (only available when no users exist).

---

## 🐳 Docker Deployment

```bash
cd nimbus-vault-sync
cp .env.example .env    # Set JWT_SECRET to a strong random string
docker compose up -d --build
```

- Data is persisted in the host's `./data` directory (volume mount). Backing up this folder protects all your notes and configuration.
- Web Admin Console: `http://localhost:8787/admin`
- WebSocket Sync Endpoint: `ws://localhost:8787/ws`
- MCP Server Endpoint: `http://localhost:8787/api/mcp`
- Running with standalone Dockerfile:
  ```bash
  docker build -t nimbus-vault-sync .
  docker run -d -p 8787:8787 \
    -e JWT_SECRET=your_jwt_secret_string \
    -v $(pwd)/data:/app/data \
    --name nimbus-vault-sync nimbus-vault-sync
  ```

---

## 🤖 Model Context Protocol (MCP) Integration

Nimbus natively implements the **StreamableHTTP** MCP transport protocol. AI clients (Cursor, Cherry Studio, Claude Desktop, Cline, Roo Code, etc.) can directly connect via standard HTTP POST without running local sub-processes.

### 1. Client Configuration (`mcp.json`)

In the Web Console, click **「🤖 AI / MCP Settings」** on the sidebar to select your vault and copy the configuration:

```json
{
  "mcpServers": {
    "nimbus-fast-note-sync": {
      "url": "http://<YOUR_SERVER_HOST>/api/mcp",
      "type": "http",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer <YOUR_JWT_TOKEN>",
        "X-Default-Vault-Name": "My Knowledge Base"
      }
    }
  }
}
```

### 2. 18 Built-in Standard MCP Tools

| Category | Tool Name | Parameters & Description | Use Cases |
| :--- | :--- | :--- | :--- |
| **Vaults & Stats** | `list_vaults` | List all accessible vaults and user permissions | Vault overview |
| | `get_vault_stats` | `vaultId?`: Stats for Markdown/HTML/attachments, Top 20 tags, and recent edits | Knowledge base health check |
| **Search & Metadata** | `list_notes` | `folder?`, `extension?`, `sortBy?`, `sortOrder?`, `limit?`, `includeMetadata?` | Filter by folder/time/extension |
| | `get_note_metadata`| `path`, `vaultId?`: Extract word count, YAML frontmatter, backlinks `[[Link]]`, `#tags`, and outline | Deep structural analysis |
| **Read & Write** | `read_note` | `path`, `vaultId?`: Read full document text | Read note contents |
| | `write_note` | `path`, `content`, `baseHash?`, `vaultId?`: Create or update note with history & real-time broadcast | AI note generation / refactoring |
| | `append_note` | `path`, `content`, `heading?`, `withTimestamp?`: Append at end of note or under a heading | Meeting notes, quick capture |
| | `prepend_note` | `path`, `content`, `withTimestamp?`: Insert at the top (preserving YAML frontmatter) | Summary insert / pin |
| | `patch_note` | `path`, `search`, `replace`, `replaceAll?`: Targeted search and replace | Precise partial updates |
| **Daily Notes** | `get_daily_note` | `date?`, `folder?`, `createIfMissing?`: Retrieve or initialize daily note | Query daily journal |
| | `append_daily_note`| `content`, `date?`, `folder?`, `heading?`, `withTimestamp?`: Append timestamped daily log | Micro-journaling / task logs |
| **Search & Tags** | `search_notes` | `query`, `folder?`, `limit?`, `useRegex?`, `caseSensitive?`: Full-text search with line context | Quick knowledge lookup |
| | `list_tags` | `folder?`, `vaultId?`: Aggregate all Obsidian tags & nested tag frequencies | Tag taxonomy overview |
| **Organization** | `move_note` | `oldPath`, `newPath`, `overwrite?`: Rename or move note | Vault re-organization |
| | `delete_note` | `path`, `vaultId?`: Safe soft deletion (moved to trash) with broadcast | Note cleanup |
| **History & Diff** | `get_note_history` | `path`, `vaultId?`: Query all historical snapshots for a note | Change log audit |
| | `read_history_version`| `versionId`, `vaultId?`: Retrieve raw content of a specific snapshot | Comparison & rollback |
| **Sharing** | `create_share_link`| `path`, `title?`, `password?`, `expiresDays?`, `allowCopy?`: Generate public web share link | AI one-click publishing |

---

## 📖 REST API Overview

Click **「📖 REST API Docs」** on the Web Console sidebar to view interactive cURL examples pre-injected with your current session token and active vault. The machine-readable OpenAPI spec is also served at `GET /api/docs/spec`.

### Core Endpoint Quick Reference

| Category | Method | Path | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Login and acquire JWT Token |
| | `GET` | `/api/health` | Service health status check |
| **Vaults** | `GET` | `/api/vaults` | List all accessible vaults |
| | `POST` | `/api/vaults` | Create a new vault |
| | `GET` | `/api/vaults/:vaultId/manifest` | Full file manifest & SHA-256 hashes |
| | `GET` | `/api/vaults/search?q=keyword` | Cross-vault file and content search |
| **Files** | `GET` | `/api/vaults/:vaultId/files/*` | Read note or binary attachment |
| | `PUT` | `/api/vaults/:vaultId/files/*` | Write file (supports `X-Base-Hash` conflict check & broadcast) |
| | `DELETE`| `/api/vaults/:vaultId/files/*` | Delete file (soft delete to trash bin) |
| **History** | `GET` | `/api/vaults/:vaultId/history?path=...` | List historical versions of a note |
| | `POST` | `/api/vaults/:vaultId/history/:versionId/restore` | Rollback to a specific snapshot |
| **Trash** | `GET` | `/api/vaults/:vaultId/trash` | List files in trash bin |
| | `POST` | `/api/vaults/:vaultId/trash/:trashId/restore` | Restore file from trash bin |
| **Backups & Conflicts** | `POST` | `/api/vaults/:vaultId/backups` | Create full vault ZIP snapshot |
| | `GET` | `/api/vaults/:vaultId/export` | Download full vault as ZIP |
| | `POST` | `/api/vaults/:vaultId/conflicts/resolve` | Submit conflict resolution strategy |
| **Sharing** | `POST` | `/api/vaults/:vaultId/shares` | Create public share link |
| | `GET` | `/api/public/shares/:shareId` | Reader endpoint for public article |
| **MCP** | `GET` | `/api/mcp/tools` | Introspect 18 MCP tools schema & parameter specs |
| | `POST` | `/api/mcp` | Handle JSON-RPC requests from AI clients |

---

## 📡 WebSocket Sync Protocol

- **Endpoint**: `ws://<host>/ws?token=<jwt>&vaultId=<vaultId>`
- **Bidirectional Broadcasting**:
  - Automatically sends an `init` full manifest comparison upon connection.
  - Broadcasts `change` / `deleted` notifications to other active devices connected to the same vault.
  - Uses `baseHash` optimistic concurrency checking; automatically produces `.conflict` copies when concurrent conflicts occur.

---

## 📊 Comparison with fast-note-sync-service (FNS)

| Feature | Nimbus Vault Sync | FNS (haierkeys) |
|---|---|---|
| **Real-time Sync (WebSocket)** | ✅ Millisecond bidirectional broadcast | ✅ |
| **Web Admin Console** | ✅ Modern SPA (Online edit, search, device audit) | ✅ |
| **MCP Tools Count & Breadth** | ✅ **18 standard tools** (Daily notes, shares, metadata, snapshots) | ✅ Basic tools |
| **Interactive REST API Docs** | ✅ **Interactive docs + one-click cURL** (`/api/docs/spec`) | ❌ |
| **Version History Snapshots** | ✅ Automatic snapshots & one-click rollback | ✅ |
| **Safe Trash Bin** | ✅ Soft delete, restore & batch purge | ✅ |
| **Public Note Sharing** | ✅ Password protection, expiry days & reader UI | ✅ |
| **Device Management & Audit** | ✅ Online status / OS platform / remote revocation | ✅ |
| **Storage Engines** | ✅ Smooth switching across JSON / SQLite / MySQL / PostgreSQL | ✅ SQLite / MySQL / PostgreSQL |
| **Extensibility & Customization** | ✅ Pure Node.js, zero build step, easy to customize | Built with Go |

---

## 🔒 Security & Operations Recommendations

1. **Strong JWT Secret**: Ensure `JWT_SECRET` in `.env` is set to a long, random string.
2. **Reverse Proxy & HTTPS**: In production, deploy behind Nginx, Caddy, or Cloudflare with HTTPS/WSS enabled.
3. **Data Backups**: All notes and database state reside in `./data`. Regularly backing up this folder or triggering "Create Backup" in the Web Console ensures full recovery.

---

## 💖 Sponsorship & Support

- If you find this project useful and would like it to continue development, please support us in the following ways. Thank you for supporting open-source software!
- 如果您觉得本项目对您有所帮助并希望它持续迭代与更新，欢迎通过以下方式赞助支持作者，感谢您对开源软件的认可与鼓励：

| Ko-fi *Non-China Region* | | WeChat Pay *China Region* |
| :---: | :---: | :---: |
| <a href="https://ko-fi.com/lengedliu" target="_blank"><img src="https://storage.ko-fi.com/cdn/kofi2.png?v=3" width="220" alt="Support me on Ko-fi" /></a> | or | <img src="./public/wechat-reward.jpg" width="190" alt="WeChat Pay 微信打赏" /> |

---
