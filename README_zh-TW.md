# Nimbus Vault Sync — 自託管 Obsidian 同步 + Web 管理後台 + MCP + 開放 REST API 服務

[简体中文](README.md) / [English](README_en.md) / [日本語](README_ja.md) / [한국어](README_ko.md) / [繁體中文](README_zh-TW.md)

**Nimbus Vault Sync**（前身 FNS / Fast Note Sync）是一個輕量級、自託管、全功能的 Obsidian 雲端同步與知識管理服務端：

- 📡 **WebSocket 毫秒級即時同步** — 多裝置 / 多 Vault 協同，具備版本防衝突樂觀鎖與即時狀態廣播
- 🖥 **現代化 Web 管理後台** — 支援多筆記庫切換、全文模糊檢索、線上 Markdown 編輯預覽、裝置管理與垃圾桶
- 🤖 **全面擴充的 MCP (Model Context Protocol)** — 內建 18 項標準 MCP 工具，讓 Cursor、Cherry Studio、Claude Desktop、Cline 等 AI 用戶端直接讀寫與整理筆記，變更毫秒級同步至手機與桌面用戶端
- 📖 **互動式 REST API 開發者文件** — 內建完整 OpenAPI Spec 規範，Web 端一鍵複製已注入 Token 與 Vault ID 的 cURL 請求
- 🔗 **優雅的筆記外鏈分享** — 為筆記一鍵生成 Web 閱讀外鏈，支援存取密碼、有效期天數與防複製保護
- 📱 **多裝置管理與審計** — 監控用戶端系統類型、IP 位址、線上狀態、專用授權權杖及遠端剔除
- 🕘 **筆記版本歷史快照** — 每次儲存自動歸檔歷史快照，隨時查看差異、一鍵回滾還原
- 🗑 **安全垃圾桶機制** — 所有刪除操作自動移入垃圾桶軟刪除，防止誤刪，支援單檔案還原或一鍵清空
- 🗄 **多資料庫引擎支援** — 原生支援 JSON 檔案、SQLite、MySQL 及 PostgreSQL，支援無縫平滑遷移
- 🐳 **Docker 一鍵部署** — 自帶 `Dockerfile` / `docker-compose.yml`，持久化資料卷配置

配套的 Obsidian 插件已內建在倉庫的 [`obsidian-plugin`](./obsidian-plugin) 目錄中。

---

## 📁 目錄結構

```
nimbus-vault-sync/
├── server.js                # 入口：REST API + WebSocket Hub + MCP 協定端點 + 靜態資源
├── obsidian-plugin/         # 配套 Obsidian 雙向同步插件 (可複製至 .obsidian/plugins/nimbus-sync)
│   ├── manifest.json
│   ├── main.js
│   ├── styles.css
│   └── README.md
├── src/
│   ├── config.js            # 環境變數與系統配置
│   ├── db.js                # 多資料庫引擎管理（JSON / SQLite / PostgreSQL / MySQL）
│   ├── users.js             # 使用者體系（admin / user 角色及多庫授權）
│   ├── vaults.js            # 筆記庫資料儲存與權限校驗
│   ├── auth.js              # JWT 驗證與 requireAuth / requireAdmin 中間件
│   ├── storage.js           # 筆記檔案讀寫、歷史快照、垃圾桶、衝突管理
│   ├── mcpServer.js         # 18 個 MCP 標準工具實現與 StreamableHTTP 處理器
│   ├── wsHub.js             # WebSocket 即時多端同步廣播中心
│   └── routes/
│       ├── authRoutes.js    # 註冊、登入、系統狀態
│       ├── vaultRoutes.js   # 筆記庫列表、建立、刪除、Manifest
│       ├── fileRoutes.js    # 檔案增量讀寫、刪除
│       ├── vaultExtrasRoutes.js # 歷史版本、垃圾桶、衝突、快照備份、協作成員、審計日誌
│       ├── shareRoutes.js   # 外鏈分享建立與公開閱讀
│       ├── deviceRoutes.js  # 關聯裝置列表與管理
│       ├── settingsRoutes.js# 同步配置、密碼修改、資料庫引擎切換
│       ├── adminRoutes.js   # 超管專屬：全庫、全使用者管理
│       ├── mcpRoutes.js     # MCP StreamableHTTP 介面及 /tools 自省介面
│       └── docsRoutes.js    # REST API 文件與規範端點
├── public/                  # Web 管理後台（純原生 HTML/CSS/JS，無需建置打包）
│   ├── index.html           # 主管理控制台
│   ├── share.html           # 公開外鏈優雅閱讀頁
│   ├── style.css            # 現代化主題樣式系統
│   └── app.js               # 前端核心互動邏輯
└── data/                    # 執行階段持久化資料：筆記庫、歷史快照、垃圾桶、備份壓縮包
```

