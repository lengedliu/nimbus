# Nimbus Vault Sync — セルフホスト型 Obsidian 同期 + Web 管理 + MCP + オープン REST API サーバー

[简体中文](README.md) / [English](README_en.md) / [日本語](README_ja.md) / [한국어](README_ko.md) / [繁體中文](README_zh-TW.md)

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.19-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com)
[![WebSocket](https://img.shields.io/badge/WebSocket-Realtime-010101?style=flat&logo=socketdotio&logoColor=white)](https://github.com/websockets/ws)
[![MCP](https://img.shields.io/badge/MCP-18_Tools-8A2BE2?style=flat&logo=anthropic&logoColor=white)](https://modelcontextprotocol.io)
[![Obsidian](https://img.shields.io/badge/Obsidian-Plugin-7C3AED?style=flat&logo=obsidian&logoColor=white)](https://obsidian.md)
[![Database](https://img.shields.io/badge/Database-SQLite%20%7C%20MySQL%20%7C%20Postgres-4479A1?style=flat&logo=sqlite&logoColor=white)](#)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-MIT-F59E0B?style=flat&logo=opensourceinitiative&logoColor=white)](LICENSE)

**Nimbus Vault Sync** は、軽量でセルフホスト可能な Obsidian クラウド同期およびナレッジ管理のバックエンドサービスです：

- 📡 **ミリ秒単位の WebSocket リアルタイム同期** — 複数デバイス・複数 Vault 間の協調、競合防止のオプティミスティックロックおよびリアルタイム状態ブロードキャスト
- 🖥 **モダンな Web 管理コンソール** — 複数 Vault 切り替え、全文ファジー検索、オンライン Markdown 編集とプレビュー、デバイス管理、ごみ箱機能
- 🤖 **包括的な MCP (Model Context Protocol) 統合** — 18 種類の標準 MCP ツールを内蔵し、Cursor、Cherry Studio、Claude Desktop、Cline などの AI クライアントが直接ノートを読み書き・整理可能。変更は瞬時にモバイル・デスクトップへ同期
- 📖 **インタラクティブ REST API ドキュメント** — OpenAPI Spec 準拠。Web 画面から認証トークン・Vault ID 埋め込み済み cURL コマンドをワンクリックコピー
- 🔗 **スマートな外部リンク共有** — パスワード保護、有効期限、コピー禁止設定に対応した美しい Web 共有ページを生成
- 📱 **マルチデバイス管理** — 接続端末の OS 種別、IP アドレス、オンライン状態、専用トークン管理およびリモートアクセス遮断
- 🕘 **ノート履歴スナップショット** — 保存ごとの自動バックアップ、差分確認、ワンクリック復元
- 🗑 **安全なごみ箱機構** — 誤削除を防ぐ論理削除。個別復元および一括完全削除をサポート
- 🗄 **マルチデータベース対応** — JSON ファイル、SQLite、PostgreSQL、MySQL にネイティブ対応し、スムーズな移行が可能
- 🐳 **ワンクリック Docker デプロイ** — 本番対応の `Dockerfile` および `docker-compose.yml`、永続化データボリュームマウント完備

Obsidian 向け連携プラグインはリポジトリ内の [`obsidian-plugin`](./obsidian-plugin) ディレクトリに収録されています。

---

## 📁 ディレクトリ構成

```
nimbus-vault-sync/
├── server.js                # エントリーポイント：REST API + WebSocket Hub + MCP エンドポイント + 静的配信
├── obsidian-plugin/         # Obsidian 双方向同期プラグイン (.obsidian/plugins/nimbus-sync に配置可能)
│   ├── manifest.json
│   ├── main.js
│   ├── styles.css
│   └── README.md
├── src/
│   ├── config.js            # 環境変数およびシステム設定
│   ├── db.js                # マルチデータベースエンジン管理（JSON / SQLite / PostgreSQL / MySQL）
│   ├── users.js             # ユーザー管理・権限チェック（管理者 / 一般ユーザー）
│   ├── vaults.js            # Vault ストレージとアクセス検証
│   ├── auth.js              # JWT 認証および requireAuth / requireAdmin ミドルウェア
│   ├── storage.js           # ノートの読み書き、履歴スナップショット、ごみ箱、競合解決
│   ├── mcpServer.js         # 18 種の MCP 標準ツール実装および StreamableHTTP ハンドラー
│   ├── wsHub.js             # WebSocket リアルタイム配信ハブ
│   └── routes/
│       ├── authRoutes.js    # ログイン、アカウント登録、システムステータス
│       ├── vaultRoutes.js   # Vault 一覧、作成、削除、マニフェスト
│       ├── fileRoutes.js    # ファイルの増分読み書き、削除
│       ├── vaultExtrasRoutes.js # 履歴、ごみ箱、競合、バックアップ、共有メンバー、監査ログ
│       ├── shareRoutes.js   # 共有リンク作成およびパブリック閲覧
│       ├── deviceRoutes.js  # 接続デバイス一覧・専用トークン管理
│       ├── settingsRoutes.js# 同期設定、パスワード変更、DB 切り替え
│       ├── adminRoutes.js   # 管理者専用：全 Vault・全ユーザー管理
│       ├── mcpRoutes.js     # MCP StreamableHTTP エンドポイントおよび /tools イントロスペクション
│       └── docsRoutes.js    # REST API ドキュメントおよび OpenAPI 仕様
├── public/                  # Web 管理画面（純粋な HTML/CSS/JS、ビルド不要）
│   ├── index.html           # メイン管理ダッシュボード
│   ├── share.html           # 共有ノート閲覧ページ
│   ├── style.css            # モダンテーマスタイル
│   └── app.js               # フロントエンド制御ロジック
└── data/                    # 永続化データ：ノート本体、履歴、ごみ箱、バックアップ ZIP
```

---

## 🚀 クイックスタート

```bash
cd nimbus-vault-sync
npm install
cp .env.example .env       # PORT や JWT_SECRET を必要に応じて変更
npm start
```

ブラウザで **`http://localhost:8787/admin`** にアクセスすると Web 管理画面が開きます。

初回起動時にユーザーが存在しない場合、以下のいずれかで初期管理者を作成します：
1. ブラウザで管理画面を開き、初期管理者設定ウィザードから登録。
2. `POST /api/auth/register` API を呼び出して登録（ユーザーが存在しない場合のみ利用可能）。

---

## 🐳 Docker デプロイ

```bash
cd nimbus-vault-sync
cp .env.example .env    # JWT_SECRET をランダムで強固な文字列に設定
docker compose up -d --build
```

- データはホスト側の `./data` ディレクトリに永続化（ボリュームマウント）されます。このディレクトリをバックアップするだけで全ノートと設定を保護できます。
- Web 管理コンソール：`http://localhost:8787/admin`
- WebSocket 同期エンドポイント：`ws://localhost:8787/ws`
- MCP サービスエンドポイント：`http://localhost:8787/api/mcp`
- 単体 Dockerfile での起動：
  ```bash
  docker build -t nimbus-vault-sync .
  docker run -d -p 8787:8787 \
    -e JWT_SECRET=your_jwt_secret_string \
    -v $(pwd)/data:/app/data \
    --name nimbus-vault-sync nimbus-vault-sync
  ```

---

## 🤖 Model Context Protocol (MCP) AI クライアント連携

Nimbus は **StreamableHTTP** プロトコルにネイティブ対応しています。AI クライアント（Cursor、Cherry Studio、Claude Desktop、Cline など）はローカルのサブプロセスを起動することなく、標準の HTTP POST で直接接続できます。

### 1. クライアント設定 (`mcp.json`)

Web 管理画面の左メニュー **「🤖 AI / MCP 連携設定」** から Vault を選択して以下の設定をコピーできます：

```json
{
  "mcpServers": {
    "nimbus-fast-note-sync": {
      "url": "http://<サーバーのアドレス>/api/mcp",
      "type": "http",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer <JWTトークン>",
        "X-Default-Vault-Name": "マイナレッジベース"
      }
    }
  }
}
```

### 2. 内蔵 18 種の MCP 標準ツール一覧

| カテゴリ | ツール名 | パラメータおよび概要 | 主な利用シーン |
| :--- | :--- | :--- | :--- |
| **Vault 管理と統計** | `list_vaults` | 利用可能な全 Vault と権限一覧を取得 | Vault 概要確認 |
| | `get_vault_stats` | `vaultId?`: Markdown/HTML/添付ファイル統計、上位 20 タグ、最近の更新 | ナレッジベースの健全性確認 |
| **ノート検索とメタ情報** | `list_notes` | `folder?`, `extension?`, `sortBy?`, `sortOrder?`, `limit?`, `includeMetadata?` | フォルダ・日時・拡張子での一覧取得 |
| | `get_note_metadata`| `path`, `vaultId?`: 文字数、YAML Frontmatter、相互リンク `[[Link]]`、`#タグ`、見出し階層を抽出 | ノート構造の深層分析 |
| **読み込みと書き込み** | `read_note` | `path`, `vaultId?`: ノート全文の取得 | 記事内容の参照 |
| | `write_note` | `path`, `content`, `baseHash?`, `vaultId?`: ノート作成または上書き（履歴保存と端末通知を自動実行） | AI によるノート新規作成・再構成 |
| | `append_note` | `path`, `content`, `heading?`, `withTimestamp?`: 末尾または指定見出し下に追記 | 会議メモ追記、クイックメモ |
| | `prepend_note` | `path`, `content`, `withTimestamp?`: 先頭に挿入（YAML Frontmatter を保護） | 要約の挿入、ピン留め |
| | `patch_note` | `path`, `search`, `replace`, `replaceAll?`: 部分的な検索・置換 | 全文転送不要なピンポイント修正 |
| **デイリーノート** | `get_daily_note` | `date?`, `folder?`, `createIfMissing?`: 当日のデイリーノートを取得・作成 | デイリーノートの確認 |
| | `append_daily_note`| `content`, `date?`, `folder?`, `heading?`, `withTimestamp?`: タイムスタンプ付きで追記 | アイデア・タスクログの蓄積 |
| **全文検索とタグ** | `search_notes` | `query`, `folder?`, `limit?`, `useRegex?`, `caseSensitive?`: 行番号付き全文検索 | ナレッジの高速特定 |
| | `list_tags` | `folder?`, `vaultId?`: 全タグおよび階層タグの頻度を集計 | タグ体系の整理 |
| **整理と管理** | `move_note` | `oldPath`, `newPath`, `overwrite?`: ノートの移動・リネーム | ディレクトリ整理 |
| | `delete_note` | `path`, `vaultId?`: 安全削除（ごみ箱へ移動）と端末通知 | ノートのクリーンアップ |
| **履歴スナップショット** | `get_note_history` | `path`, `vaultId?`: ノートの全履歴スナップショットを取得 | 変更履歴の監査 |
| | `read_history_version`| `versionId`, `vaultId?`: 指定バージョンの生データを取得 | 差分比較と復元 |
| **共有** | `create_share_link`| `path`, `title?`, `password?`, `expiresDays?`, `allowCopy?`: 公開 Web リンクを発行 | AI によるワンクリック記事公開 |

---

## 📖 REST API 概要

Web 管理画面の左メニュー **「📖 REST API ドキュメント」** を開くと、現在のトークンと Vault ID が自動入力されたインタラクティブな cURL コマンドを確認できます。`GET /api/docs/spec` から OpenAPI 仕様も取得可能です。

### 主要エンドポイント一覧

| 分類 | メソッド | パス | 説明 |
| :--- | :--- | :--- | :--- |
| **認証** | `POST` | `/api/auth/login` | ログインして JWT トークンを取得 |
| | `GET` | `/api/health` | サービスの健全性チェック |
| **Vault** | `GET` | `/api/vaults` | 利用可能な Vault 一覧と権限を取得 |
| | `POST` | `/api/vaults` | 新規 Vault の作成 |
| | `GET` | `/api/vaults/:vaultId/manifest` | 全ファイル一覧および SHA-256 ハッシュ |
| | `GET` | `/api/vaults/search?q=キーワード` | 全 Vault 横断のファイル名・本文検索 |
| **ファイル** | `GET` | `/api/vaults/:vaultId/files/*` | ノートまたは添付ファイルの取得 |
| | `PUT` | `/api/vaults/:vaultId/files/*` | ファイル書き込み（`X-Base-Hash` 競合防止とリアルタイム配信対応） |
| | `DELETE`| `/api/vaults/:vaultId/files/*` | ファイル削除（ごみ箱へ論理削除） |
| **履歴** | `GET` | `/api/vaults/:vaultId/history?path=...` | 履歴バージョン一覧の取得 |
| | `POST` | `/api/vaults/:vaultId/history/:versionId/restore` | 履歴バージョンの復元 |
| **ごみ箱** | `GET` | `/api/vaults/:vaultId/trash` | ごみ箱内ファイル一覧の取得 |
| | `POST` | `/api/vaults/:vaultId/trash/:trashId/restore` | ごみ箱からのファイル復元 |
| **バックアップ・競合** | `POST` | `/api/vaults/:vaultId/backups` | 全 Vault の ZIP スナップショット作成 |
| | `GET` | `/api/vaults/:vaultId/export` | 全 Vault の ZIP ダウンロード |
| | `POST` | `/api/vaults/:vaultId/conflicts/resolve` | 競合解決ポリシーの適用 |
| **共有** | `POST` | `/api/vaults/:vaultId/shares` | 公開共有リンクの作成 |
| | `GET` | `/api/public/shares/:shareId` | 閲覧用公開ノート本文の取得 |
| **MCP** | `GET` | `/api/mcp/tools` | 18 種の MCP ツール仕様およびパラメータ一覧 |
| | `POST` | `/api/mcp` | AI クライアントからの JSON-RPC リクエスト処理 |

---

## 📡 WebSocket 同期プロトコル

- **エンドポイント**: `ws://<host>/ws?token=<jwt>&vaultId=<vaultId>`
- **双方向配信**:
  - 接続直後に `init` メッセージで全マニフェストの差分比較を実施。
  - 変更や削除が発生した際、同一 Vault に接続中の端末へ `change` / `deleted` をブロードキャスト。
  - `baseHash` による競合検知を行い、衝突時は `.conflict` コピーファイルを自動生成。

---

## 📊 fast-note-sync-service (FNS) との比較

| 機能・特徴 | Nimbus Vault Sync | FNS (haierkeys) |
|---|---|---|
| **リアルタイム同期 (WebSocket)** | ✅ ミリ秒単位の双方向ブロードキャスト | ✅ |
| **Web 管理コンソール** | ✅ モダンな SPA（オンライン編集・検索・デバイス管理） | ✅ |
| **MCP ツール数と機能深度** | ✅ **18 種の標準ツール** (デイリー、共有、メタ情報、履歴) | ✅ 基本ツール |
| **インタラクティブ REST API ドキュメント** | ✅ **内蔵ドキュメント＆ワンクリック cURL** (`/api/docs/spec`) | ❌ |
| **ノート履歴とロールバック** | ✅ 自動保存＆ワンクリック復元 | ✅ |
| **安全なごみ箱機構** | ✅ 論理削除、個別復元、完全削除 | ✅ |
| **公開共有リンク** | ✅ パスワード保護・有効期限・美しい閲覧画面 | ✅ |
| **接続デバイス管理・監査** | ✅ オンライン状態・OS 種別・リモート切断 | ✅ |
| **マルチデータベース** | ✅ JSON / SQLite / MySQL / PostgreSQL のスムーズな切り替え | ✅ SQLite / MySQL / PostgreSQL |
| **軽量・カスタマイズ性** | ✅ ピュア Node.js、ビルド不要、高い拡張性 | Go 言語製 |

---

## 🔒 セキュリティと運用上の推奨事項

1. **強固な JWT Secret**: `.env` の `JWT_SECRET` には十分な長さのランダムな文字列を設定してください。
2. **リバースプロキシと HTTPS**: 本番環境では Nginx、Caddy、Cloudflare などの背面で稼働させ、HTTPS/WSS を有効化してください。
3. **データバックアップ**: ノートおよびシステムデータはすべて `./data` ディレクトリに保存されます。このディレクトリを定期的にバックアップするか、管理画面の「バックアップ作成」をご利用ください。

---

## 💖 Sponsorship & Support / スポンサー・ご支援

- If you find this project useful and would like it to continue development, please support us in the following ways. Thank you for supporting open-source software!
- 本プロジェクトがお役に立ち、今後の継続的な開発・メンテナンスをご支援いただける場合は、ぜひ以下の方法でサポートをお願いいたします：

| Ko-fi *Non-China Region* | | WeChat Pay *China Region* |
| :---: | :---: | :---: |
| <a href="https://ko-fi.com/lengedliu" target="_blank"><img src="https://storage.ko-fi.com/cdn/kofi2.png?v=3" width="220" alt="Support me on Ko-fi" /></a> | or | <img src="./public/wechat-reward.jpg" width="190" alt="WeChat Pay 微信打赏" /> |

---
