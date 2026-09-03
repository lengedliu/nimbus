# 性能优化改动说明

这份文档记录了这一轮针对性能瓶颈的具体改动，方便你回顾和 code review。

## ⚠️ 使用前必读

1. **需要重新安装依赖**：新增了 `compression` 和 `express-rate-limit` 两个包，已加进 `package.json`，
   拉下来后先跑一遍：
   ```bash
   npm install
   ```
2. **没有做端到端联调测试**：这次修改是在没有网络、没法 `npm install` 的沙箱环境里完成的，只做了
   `node -c` 语法检查和逐行代码通读，没有真正起服务跑一遍上传/下载/搜索/登录的完整流程。
   建议你在测试环境先跑一轮基本操作（登录、建库、上传笔记、上传一个大附件、下载、搜索、多设备同时
   编辑触发冲突）再上生产。
3. 新增了环境变量 `TRUST_PROXY`（默认 `0`），只有部署在 Nginx/Caddy/Traefik 反向代理之后时才设成 `1`，
   否则限流可能被伪造的 `X-Forwarded-For` 头绕过。

## 改了什么

### ① 全文搜索（`src/storage.js`）
- `searchVault()` 改成 `async` 函数。
- 新增按 vault 维度的内容缓存（`contentCache`），命中缓存（文件的 size/mtime 都没变）就不用重新
  `readFileSync`，重复搜索会明显变快。
- 每处理 40 个文件后 `await` 一次 `setImmediate`，主动把控制权还给事件循环，避免大 vault 的一次
  全文搜索长时间独占进程，卡住其他用户的请求和 WebSocket 消息。
- 文件写入/删除/恢复时都会让对应的内容缓存条目失效（`invalidateContentCacheEntry`），避免搜索命中
  过期内容。
- 三个调用点（`src/routes/vaultRoutes.js` 两处、`src/routes/vaultExtrasRoutes.js` 一处）都已同步
  改成 `await`。

### ② WebSocket 广播（`src/wsHub.js`）
- `broadcastFileChange` / `broadcastFileDelete` 现在只 `JSON.stringify` 一次，房间里所有客户端复用
  同一份序列化结果，而不是每个客户端都重新序列化一遍相同内容。

### ③ 流式传输（`src/storage.js` + `src/routes/fileRoutes.js`）
这是改动最大的一块：
- **下载（GET）**：改成 `fs.createReadStream(...).pipe(res)`，不再把整个文件读进内存再 `res.send()`。
- **上传（PUT）**：不再用 `express.raw()` 把整个请求体缓冲成一个 Buffer，而是边接收边写入临时文件
  （`.tmp-uploads/` 目录，和实际同步的 `files/` 目录是分开的，不会被误同步），同时用一个
  `Transform` 流边过一遍数据边计算 sha256。
- 上传大小上限从写死的 50MB 改成可通过 `MAX_UPLOAD_MB` 环境变量配置（默认 500MB）——现在的限制只是
  "防止把磁盘写爆"的安全阀，不再等价于"这么大的文件都必须先塞进内存"。
- 判断"服务器上现有内容是否相同/是否有冲突"时，直接复用 manifest 缓存里已经算好的 hash，不再重新
  读一遍旧文件、重新算一次 sha256。
- 真正需要保存历史快照时，用 `fs.copyFileSync` 直接在磁盘上复制旧文件到 `history/`，
  不经过内存 Buffer；最终落盘用 `fs.renameSync`（同分区几乎零成本），处理了跨文件系统场景的
  `EXDEV` 报错兜底（自动退化为 copy + unlink）。
- 新增 `cleanupAllStaleUploadTemps()`，服务器启动时清理所有 vault 里残留的 `.tmp-uploads` 临时
  文件——进程重启前如果正好有上传在进行中，那些临时文件必然是半成品，不可能续传完成，启动时统一清
  一次避免每次重启都留垃圾文件。

**已知局限**：WebSocket 实时同步这条通道仍然是整份文件 base64 编码后一次性传输（协议本身就是
JSON + base64），没有跟着流式化——这需要把 WS 传输协议改成二进制分帧，改动和风险都更大，这次没有
动它。日常小笔记走 WS 没问题，大附件如果通过 WS 通道同步，仍然会有相对明显的内存和延迟开销；
但目前 REST 通道（多数客户端全量同步大文件时更常用）已经是流式的了。

### ④ bcrypt 异步化（`src/users.js` + `src/shares.js`）
- `createUser` / `verifyPassword` / `updatePassword` / `updateUser`（`users.js`）以及
  `create` / `verifyPassword`（`shares.js`，分享链接密码）全部从 `hashSync`/`compareSync` 换成了
  `hash`/`compare` 的异步版本，不再阻塞事件循环。
- 顺带发现 `shares.js` 的分享链接密码校验本来也是同步版本——这个接口不需要登录就能访问，暴露面比
  登录接口更大，一并修了。
- 所有调用方都已加上 `await`：`src/routes/authRoutes.js`（登录/注册）、
  `src/routes/settingsRoutes.js`（改密码）、`src/routes/adminRoutes.js`（后台建号/改号）、
  `src/routes/shareRoutes.js`（创建分享/校验分享密码）、`src/cli/createUser.js`（命令行建号脚本）。

### ⑤ 压缩与限流（`server.js`）
- 加了全局 `compression()` 中间件。文件下载统一走 `Content-Type: application/octet-stream`，
  `compression` 的默认过滤器会自动跳过这类响应（图片/PDF/视频等本来就压缩过，gzip 也压不小，
  白费 CPU），JSON/HTML/文本类响应会正常走 gzip。
- 加了全局 `express-rate-limit`：600 次/分钟/IP，阈值给得比较宽松，正常的多设备同步不会碰到，
  主要是防止全文搜索、manifest 拉取这类相对重的接口被单一来源短时间内打爆。登录接口原本就有更严格
  的专用限流，两者不冲突。
- `app.set('trust proxy', ...)` 改成由 `TRUST_PROXY` 环境变量控制，默认关闭（见上面"使用前必读"）。

## 建议的验证步骤

1. `npm install`
2. 启动服务，创建一个测试用户、一个测试 vault
3. 上传几个不同大小的文件（几 KB 的笔记、几十 MB 的附件），确认能正常上传、下载、内容一致
   （可以下载下来跟原文件做个 md5/sha256 比对）
4. 故意制造一次冲突（同一个文件，先用旧的 baseHash 尝试写入），确认能正确生成 `.conflict-*` 副本
5. 搜索测试：连续搜索同一个关键词两次，第二次应该明显更快（命中内容缓存）
6. 多开几个 WebSocket 连接（或多个浏览器标签）同时连到同一个 vault，改动一个文件，确认其他连接都能
   收到正确的广播内容
7. 登录、改密码、创建分享链接、访问带密码的分享链接，确认功能正常
