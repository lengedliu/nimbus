# Nimbus Vault Sync — 自託管全能 Obsidian 雲端同步與知識管理平台

[简体中文](README.md) | [English](README_en.md) | [繁體中文](README_zh-TW.md) | [日本語](README_ja.md) | [한국어](README_ko.md)

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](package.json)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![WebSocket](https://img.shields.io/badge/WebSocket-Realtime-010101?style=flat&logo=socketdotio&logoColor=white)](https://github.com/websockets/ws)
[![MCP](https://img.shields.io/badge/MCP-22_Tools-8A2BE2?style=flat&logo=anthropic&logoColor=white)](https://modelcontextprotocol.io)
[![Git Sync](https://img.shields.io/badge/Git-Auto_Backup-F05032?style=flat&logo=git&logoColor=white)](#-git-自動備份與遠端同步)
[![Obsidian](https://img.shields.io/badge/Obsidian-Plugin-7C3AED?style=flat&logo=obsidian&logoColor=white)](https://obsidian.md)
[![Database](https://img.shields.io/badge/Database-JSON%20%7C%20SQLite%20%7C%20Postgres%20%7C%20MySQL-4479A1?style=flat&logo=sqlite&logoColor=white)](#-多資料庫引擎與線上無縫遷移)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com)
[![i18n](https://img.shields.io/badge/i18n-5_Languages-00C49F?style=flat)](#-原生多語言支援-i18n)
[![License](https://img.shields.io/badge/License-MIT-F59E0B?style=flat&logo=opensourceinitiative&logoColor=white)](LICENSE)

**Nimbus Vault Sync** 是一款輕量級、高安全性、全功能的私有化自託管 Obsidian 知識庫雲端同步與協作管理中樞。它不僅支援桌面端與行動端（iOS / Android / Mac / Windows / Linux）毫秒級雙向即時同步，更深度整合了 **22 項標準 Model Context Protocol (MCP) AI 工具**、**原生 Git 自動備份**、**D3 雙鏈知識圖譜**、**互動式任務看板**、**三方視覺化衝突解決**及**安全外鏈分享**。

---

## 🌟 核心特色與架構優勢

- ⚡ **WebSocket 毫秒級極速即時同步**
  - 多裝置、多筆記庫雙向即時廣播，即時傳遞檔案增量變更。
  - 內建 SHA-256 樂觀並行鎖機制，告別多端並發覆蓋。
- 🤖 **全面賦能的 22 項 MCP (Model Context Protocol) AI 核心工具**
  - 原生支援 **StreamableHTTP** 協定，支援 **Cursor、Cherry Studio、Claude Desktop、Cline、Roo Code、VSCode** 等 AI 用戶端直連。
  - AI 可直接執行全文語意檢索、筆記讀取、追加與局部 Patch、日記沉澱、雙鏈與標籤分析、附件上傳、歷史版本溯源及 Git 遠端同步。
- 🌿 **原生 Git 自動備份與遠端同步**
  - 支援將筆記庫直接與 GitHub、GitLab、Gitee 或自建 Git 倉庫關聯。
  - 檔案修改後自動防抖（Debounce）提交（Commit）與推送（Push），支援自訂提交訊息範本與分支管理。
- 📊 **互動式看板與待辦任務智慧掃描**
  - 每庫獨立視覺化看板，支援自訂任務泳道與拖曳排序。
  - 全庫秒級掃描 Markdown 任務語法（`- [ ]` / `- [x]`），在 Web 端一鍵勾選完成並直達源文件。
- 🕸️ **D3 互動式雙向連結知識圖譜**
  - 基於 D3.js 2D 力導向網絡圖，動態呈現文件引用網狀脈絡、孤立筆記、中心度權重與標籤聚類。
- 🔀 **視覺化三方差異比對與衝突解決**
  - 當離線編輯產生衝突時自動保留 `.conflict` 複本，絕不遺失資料。
  - Web 控制台提供行級 3-Way 差異比對、合併編輯器與一鍵採納策略。
- 👥 **細粒度 RBAC 權限與多成員協作**
  - 支援所有者（Owner）、讀寫編輯（Editor）、唯讀瀏覽（Viewer）權限隔離。
  - 支援按使用者與裝置生成獨立 API 權杖（Token），支援裝置線上感知與一鍵強制剔除。
- 📢 **全功能 Webhook 即時告警通知**
  - 支援 **Discord、Slack、飛書 (Feishu)、釘釘 (DingTalk)、企業微信 (WeCom)** 及自訂 Webhook。
  - 涵蓋檔案刪除、衝突產生、版本復原、備份建立與裝置登入等多類維運事件。
- 🔗 **安全外鏈公開分享**
  - 一鍵將 Markdown 筆記發布為獨立 Web 閱讀頁，支援存取密碼、到期時間與禁止複製保護。
- 🕘 **全版本歷史快照與安全資源回收筒**
  - 每次儲存自動歸檔歷史快照，支援時間軸溯源與一鍵還原。
  - 誤刪檔案自動進入資源回收筒軟刪除，支援單檔案復原與保留週期自動輪替。
- 🗄️ **多資料庫引擎與線上無縫遷移**
  - 開箱即用純 JSON 檔案儲存（零配置依賴），同時原生支援 **SQLite、PostgreSQL 與 MySQL**。
  - 支援在 Web 控制台一鍵將歷史資料無損線上遷移至目標資料庫。
- 🌍 **原生多語言支援 (i18n)**
  - 完美適配 **繁體中文、简体中文、English、日本語、한국어** 5 種語言，即時切換無縫持久化。
- 📖 **互動式 REST API 開發者文件**
  - 內建 OpenAPI Spec 規範，Web 控制台自帶自動注入權杖的互動式偵錯終端與 cURL 快速生成。

---

## 📁 目錄結構

```
nimbus-vault-sync/
├── server.js                # 入口服務：REST API + WebSocket Hub + MCP 協定端點 + 靜態託管
├── obsidian-plugin/         # 配套 Obsidian 官方規範雙向同步插件
│   ├── manifest.json
│   ├── main.js
│   ├── styles.css
│   └── README.md
├── src/
│   ├── config.js            # 集中配置中心（從 package.json / 環境變數統一讀取版本與參數）
│   ├── db.js                # 多資料庫引擎（JSON / SQLite / PostgreSQL / MySQL）與線上遷移
│   ├── mcp.js               # 22 個 MCP 標準工具集實現與 StreamableHTTP 處理器
│   ├── wsHub.js             # WebSocket 即時多端同步廣播中心
│   ├── storage.js           # 檔案讀寫、歷史快照、資源回收筒軟刪除、衝突管理
│   ├── gitSync.js           # 原生 Git 自動提交流水線與遠端倉庫協同
│   ├── webhooks.js          # 多平台 Webhook 告警與通知排程器
│   ├── users.js             # 使用者帳戶體系與 RBAC 權限
│   ├── vaults.js            # 筆記庫元資料儲存與存取校驗
│   ├── vaultMembers.js      # 多使用者協作成員與權限矩陣
│   ├── devices.js           # 接入裝置鑑權與線上狀態感知
│   ├── shares.js            # 外鏈加密分享與存取控制
│   ├── syncRules.js         # 同步過濾規則（忽略模式與副檔名）
│   ├── health.js            # 磁碟、記憶體與資料庫即時健康探針
│   └── routes/              # 模組化 RESTful 路由
├── public/                  # 現代化響應式 Web 控制台（極速純原生，無需打包建置）
│   ├── index.html           # 主控制台單頁應用
│   ├── share.html           # 優雅外鏈閱讀頁
│   ├── style.css            # 響應式自適應主題系統
│   ├── app.js               # 前端狀態機與核心互動
│   └── i18n.js              # 5 國語言國際化字典
└── data/                    # 執行時期持久化資料卷（筆記庫、配置、快照、資源回收筒、備份）
```

---

## 🚀 快速開始

### 方式一：Node.js / Bun 本地執行

```bash
# 1. 複製程式碼倉庫
git clone https://github.com/your-org/nimbus-vault-sync.git
cd nimbus-vault-sync

# 2. 安裝依賴
npm install

# 3. 配置環境變數
cp .env.example .env
# 可按需修改 PORT、JWT_SECRET 等參數

# 4. 啟動服務
npm start
```

服務啟動後，在瀏覽器存取 **`http://localhost:3000`** 即可進入 Web 管理控制台。  
首次啟動若無使用者，系統將引導建立全域初始管理員（Admin）帳號。

---

### 方式二：Docker & Docker Compose 一鍵部署

#### 使用 Docker Compose（推薦）

```bash
# 複製設定檔
cp .env.example .env

# 後台建置並啟動服務
docker compose up -d --build
```

#### 使用原生 Docker 執行

```bash
docker build -t nimbus-vault-sync .
docker run -d -p 3000:3000 \
  -e JWT_SECRET=your_super_strong_random_secret \
  -v $(pwd)/data:/app/data \
  --name nimbus-vault-sync nimbus-vault-sync
```

- **Web 控制台**：`http://localhost:3000`
- **WebSocket 即時端點**：`ws://localhost:3000/ws`
- **MCP AI 介面端點**：`http://localhost:3000/api/mcp`
- **健康檢查探針**：`http://localhost:3000/api/health`

---

## 🔌 配套 Obsidian 插件安裝與設定

1. 開啟你的 Obsidian 筆記庫，進入 **「設定」->「社群外掛程式」**，關閉安全模式。
2. 將本倉庫中的 [`obsidian-plugin`](./obsidian-plugin) 資料夾複製至你的筆記庫目錄：
   `.obsidian/plugins/nimbus-sync/`
3. 重新載入 Obsidian 外掛程式清單，啟用 **Nimbus Sync**。
4. 登入 Nimbus Web 控制台，在 **「設定與權杖」** 面板生成專屬 API Token，或點選 **「一鍵複製外掛程式設定」**。
5. 在 Obsidian 外掛程式設定面板貼上設定，即可開啟極速雙向即時同步。

---

## 🤖 Model Context Protocol (MCP) AI 助手接入

Nimbus 原生內建 **StreamableHTTP** 協定的 MCP 介面，AI 用戶端無需在本地執行複雜的子程序，透過標準 HTTP POST 即可直接連接。

### 1. 用戶端設定檔 (`mcp.json`)

在 Web 控制台左側點選 **「🤖 AI / MCP」**，可快速選擇筆記庫並一鍵複製以下設定：

```json
{
  "mcpServers": {
    "nimbus-vault-sync": {
      "url": "http://<你的伺服器位址>:3000/api/mcp",
      "type": "http",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer <你的JWT權杖>",
        "X-Default-Vault-Name": "我的知識庫"
      }
    }
  }
}
```

### 2. 內建 22 項 MCP 標準工具清單

| 類別 | 工具名稱 | 參數及說明 | 典型應用場景 |
| :--- | :--- | :--- | :--- |
| **庫管理與體檢** | `list_vaults` | 取得目前使用者所有授權筆記庫及權限角色 | 多庫感知與切換 |
| | `get_vault_stats` | `vaultId?`：取得文件數、附件統計、Top 20 標籤與修改概況 | 知識庫全量體檢 |
| **檢索與元資料** | `list_notes` | `folder?`, `extension?`, `sortBy?`, `sortOrder?`, `limit?` | 結構化目錄檢索 |
| | `get_note_metadata` | `path`, `vaultId?`：擷取字數、Frontmatter、雙鏈 `[[Link]]`、標籤與大綱 | 筆記深度語意分析 |
| **讀寫與局部修改** | `read_note` | `path`, `vaultId?`：讀取筆記原始內容 | 閱讀全文 |
| | `write_note` | `path`, `content`, `baseHash?`, `vaultId?`：建立或覆蓋筆記，自動記錄版本快照並推送多端 | AI 新建/重構文件 |
| | `append_note` | `path`, `content`, `heading?`, `withTimestamp?`：在末尾或指定標題下追加 | 會議紀錄增補、隨手記 |
| | `prepend_note` | `path`, `content`, `withTimestamp?`：在頂部插入（保留 YAML 屬性） | 插入核心摘要或置頂 |
| | `patch_note` | `path`, `search`, `replace`, `replaceAll?`：局部精準比對取代 | 小範圍精準修改 |
| **附件管理** | `upload_attachment` | `path`, `sourceUrl?`, `base64Data?`, `vaultId?`：透過 URL 或 Base64 直傳圖片與附件 | 網頁圖片轉存至庫 |
| | `get_attachment_base64` | `path`, `vaultId?`：取得圖片/附件的 Base64 編碼與 MIME 類型 | 多模態 AI 圖片理解 |
| **日記流與隨手記** | `get_daily_note` | `date?`, `folder?`, `createIfMissing?`：取得或初始化當天日記 | 日記查詢 |
| | `append_daily_note` | `content`, `date?`, `folder?`, `heading?`, `withTimestamp?`：追加碎片思考 | 日常靈感沉澱 |
| **搜尋與標籤樹** | `search_notes` | `query`, `folder?`, `limit?`, `useRegex?`, `caseSensitive?`：帶上下文行號的全文檢索 | 快速定位知識點 |
| | `list_tags` | `folder?`, `vaultId?`：統計全庫 Obsidian 標籤與詞頻 | 標籤體系梳理 |
| **檔案組織與刪除** | `move_note` | `oldPath`, `newPath`, `overwrite?`：重新命名或移動筆記 | 知識庫歸檔重組 |
| | `delete_note` | `path`, `vaultId?`：安全刪除（移入資源回收筒軟刪除）並同步全端 | 筆記清理 |
| **版本快照與溯源** | `get_note_history` | `path`, `vaultId?`：查詢單篇筆記的所有歷史備份版本 | 變更歷史回溯 |
| | `read_history_version` | `versionId`, `vaultId?`：讀取指定歷史快照原始內容 | 版本比對與還原 |
| **外鏈分享** | `create_share_link` | `path`, `title?`, `password?`, `expiresDays?`, `allowCopy?`：生成加密閱讀外鏈 | 一鍵發布文章 |
| **Git 遠端同步** | `get_vault_git_status` | `vaultId?`：查看 Git 分支、未提交變更與遠端同步狀態 | Git 狀態監測 |
| | `git_sync_vault` | `vaultId?`, `commitMessage?`, `pullFirst?`：觸發 Git 自動提交並雙向同步遠端 | AI 自動觸發遠端推送 |

---

## 📊 方案對比

| 功能特性 | **Nimbus Vault Sync** | **Obsidian Official Sync** | **fast-note-sync-service (Go)** |
| :--- | :---: | :---: | :---: |
| **私有化自託管** | ✅ **完全自主可控** | ❌ 商業閉源雲端 | ✅ 自託管 |
| **MCP AI 原生深度整合** | ✅ **22 個全功能工具** | ❌ 無 | ⚠️ 基礎唯讀/簡易寫入 |
| **多語言介面支援** | ✅ **5 種語言原生支援** | ⚠️ 用戶端內建 | ❌ 單一語言 |
| **原生 Git 自動遠端備份** | ✅ **內建 GitHub/GitLab 同步** | ❌ 無 | ❌ 無 |
| **視覺化 D3 知識圖譜** | ✅ **Web 端互動式 2D 力導向圖** | ⚠️ 僅用戶端本地 | ❌ 無 |
| **任務看板與 Markdown 待辦掃描** | ✅ **內建互動式看板與全庫掃描** | ❌ 無 | ❌ 無 |
| **3-Way 視覺化差異比對與衝突解決** | ✅ **內建 Diff & Merge 編輯器** | ⚠️ 簡易版本選擇 | ⚠️ 僅衝突複本保留 |
| **多資料庫支援與平滑遷移** | ✅ **JSON / SQLite / PG / MySQL** | ❌ 專有格式 | ⚠️ SQLite / PG / MySQL |
| **外鏈公開分享** | ✅ **密碼 + 防複製 + 有效期** | ❌ 需另購 Obsidian Publish | ⚠️ 基礎分享 |
| **互動式 REST API 開發者文件** | ✅ **內建互動式控制台與規範** | ❌ 無公開 API | ❌ 無互動文件 |
| **多平台 Webhook 告警調度** | ✅ **Discord/Slack/飛書/釘釘/企微** | ❌ 無 | ❌ 無 |

---

## 🔒 生產環境安全與維運建議

1. **強隨機金鑰**：生產部署時務必修改 `.env` 中的 `JWT_SECRET`，使用 `openssl rand -base64 32` 生成高強度金鑰。
2. **反向代理與 HTTPS/WSS**：建議透過 Nginx / Caddy / Cloudflare 等反向代理暴露服務，開啟 SSL/TLS 加密，並在啟用反向代理時設定 `TRUST_PROXY=1`。
3. **CORS 收緊**：在固定網域下部署時，建議設定 `CORS_ALLOWED_ORIGINS=https://your-domain.com` 收緊跨來源資源共用策略。
4. **定期資料備份**：Nimbus 所有筆記、快照、資源回收筒與系統設定均儲存在 `./data` 目錄中，定期備份該目錄即可完整保護資料資產。

---

## 📄 開源授權

本專案基於 [MIT License](LICENSE) 授權開源。