---

## 🚀 快速開始

```bash
cd nimbus-vault-sync
npm install
cp .env.example .env       # 按需修改 PORT / JWT_SECRET
npm start
```

打開瀏覽器造訪 **`http://localhost:8787/admin`** 即進入 Web 管理後台。

首次啟動沒有任何使用者時，建立管理員帳號有兩種方式：
1. 打開網頁管理後台，直接在介面上完成初始管理員帳號設定。
2. 或呼叫系統註冊介面 `POST /api/auth/register`（僅在無使用者時開放）。

---

## 🐳 Docker 一鍵部署

```bash
cd nimbus-vault-sync
cp .env.example .env    # 修改 JWT_SECRET 為強隨機字串
docker compose up -d --build
```

- 資料持久化在宿主機的 `./data` 目錄（掛載卷），備份此目錄即可完整保留所有筆記與配置。
- 管理後台：`http://localhost:8787/admin`
- WebSocket 同步端點：`ws://localhost:8787/ws`
- MCP 服務端點：`http://localhost:8787/api/mcp`
- 常用單獨 Dockerfile 運行：
  ```bash
  docker build -t nimbus-vault-sync .
  docker run -d -p 8787:8787 \
    -e JWT_SECRET=your_jwt_secret_string \
    -v $(pwd)/data:/app/data \
    --name nimbus-vault-sync nimbus-vault-sync
  ```

---

## 🤖 Model Context Protocol (MCP) AI 助手接入

Nimbus 原生內建了 **StreamableHTTP** 協定的 MCP 介面，AI 用戶端（Cursor、Cherry Studio、Claude Desktop、Cline 等）無需在本地啟動子程序，透過標準 HTTP POST 即可直接連線。

### 1. 用戶端接入配置 (`mcp.json`)

在 Web 後台點擊左側 **「🤖 AI / MCP 介面配置」**，可動態選擇筆記庫並複製以下配置：

