# 安全与健壮性修复说明

这一轮修复的是性能之外发现的问题：权限漏洞、异常处理缺口、密钥/密码策略、以及工程习惯（测试、CORS）。
按之前分析时定的优先级（①②→③④⑤⑥→⑦⑧）逐条记录。

## ⚠️ 使用前必读

1. **`npm install` 之后先跑 `npm test`**：新增了 `test/` 目录（用 Node 自带的 `node:test`，不需要额外依赖），
   重点覆盖了流式写入/冲突检测这块风险最高的逻辑。这次修改同样是在没有网络、装不上依赖的沙箱里完成的，
   `npm test` 在这边因为缺 `jsonwebtoken`/`archiver` 等依赖跑不起来，**没有真正验证过测试能不能全部通过**，
   麻烦你在自己的机器上跑一遍确认。
2. 新增了 `CORS_ALLOWED_ORIGINS` 环境变量（逗号分隔的域名列表）。不设置的话行为和以前一样（允许任意来源），
   但会在启动日志里打印一条警告；如果你的 Web 面板固定在某个域名下，建议配置这个变量收紧。
3. `NODE_ENV=production` 时，如果 `JWT_SECRET` 还是默认值，服务会**直接拒绝启动**（Dockerfile 里已经设了
   `NODE_ENV=production`，所以用 Docker 部署且忘了改 `JWT_SECRET` 的话，容器会启动失败，日志里能看到原因）。

## 改了什么

### ① Webhook 配置接口权限漏洞（`src/routes/settingsRoutes.js`）
- `GET /api/settings/webhooks`：之前任何登录用户都能读到全局 webhook 配置（包括 secret），现在要求 admin。
- `POST /api/settings/webhooks/test`：这个接口会把请求体里的 `url` 原样拿去发起真实 HTTP 请求、并把目标
  服务器的响应内容透传回来——不限权的话等于给了任何登录用户一个探测内网的工具。现在同样要求 admin。
- `PUT`/`POST /api/settings/webhooks`（保存配置）本来就有 admin 检查，没有改动。

### ② 数据库相关接口权限漏洞（同上文件）
- `GET /api/settings/database`：之前任何登录用户都能看到数据库 host/port/用户名，以及全服务器的用户数/
  库数/分享数/令牌数统计，现在要求 admin。
- `POST /api/settings/database/test`：接收任意用户传入的连接配置并真实发起连接尝试，同样是内网探测风险，
  现在要求 admin。
- `POST /api/settings/database/switch` 本来就有 admin 检查，没有改动。

### ③ 部分 async 路由缺少错误处理
- 新增 `src/utils/asyncHandler.js`：包一层 async 路由函数，内部抛出的异常/reject 会被自动转交给 Express
  的错误处理链，而不是让请求永远挂起。
- 补到了：全局搜索、单库搜索（`vaultRoutes.js`、`vaultExtrasRoutes.js`）、登录/注册（`authRoutes.js`）、
  改密码（`settingsRoutes.js`）、创建分享/校验分享密码（`shareRoutes.js`）。
- `server.js` 新增：
  - 全局错误处理中间件（放在所有路由之后），统一返回 JSON 错误，生产环境下不泄露具体错误信息/堆栈。
  - `process.on('unhandledRejection', ...)`：记录日志，不主动退出（避免一个漏改的路由错误带崩整个服务）。
  - `process.on('uncaughtException', ...)`：记录日志后退出进程，交给容器/systemd 的重启策略处理——出现
    真正未捕获的同步异常意味着状态可能已经不可信，继续跑风险更大。

### ④ 密码强度策略弱且不一致
- 注册（`authRoutes.js`）、改密码（`settingsRoutes.js`）、后台建号（`adminRoutes.js`）统一为最低 6 位，
  之前注册没有任何长度限制、改密码要求 4 位。

