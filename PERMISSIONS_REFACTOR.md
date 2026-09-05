# PERMISSIONS_REFACTOR — 权限体系重构与架构一致性记录

## 1. 细粒度 RBAC 权限矩阵
- **角色划分**：
  - **Owner（所有者）**：拥有库的所有控制权（创建、重命名、删除、成员管理、Git 绑定、权限分配）。
  - **Editor（读写协作成员）**：具备文件读写、创建、重命名、附件上传与历史快照回滚权限，无权删除库或转让所有权。
  - **Viewer（只读成员）**：仅具备阅读笔记、检索与知识图谱查看权限，拦截任何文件写操作。
  - **Admin（系统管理员）**：可跨库运维，但在用户未显式授权时遵守租户隔离原则。

## 2. 统一权限判定与断言规范 (`permissions.js`)
- 规范化导出断言方法：`assertReadAccess`、`assertWriteAccess` 与 `assertOwnerAccess`。
- 保证 REST 路由、WebSocket 同步事件及 MCP 工具调用统一走同一套权限校验断言逻辑。

## 3. 自动化权限一致性检查脚本 (`check-permission-consistency.js`)
- 静态扫描所有路由文件，自动校验所有异步路由均被 `asyncHandler` 包装，所有写类接口均包含明确的鉴权与权限断言调用。
