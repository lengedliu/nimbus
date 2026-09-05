# Nimbus Vault Sync — Self-Hosted Obsidian Cloud Sync & Knowledge Management Platform

[简体中文](README.md) | [English](README_en.md) | [繁體中文](README_zh-TW.md) | [日本語](README_ja.md) | [한국어](README_ko.md)

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](package.json)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![WebSocket](https://img.shields.io/badge/WebSocket-Realtime-010101?style=flat&logo=socketdotio&logoColor=white)](https://github.com/websockets/ws)
[![MCP](https://img.shields.io/badge/MCP-22_Tools-8A2BE2?style=flat&logo=anthropic&logoColor=white)](https://modelcontextprotocol.io)
[![Git Sync](https://img.shields.io/badge/Git-Auto_Backup-F05032?style=flat&logo=git&logoColor=white)](#-git-auto-backup--remote-sync)
[![Obsidian](https://img.shields.io/badge/Obsidian-Plugin-7C3AED?style=flat&logo=obsidian&logoColor=white)](https://obsidian.md)
[![Database](https://img.shields.io/badge/Database-JSON%20%7C%20SQLite%20%7C%20Postgres%20%7C%20MySQL-4479A1?style=flat&logo=sqlite&logoColor=white)](#-multi-database-engine-support--online-migration)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com)
[![i18n](https://img.shields.io/badge/i18n-5_Languages-00C49F?style=flat)](#-native-multi-language-support-i18n)
[![License](https://img.shields.io/badge/License-MIT-F59E0B?style=flat&logo=opensourceinitiative&logoColor=white)](LICENSE)

**Nimbus Vault Sync** is a lightweight, secure, and full-featured private self-hosted Obsidian cloud sync and collaborative knowledge hub. It provides millisecond-level bidirectional real-time synchronization across all platforms (iOS, Android, Mac, Windows, Linux, Web), alongside deep integrations for **22 standard Model Context Protocol (MCP) AI tools**, **native Git auto-backup**, **D3 2D knowledge graph visualization**, **interactive task kanban boards**, **3-way visual conflict resolution**, and **secure note sharing**.

---

## 🌟 Core Features & Highlights

- ⚡ **Millisecond Real-Time WebSocket Synchronization**
  - Bidirectional broadcasting across multiple devices and vaults with instant delta updates.
  - SHA-256 optimistic concurrency locking to prevent multi-device concurrent overwrites.
- 🤖 **22 Comprehensive Model Context Protocol (MCP) AI Tools**
  - Native **StreamableHTTP** protocol support for **Cursor, Cherry Studio, Claude Desktop, Cline, Roo Code, VSCode**, and other AI clients.
  - AI can search notes, read/write/patch documents, log daily thoughts, inspect backlinks & tags, upload attachments, inspect history snapshots, and trigger Git synchronization.
- 🌿 **Native Git Auto-Backup & Remote Sync**
  - Connect vaults directly to GitHub, GitLab, Gitee, or self-hosted Git servers.
  - Debounced auto-commit and push upon file changes, with customizable commit message templates and branch management.
- 📊 **Interactive Kanban & Markdown Task Scanner**
  - Vault-level visual task boards with custom swimlanes and drag-and-drop organization.
  - Instant vault-wide scanning of Markdown task syntax (`- [ ]` / `- [x]`), with one-click toggles and direct navigation to source notes.
- 🕸️ **D3 Interactive Bi-directional Knowledge Graph**
  - Dynamic 2D force-directed network graph visualizing document links, orphan notes, degree centrality, and tag clusters.
- 🔀 **Visual 3-Way Diff & Conflict Resolution**
  - Preserves `.conflict` backup files during offline collisions to guarantee zero data loss.
  - Built-in line-level 3-way visual diff & merge editor with one-click resolution policies.
- 👥 **Fine-Grained RBAC Permissions & Vault Collaboration**
  - Role-based access control: Owner, Editor (Read-Write), and Viewer (Read-Only).
  - Dedicated API tokens per user and device, with real-time online status monitoring and remote revocation.
- 📢 **Multi-Platform Webhook Notifications**
  - Built-in dispatchers for **Discord, Slack, Feishu / Lark, DingTalk, WeChat Work (WeCom)**, and custom endpoints.
  - Real-time alerts for file deletions, conflict occurrences, version rollbacks, backups, and device logins.
- 🔗 **Secure Public Note Sharing**
  - Publish notes as standalone web reading pages with optional password protection, expiration dates, and anti-copy text selection prevention.
- 🕘 **Version History Snapshots & Safe Recycle Bin (Trash)**
  - Automatic snapshot archiving on save with full timeline rollbacks.
  - Soft-deletion safeguards deleted files in a dedicated trash bin with single-item recovery and automated retention policies.
- 🗄️ **Multi-Database Engine Support & Online Migration**
  - Out-of-the-box zero-dependency JSON database, with native support for **SQLite, PostgreSQL, and MySQL**.
  - One-click non-destructive online migration between database backends in the Web console.
- 🌍 **Native Multi-Language Support (i18n)**
  - Native support for **English, 简体中文, 繁體中文, 日本語, 한국어** with instant switching and persistent preferences.
- 📖 **Interactive REST API Developer Documentation**
  - Built-in OpenAPI Spec definitions with an interactive web playground that auto-injects active JWT tokens and Vault IDs into ready-to-run cURL commands.

---

## 📁 Directory Structure

```
nimbus-vault-sync/
├── server.js                # Entry point: REST API + WebSocket Hub + MCP endpoint + Static assets
├── obsidian-plugin/         # Companion Obsidian bidirectional sync plugin
│   ├── manifest.json
│   ├── main.js
│   ├── styles.css
│   └── README.md
├── src/
│   ├── config.js            # Unified configuration hub (reads versions & variables from package.json/.env)
│   ├── db.js                # Multi-database manager (JSON / SQLite / PostgreSQL / MySQL) & migration
│   ├── mcp.js               # 22 Standard MCP tool implementations & StreamableHTTP handler
│   ├── wsHub.js             # WebSocket real-time multi-client broadcasting hub
│   ├── storage.js           # File I/O, version history snapshots, trash bin, conflict management
│   ├── gitSync.js           # Native Git auto-commit pipeline & remote repository synchronization
│   ├── webhooks.js          # Multi-platform webhook dispatcher & alert scheduler
│   ├── users.js             # User management & RBAC role access
│   ├── vaults.js            # Vault storage & permission validation
│   ├── vaultMembers.js      # Multi-user collaboration & permission matrix
│   ├── devices.js           # Connected devices tracking & token revocation
│   ├── shares.js            # Encrypted public shares & access control
│   ├── syncRules.js         # Sync filtering rules (ignored patterns & extensions)
│   ├── health.js            # Real-time disk, memory, and database health probes
│   └── routes/              # Modular RESTful API route definitions
├── public/                  # Modern responsive Web dashboard (pure vanilla JS/CSS, zero build steps)
│   ├── index.html           # Main SPA management console
│   ├── share.html           # Public note reader view
│   ├── style.css            # Responsive theme & style system
│   ├── app.js               # Frontend application state & UI interactions
│   └── i18n.js              # Multi-language dictionary (5 languages)
└── data/                    # Persistent data volume (vaults, configurations, snapshots, trash, backups)
```

---

## 🚀 Quick Start

### Option 1: Local Run (Node.js / Bun)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/nimbus-vault-sync.git
cd nimbus-vault-sync

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit PORT, JWT_SECRET, etc. as needed

# 4. Start the server
npm start
```

Open your browser and navigate to **`http://localhost:3000`** to access the Web Admin Console.  
On the first launch with no existing accounts, the setup wizard will guide you to create the initial Admin account.

---

### Option 2: Docker & Docker Compose

#### Using Docker Compose (Recommended)

```bash
# Prepare environment file
cp .env.example .env

# Build and start in background
docker compose up -d --build
```

#### Using Standalone Docker

```bash
docker build -t nimbus-vault-sync .
docker run -d -p 3000:3000 \
  -e JWT_SECRET=your_super_strong_random_secret \
  -v $(pwd)/data:/app/data \
  --name nimbus-vault-sync nimbus-vault-sync
```

- **Web Dashboard**: `http://localhost:3000`
- **WebSocket Endpoint**: `ws://localhost:3000/ws`
- **MCP AI Endpoint**: `http://localhost:3000/api/mcp`
- **Health Check Probe**: `http://localhost:3000/api/health`

---

## 🔌 Companion Obsidian Plugin Setup

1. Open your Obsidian Vault, navigate to **Settings -> Community plugins**, and disable Safe mode.
2. Copy the [`obsidian-plugin`](./obsidian-plugin) folder from this repository into your vault's plugin directory:
   `.obsidian/plugins/nimbus-sync/`
3. Reload Obsidian plugins and enable **Nimbus Sync**.
4. Log into the Nimbus Web Console, navigate to **Settings & Tokens**, and click **"Copy Plugin Configuration"**.
5. Paste the configuration into the Obsidian plugin settings to initiate real-time bidirectional synchronization.

---

## 🤖 Model Context Protocol (MCP) AI Assistant Setup

Nimbus features native **StreamableHTTP** MCP integration. AI clients connect directly via standard HTTP POST without requiring local sub-processes.

### 1. Client Configuration (`mcp.json`)

In the Web Console, click **"🤖 AI / MCP"** on the sidebar to select your vault and copy the configuration snippet:

```json
{
  "mcpServers": {
    "nimbus-vault-sync": {
      "url": "http://<YOUR_SERVER_HOST>:3000/api/mcp",
      "type": "http",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer <YOUR_JWT_TOKEN>",
        "X-Default-Vault-Name": "My Vault"
      }
    }
  }
}
```

### 2. Complete 22 MCP Tools Reference

| Category | Tool Name | Parameters & Description | Typical Use Cases |
| :--- | :--- | :--- | :--- |
| **Vaults & Stats** | `list_vaults` | Lists all authorized vaults and user access roles | Vault discovery & context switching |
| | `get_vault_stats` | `vaultId?`: Returns total notes, attachments, Top 20 tags, and recent updates | Knowledge base health check |
| **Discovery & Meta**| `list_notes` | `folder?`, `extension?`, `sortBy?`, `sortOrder?`, `limit?` | Structured directory traversal |
| | `get_note_metadata` | `path`, `vaultId?`: Extracts word count, Frontmatter, `[[Links]]`, tags, and TOC | Deep semantic note analysis |
| **Read/Write/Patch**| `read_note` | `path`, `vaultId?`: Retrieves raw document content | Reading article contents |
| | `write_note` | `path`, `content`, `baseHash?`, `vaultId?`: Writes/overwrites note with snapshot archiving & real-time broadcast | AI authoring & refactoring |
| | `append_note` | `path`, `content`, `heading?`, `withTimestamp?`: Appends text to end or specific heading | Meeting notes & logging |
| | `prepend_note` | `path`, `content`, `withTimestamp?`: Inserts text at top (preserves YAML Frontmatter) | Prepending summaries |
| | `patch_note` | `path`, `search`, `replace`, `replaceAll?`: Targeted in-place string replacement | Surgical document edits |
| **Attachments** | `upload_attachment` | `path`, `sourceUrl?`, `base64Data?`, `vaultId?`: Uploads images/media via URL or Base64 | Clipping web images to vault |
| | `get_attachment_base64` | `path`, `vaultId?`: Retrieves Base64 payload and MIME type of images/media | Multimodal AI vision analysis |
| **Daily Notes** | `get_daily_note` | `date?`, `folder?`, `createIfMissing?`: Retrieves or initializes daily note | Daily journal lookup |
| | `append_daily_note`| `content`, `date?`, `folder?`, `heading?`, `withTimestamp?`: Logs timestamped notes | Capturing fleeting thoughts |
| **Search & Tags** | `search_notes` | `query`, `folder?`, `limit?`, `useRegex?`, `caseSensitive?`: Full-text search with line numbers | Rapid knowledge retrieval |
| | `list_tags` | `folder?`, `vaultId?`: Aggregates all Obsidian tags and frequencies | Taxonomy & tag cleanup |
| **File Operations** | `move_note` | `oldPath`, `newPath`, `overwrite?`: Renames or relocates documents | Vault reorganization |
| | `delete_note` | `path`, `vaultId?`: Soft-deletes note into recycle bin and broadcasts deletion | Safe note pruning |
| **Version History** | `get_note_history` | `path`, `vaultId?`: Lists historical snapshots of a document | Reviewing revision history |
| | `read_history_version`| `versionId`, `vaultId?`: Reads exact content of a past snapshot | Snapshot diffing & rollback |
| **Public Sharing** | `create_share_link` | `path`, `title?`, `password?`, `expiresDays?`, `allowCopy?`: Generates secure web links | Instant one-click publication |
| **Git Remote Sync** | `get_vault_git_status`| `vaultId?`: Inspects Git branch, uncommitted files, and remote sync state | Monitoring repository status |
| | `git_sync_vault` | `vaultId?`, `commitMessage?`, `pullFirst?`: Triggers Git auto-commit and push/pull | Automated AI Git backup |

---

## 📊 Feature Comparison

| Feature | **Nimbus Vault Sync** | **Obsidian Official Sync** | **fast-note-sync-service (Go)** |
| :--- | :---: | :---: | :---: |
| **Self-Hosted & Private** | ✅ **100% Autonomous Control** | ❌ Proprietary Cloud | ✅ Self-Hosted |
| **Deep MCP AI Integration** | ✅ **22 Comprehensive Tools** | ❌ None | ⚠️ Basic Read/Write |
| **Native Multi-Language (i18n)** | ✅ **5 Languages Built-in** | ⚠️ Client UI Only | ❌ Single Language |
| **Native Git Remote Sync** | ✅ **Built-in GitHub/GitLab Auto-Sync**| ❌ None | ❌ None |
| **Interactive D3 Knowledge Graph** | ✅ **Interactive 2D Force Graph** | ⚠️ Client Desktop Only | ❌ None |
| **Kanban & Markdown Task Scanner** | ✅ **Interactive Kanban + Task Scan** | ❌ None | ❌ None |
| **Visual 3-Way Diff & Merge** | ✅ **Built-in Diff & Merge Studio** | ⚠️ Simple Version Picker | ⚠️ Retains Conflict Copy Only |
| **Multi-Database & Live Migration** | ✅ **JSON / SQLite / PG / MySQL** | ❌ Proprietary Format | ⚠️ SQLite / PG / MySQL |
| **Secure Public Note Sharing** | ✅ **Password + Expiry + Anti-Copy** | ❌ Paid Add-on (Publish) | ⚠️ Basic Share |
| **Interactive REST API Docs** | ✅ **Built-in cURL Playground** | ❌ No Public API | ❌ No Interactive Docs |
| **Multi-Platform Webhooks** | ✅ **Discord/Slack/Feishu/DingTalk/WeCom** | ❌ None | ❌ None |

---

## 🔒 Production Security Recommendations

1. **Strong JWT Secret**: Always update `JWT_SECRET` in `.env` using a cryptographically strong string (`openssl rand -base64 32`).
2. **Reverse Proxy & HTTPS/WSS**: Deploy behind Nginx, Caddy, or Cloudflare with SSL/TLS enabled, and set `TRUST_PROXY=1` when behind reverse proxies.
3. **CORS Restrictions**: In production domains, set `CORS_ALLOWED_ORIGINS=https://your-domain.com` to lock down cross-origin API requests.
4. **Regular Data Backups**: All notes, snapshots, trash items, and database files reside in `./data`. Regularly backup this directory.

---

## 📄 License

This project is open-sourced under the [MIT License](LICENSE).