### ⑤ JWT_SECRET 默认值风险（`server.js`）
- 启动时检测 `JWT_SECRET` 是否还是仓库里 `.env.example` 公开的默认值：
  - `NODE_ENV=production` 时直接 `process.exit(1)` 拒绝启动，日志里会提示用 `openssl rand -hex 32` 生成一个。
  - 非生产环境只打印警告，不阻断本地开发调试。
- `docker-compose.yml` 那条部署路径本来就有 `${JWT_SECRET:?...}` 语法强制要求设置，这次是给"直接
  `node server.js` 或用 systemd 跑"这条路径补上同等的保护。

### ⑥ 没有优雅关闭（`server.js`）
- 新增 `SIGTERM`/`SIGINT` 监听：收到信号后停止接受新连接、关闭数据库连接，10 秒兜底超时后强制退出。
- 已知局限：如果有 WebSocket 长连接一直挂着，`server.close()` 的回调要等所有连接都断开才会触发，实际
  效果是"最多等 10 秒，然后强制退出"，不是真正意义上把所有 WS 客户端都优雅送走——这个协议本身不支持
  更精细的处理，如果要做得更好需要主动通知在线 WS 客户端"服务器即将重启，请稍后重连"再断开，这次没有做
  这一步。

### ⑦ 自动化测试（新增 `test/` 目录）
- `test/asyncHandler.test.js`：验证 `asyncHandler` 正常返回、同步抛错、Promise reject 三种情况都能正确
  转交给 `next(err)`，不会挂起。**这三个测试在沙箱里跑通过了**（不依赖第三方包）。
- `test/auth.test.js`：JWT 签发/校验往返、篡改 token 校验失败、非法字符串不抛异常。
- `test/storage.test.js`：覆盖这次改动风险最高的部分——
  - 正常写入/读取
  - 内容未变化的重复写入不算冲突
  - `baseHash` 落后于服务器实际内容时正确生成冲突副本、不覆盖原文件
  - 流式写入路径（`writeFileFromPath`）下同样的场景，额外验证临时文件被正确 rename 走、历史快照被创建
  - 全文搜索命中文件名与内容
  - 删除后 `readFile` 返回 `null`、manifest 里不再出现
- 新增 `npm test` 脚本（`node --test test/`）。
- **没有验证过的部分**：`auth.test.js` 和 `storage.test.js` 因为沙箱里没装 `jsonwebtoken`/`archiver` 等依赖
  跑不起来，只做了语法检查，逻辑本身是通读过的，但没有拿到"全绿"的实际运行结果。

### ⑧ CORS 完全开放（`server.js`）
- 新增 `CORS_ALLOWED_ORIGINS` 环境变量（逗号分隔），设置后只允许列表内的来源跨域访问；不设置的话保持
  原来的开放行为（避免默认就打破现有客户端），但会在启动日志打印警告提示你去配置。
- 没有 `Origin` 头的请求（比如 Obsidian 插件、curl、服务器到服务器调用）不受这个限制影响，直接放行。

## 建议的验证步骤

1. `npm install && npm test` —— **这一步之前没能帮你跑，务必自己跑一遍**，重点看 `storage.test.js` 是否全绿。
2. 用一个非 admin 账号分别请求 `GET /api/settings/webhooks`、`POST /api/settings/webhooks/test`、
   `GET /api/settings/database`、`POST /api/settings/database/test`，确认都返回 403。
3. 故意把 `.env` 里的 `JWT_SECRET` 改回默认值、设置 `NODE_ENV=production`，确认服务拒绝启动并打印清晰错误。
4. 注册一个密码只有 3 位的账号，确认被拒绝。
5. `docker compose stop nimbus`（或对进程发 `SIGTERM`），观察日志里是否打印了"Shutting down gracefully”
   和"Shutdown complete"，而不是被直接杀死。
6. 触发一次 500 错误（比如给某个接口传明显非法的参数），确认返回的是 JSON 格式错误、生产环境下不包含
   堆栈信息，而不是 Express 默认的 HTML 错误页。
