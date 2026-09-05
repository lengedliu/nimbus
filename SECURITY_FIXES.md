# SECURITY_FIXES — 安全强化与漏洞修复记录

## 1. 路径遍历防护 (Path Traversal Guard)
- **安全路径解析 (`safeJoin`)**：所有面向用户输入的相对文件路径均通过严格的 `safeJoin` 与 `path.normalize` 校验，拦截含有 `..`、空字节 `\0` 以及操作系统根路径逃逸的操作。
- **受保护系统目录隔离**：严格拦截对 `.git`、`.obsidian` 内部敏感配置等关键系统目录的非受控访问。

## 2. 权限校验与 RBAC 一致性
- **全路由异步异常包裹 (`asyncHandler`)**：将所有 Express 路由 handler 统一通过 `asyncHandler` 包裹，杜绝未捕获 Promise rejection 导致进程崩溃。
- **三权分立与强制校验**：针对文件与库操作强制校验所有者 (Owner)、读写协作 (Editor) 及只读 (Viewer) 权限，并在自动化 CI 脚本中加入 `check-permission-consistency.js`。

## 3. 防爆破与速率限制 (Rate Limiting)
- 对 `/api/auth/login` 与 `/api/auth/register` 设置基于 IP 的高频限流防护。
- 对通用 API 与公网分享密码验证增加防暴破限速。

## 4. 全局安全响应头
- 默认配置安全响应头（包括 `X-Content-Type-Options: nosniff`、`X-Frame-Options` 等），并在分享页实现可选的防复制与水印防护。
