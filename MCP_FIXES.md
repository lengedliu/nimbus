# MCP 模块修复说明（`src/mcp.js`）

这份文档记录针对 MCP（Model Context Protocol）工具集的深度审查发现和修复，独立于之前的性能优化
（`PERFORMANCE_FIXES.md`）和 REST API 安全修复（`SECURITY_FIXES.md`）。

## ⚠️ 使用前必读

1. `ATTACHMENT_MAX_MB` 环境变量（默认 200）控制 `upload_attachment` 工具通过 `sourceUrl` 下载的
   附件大小上限，需要更大可以调整。
2. **这是这三轮修复里唯一在沙箱环境里真正跑通单元测试验证过的一次**：新增的 `test/mcp.test.js`
   针对 `isPrivateOrReservedIp()` 的 14 个应拦截地址 + 6 个应放行地址全部测试通过（这个模块零依赖，
   不需要 `npm install` 就能跑）。其他改动（权限校验部分）仍然只做了语法检查+逐行通读，没有端到端
   联调，建议按文末的验证步骤实测。

## 改了什么

### ①【严重】写权限校验系统性缺失
之前 `mcp.js` 里所有需要修改内容的工具都只调用了 `resolveVaultId()`——这个函数只保证"用户对该 vault
有某种访问权限"，**并不区分只读协作者和读写协作者**。这意味着一个只被邀请为"只读协作者"的用户，通过
Web/REST 接口确实无法修改别人的笔记，但只要接上 MCP（比如用 Claude Desktop、Cursor 等 MCP 客户端连接），
就能直接写、改、删、移动任何笔记，甚至触发 Git 推送、创建公开分享链接。

修复：新增两个辅助函数：
- `resolveWritableVaultId(vaultId)`：在 `resolveVaultId` 基础上，额外调用 `vaultsStore.hasWriteAccess()`
  校验，只读协作者会被拒绝，抛出清晰的错误信息。
- `resolveOwnedVaultId(vaultId)`：更严格，要求 `vaultsStore.userOwnsVault()`，和 REST 接口
  `POST /vaults/:vaultId/shares` 的权限要求保持一致。

应用到以下工具：
- **要求写权限**（`resolveWritableVaultId`）：`write_note`、`append_note`、`prepend_note`、
  `patch_note`、`upload_attachment`、`append_daily_note`、`move_note`、`delete_note`、
  `git_sync_vault`（`pull` 和 `commit_and_push` 两个分支——`test_connection` 分支不改动内容，
  仍然只要求读权限）。
- **要求所有者权限**（`resolveOwnedVaultId`）：`create_share_link`。
- **特殊处理**：`get_daily_note` 默认 `createIfMissing=true`，但只有在目标日记文件真的不存在、需要
  新建时才会触发写权限检查——单纯查看一篇已经存在的日记，只读协作者不受影响。

其余 12 个纯读取工具（`get_vault_stats`、`list_notes`、`get_note_metadata`、`read_note`、
`get_attachment_base64`、`search_notes`、`list_tags`、`get_note_history`、`read_history_version`、
`get_vault_git_status`、`git_sync_vault` 的 `test_connection` 分支、`get_daily_note` 的读取部分）
维持原来的 `resolveVaultId()`，只读协作者可以正常使用。

### 顺手修复的回归 bug：`create_share_link` 漏加 `await`
上一轮把 `shares.create()` 从同步 bcrypt 改成异步版本时，`shareRoutes.js` 的调用点补上了 `await`，
但 `mcp.js` 里 `create_share_link` 工具这个调用点当时漏掉了——`sharesStore.create()` 现在返回一个
`Promise`，之前的代码没有 `await`，会导致 `record` 是一个 `Promise` 对象而不是真正的分享记录，工具
返回的 `record.id`、`record.url` 等字段全部是 `undefined`。这次一并修复。

### ② `upload_attachment` 的 `sourceUrl` 是一个 SSRF 缺口
`sourceUrl` 参数之前直接 `fetch(sourceUrl)`，服务器会对任意用户指定的地址发起真实请求，下载结果存进
vault、还能通过 `get_attachment_base64` 读回来——等于一条完整的"探内网 + 把结果带出来"的链路。

