# MCP_FIXES — Model Context Protocol (MCP) 架构与工具完善记录

## 1. 协议规范对齐与 StreamableHTTP 支持
- **StreamableHTTP 原生支持**：实现标准的 MCP StreamableHTTP 端点 (`/api/mcp`)，兼容 Cursor、Cherry Studio、Claude Desktop、Cline、Roo Code 等主流客户端通过 HTTP POST 直连，免去本地安装并启动额外 Node/Python 子进程的繁琐步骤。
- **自省与能力端点**：提供 `/api/mcp` 的标准能力探测与版本声明。

## 2. 核心 22 项工具全量落地与补全
- **知识库健康与统计**：`list_vaults`, `get_vault_stats`。
- **结构化发现与语义元数据**：`list_notes`, `get_note_metadata`（提取字数、Frontmatter、`[[Link]]` 双链拓扑与标签）。
- **读写与局部精准 Patch**：`read_note`, `write_note`, `append_note`, `prepend_note` 及 `patch_note`。
- **多模态与附件管理**：`upload_attachment` (支持 Base64 / URL 直存) 与 `get_attachment_base64`。
- **日记与随手记流**：`get_daily_note`, `append_daily_note`。
- **带上下文全文检索**：`search_notes`, `list_tags`。
- **文件组织与安全管理**：`move_note`, `delete_note`（软删除至回收站）。
- **版本快照回溯与比对**：`get_note_history`, `read_history_version`。
- **外链分享与 Git 远程同步**：`create_share_link`, `get_vault_git_status`, `git_sync_vault`。

## 3. 安全防护与上下文注入
- **Token 与 Vault 鉴权隔离**：MCP 工具调用全程受 JWT 权限控制，支持通过 `X-Default-Vault-Name` 或 `vaultId` 自动绑定操作范围，严防越权越库读写。
