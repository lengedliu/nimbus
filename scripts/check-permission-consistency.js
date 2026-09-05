#!/usr/bin/env node
/**
 * 静态一致性检查——不是通用 linter，只盯这次几轮审查里反复出现的那一类 bug：
 * "同一件事（权限校验、异步错误处理）在不同地方各实现一遍，改了一处忘了另一处"。
 * 例如：webhook/数据库接口漏加管理员校验、MCP 写类工具漏加写权限校验、
 * async 路由忘了包 asyncHandler 导致请求挂起不响应。
 *
 * 跑在 CI 里（见 .github/workflows/ci.yml），任何一条规则不满足就以非 0 退出。
 * 用法：node scripts/check-permission-consistency.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ROUTES_DIR = path.join(ROOT, 'src', 'routes');
const MCP_FILE = path.join(ROOT, 'src', 'mcp.js');

const violations = [];

function fail(location, message) {
  violations.push(`${location}\n    ${message}`);
}

function lineNumberAt(source, charIndex) {
  return source.slice(0, charIndex).split('\n').length;
}

// ------------------------------------------------------------------
// 规则 1：src/routes/*.js 里所有 async 路由处理函数必须经过 asyncHandler() 包装。
// 没包的话，内部一旦抛出异常/reject，请求会永远挂起（客户端超时），而不是
// 返回一个错误响应；这正是之前 create_share_link 漏加 await 那类问题会真正
// 变成"用户遇到的故障"的原因。
// ------------------------------------------------------------------
function checkAsyncHandlerWrapping() {
  for (const file of fs.readdirSync(ROUTES_DIR)) {
    if (!file.endsWith('.js')) continue;
    const filePath = path.join(ROUTES_DIR, file);
    const src = fs.readFileSync(filePath, 'utf8');
    const re = /async \(req, res(?:, next)?\)\s*=>\s*\{/g;
    let m;
    while ((m = re.exec(src))) {
      const before = src.slice(Math.max(0, m.index - 20), m.index);
      if (/asyncHandler\(\s*$/.test(before)) continue; // 已经包过了
      const lineNo = lineNumberAt(src, m.index);
      fail(
        `src/routes/${file}:${lineNo}`,
        '这个 async 路由处理函数没有用 asyncHandler() 包装。内部抛出的异常/reject 不会被 ' +
        'Express 自动捕获，请求会一直挂起而不是返回错误响应。用 asyncHandler(async (req, res) => {...}) 包一下。'
      );
    }
  }
}

// ------------------------------------------------------------------
// 规则 2：src/mcp.js 里名字看起来是写/删/发布类操作的工具，必须调用
// resolveWritableVaultId() 或 resolveOwnedVaultId()，不能只用只读级的 resolveVaultId()。
// 这正是之前"只读协作者能通过 MCP 绕过权限修改笔记"那个漏洞的根因。
// ------------------------------------------------------------------
const MUTATING_TOOL_PREFIXES = [
  'write_', 'append_', 'prepend_', 'patch_', 'upload_', 'move_', 'delete_', 'create_share', 'git_sync',
];

function checkMcpWritePermissions() {
  const src = fs.readFileSync(MCP_FILE, 'utf8');
  const toolRe = /server\.tool\(\s*\r?\n?\s*'([a-z_]+)'/g;
  const matches = [];
  let m;
  while ((m = toolRe.exec(src))) {
    matches.push({ name: m[1], start: m.index });
  }

  for (let i = 0; i < matches.length; i++) {
    const { name, start } = matches[i];
    if (!MUTATING_TOOL_PREFIXES.some((p) => name.startsWith(p))) continue;

    const end = i + 1 < matches.length ? matches[i + 1].start : src.length;
    const block = src.slice(start, end);

    if (!/resolveWritableVaultId\(|resolveOwnedVaultId\(/.test(block)) {
      const lineNo = lineNumberAt(src, start);
      fail(
        `src/mcp.js:${lineNo} (tool "${name}")`,
        '这个工具名字看起来是写/删/发布类操作，但没有调用 resolveWritableVaultId() 或 ' +
        'resolveOwnedVaultId()。如果它只调用了只读级的 resolveVaultId()，只读协作者也能通过 ' +
        'MCP 绕过权限直接修改内容——这正是之前修过的那个漏洞的根因，别再引入第二次。'
      );
    }
  }
}

// ------------------------------------------------------------------
// 规则 3：涉及 vault 的路由文件里，任何 POST/PUT/DELETE/PATCH 且路径里带 :vaultId
// 的路由，处理函数体内必须出现权限校验调用——不能只有 requireAuth 就直接动手改数据。
// 允许的校验方式：requireWriteAccess / requireOwnerAccess / requireOwnerOr404 /
// assertWriteAccess / assertOwnerAccess（有的文件出于返回码的产品考虑自己包了一层，
// 比如 shareRoutes.js 的 requireOwnerOr404，只要底层还是调用 permissions.js 的
// assert* 函数就算数）。
// ------------------------------------------------------------------
const VAULT_ROUTE_FILES = ['fileRoutes.js', 'vaultRoutes.js', 'vaultExtrasRoutes.js', 'shareRoutes.js'];
const PERMISSION_CALL_RE = /requireWriteAccess\(|requireOwnerAccess\(|requireOwnerOr404\(|assertWriteAccess\(|assertOwnerAccess\(/;
const MUTATING_METHODS = ['post', 'put', 'delete', 'patch'];

function checkRestWritePermissions() {
  for (const file of VAULT_ROUTE_FILES) {
    const filePath = path.join(ROUTES_DIR, file);
    if (!fs.existsSync(filePath)) continue;
    const src = fs.readFileSync(filePath, 'utf8');

    const routeRe = new RegExp(
      `router\\.(${MUTATING_METHODS.join('|')})\\(\\s*['"]([^'"]*)['"]`,
      'g'
    );
    const matches = [];
    let m;
    while ((m = routeRe.exec(src))) {
      matches.push({ method: m[1], routePath: m[2], start: m.index });
    }

    // 也需要知道所有 router.<method>( 的位置（包括 get），才能正确切出每个
    // handler 的结尾（下一个 router. 调用之前）。
    const allRouterCalls = [];
    const anyRouteRe = /router\.(get|post|put|delete|patch|use)\(/g;
    while ((m = anyRouteRe.exec(src))) {
      allRouterCalls.push(m.index);
    }

    for (const { method, routePath, start } of matches) {
      if (!routePath.includes(':vaultId')) continue; // 不涉及具体某个 vault，跳过（比如"创建新 vault"）

      const nextCallIdx = allRouterCalls.find((idx) => idx > start);
      const end = nextCallIdx !== undefined ? nextCallIdx : src.length;
      const block = src.slice(start, end);

      if (!PERMISSION_CALL_RE.test(block)) {
        const lineNo = lineNumberAt(src, start);
        fail(
          `src/routes/${file}:${lineNo} (${method.toUpperCase()} ${routePath})`,
          '这是一个会修改某个 vault 内容的路由，但处理函数体内没有找到 requireWriteAccess/' +
          'requireOwnerAccess 之类的权限校验调用。如果这是有意为之（比如权限校验放在了共用中间件里），' +
          '可以把这条路由加进本脚本的白名单；否则请补上权限校验。'
        );
      }
    }
  }
}

checkAsyncHandlerWrapping();
checkMcpWritePermissions();
checkRestWritePermissions();

if (violations.length > 0) {
  console.error(`\n发现 ${violations.length} 处一致性问题：\n`);
  violations.forEach((v, i) => console.error(`${i + 1}. ${v}\n`));
  process.exit(1);
} else {
  console.log('一致性检查通过：所有 async 路由都经过 asyncHandler 包装，所有写类操作都有权限校验。');
  process.exit(0);
}
