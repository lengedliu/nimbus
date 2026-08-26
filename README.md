# Nimbus Server — self-hosted Obsidian 同步 + 管理 + MCP 服务

**Nimbus**（前身 FNS / Fast Note Sync）是一个轻量级、自托管的 Obsidian 服务端：

- 📡 **实时同步** — WebSocket，多设备/多 vault，带写冲突检测
- 🖥 **Web 管理后台** — 浏览器里登录、建 vault、看文件、在线编辑/删除，管理员还能管用户
- 🤖 **MCP 支持** — 内置 MCP (Model Context Protocol) HTTP 端点，Claude Code / Cursor 等
  MCP 客户端可以直接读写你的 Obsidian 笔记，改动实时同步到所有在线设备
- 🐳 **Docker 一键部署** — 自带 `Dockerfile` / `docker-compose.yml`，数据用卷持久化
- 🕘 **笔记历史版本** — 每次覆盖笔记前自动存一份旧版本快照，随时能看历史、恢复到某个版本
- 🗑 **回收站** — 删除是软删除，误删了能恢复，不是真的马上没了

配套的 Obsidian 插件在 [`fns-obsidian-plugin`](../fns-obsidian-plugin) 目录（插件本身不需要改，
接口路径没变）。

## 目录结构

```
nimbus-server/
├── server.js                # 入口：REST API + WebSocket + MCP 端点 + 管理后台静态资源
├── src/
│   ├── config.js
│   ├── jsonDb.js
│   ├── users.js               # 用户存储（含角色 user/admin）
│   ├── vaults.js
│   ├── auth.js                # JWT + requireAuth/requireAdmin 中间件
│   ├── storage.js             # 文件读写、哈希、manifest
│   ├── wsHub.js                 # WebSocket 实时同步
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── vaultRoutes.js
│   │   ├── fileRoutes.js
│   │   └── adminRoutes.js       # 管理员专属：用户/全部vault管理
│   └── cli/createUser.js
├── public/                    # 管理后台前端（纯 HTML/CSS/JS，无需构建）
│   ├── index.html
│   ├── style.css
│   └── app.js
└── data/                       # 运行时生成：用户/vault 元数据 + 每个 vault 的文件
```

## 快速开始

```bash
cd nimbus-server
npm install
cp .env.example .env       # 按需修改 PORT / JWT_SECRET
npm start
```

打开浏览器访问 **`http://localhost:8787/admin`** 就是管理后台。

首次启动没有任何用户，创建第一个账号（自动成为管理员）有两种方式：

1. `npm run create-user`（会问角色，第一个用户不管填什么都会被设为 admin）
2. 或调用一次性开放的 `POST /api/auth/register`（同样只有在完全没有用户时可用）

## Docker 部署

```bash
cd nimbus-server
cp .env.example .env    # 改好 JWT_SECRET，其他默认值可以先不动
docker compose up -d --build

# 创建第一个（管理员）账号
docker compose exec nimbus npm run create-user
```

- 数据持久化在宿主机的 `./data` 目录（docker-compose.yml 里挂载的卷），备份这个目录就行
- 管理后台：`http://localhost:8787/admin`；WebSocket 同步端点：`ws://localhost:8787/ws`
- 改端口：改 `.env` 里的 `PORT`（同时也是 compose 里宿主机对外暴露的端口）
- 只用 `Dockerfile`（不经 compose）也可以：
  ```bash
  docker build -t nimbus-server .
  docker run -d -p 8787:8787 \
    -e JWT_SECRET=改成随机字符串 \
    -v $(pwd)/data:/app/data \
    --name nimbus-server nimbus-server
  ```
- 更新代码后重新部署：`docker compose up -d --build`（`./data` 卷不受影响，数据不丢）
- MCP 端点（`/api/mcp`）就是主服务的一部分，docker 部署自动带上，不需要额外配置

## 笔记历史版本 & 回收站

- **历史版本**：每次一篇笔记被真正覆盖（内容变了，不是简单碰一下 mtime）之前，
  旧版本会自动存进 `history/`，同一篇笔记最多留 20 个历史版本，超出的自动清掉最老的。
  恢复历史版本走的还是正常的 `writeFile`，所以恢复前的"当前版本"也会先被存一份
  ——也就是说恢复操作本身也是可撤销的，不会丢东西。
- **回收站**：删除文件（不管是插件同步删的、管理后台点删除、还是 MCP 工具调
  `delete_note`）现在都是移进 `trash/`，不是直接 `unlink`。可以在管理后台找回来，
  或者手动彻底清掉。
- 这两块都存在 vault 数据目录里（`history/`、`trash/`，跟 `files/` 平级），**不会**
  出现在 manifest 里，也就不会被当成笔记同步到 Obsidian 客户端——纯服务端功能。