修复：新增 `src/utils/ssrfGuard.js`（零依赖模块，方便单测）：
- `isPrivateOrReservedIp(ip)`：判断一个 IP 是否落在 `127.0.0.0/8`、`10.0.0.0/8`、`172.16.0.0/12`、
  `192.168.0.0/16`、`169.254.0.0/16`（含云主机元数据地址 `169.254.169.254`）、`100.64.0.0/10`、
  以及对应的 IPv6 保留段（`::1`、`fe80::/10`、`fc00::/7`）内。
- `mcp.js` 里的 `fetchAttachmentUrlSafely()`：先用 `dns.lookup()` 解析出目标域名的**真实 IP**
  （而不是只看 URL 里写的 hostname 字符串，防止 DNS rebinding 绕过），逐个 IP 校验，命中内网/保留
  地址直接拒绝；同时加了 30 秒超时。

### ⑤（顺带解决）附件上传没有大小上限
`fetchAttachmentUrlSafely()` 双重限制下载大小：先检查响应头 `Content-Length`（超限直接拒绝，不发起
真正下载），再在实际读取数据流时用字节计数器兜底（防止对方谎报或不返回 `Content-Length`）。
`contentBase64` 路径同样加了解码后大小检查。上限统一由 `ATTACHMENT_MAX_MB` 环境变量控制，默认 200MB。

### ③ 同一个"同步全文扫描"性能问题在 MCP 里独立重现了三次
之前修 REST 的 `/search` 接口时，只改了 `storage.searchVault()` 这一个函数——但 `mcp.js` 里的
`get_vault_stats`（统计标签）、`search_notes`（全文搜索）、`list_tags`（标签聚合）三个工具都是
各自独立实现的同步全量扫描，完全没有复用那次的修复，调用其中任何一个都会重新卡住整个事件循环。

修复：把 `storage.js` 内部的内容缓存和让出逻辑抽成两个可复用的导出函数：
- `storage.getTextContent(vaultId, relPath, meta)`：命中缓存（文件 size/mtime 都没变）就不重新
  读盘，`searchVault()` 和这三个 MCP 工具现在共用同一份缓存。
- `storage.yieldToEventLoop()` + `storage.SEARCH_YIELD_BATCH_SIZE`：三个工具的扫描循环里都加上了
  "每处理 40 个文件让出一次事件循环"，和 `searchVault()` 保持一致的节奏。

## 建议的验证步骤

1. `npm install && npm test` —— 重点关注 `mcp.test.js` 是否全绿（这个应该不用装依赖就能跑，
   在沙箱里已经验证通过）。
2. 邀请一个"只读"权限的协作者账号，通过 MCP 客户端（或直接调用 MCP HTTP 接口）尝试
   `write_note`/`delete_note`/`move_note`/`create_share_link`/`git_sync_vault`，确认全部返回权限
   错误，而不是真的执行了。同一个账号调用 `read_note`/`search_notes`/`list_tags` 应该正常工作。
3. 用 `upload_attachment` 的 `sourceUrl` 参数分别测试：
   - 指向 `http://127.0.0.1:PORT/`、`http://169.254.169.254/` 等内网地址 —— 应该被拒绝。
   - 指向一个正常的公网图片/文件直链 —— 应该正常下载成功。
   - 指向一个超过 `ATTACHMENT_MAX_MB` 的大文件 —— 应该被拒绝而不是把内存吃满。
4. 用 `create_share_link` 分别测试库主本人 vs 有写权限的协作者 vs 只读协作者三种身份，确认只有库主
   能成功创建、且创建出来的分享记录字段（`id`/`url`）不是 `undefined`（验证那个 `await` 回归修复）。
5. 对一个较大的 vault（几千个文件）调用 `get_vault_stats`/`search_notes`/`list_tags`，同时另开一个
   连接做点别的操作，确认不会被卡住很久没有响应。
