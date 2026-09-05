# Git 同步模块安全修复说明（`src/gitSync.js`）

这是这几轮审查里发现的最严重的一组问题：一个可以被普通用户触发的远程代码执行（RCE），加上一个让
凭据脱敏形同虚设的信息泄露。修复分三块：协议白名单、隔离 `.git` 目录、收紧操作权限。

## ⚠️ 使用前必读

1. **这次修复需要重启服务才能完全生效**。`.git` 目录隔离依赖 `getManifest()` 重新扫描——内存缓存
   在进程重启后会自动清空，下次访问会用新逻辑重新扫描并整体覆盖旧的 `manifest-cache.json`（不需要
   手动清缓存或跑迁移脚本，但**必须重启进程**）。
2. **如果你之前已经用过 Git 同步功能，强烈建议做两件事**：
   - 检查一下对应仓库远端（GitHub/Gitee/GitLab 等）的访问令牌（Token）有没有可能已经被别人看到过
     （比如给过其他人只读协作权限），如果不放心，**去令牌颁发方那边直接吊销重新生成**——这次修复只是
     堵住了应用层的泄露渠道，不能撤销一个可能已经被别人读到过的旧令牌。
   - 升级后第一次操作前，先看一下 `git-config.json` 里的 `remoteUrl` 字段，确认它是正常的
     `https://...`/`git@...` 格式，不是什么奇怪的字符串（正常情况下不会被污染，但如果你怀疑有人已经
     利用过这个漏洞改过配置，这里是检查的地方）。
3. 新增的 `test/gitUrlGuard.test.js` 是零依赖测试，已经在沙箱里跑通过。

## 发现的问题

### ①②【严重】`remoteUrl` 没有协议限制，可以导致任意命令执行 / 跨租户数据泄露
`gitSync.js` 对用户填写的 Git 远程地址完全没有做协议校验，会原样传给 `execFile('git', [...])`。
Git 本身支持一个叫 `ext::` 的"外部传输协议"，写法类似 `ext::sh -c "任意命令"`，是公开资料里很经典
的 Git 远程 RCE 手法；同时 `file:///path` 这种本地路径也会被 Git 当作合法远程仓库，而所有 vault 都
存在同一个 `VAULTS_DIR` 下面、目录名就是 vault id，意味着可以用 `file://` 指向别人的 vault 目录，
`git pull` 一下就能把别人的内容拉进自己的仓库历史里。

最直接的触发路径是 `POST /api/vaults/:vaultId/git/test`——这个接口**只要求读权限**，而且直接把请求体
里的 `remoteUrl` 传给 `git ls-remote` 去执行，不需要先保存任何配置。也就是说任何一个注册用户，用自己
随手建的一个 vault，发一个请求就能触发。

### ③【严重】`.git` 目录被当成普通 vault 内容，读权限就能读到明文凭据
Git 仓库直接建在 `vaultFilesRoot(vaultId)`（也就是真正同步给客户端的那棵目录树）里面，而
`storage.js` 扫描目录时没有排除 `.git`，会把它当成普通笔记/附件列进 manifest。设置了账号密码/Token
的远程仓库，Git 自己会把认证信息编码进 URL 写进 `.git/config`——虽然 `getStatus()`/`GET /git/config`
接口在返回 API 数据时把 token 脱敏成了 `********`，但这个脱敏没有意义，因为真实凭据其实躺在一个可以
被直接读到的文件里：任何对这个 vault 有读权限的人（包括只读协作者），用 `GET /api/vaults/:id/files/.git/config`
或者 MCP 的 `read_note` 工具，都能把明文 token 读出来。

### ④ 操作 Git 远程配置只要求"写权限"，门槛偏低
`POST /:vaultId/git/config`、`/git/init`、`/git/commit-push`、`/git/pull` 都只要求写权限，不要求
是库主本人——意味着上面①②③三个洞，任何一个有写权限的协作者（不只是库主）都能触发。

## 改了什么

### 方案 A：协议白名单校验（新增 `src/utils/gitUrlGuard.js`）
零依赖模块，导出 `validateGitRemoteUrl(url)`：
- 能被标准 `URL` 解析的，协议必须在白名单里：`http:`、`https:`、`git:`、`ssh:`。
- 不能被标准 `URL` 解析的，只允许符合 `git@host:path` 这种标准 SCP 短语法的字符串（正则严格匹配，
  不允许空白字符、`::` 等异常内容）。
