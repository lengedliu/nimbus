# 权限归一化 + 自动化一致性检查 + CI

这一轮不是修具体漏洞，而是落实之前给的三条架构建议，目的是让"同一逻辑多处实现、改一处忘一处"这类
问题（这几轮审查里几乎所有严重漏洞的根因）以后能被自动挡住，而不是靠人工 review 记住。

## 改了什么

### 1. 权限校验归一化：新增 `src/permissions.js`
之前 REST 路由（好几个文件里各自的 `checkAccess`/`checkOwnerAccess`，以及散落在 `vaultRoutes.js`
里的内联 `vault.ownerId !== req.user.id` 比较）和 MCP 工具（`buildMcpServer` 内部的
`resolveVaultId` 系列）是好几套独立实现的"这个用户对这个 vault 有没有权限"判断逻辑。

现在统一成一个模块，导出：
- **框架无关的判定函数**（谁都能用）：`assertReadAccess`、`assertWriteAccess`、`assertOwnerAccess`，
  权限不足时抛出 `PermissionError`（带 `.code`：`NOT_FOUND` / `WRITE_REQUIRED` / `OWNER_REQUIRED`）。
- **Express 适配层**（薄封装，方便路由文件里沿用原来 `if (!requireXxxAccess(req, res)) return;`
  的写法）：`requireReadAccess`、`requireWriteAccess`、`requireOwnerAccess`。

`src/mcp.js` 的 `resolveWritableVaultId`/`resolveOwnedVaultId` 现在内部直接调用
`permissions.assertWriteAccess`/`assertOwnerAccess`——和 REST 路由用的是**同一个函数**，不是
形状相似的两份实现。

**四个路由文件**（`fileRoutes.js`、`vaultRoutes.js`、`vaultExtrasRoutes.js`、`shareRoutes.js`）
都已经切到这套共享逻辑，各自的本地 `checkAccess`/`checkOwnerAccess`/内联比较全部删除。

**一个设计上的取舍值得说明**：`shareRoutes.js` 对"不是所有者"故意返回 404 而不是 403（不想让陌生人
通过状态码区分"vault 存在但不是我的"和"vault 根本不存在"）。这个产品层面的差异被保留了——它没有直接
用 `requireOwnerAccess`（固定返回 403），而是自己包了一层 `requireOwnerOr404`，底层判定逻辑仍然是
同一个 `assertOwnerAccess`，只是这个文件自己决定把结果映射成什么状态码。

**另一个需要你知道的行为变化**：统一之后，`assertOwnerAccess` 对管理员有豁免（和应用里其他"所有者级"
检查的豁免规则一致）。这意味着 `create_share_link`（MCP）和 `POST /vaults/:vaultId/shares`（REST）
现在也允许管理员越权管理——**之前这两个接口是没有管理员豁免的**。考虑到管理员在这个应用里本来就对
所有 vault 有完整的读写权限（`hasReadAccess`/`hasWriteAccess` 都豁免管理员），我认为让管理员也能
管理分享链接是一致且合理的延伸，不是新增的越权点；但这确实是一个行为变化，如果你不认同这个设计取舍，
告诉我，可以单独给分享相关的所有者检查关掉管理员豁免。

顺手还发现并修了一个小权限漏洞：`DELETE /:vaultId/sync-logs`（清空同步日志，是个改动性操作）之前
只要求了读权限，现在改成了写权限。

### 2. 自动化一致性检查：新增 `scripts/check-permission-consistency.js`
不是通用 linter，只盯这几轮审查里反复出现的三类具体问题：

1. **`src/routes/*.js` 里所有 async 路由处理函数必须用 `asyncHandler()` 包装**——没包的话，内部
   异常/reject 不会被 Express 自动捕获，请求会一直挂起而不是返回错误。这次顺便清查了一遍，把之前
   遗留的、还没包装的 async 处理函数（`adminRoutes.js`、`mcpRoutes.js`、`settingsRoutes.js`、
   `vaultExtrasRoutes.js`、`vaultRoutes.js` 里一共 20 处）全部补上了。
2. **`src/mcp.js` 里名字看起来是写/删/发布类的工具**（`write_*`、`append_*`、`prepend_*`、`patch_*`、
   `upload_*`、`move_*`、`delete_*`、`create_share*`、`git_sync*`）**必须调用
   `resolveWritableVaultId()` 或 `resolveOwnedVaultId()`**，不能只有只读级的 `resolveVaultId()`。
3. **涉及 vault 的四个路由文件里，任何 `POST`/`PUT`/`DELETE`/`PATCH` 且路径带 `:vaultId` 的路由**，
   处理函数体内必须出现权限校验调用（`requireWriteAccess`/`requireOwnerAccess`/`requireOwnerOr404`/
   `assertWriteAccess`/`assertOwnerAccess` 之一）。

跑法：`npm run check:permissions`。我在沙箱里手动验证过这三条规则真的能检测到问题（临时注入一个假的
"漏权限检查"/"漏 asyncHandler 包装"改动，确认脚本会报错退出，然后撤销改动确认恢复全绿），不是一个
写了正则但从来没触发过的摆设。

这个脚本是启发式的文本扫描，不是真正的 AST 解析——如果以后代码风格变化很大（比如换了完全不同的路由
注册写法），规则可能需要跟着调整。如果确实有正当理由要绕开某条规则（比如权限检查故意放在了更上层的
中间件里），在脚本里加个白名单，并且注释清楚为什么。

### 3. CI：新增 `.github/workflows/ci.yml`
每次 push 或 PR 到任意分支，在 Node 20.x 和 22.x 上跑：
1. `npm install`（如果你提交了 `package-lock.json` 会自动改用 `npm ci`，更快更可复现）
2. `npm run lint`（语法检查）
3. `npm run check:permissions`（上面那个一致性检查）
4. `npm test`
5. `npm audit --audit-level=high`（依赖漏洞扫描，非阻塞——只是提醒你去看一眼，不会因为有已知漏洞
   就让 CI 变红，避免上游包一有漏洞通告就阻塞你所有的开发）

新增了 `npm run verify` 作为本地一键跑完前三步的命令（lint + check:permissions + test），推荐每次
提交前自己先跑一遍。

## ⚠️ 使用前必读

1. **仓库里目前没有 `package-lock.json`**。建议你在自己的机器上跑一次 `npm install` 然后把生成的
   `package-lock.json` 提交进仓库——这样 CI 会用 `npm ci`（更快、版本更可控），而且能让
   Dependabot/`npm audit` 真正发挥作用。
2. `npm run check:permissions` 和其他脚本一样，在这个沙箱环境里跑不了完整依赖链，但**这一个脚本
   本身是零依赖的纯文本扫描**，已经在沙箱里手动验证过逻辑正确。
3. 上面提到的"管理员豁免分享链接所有权检查"这个行为变化，如果你不认可，告诉我一声，可以单独调整。

## 建议的验证步骤

1. 提交前跑 `npm run verify`（或者分开跑 `npm run lint && npm run check:permissions && npm test`）。
2. 推一个 PR 上 GitHub，确认 Actions 里的 CI 跑起来了、状态显示正常。
3. 用一个"有写权限但不是所有者"的账号，测一下 `DELETE /api/vaults/:id/sync-logs`，确认现在会被拒绝
   （之前只要求读权限，这个漏洞算是这次顺手带上的）。
4. 如果你手痒，可以自己在某个路由文件里故意删掉一处 `requireWriteAccess` 调用，跑一下
   `npm run check:permissions`，看它是不是真的会报错——这是我在沙箱里已经验证过的，但你自己动手
   感受一下这个安全网具体长什么样也无妨。