```json
{
  "mcpServers": {
    "nimbus-fast-note-sync": {
      "url": "http://<你的伺服器位址>/api/mcp",
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

### 2. 內建 18 個 MCP 標準工具清單

| 類別 | 工具名稱 | 參數及說明 | 典型場景 |
| :--- | :--- | :--- | :--- |
| **庫管理與統計** | `list_vaults` | 取得當前使用者所有可用筆記庫及權限 | 筆記庫資訊概覽 |
| | `get_vault_stats` | `vaultId?`：取得 Markdown/HTML/附件統計、Top 20 熱門標籤及最近修改 | 知識庫現況體檢 |
| **筆記檢索與中繼資料** | `list_notes` | `folder?`, `extension?`, `sortBy?`, `sortOrder?`, `limit?`, `includeMetadata?` | 按時間/副檔名檢索檔案 |
| | `get_note_metadata`| `path`, `vaultId?`：擷取字數、YAML Frontmatter、雙鏈 `[[Link]]`、`#tag` 與大綱 | 筆記結構深層分析 |
| **讀取與寫入** | `read_note` | `path`, `vaultId?`：讀取筆記全文 | 閱讀文章內容 |
| | `write_note` | `path`, `content`, `baseHash?`, `vaultId?`：建立或覆蓋筆記，自動維護歷史並即時推播多端 | AI 新建/重構筆記 |
| | `append_note` | `path`, `content`, `heading?`, `withTimestamp?`：在文件末尾或指定標題下追加 | 會議紀錄增補、隨手記 |
| | `prepend_note` | `path`, `content`, `withTimestamp?`：在頂部插入（保留 YAML 屬性） | 插入核心摘要/置頂 |
| | `patch_note` | `path`, `search`, `replace`, `replaceAll?`：局部精準搜尋取代 | 局部微調，無需傳輸全篇 |
| **日記與日誌** | `get_daily_note` | `date?`, `folder?`, `createIfMissing?`：取得或初始化當天日記 | 日記查詢 |
| | `append_daily_note`| `content`, `date?`, `folder?`, `heading?`, `withTimestamp?`：追加日記（帶時間戳記） | 碎片思考/待辦流沉澱 |
| **全文搜尋與標籤** | `search_notes` | `query`, `folder?`, `limit?`, `useRegex?`, `caseSensitive?`：帶上下文行號的全文檢索 | 快速定位知識點 |
| | `list_tags` | `folder?`, `vaultId?`：聚合所有 Obsidian 標籤與巢狀標籤詞頻 | 標籤樹梳理 |
| **組織與管理** | `move_note` | `oldPath`, `newPath`, `overwrite?`：重新命名或移動筆記 | 目錄整理歸檔 |
| | `delete_note` | `path`, `vaultId?`：安全刪除（移入垃圾桶保護）並廣播至用戶端 | 筆記清理 |
| **版本歷史** | `get_note_history` | `path`, `vaultId?`：查詢單篇筆記的所有歷史備份版本 | 溯源變更記錄 |
| | `read_history_version`| `versionId`, `vaultId?`：讀取特定歷史快照原始內容 | 版本比對與復原 |
| **外鏈分享** | `create_share_link`| `path`, `title?`, `password?`, `expiresDays?`, `allowCopy?`：生成公開網頁外鏈 | AI 一鍵發布文章 |

---

## 📖 REST API 概覽與介面說明

在 Web 管理後台左側點擊 **「📖 REST API 開發者文件」**，可直接檢視已注入當前 Token 與 Vault ID 的互動式 cURL 命令。系統同時提供 `GET /api/docs/spec` 介面規範定義。

### 常用核心端點速查

| 分類 | 方法 | 路徑 | 說明 |
| :--- | :--- | :--- | :--- |
| **認證** | `POST` | `/api/auth/login` | 登入，取得 JWT 權杖 |
| | `GET` | `/api/health` | 服務健康檢查 |
| **筆記庫** | `GET` | `/api/vaults` | 取得當前使用者所有筆記庫及權限 |
| | `POST` | `/api/vaults` | 建立新筆記庫 |
| | `GET` | `/api/vaults/:vaultId/manifest` | 全量檔案清單與 SHA-256 雜湊 |
| | `GET` | `/api/vaults/search?q=關鍵字` | 跨庫檔案名稱與內文檢索 |
| **檔案讀寫** | `GET` | `/api/vaults/:vaultId/files/*` | 讀取筆記或附件內容 |
| | `PUT` | `/api/vaults/:vaultId/files/*` | 寫入檔案（支援 `X-Base-Hash` 樂觀鎖防衝突並即時廣播） |
| | `DELETE`| `/api/vaults/:vaultId/files/*` | 刪除檔案（軟刪除至垃圾桶） |
| **歷史快照** | `GET` | `/api/vaults/:vaultId/history?path=...` | 檢視歷史版本列表 |
| | `POST` | `/api/vaults/:vaultId/history/:versionId/restore` | 回滾還原歷史版本 |
| **垃圾桶** | `GET` | `/api/vaults/:vaultId/trash` | 取得垃圾桶檔案列表 |
| | `POST` | `/api/vaults/:vaultId/trash/:trashId/restore` | 從垃圾桶還原檔案 |
| **備份與衝突** | `POST` | `/api/vaults/:vaultId/backups` | 建立全庫快照備份 |
| | `GET` | `/api/vaults/:vaultId/export` | 打包下載整庫 ZIP |
| | `POST` | `/api/vaults/:vaultId/conflicts/resolve` | 提交衝突解決策略 |
| **外鏈分享** | `POST` | `/api/vaults/:vaultId/shares` | 建立公開分享外鏈 |
| | `GET` | `/api/public/shares/:shareId` | 讀者端取得公開文章內文 |
| **MCP** | `GET` | `/api/mcp/tools` | 自省 18 個 MCP 工具列表與參數規則 |
| | `POST` | `/api/mcp` | 接收 AI 用戶端的標準 JSON-RPC 請求 |