API：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/vaults/:id/history?path=<path>` | 某篇笔记的历史版本列表 |
| GET | `/api/vaults/:id/history/:versionId` | 某个历史版本的原始内容 |
| POST | `/api/vaults/:id/history/:versionId/restore` | 恢复到这个版本 |
| GET | `/api/vaults/:id/trash` | 回收站列表 |
| POST | `/api/vaults/:id/trash/:trashId/restore` | 从回收站恢复 |
| DELETE | `/api/vaults/:id/trash/:trashId` | 彻底删除（不可撤销） |

## Web 管理后台（`/admin`）

- 登录后看到自己的 vault 列表：新建 / 删除 vault
- 点进一个 vault：文件表格（路径/大小/修改时间），点一行在线打开 → 文本编辑器 → 保存
  （保存时带上当时读到的 hash 做冲突保护，和 Obsidian 插件同一套机制）、删除文件、新建文件
- 每行文件旁边有个 **"历史"** 按钮：看这篇笔记之前被覆盖过的版本、查看内容、一键恢复
- 页头有个 **"🗑 回收站"** 按钮：删除的文件不是真删，能在这里找回来或彻底清掉
- 如果当前账号是 **管理员**，侧栏多一个"管理员"分区：
  - **用户管理**：看所有账号、新建账号（可勾选是否给管理员权限）、删除账号
  - **全部 Vault**：看所有用户名下的全部 vault（名称/所有者/ID/创建时间）

登录时"服务器地址"留空则默认用当前打开这个页面的地址；如果后台部署在别的域名/端口，
填完整地址（如 `http://192.168.1.10:8787`）即可连过去，方便一个后台管理多台 Nimbus。

## MCP 支持