- 其余一律拒绝，包括 `ext::`、`fd::`、`file://`、`ftp://` 等。
- 空字符串/未设置视为合法（代表"未配置远程仓库"）。

在两个层次调用这个校验（缺一不可）：
1. `gitSync.saveConfig()`：保存配置时就校验，尽早拒绝，避免危险值落盘。
2. `gitSync.updateRemoteUrl()`（`initRepo`/`commitAndPush`/`pull` 都会调用它）和
   `gitSync.testConnection()`：真正要把这个地址交给 `git` 子进程之前再校验一次——这样即使磁盘上已经
   有升级前被写入的旧配置，也不会被放行执行；`testConnection` 还额外覆盖了"不经过保存、直接在请求体
   里传 `remoteUrl` 测试"这条最直接的攻击路径。

### 方案 B：隔离 `.git` 目录（`src/storage.js`）
- `walk()` 递归扫描时直接跳过名字是 `.git` 的目录，manifest/搜索/导出都不会再包含它。
- 更关键的一步：在 `safeJoin()` 里加了硬拦截——任何路径只要有一段精确等于 `.git`，无论是从
  manifest 列举出来的还是调用方直接指定的路径，一律拒绝访问。`readFile`/`writeFile`/`deleteFile`
  都经过这个函数，所以 REST 的 GET/PUT/DELETE 和 MCP 的 `read_note`/`write_note` 等工具全部一并生效，
  就算有人知道或猜到 `.git/config` 这个路径，也无法通过应用层的任何接口读到它。
- 不影响 Git 自己的内部操作：`execGit()` 是直接用 `vaultFilesRoot(vaultId)` 作为 `cwd` 调用 `git`
  命令行，不经过 `safeJoin`，所以 Git 依然可以正常读写自己的 `.git` 内部数据，只是"应用层的文件
  读写接口"不能再把它当成普通笔记暴露出去。

### 方案 C：提高 Git 操作的权限门槛（`src/routes/vaultExtrasRoutes.js` + `src/mcp.js`）
- 新增 `checkOwnerAccess()`，要求库所有者（或管理员），比原来的"写权限即可"更严格——和
  `POST /vaults/:vaultId/shares`（创建分享链接）用的是同一个标准。
- 应用到：`POST /:vaultId/git/config`、`/git/init`、`/git/test`、`/git/commit-push`、`/git/pull`。
- 只读的 `GET /:vaultId/git/status`、`GET /:vaultId/git/config`、`GET /:vaultId/git/logs` 维持原来的
  读权限要求（这几个本身没有执行风险，token 也已经脱敏）。
- MCP 的 `git_sync_vault` 工具同步收紧：之前上一轮改成了"要求写权限"，这次进一步提高到"要求所有者"，
  连 `test_connection` 分支也一起收紧（虽然方案 A 已经从协议层面堵住了它的直接风险，但保持"Git 相关
  操作统一要求所有者权限"这个原则的一致性）。

## 建议的验证步骤

1. `npm install && npm test`，重点看 `test/gitUrlGuard.test.js`（应该不需要装依赖就能跑，沙箱里已
   验证通过）。
2. 用一个**有写权限但不是所有者**的协作者账号，尝试 `POST /:vaultId/git/config`、`/git/test`、
   `/git/commit-push`、`/git/pull`，确认全部返回 403。
3. 用库主账号，尝试把 `remoteUrl` 设置成 `ext::sh -c "id"` 或 `file:///etc/passwd`，确认保存时就被
   拒绝并返回清晰的错误信息（而不是保存成功、等下次同步才出问题）。
4. 手动在某个 vault 的 `files/` 目录下建一个 `.git` 文件夹放点东西进去，确认：
   - 这个 vault 的书架/文件列表里看不到 `.git` 相关的"笔记"
   - 直接请求 `GET /api/vaults/:id/files/.git/xxx` 返回错误而不是内容
5. 正常配置一个真实可用的 Git 远程仓库（比如自己在 GitHub 建一个测试仓库），走一遍
   `test → init → commit-push → pull` 的完整流程，确认协议白名单没有把正常的 `https://`/`git@` 地址
   也拦下来。