---

## 📡 WebSocket 即時同步協定

- **連線端點**：`ws://<host>/ws?token=<jwt>&vaultId=<vaultId>`
- **雙向廣播**：
  - 用戶端連線後立即下發 `init` 全量 manifest 比對。
  - 發生修改或刪除時向同庫線上裝置廣播 `change` / `deleted` 訊息。
  - 支援 `baseHash` 衝突檢測，避免多端離線後並發覆蓋，衝突時自動生成 `.conflict` 副本。

---

## 📊 與 fast-note-sync-service (FNS) 對比

| 功能特性 | Nimbus Vault Sync | FNS (haierkeys) |
|---|---|---|
| **即時同步 (WebSocket)** | ✅ 毫秒級雙向廣播 | ✅ |
| **Web 管理後台** | ✅ 現代化單頁應用 (含線上編輯/搜尋) | ✅ |
| **MCP 工具數量與深度** | ✅ **18 個標準工具** (含日記、外鏈、中繼資料、快照) | ✅ 基礎工具集 |
| **REST API 互動文件** | ✅ **內建互動式文件與一鍵 cURL** (`/api/docs/spec`) | ❌ |
| **筆記版本歷史與復原** | ✅ 自動歸檔、支援隨時回滾 | ✅ |
| **垃圾桶安全機制** | ✅ 軟刪除、支援單檔案恢復與清空 | ✅ |
| **公開外鏈分享** | ✅ 帶密碼保護、有效期與優雅閱讀頁 | ✅ |
| **多裝置接入審計** | ✅ 線上狀態/系統類型/遠端剔除 | ✅ |
| **多儲存/資料庫引擎** | ✅ JSON / SQLite / MySQL / PostgreSQL 平滑切換 | ✅ SQLite / MySQL / PostgreSQL |
| **輕量級與二次開發** | ✅ 純 Node.js，零複雜建置鏈，易維護易客製 | Go 語言建置 |

---

## 🔒 安全與維運建議

1. **強金鑰**：請務必將 `.env` 中的 `JWT_SECRET` 設定為隨機強字串。
2. **反向代理與 HTTPS**：生產環境中推薦在 Nginx、Caddy 或 Cloudflare 後面運行，啟用 HTTPS/WSS。
3. **資料備份**：所有筆記和系統資料儲存在 `./data` 目錄下，定期備份此目錄或透過 Web 後台「一鍵備份」即可完整保留資料。

---

## 💖 Sponsorship & Support / 贊助與支持

- If you find this project useful and would like it to continue development, please support us in the following ways. Thank you for supporting open-source software!
- 如果您覺得本專案對您有所幫助並希望它持續迭代與更新，歡迎透過以下方式贊助支援作者，感謝您對開源軟體的認可與鼓勵：

| Ko-fi *Non-China Region* | | WeChat Pay *China Region* |
| :---: | :---: | :---: |
| <a href="https://ko-fi.com/lengedliu" target="_blank"><img src="https://storage.ko-fi.com/cdn/kofi2.png?v=3" width="220" alt="Support me on Ko-fi" /></a> | or | <img src="./public/wechat-reward.jpg" width="190" alt="WeChat Pay 微信打賞" /> |

---