参考了 [fast-note-sync-service](https://github.com/haierkeys/fast-note-sync-service)（也叫 FNS，
和这个项目撞名但是两个不同的实现）的 MCP 设计：**服务端原生提供一个 HTTP MCP 端点**，
AI 客户端（Claude Code、Cursor、Cherry Studio 等）直接拿 URL + Token 连接就行，不需要在本机
另外起一个进程。

### 原生 HTTP 端点（推荐）

- **地址**：`http://<host>/api/mcp`（StreamableHTTP，单一端点，POST 收发所有请求）
- **鉴权**：`Authorization: Bearer <token>`，跟 REST API 用的是同一套登录 token
- **默认 vault**：`X-Default-Vault-Name: <vault名字>` 头（按名字不是 ID，跟 FNS 一致），
  不传的话每次调用工具都要显式传 `vaultId` 参数
- 当前是**无状态模式**：每次请求建一个临时的 MCP server 实例处理完就丢，没有跨请求的
  会话状态——兼容性最好，缺点是不支持服务器主动推送通知（GET 长连接），大部分客户端
  用不到这个所以问题不大

在管理后台（`/admin`）每个 vault 条目上有个 **⧉ 按钮**，点一下直接把下面这段配置连同
你的登录 token 一起复制到剪贴板：

```json
{
  "mcpServers": {
    "nimbus": {
      "url": "http://<host>/api/mcp",
      "type": "http",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer <token>",
        "X-Default-Vault-Name": "<vault名字>"
      }
    }
  }
}
```

粘到对应客户端的 MCP 配置里（Claude Code 是 `.mcp.json` 或 `claude mcp add --transport http`；
Cursor/Cherry Studio 在各自的 MCP 设置界面里）即可。

**工具集**：`list_vaults`、`list_notes`、`read_note`、`write_note`（带冲突保护）、
`delete_note`、`search_notes`。工具直接调服务器内部的存储模块，而且每次 `write_note`/
`delete_note` 都会经过和实时同步一样的 WebSocket 广播——AI 改了笔记，Obsidian 里开着
的其他设备立刻就能看到变化。

> 注意：复制出来的配置里带的是登录 token，会过期（`.env` 里 `TOKEN_TTL`，默认 30 天）。
> 过期后回管理后台重新登录一次，再点一次 ⧉ 复制新的配置替换掉旧的就行。

## REST API

所有 `/api/vaults/*`、`/api/admin/*` 接口都需要 `Authorization: Bearer <token>` 头；
`/api/admin/*` 额外要求账号角色是 `admin`。

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/register` | 首个用户注册（自动成为 admin），之后关闭 |
| POST | `/api/auth/login` | 登录，返回 `{ token, user }` |
| GET | `/api/vaults` | 列出当前用户的 vault |
| POST | `/api/vaults` `{name}` | 新建 vault |
| DELETE | `/api/vaults/:vaultId` | 删除 vault |
| GET | `/api/vaults/:vaultId/manifest` | 全量文件清单 |
| GET/PUT/DELETE | `/api/vaults/:vaultId/files/*path` | 读/写/删单个文件 |
| GET | `/api/admin/users` | 全部用户（仅 admin） |
| POST | `/api/admin/users` | 创建用户（仅 admin） |
| DELETE | `/api/admin/users/:id` | 删除用户（仅 admin，不能删自己） |
| GET | `/api/admin/vaults` | 全部用户的全部 vault（仅 admin） |
| POST | `/api/mcp` | MCP StreamableHTTP 端点（见下方 MCP 支持一节） |

`PUT` 文件时可带 `X-Mtime`、`X-Base-Hash` 头做冲突检测，见下方 WebSocket 部分说明的机制。

## WebSocket 实时同步

连接：`ws://<host>/ws?token=<jwt>&vaultId=<vaultId>`，协议细节（消息格式、冲突处理）
和之前一致，插件代码不用改。简要过一遍：

- 连上收到 `init`（全量 manifest），之后增量 `push`/`pull`/`delete`
- 服务器把变更 `change`/`deleted` 实时广播给同一 vault 下的其他在线客户端
- 写入时可带 `baseHash`（客户端记得的上次同步 hash），服务器发现真实冲突时不覆盖，
  生成 `.conflict-<timestamp>` 副本并通知

完整消息格式表见代码注释（`src/wsHub.js` 顶部）。

## HTTP / HTTPS

服务端两种都支持：

- **默认（不配置证书）**：跑 HTTP + WS（明文）。本地/内网用没问题。
- **配置 `TLS_CERT_PATH` + `TLS_KEY_PATH`**（`.env` 里，指向证书和私钥文件）：
  Node 进程自己直接用 HTTPS + WSS 监听，不需要额外套反向代理。

两个环境变量必须同时给，缺一个就自动退回明文 HTTP（并在启动日志里提示）。
证书可以是 Let's Encrypt 签发的，也可以是自签名的（自签名的话客户端/浏览器会有安全警告，
自己内部用无所谓，公网给别人用不建议）。

也仍然可以走**反向代理终止 TLS**（Nginx/Caddy 转发到本机的 HTTP 端口）的老路子，
两种方式二选一，别同时开（代理已经解了一次 TLS，容器内部没必要再解一次）。

无论哪种方式，Obsidian 插件那边只看你在设置里填的地址协议：填 `https://xxx`
它会自动用 `wss://xxx` 连 WebSocket；填 `http://xxx` 就是明文 `ws://`。管理后台同理。

## 和 fast-note-sync-service（FNS）的对比

Nimbus 最初参考了 [haierkeys/fast-note-sync-service](https://github.com/haierkeys/fast-note-sync-service)
（同样自称 FNS，跟这个项目撞名，是两套独立实现，Go 写的，star 1.7k，功能更成熟）。
对比一下，方便决定要不要迁移/怎么选：

| 功能 | Nimbus | FNS (haierkeys) |
|---|---|---|
| 实时同步（WebSocket） | ✅ | ✅ |
| Web 管理后台 | ✅ | ✅（还带 OIDC 登录） |
| MCP | ✅ StreamableHTTP（无状态） | ✅ StreamableHTTP + SSE |
| 笔记历史版本 | ✅ | ✅ |
| 回收站 | ✅ | ✅ |
| 附件/图片同步 | ✅（无分片，走 base64/原始字节） | ✅ 支持分片上传下载 |
| `.obsidian` 配置同步 | ❌ | ✅ |
| 离线编辑合并 | 基础版（hash+mtime 比较） | 更完整的离线策略 |
| 笔记分享 | ❌ | ✅ 带密码/统计/短链 |
| Git 自动化推送 | ❌ | ✅ |
| 多存储后端（S3/OSS/WebDAV等） | ❌ | ✅ |
| 数据库 | JSON 文件（个人/小规模够用） | SQLite/MySQL/PostgreSQL |
| 语言/体量 | Node.js，单文件路由，代码量小、好改 | Go，功能更全，代码量也大得多 |

### 为什么有些没做

- **`.obsidian` 配置同步**：技术上不难（插件那边用 `vault.adapter` 走底层文件 API
  就行），但 `.obsidian/workspace.json` 这类文件记的是"当前设备的窗口布局/打开的标签
  页"，跨设备同步反而容易互相覆盖打架，得先做好排除规则不然是帮倒忙，所以先没上。
- **分片上传下载**：现在 `PUT /files/*` 是一次性整包传（50MB 上限），WebSocket 那条
  路是 base64 编码整个文件发过去。日常笔记和一般图片够用，同步几百 MB 的视频附件的话
  会比较吃内存/带宽，这个是分片传输真正有价值的场景。
- **笔记分享、Git 自动化、多存储后端**：这几个是独立的大功能模块，不是"顺手加一下"的
  体量，值得单开一次来做，而不是这次顺带糊一个简化版。
- **多数据库支持**：当前用 JSON 文件存元数据，个人/小团队用没问题；真要支持多用户高
  并发场景，换 SQLite 会是更值当的第一步（比直接上 MySQL/Postgres 轻量）。

这几个如果你要哪个，告诉我优先级，下次接着做。

## 安全提示

- `.env` 里的 `JWT_SECRET` 一定要改成随机长字符串
- 建议在 Nginx/Caddy 后面跑并开 HTTPS/WSS，尤其是公网部署、暴露管理后台或 MCP token 时
- `data/` 目录是所有笔记的存储位置，记得备份
- MCP token 直接写在本地配置文件里，注意别把 `claude_desktop_config.json` 提交进公开仓库
