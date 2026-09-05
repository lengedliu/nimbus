# Nimbus Vault Sync — セルフホスト対応 Obsidian クラウド同期 & ナレッジ管理プラットフォーム

[简体中文](README.md) | [English](README_en.md) | [繁體中文](README_zh-TW.md) | [日本語](README_ja.md) | [한국어](README_ko.md)

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](package.json)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![WebSocket](https://img.shields.io/badge/WebSocket-Realtime-010101?style=flat&logo=socketdotio&logoColor=white)](https://github.com/websockets/ws)
[![MCP](https://img.shields.io/badge/MCP-22_Tools-8A2BE2?style=flat&logo=anthropic&logoColor=white)](https://modelcontextprotocol.io)
[![Git Sync](https://img.shields.io/badge/Git-Auto_Backup-F05032?style=flat&logo=git&logoColor=white)](#-git-自動バックアップ--リモート同期)
[![Obsidian](https://img.shields.io/badge/Obsidian-Plugin-7C3AED?style=flat&logo=obsidian&logoColor=white)](https://obsidian.md)
[![Database](https://img.shields.io/badge/Database-JSON%20%7C%20SQLite%20%7C%20Postgres%20%7C%20MySQL-4479A1?style=flat&logo=sqlite&logoColor=white)](#-マルチデータベース--オンラインシームレス移行)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com)
[![i18n](https://img.shields.io/badge/i18n-5_Languages-00C49F?style=flat)](#-ネイティブ多言語対応-i18n)
[![License](https://img.shields.io/badge/License-MIT-F59E0B?style=flat&logo=opensourceinitiative&logoColor=white)](LICENSE)

**Nimbus Vault Sync** は、軽量・高セキュリティ・多機能なセルフホスト型 Obsidian ノート同期＆ナレッジ管理プラットフォームです。iOS、Android、macOS、Windows、Linux、Web 間でのミリ秒単位の双方向リアルタイム同期に加え、**22 種類の標準 Model Context Protocol (MCP) AI ツール**、**ネイティブ Git 自動バックアップ**、**D3 双方向リンクナレッジグラフ**、**インタラクティブカンバンボード**、**3-Way 競合解決エディタ**、**セキュアなノート共有機能**を統合しています。

---

## 🌟 主な機能と特徴

- ⚡ **WebSocket によるミリ秒単位のリアルタイム同期**
  - 複数端末・複数 Vault 間の双方向ブロードキャスト。差分変更を即時反映。
  - SHA-256 楽観的ロック制御により、オフライン復帰時の並行上書きを完全に防止。
- 🤖 **22 種類の標準 MCP (Model Context Protocol) AI ツールを標準搭載**
  - **StreamableHTTP** プロトコルにネイティブ対応し、**Cursor、Cherry Studio、Claude Desktop、Cline、Roo Code、VSCode** などの AI クライアントから直接接続可能。
  - AI による全文検索、ノートの読み書き・パッチ修正、デイリーログ記録、双方向リンク・タグ解析、添付ファイル管理、履歴ロールバック、Git リモート同期をサポート。
- 🌿 **Git 自動バックアップ & リモート同期**
  - GitHub、GitLab、Gitee、プライベート Git リポジトリと Vault を直接連携。
  - 変更検知時の自動デバウンス（Debounce）コミット＆プッシュ、カスタムコミットメッセージテンプレート対応。
- 📊 **カンバンボード & Markdown タスク自動スキャン**
  - Vault ごとに独立したカンバンボード。ドラッグ＆ドロップでタスクを直感管理。
  - Markdown のタスク構文（`- [ ]` / `- [x]`）を全自動スキャンし、Web 上からワンクリック完了＆元ノートジャンプ。
- 🕸️ **D3 インタラクティブ双方向リンクナレッジグラフ**
  - D3.js による 2D 力学モデルネットワークグラフ。ノート間のリンク関係、孤立ノート、タグクラスタを可視化。
- 🔀 **視覚的 3-Way 差分比較 & 競合解決**
  - オフライン編集による競合発生時も `.conflict` バックアップを自動保持し、データ消失ゼロを保証。
  - Web 管理画面にて行単位の 3-Way 差分比較、マージエディタ、ワンクリック解決を完備。
- 👥 **きめ細やかな RBAC 権限 & 共同編集**
  - 所有者（Owner）、編集（Editor）、閲覧専用（Viewer）のロール制御。
  - 端末・ユーザーごとの独立 API トークン発行、リアルタイム接続状況の把握とリモート切断に対応。
- 📢 **マルチプラットフォーム Webhook 通知**
  - **Discord、Slack、Feishu / Lark、DingTalk、WeCom**、カスタム Webhook に標準対応。
  - ファイル削除、競合発生、バージョン復元、バックアップ作成、端末ログインなどのイベントを即時通知。
- 🔗 **パスワード保護付きノート公開共有**
  - Markdown ノートを独立した Web 閲覧ページとして公開。パスワード保護、有効期限、テキストコピー防止を設定可能。
- 🕘 **全バージョン履歴スナップショット & 安全なごみ箱**
  - 保存ごとの自動バックアップスナップショット。タイムライン比較とワンクリック復元。
  - 削除ノートはごみ箱に退避（ソフトデリート）。個別復元や保持期間ポリシーによる自動整理に対応。
- 🗄️ **マルチデータベース & オンラインシームレス移行**
  - ゼロ構成の JSON ファイルストレージに加え、**SQLite、PostgreSQL、MySQL** に完全対応。
  - Web 管理画面から既存データをターゲット DB へダウンタイムなしでワンクリック移行可能。
- 🌍 **ネイティブ多言語対応 (i18n)**
  - **日本語、English、简体中文、繁體中文、한국어** の 5 言語に対応。設定は即時反映・永続化。
- 📖 **インタラクティブ REST API 開発者ドキュメント**
  - OpenAPI 仕様に準拠。現在のトークンと Vault ID が自動挿入されたインタラクティブ cURL テスターを Web 内に搭載。

---

## 📁 ディレクトリ構成

```
nimbus-vault-sync/
├── server.js                # エントリポイント: REST API + WebSocket Hub + MCP エンドポイント + 静的配信
├── obsidian-plugin/         # 公式仕様準拠の Obsidian 双方向同期プラグイン
│   ├── manifest.json
│   ├── main.js
│   ├── styles.css
│   └── README.md
├── src/
│   ├── config.js            # 集中設定管理（package.json / 環境変数からバージョン・設定を一括取得）
│   ├── db.js                # データベースマネージャ（JSON / SQLite / PostgreSQL / MySQL）& 移行ロジック
│   ├── mcp.js               # 22 種類の標準 MCP ツール実装 & StreamableHTTP ハンドラ
│   ├── wsHub.js             # WebSocket リアルタイム同期ブロードキャストハブ
│   ├── storage.js           # ノート I/O、履歴スナップショット、ごみ箱、競合管理
│   ├── gitSync.js           # Git 自動コミット＆リモートリポジトリ同期パイプライン
│   ├── webhooks.js          # マルチプラットフォーム Webhook 通知スケジューラ
│   ├── users.js             # ユーザー認証 & RBAC ロール管理
│   ├── vaults.js            # Vault メタデータ管理 & アクセス検証
│   ├── vaultMembers.js      # 共同編集メンバー & 権限マトリクス
│   ├── devices.js           # 接続端末管理 & トークン無効化
│   ├── shares.js            # パスワード付き公開共有管理
│   ├── syncRules.js         # 同期フィルタングルール（無視パターン・拡張子）
│   ├── health.js            # ディスク・メモリ・DB のリアルタイム健全性プローブ
│   └── routes/              # モジュール化 RESTful ルーティング
├── public/                  # モダンレスポンシブ Web ダッシュボード（ビルド不要・高速ネイティブ）
│   ├── index.html           # メイン SPA 管理コンソール
│   ├── share.html           # 公開ノートリーダーページ
│   ├── style.css            # レスポンシブテーマシステム
│   ├── app.js               # フロントエンドステートマシン & UI インタラクション
│   └── i18n.js              # 5 言語対応国際化辞書
└── data/                    # 永続化データボリューム（Vault、設定、スナップショット、ごみ箱、バックアップ）
```

---

## 🚀 クイックスタート

### 方法 1: Node.js / Bun によるローカル起動

```bash
# 1. リポジトリのクローン
git clone https://github.com/your-org/nimbus-vault-sync.git
cd nimbus-vault-sync

# 2. 依存関係のインストール
npm install

# 3. 環境変数の設定
cp .env.example .env
# 必要に応じて PORT、JWT_SECRET などを設定

# 4. サーバ起動
npm start
```

ブラウザで **`http://localhost:3000`** にアクセスすると Web 管理画面が表示されます。  
初回起動時、ウィザードに従って管理者（Admin）アカウントを作成してください。

---

### 方法 2: Docker & Docker Compose 一括起動

#### Docker Compose を使用（推奨）

```bash
cp .env.example .env
docker compose up -d --build
```

#### 単体 Docker コンテナを使用

```bash
docker build -t nimbus-vault-sync .
docker run -d -p 3000:3000 \
  -e JWT_SECRET=your_super_strong_random_secret \
  -v $(pwd)/data:/app/data \
  --name nimbus-vault-sync nimbus-vault-sync
```

- **Web 管理画面**: `http://localhost:3000`
- **WebSocket エンドポイント**: `ws://localhost:3000/ws`
- **MCP AI エンドポイント**: `http://localhost:3000/api/mcp`
- **ヘルスチェック**: `http://localhost:3000/api/health`

---

## 🔌 Obsidian プラグインのインストールと設定

1. Obsidian を開き、**「設定」->「コミュニティプラグイン」** で制限モードをオフにします。
2. 本リポジトリの [`obsidian-plugin`](./obsidian-plugin) フォルダを Vault のプラグインディレクトリに配置します：  
   `.obsidian/plugins/nimbus-sync/`
3. プラグイン一覧を再読み込みし、**Nimbus Sync** を有効化します。
4. Nimbus Web 管理コンソールにログインし、**「設定 & トークン」** から **「プラグイン設定をコピー」** をクリックします。
5. Obsidian 側のプラグイン設定に貼り付けると、即座に双方向リアルタイム同期が開始されます。

---

## 🤖 Model Context Protocol (MCP) AI 設定

Nimbus は **StreamableHTTP** プロトコルにネイティブ対応しています。ローカルでサブプロセスを起動することなく、標準の HTTP POST で直接接続できます。

### 1. クライアント設定ファイル (`mcp.json`)

Web 管理コンソールの **「🤖 AI / MCP」** をクリックし、対象 Vault を選択して設定をコピーしてください：

```json
{
  "mcpServers": {
    "nimbus-vault-sync": {
      "url": "http://<サーバアドレス>:3000/api/mcp",
      "type": "http",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer <JWTトークン>",
        "X-Default-Vault-Name": "My Vault"
      }
    }
  }
}
```

### 2. 内蔵 22 種類の標準 MCP ツール一覧

| カテゴリ | ツール名 | パラメータ & 概要 | 主な利用シーン |
| :--- | :--- | :--- | :--- |
| **Vault & 統計** | `list_vaults` | ユーザーがアクセス可能な全 Vault とロール一覧を取得 | Vault の把握・切り替え |
| | `get_vault_stats` | `vaultId?`: ノート数、添付ファイル数、Top 20 タグなどを取得 | ナレッジベースの健全性確認 |
| **検索 & メタデータ** | `list_notes` | `folder?`, `extension?`, `sortBy?`, `sortOrder?`, `limit?` | 階層別ノート一覧 |
| | `get_note_metadata` | `path`, `vaultId?`: 文字数、Frontmatter、`[[リンク]]`、タグ、目次を抽出 | ノートの構造・リンク解析 |
| **読み書き & パッチ** | `read_note` | `path`, `vaultId?`: ノートの生テキストを取得 | ノート閲覧 |
| | `write_note` | `path`, `content`, `baseHash?`, `vaultId?`: 新規作成・上書き保存（履歴記録・全端末配信） | AI による執筆・リライト |
| | `append_note` | `path`, `content`, `heading?`, `withTimestamp?`: 末尾または指定見出し下に追記 | 議事録・ログ追記 |
| | `prepend_note` | `path`, `content`, `withTimestamp?`: 先頭に挿入（YAML 属性を保護） | 要約の先頭追加 |
| | `patch_note` | `path`, `search`, `replace`, `replaceAll?`: 指定文字列の部分置換 | 局所的な正確修正 |
| **添付ファイル** | `upload_attachment` | `path`, `sourceUrl?`, `base64Data?`, `vaultId?`: URL / Base64 で画像やファイルを保存 | Web 画像のクリッピング |
| | `get_attachment_base64` | `path`, `vaultId?`: 画像・添付ファイルの Base64 と MIME タイプを取得 | マルチモーダル AI 画像認識 |
| **デイリーノート** | `get_daily_note` | `date?`, `folder?`, `createIfMissing?`: 当日のデイリーノートを取得・作成 | 日報・日記の取得 |
| | `append_daily_note`| `content`, `date?`, `folder?`, `heading?`, `withTimestamp?`: 思考ログを追記 | アイデアの即時記録 |
| **全文検索 & タグ** | `search_notes` | `query`, `folder?`, `limit?`, `useRegex?`, `caseSensitive?`: 行番号付き全文検索 | 目的情報の高速検索 |
| | `list_tags` | `folder?`, `vaultId?`: 全タグの使用頻度と一覧を集計 | タグ体系の整理 |
| **ファイル操作** | `move_note` | `oldPath`, `newPath`, `overwrite?`: ノートの移動・名前変更 | フォルダ構造の整理 |
| | `delete_note` | `path`, `vaultId?`: ごみ箱へ安全削除（全端末に同期） | 不要ノートの整理 |
| **バージョン履歴** | `get_note_history` | `path`, `vaultId?`: 過去のバックアップスナップショット一覧を取得 | 編集履歴の確認 |
| | `read_history_version`| `versionId`, `vaultId?`: 過去のスナップショットの内容を直接取得 | 履歴比較・復元 |
| **公開共有** | `create_share_link` | `path`, `title?`, `password?`, `expiresDays?`, `allowCopy?`: 公開リンクを発行 | ノートの外部公開 |
| **Git リモート同期** | `get_vault_git_status`| `vaultId?`: Git ブランチ、未コミット変更、リモート同期状況を確認 | Git 状態の監視 |
| | `git_sync_vault` | `vaultId?`, `commitMessage?`, `pullFirst?`: Git コミット＆リモート同期を実行 | AI からの自動 Git Push |

---

## 📊 機能比較表

| 機能項目 | **Nimbus Vault Sync** | **Obsidian 公式 Sync** | **fast-note-sync-service (Go)** |
| :--- | :---: | :---: | :---: |
| **セルフホスト完全対応** | ✅ **完全自律運用** | ❌ クローズドな商用クラウド | ✅ セルフホスト対応 |
| **高度な MCP AI 統合** | ✅ **22 種類の標準ツール** | ❌ なし | ⚠️ 基本的な読取/簡易書込 |
| **ネイティブ多言語対応** | ✅ **5 言語標準サポート** | ⚠️ アプリ内言語のみ | ❌ 単一言語 |
| **Git 自動リモート同期** | ✅ **GitHub/GitLab 自動連携** | ❌ なし | ❌ なし |
| **インタラクティブ D3 グラフ** | ✅ **Web 上で 2D 力学グラフ** | ⚠️ クライアント版のみ | ❌ なし |
| **カンバン & Markdown タスク** | ✅ **カンバン & タスク一括検索** | ❌ なし | ❌ なし |
| **3-Way 視覚的差分マージ** | ✅ **内蔵マージエディタ** | ⚠️ 簡易バージョン選択 | ⚠️ 競合ファイルの保持のみ |
| **マルチ DB & オンライン移行** | ✅ **JSON / SQLite / PG / MySQL** | ❌ 独自フォーマット | ⚠️ SQLite / PG / MySQL |
| **セキュアなノート公開共有** | ✅ **パスワード + 期限 + コピー防止** | ❌ 有料 Publish が必要 | ⚠️ 基本的な共有 |
| **インタラクティブ API 開発画面** | ✅ **cURL テスター内蔵** | ❌ 公開 API なし | ❌ インタラクティブ画面なし |
| **マルチ Webhook 通知** | ✅ **Discord/Slack/Feishu/DingTalk/WeCom** | ❌ なし | ❌ なし |

---

## 🔒 セキュリティと本番運用の推奨事項

1. **セキュアな秘密鍵**: 本番環境では `.env` の `JWT_SECRET` に `openssl rand -base64 32` などで生成した推測不能な文字列を設定してください。
2. **リバースプロキシと HTTPS/WSS**: Nginx、Caddy、Cloudflare 等の配下で SSL/TLS 暗号化を有効にして運用し、リバースプロキシ使用時は `TRUST_PROXY=1` を設定してください。
3. **CORS の制限**: 固定ドメインで運用する場合は、`CORS_ALLOWED_ORIGINS=https://your-domain.com` を指定してクロスオリジンアクセスを制限してください。
4. **定期データバックアップ**: すべてのノート、スナップショット、ごみ箱、DB 設定は `./data` に集約されています。このディレクトリを定期的にバックアップしてください。

---

## 📄 ライセンス

本プロジェクトは [MIT License](LICENSE) のもとで公開されています。
