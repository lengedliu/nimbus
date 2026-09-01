/**
 * Nimbus Vault Sync - Internationalization (i18n) Module
 * Supported Languages:
 *   - zh-CN: 简体中文 (Simplified Chinese)
 *   - zh-TW: 繁體中文 (Traditional Chinese)
 *   - en: English
 *   - ko: 한국어 (Korean)
 *   - ja: 日本語 (Japanese)
 */

(function () {
  'use strict';

  const LANGUAGES = {
    'zh-CN': { name: '简体中文', flag: '🇨🇳', code: 'zh-CN' },
    'zh-TW': { name: '繁體中文', flag: '🇭🇰', code: 'zh-TW' },
    'en': { name: 'English', flag: '🇺🇸', code: 'en' },
    'ko': { name: '한국어', flag: '🇰🇷', code: 'ko' },
    'ja': { name: '日本語', flag: '🇯🇵', code: 'ja' },
  };

  const TRANSLATIONS = {
    'zh-CN': {
      // 常用
      'common.save': '保存',
      'common.cancel': '取消',
      'common.confirm': '确认',
      'common.delete': '删除',
      'common.edit': '编辑',
      'common.close': '关闭',
      'common.refresh': '刷新',
      'common.search': '搜索',
      'common.copy': '复制',
      'common.copied': '已复制到剪贴板',
      'common.loading': '加载中…',
      'common.success': '操作成功',
      'common.failed': '操作失败',
      'common.error': '错误',
      'common.warning': '警告',
      'common.all': '全部',
      'common.action': '操作',
      'common.status': '状态',
      'common.created': '创建时间',
      'common.updated': '更新时间',
      'common.size': '大小',
      'common.name': '名称',
      'common.details': '详情',
      'common.back': '返回',
      'common.next': '下一步',
      'common.download': '下载',
      'common.upload': '上传',
      'common.export': '导出',
      'common.import': '导入',
      'common.enabled': '已启用',
      'common.disabled': '已禁用',
      'common.view': '查看',
      'common.preview': '预览',
      'common.none': '无',
      'common.total': '总计',
      'common.yes': '是',
      'common.no': '否',
      'common.tip': '提示',
      'common.unknown': '未知',
      'common.save_changes': '保存更改',

      // 登录
      'login.title': 'Nimbus Vault Sync',
      'login.subtitle': 'Obsidian 高速实时同步服务 · 管理后台',
      'login.server_label': '服务器地址',
      'login.server_placeholder': '留空默认当前服务器 (自动识别端口)',
      'login.username_label': '用户名',
      'login.password_label': '密码',
      'login.submit_btn': '登录',
      'login.logging_in': '正在登录…',
      'login.err_empty': '请输入用户名与密码',
      'login.err_failed': '登录失败，请检查账号密码或服务器地址',

      // 顶栏
      'topbar.search_placeholder': '全局检索笔记与内容...',
      'topbar.search_shortcut': 'Ctrl K',
      'topbar.search_title': '全局快速检索 (Ctrl+K)',
      'topbar.sync_ready': '同步服务就绪',
      'topbar.sync_running': '同步中…',
      'topbar.sync_title': '实时同步服务运行中',
      'topbar.theme_title': '切换后台主题与配色',
      'topbar.lang_title': '切换语言 / Language',
      'topbar.logout': '退出',
      'topbar.role_admin': '管理员',
      'topbar.role_user': '普通用户',

      // 主题
      'theme.default': '经典科技蓝 (默认)',
      'theme.obsidian': 'Obsidian 紫魅夜',
      'theme.emerald': '翡翠极光绿',
      'theme.azure': '深海蔚蓝',
      'theme.rose': '琥珀丝绒红',
      'theme.mono': 'OLED 纯黑极简',
      'theme.light': '明亮白昼 (Light)',

      // 侧边栏
      'sidebar.my_vaults': '我的 Vaults',
      'sidebar.new_vault': '新建 Vault',
      'sidebar.quick_tools': '快捷工具',
      'sidebar.settings': '⚙️ 设置',
      'sidebar.devices': '📱 接入设备管理',
      'sidebar.connect_guide': '⚡ Obsidian 连接指引',
      'sidebar.mcp_config': '🤖 AI / MCP 接口配置',
      'sidebar.api_docs': '📖 REST API 开发者文档',
      'sidebar.sponsor': '❤️ 支持该项目',
      'sidebar.admin_section': '系统管理',
      'sidebar.database': '🗄️ 数据库管理',
      'sidebar.webhooks': '🔔 Webhook 告警',
      'sidebar.synclogs': '📋 同步日志',
      'sidebar.all_devices': '📱 全局设备',
      'sidebar.users': '👥 用户管理',
      'sidebar.all_vaults': '📚 全局 Vault',
      'sidebar.sponsor_admin': '❤️ 赞助支持',
      'sidebar.version': '当前版本',

      // 空白页
      'empty.welcome_title': '欢迎使用 Nimbus Vault Sync',
      'empty.welcome_desc': '从左侧选择一个 Vault 开始管理，或新建一个 Vault 进行 Obsidian 同步',
      'empty.no_vaults': '暂无可用 Vault，点击左上方「+」按钮即可创建新仓库',
      'empty.create_vault_btn': '➕ 创建首个 Vault',

      // Vault 详情
      'vault.tab_files': '📄 笔记文件',
      'vault.tab_stats': '📊 统计分析',
      'vault.tab_shares': '🔗 分享协作',
      'vault.tab_rules': '🛡️ 同步规则',
      'vault.tab_trash': '🗑️ 回收站',
      'vault.overview_files': '文件数量',
      'vault.overview_size': '占用空间',
      'vault.overview_last_sync': '最后同步',
      'vault.never_synced': '尚未同步',
      'vault.sync_guide_btn': '⚡ Obsidian 同步指引',
      'vault.settings_btn': '⚙️ 仓库配置',

      // 文件列表与操作
      'files.tree_view': '树形目录',
      'files.flat_view': '扁平列表',
      'files.filter_all': '全部文件',
      'files.filter_md': 'Markdown 笔记',
      'files.filter_media': '媒体资源',
      'files.filter_config': '配置与数据',
      'files.sort_ctime_desc': '创建时间 (新→旧)',
      'files.sort_ctime_asc': '创建时间 (旧→新)',
      'files.sort_mtime_desc': '修改时间 (最新)',
      'files.sort_name_asc': '名称排序 (A→Z)',
      'files.search_placeholder': '在当前 Vault 中筛选路径或文件名…',
      'files.upload_btn': '📤 上传文件',
      'files.new_note_btn': '➕ 新建笔记',
      'files.download_zip': '📦 打包下载',
      'files.empty_vault': '当前仓库暂无文件，可通过 Obsidian 客户端同步或直接上传',
      'files.drop_hint': '拖拽文件或文件夹到此处即可直接上传',
      'files.delete_confirm': '确定删除该文件吗？删除后可在回收站中找回。',
      'files.history': '版本历史',
      'files.diff': '版本对比',
      'files.rename': '重命名',
      'files.preview': '预览/编辑',

      // 统计分析
      'stats.title': '仓库统计与分析',
      'stats.total_files': '总文件数',
      'stats.md_files': 'Markdown 笔记',
      'stats.media_files': '媒体与附件',
      'stats.other_files': '其他文件',
      'stats.total_size': '总存储大小',
      'stats.growth_trend': '存储与活跃趋势',
      'stats.top_large_files': '最大占用文件排行',

      // 分享
      'shares.title': '公开与加密分享链接',
      'shares.create_btn': '➕ 创建分享链接',
      'shares.link': '分享链接',
      'shares.pwd': '访问密码',
      'shares.expires': '有效期限',
      'shares.permission': '访问权限',
      'shares.readonly': '只读浏览',
      'shares.readwrite': '允许编辑',
      'shares.no_shares': '暂无分享链接',

      // 规则
      'rules.title': '同步过滤与忽略规则',
      'rules.desc': '设置不需要同步到本服务器的文件或目录（支持通配符 glob 规则，每行一条）',
      'rules.save_btn': '保存忽略规则',

      // 回收站
      'trash.title': '文件回收站',
      'trash.desc': '已删除的文件将在此暂存，支持随时恢复或彻底粉碎',
      'trash.restore_btn': '恢复文件',
      'trash.delete_forever': '彻底删除',
      'trash.empty_btn': '清空回收站',
      'trash.empty_confirm': '确定清空回收站吗？清空后所有文件将无法找回！',
      'trash.no_items': '回收站为空，没有任何已删除的文件',

      // 设置
      'settings.title': '⚙️ 系统与个人偏好设置',
      'settings.server_info': '服务器状态与运行信息',
      'settings.version': '程序版本',
      'settings.uptime': '运行时间',
      'settings.storage_path': '存储路径',
      'settings.git_backup': 'Git 自动备份与远程同步',
      'settings.git_desc': '支持将所有 Vault 定时自动 commit 并 push 到 GitHub/Gitee 私有仓库',
      'settings.git_remote': '远程 Git 仓库 URL',
      'settings.git_branch': '目标分支',
      'settings.git_push_now': '🚀 立即执行 Git 备份',
      'settings.token_title': 'API Token 与访问凭证',
      'settings.token_desc': '用于 Obsidian 插件、MCP 服务或外部脚本认证',
      'settings.lang_title': '界面语言偏好',
      'settings.theme_title': '主题配色方案',

      // 数据库管理
      'db.title': '🗄️ 数据库引擎与数据管理',
      'db.current_engine': '当前数据库类型',
      'db.sqlite': 'SQLite 本地轻量数据库',
      'db.mysql': 'MySQL / MariaDB 分布式数据库',
      'db.postgres': 'PostgreSQL 高性能数据库',
      'db.total_records': '总记录数',
      'db.export_btn': '💾 备份数据库',
      'db.vacuum_btn': '🧹 碎片整理与优化',

      // Webhooks
      'webhooks.title': '🔔 Webhook 告警与事件通知',
      'webhooks.desc': '当 Vault 发生同步、冲突、文件修改或登录异常时自动推送通知',
      'webhooks.add_btn': '➕ 添加 Webhook',
      'webhooks.url': 'Webhook URL',
      'webhooks.events': '订阅事件',
      'webhooks.test_btn': '🧪 发送测试通知',

      // 同步日志
      'logs.title': '📋 实时同步与审计日志',
      'logs.desc': '查看多终端客户端的同步请求、文件变更详情与错误告警',
      'logs.filter_vault': '按 Vault 筛选',
      'logs.filter_device': '按设备筛选',
      'logs.auto_refresh': '自动轮询刷新',
      'logs.clear_btn': '清空日志',
      'logs.export_btn': '导出 CSV 日志',

      // 设备管理
      'devices.title': '📱 接入设备与客户端管理',
      'devices.desc': '查看已授权同步的 Obsidian 客户端、移动端、平板或自动化脚本',
      'devices.device_name': '设备名称',
      'devices.client_type': '客户端类型',
      'devices.ip': '接入 IP',
      'devices.last_active': '最近同步活跃',
      'devices.revoke_btn': '吊销授权',

      // 用户管理
      'users.title': '👥 用户与权限管理',
      'users.add_btn': '➕ 新增用户',
      'users.username': '用户名',
      'users.role': '角色',
      'users.admin': '系统管理员',
      'users.regular': '普通用户',
      'users.reset_pwd': '重置密码',
      'users.delete': '删除用户',

      // 全局 Vaults
      'all_vaults.title': '📚 全局 Vault 资源总览',
      'all_vaults.desc': '系统内所有用户创建的知识库列表及存储占用情况',
      'all_vaults.owner': '所有者',

      // Obsidian 连接指引
      'connect.title': '⚡ Obsidian 客户端极速连接指引',
      'connect.subtitle': '3 步即可在 Obsidian 桌面端与移动端实现毫秒级自动同步',
      'connect.step1_title': '第一步：安装 Nimbus Sync 插件',
      'connect.step1_desc': '在 Obsidian 设置中安装 Community Plugin，或将插件文件解压到 .obsidian/plugins/nimbus-vault-sync',
      'connect.step2_title': '第二步：填入服务器连接参数',
      'connect.server_url': '服务器地址 (Server URL)',
      'connect.auth_token': '认证令牌 (Auth Token)',
      'connect.vault_id': 'Vault ID',
      'connect.step3_title': '第三步：点击测试连接并开启自动同步',
      'connect.copy_all': '📋 一键复制全部连接配置',

      // MCP 配置
      'mcp.title': '🤖 AI / MCP (Model Context Protocol) 接口配置',
      'mcp.subtitle': '让 Claude Desktop、Cursor、Cline 等 AI 助手直接理解并检索您的 Obsidian 笔记',
      'mcp.claude_title': 'Claude Desktop 配置文件 (claude_desktop_config.json)',
      'mcp.cursor_title': 'Cursor / Windsurf / Cline 配置',
      'mcp.copy_btn': '📋 复制 JSON 配置',
      'mcp.tools_title': '已启用的 20 个 MCP 原生知识库检索与管理工具',

      // REST API
      'docs.title': '📖 REST API 开发者文档',
      'docs.subtitle': '标准 HTTP RESTful 接口规范，支持与第三方系统或脚本自动化对接',
      'docs.auth_header': '认证请求头',

      // 赞助支持
      'sponsor.title': '❤️ 赞助与支持 Nimbus Vault Sync',
      'sponsor.subtitle': '如果这个项目帮助到您，欢迎支持作者持续开发与维护！',
      'sponsor.kofi_title': '请作者喝杯咖啡 (Ko-fi)',
      'sponsor.kofi_desc': '支持国际信用卡、PayPal 等快捷赞助方式',
      'sponsor.wechat_title': '微信打赏支持',
      'sponsor.wechat_desc': '打开微信「扫一扫」即可直接支持',
      'sponsor.alipay_title': '支付宝支持',
      'sponsor.config_btn': '⚙️ 赞助方式配置',
      'sponsor.wall_title': '🌟 赞助者芳名录',
      'sponsor.total_amount': '累计获赠赞助',
      'sponsor.supporters_count': '位支持者',
      'sponsor.empty_wall': '暂无赞助记录，感谢每一位支持开源的朋友！',
    },

    'zh-TW': {
      // 常用
      'common.save': '儲存',
      'common.cancel': '取消',
      'common.confirm': '確認',
      'common.delete': '刪除',
      'common.edit': '編輯',
      'common.close': '關閉',
      'common.refresh': '重新整理',
      'common.search': '搜尋',
      'common.copy': '複製',
      'common.copied': '已複製到剪貼簿',
      'common.loading': '載入中…',
      'common.success': '操作成功',
      'common.failed': '操作失敗',
      'common.error': '錯誤',
      'common.warning': '警告',
      'common.all': '全部',
      'common.action': '操作',
      'common.status': '狀態',
      'common.created': '建立時間',
      'common.updated': '更新時間',
      'common.size': '大小',
      'common.name': '名稱',
      'common.details': '詳細資訊',
      'common.back': '返回',
      'common.next': '下一步',
      'common.download': '下載',
      'common.upload': '上傳',
      'common.export': '匯出',
      'common.import': '匯入',
      'common.enabled': '已啟用',
      'common.disabled': '已停用',
      'common.view': '查看',
      'common.preview': '預覽',
      'common.none': '無',
      'common.total': '總計',
      'common.yes': '是',
      'common.no': '否',
      'common.tip': '提示',
      'common.unknown': '未知',
      'common.save_changes': '儲存變更',

      // 登錄
      'login.title': 'Nimbus Vault Sync',
      'login.subtitle': 'Obsidian 高速即時同步服務 · 管理後台',
      'login.server_label': '伺服器位址',
      'login.server_placeholder': '留空預設當前伺服器 (自動識別埠號)',
      'login.username_label': '使用者名稱',
      'login.password_label': '密碼',
      'login.submit_btn': '登入',
      'login.logging_in': '正在登入…',
      'login.err_empty': '請輸入使用者名稱與密碼',
      'login.err_failed': '登入失敗，請檢查帳號密碼或伺服器位址',

      // 頂欄
      'topbar.search_placeholder': '全域檢索筆記與內容...',
      'topbar.search_shortcut': 'Ctrl K',
      'topbar.search_title': '全域快速檢索 (Ctrl+K)',
      'topbar.sync_ready': '同步服務就緒',
      'topbar.sync_running': '同步中…',
      'topbar.sync_title': '即時同步服務運作中',
      'topbar.theme_title': '切換後台主題與配色',
      'topbar.lang_title': '切換語言 / Language',
      'topbar.logout': '登出',
      'topbar.role_admin': '管理員',
      'topbar.role_user': '一般使用者',

      // 主題
      'theme.default': '經典科技藍 (預設)',
      'theme.obsidian': 'Obsidian 紫魅夜',
      'theme.emerald': '翡翠極光綠',
      'theme.azure': '深海蔚藍',
      'theme.rose': '琥珀絲絨紅',
      'theme.mono': 'OLED 純黑極簡',
      'theme.light': '明亮白晝 (Light)',

      // 側邊欄
      'sidebar.my_vaults': '我的 Vaults',
      'sidebar.new_vault': '新建 Vault',
      'sidebar.quick_tools': '快捷工具',
      'sidebar.settings': '⚙️ 設定',
      'sidebar.devices': '📱 接入裝置管理',
      'sidebar.connect_guide': '⚡ Obsidian 連線指引',
      'sidebar.mcp_config': '🤖 AI / MCP 介面配置',
      'sidebar.api_docs': '📖 REST API 開發者文件',
      'sidebar.sponsor': '❤️ 支持該專案',
      'sidebar.admin_section': '系統管理',
      'sidebar.database': '🗄️ 資料庫管理',
      'sidebar.webhooks': '🔔 Webhook 警報',
      'sidebar.synclogs': '📋 同步日誌',
      'sidebar.all_devices': '📱 全域裝置',
      'sidebar.users': '👥 使用者管理',
      'sidebar.all_vaults': '📚 全域 Vault',
      'sidebar.sponsor_admin': '❤️ 贊助支持',
      'sidebar.version': '目前版本',

      // 空白頁
      'empty.welcome_title': '歡迎使用 Nimbus Vault Sync',
      'empty.welcome_desc': '從左側選擇一個 Vault 開始管理，或新建一個 Vault 進行 Obsidian 同步',
      'empty.no_vaults': '暫無可用 Vault，點擊左上方「+」按鈕即可建立新倉庫',
      'empty.create_vault_btn': '➕ 建立首個 Vault',

      // Vault 詳情
      'vault.tab_files': '📄 筆記檔案',
      'vault.tab_stats': '📊 統計分析',
      'vault.tab_shares': '🔗 分享協作',
      'vault.tab_rules': '🛡️ 同步規則',
      'vault.tab_trash': '🗑️ 資源回收筒',
      'vault.overview_files': '檔案數量',
      'vault.overview_size': '佔用空間',
      'vault.overview_last_sync': '最後同步',
      'vault.never_synced': '尚未同步',
      'vault.sync_guide_btn': '⚡ Obsidian 同步指引',
      'vault.settings_btn': '⚙️ 倉庫設定',

      // 檔案列表與操作
      'files.tree_view': '樹狀目錄',
      'files.flat_view': '扁平列表',
      'files.filter_all': '全部檔案',
      'files.filter_md': 'Markdown 筆記',
      'files.filter_media': '媒體資源',
      'files.filter_config': '設定與資料',
      'files.sort_ctime_desc': '建立時間 (新→舊)',
      'files.sort_ctime_asc': '建立時間 (舊→新)',
      'files.sort_mtime_desc': '修改時間 (最新)',
      'files.sort_name_asc': '名稱排序 (A→Z)',
      'files.search_placeholder': '在目前 Vault 中篩選路徑或檔案名稱…',
      'files.upload_btn': '📤 上傳檔案',
      'files.new_note_btn': '➕ 新建筆記',
      'files.download_zip': '📦 打包下載',
      'files.empty_vault': '目前倉庫暫無檔案，可透過 Obsidian 用戶端同步或直接上傳',
      'files.drop_hint': '拖曳檔案或資料夾至此即可直接上傳',
      'files.delete_confirm': '確定刪除該檔案嗎？刪除後可在資源回收筒中找回。',
      'files.history': '版本歷史',
      'files.diff': '版本比對',
      'files.rename': '重新命名',
      'files.preview': '預覽/編輯',

      // 統計分析
      'stats.title': '倉庫統計與分析',
      'stats.total_files': '總檔案數',
      'stats.md_files': 'Markdown 筆記',
      'stats.media_files': '媒體與附件',
      'stats.other_files': '其他檔案',
      'stats.total_size': '總儲存空間',
      'stats.growth_trend': '儲存與活躍趨勢',
      'stats.top_large_files': '最大佔用檔案排行',

      // 分享
      'shares.title': '公開與加密分享連結',
      'shares.create_btn': '➕ 建立分享連結',
      'shares.link': '分享連結',
      'shares.pwd': '存取密碼',
      'shares.expires': '有效期限',
      'shares.permission': '存取權限',
      'shares.readonly': '唯讀瀏覽',
      'shares.readwrite': '允許編輯',
      'shares.no_shares': '暫無分享連結',

      // 規則
      'rules.title': '同步過濾與忽略規則',
      'rules.desc': '設定不需要同步至本伺服器的檔案或目錄（支援通配符 glob 規則，每行一條）',
      'rules.save_btn': '儲存忽略規則',

      // 回收站
      'trash.title': '檔案資源回收筒',
      'trash.desc': '已刪除的檔案將在此暫存，支援隨時還原或徹底粉碎',
      'trash.restore_btn': '還原檔案',
      'trash.delete_forever': '徹底刪除',
      'trash.empty_btn': '清空資源回收筒',
      'trash.empty_confirm': '確定清空資源回收筒嗎？清空後所有檔案將無法找回！',
      'trash.no_items': '資源回收筒為空，沒有任何已刪除的檔案',

      // 設定
      'settings.title': '⚙️ 系統與個人偏好設定',
      'settings.server_info': '伺服器狀態與運作資訊',
      'settings.version': '程式版本',
      'settings.uptime': '運作時間',
      'settings.storage_path': '儲存路徑',
      'settings.git_backup': 'Git 自動備份與遠端同步',
      'settings.git_desc': '支援將所有 Vault 定時自動 commit 並 push 至 GitHub/Gitee 私有倉庫',
      'settings.git_remote': '遠端 Git 倉庫 URL',
      'settings.git_branch': '目標分支',
      'settings.git_push_now': '🚀 立即執行 Git 備份',
      'settings.token_title': 'API Token 與存取憑證',
      'settings.token_desc': '用於 Obsidian 外掛、MCP 服務或外部腳本認證',
      'settings.lang_title': '介面語言偏好',
      'settings.theme_title': '主題配色方案',

      // 資料庫管理
      'db.title': '🗄️ 資料庫引擎與資料管理',
      'db.current_engine': '目前資料庫類型',
      'db.sqlite': 'SQLite 本地輕量資料庫',
      'db.mysql': 'MySQL / MariaDB 分布式資料庫',
      'db.postgres': 'PostgreSQL 高效能資料庫',
      'db.total_records': '總記錄數',
      'db.export_btn': '💾 備份資料庫',
      'db.vacuum_btn': '🧹 碎片重組與最佳化',

      // Webhooks
      'webhooks.title': '🔔 Webhook 警報與事件通知',
      'webhooks.desc': '當 Vault 發生同步、衝突、檔案修改或登入異常時自動推播通知',
      'webhooks.add_btn': '➕ 新增 Webhook',
      'webhooks.url': 'Webhook URL',
      'webhooks.events': '訂閱事件',
      'webhooks.test_btn': '🧪 發送測試通知',

      // 同步日誌
      'logs.title': '📋 即時同步與稽核日誌',
      'logs.desc': '檢視多終端用戶端的同步請求、檔案變更詳情與錯誤警報',
      'logs.filter_vault': '依 Vault 篩選',
      'logs.filter_device': '依裝置篩選',
      'logs.auto_refresh': '自動輪詢重新整理',
      'logs.clear_btn': '清空日誌',
      'logs.export_btn': '匯出 CSV 日誌',

      // 裝置管理
      'devices.title': '📱 接入裝置與用戶端管理',
      'devices.desc': '檢視已授權同步的 Obsidian 用戶端、行動端、平板或自動化腳本',
      'devices.device_name': '裝置名稱',
      'devices.client_type': '用戶端類型',
      'devices.ip': '接入 IP',
      'devices.last_active': '最近同步活躍',
      'devices.revoke_btn': '撤銷授權',

      // 使用者管理
      'users.title': '👥 使用者與權限管理',
      'users.add_btn': '➕ 新增使用者',
      'users.username': '使用者名稱',
      'users.role': '角色',
      'users.admin': '系統管理員',
      'users.regular': '一般使用者',
      'users.reset_pwd': '重設密碼',
      'users.delete': '刪除使用者',

      // 全局 Vaults
      'all_vaults.title': '📚 全域 Vault 資源總覽',
      'all_vaults.desc': '系統內所有使用者建立的知識庫列表及儲存佔用情況',
      'all_vaults.owner': '擁有者',

      // Obsidian 連線指引
      'connect.title': '⚡ Obsidian 用戶端極速連線指引',
      'connect.subtitle': '3 步驟即可在 Obsidian 桌面端與行動端實現毫秒級自動同步',
      'connect.step1_title': '第一步：安裝 Nimbus Sync 外掛',
      'connect.step1_desc': '在 Obsidian 設定中安裝 Community Plugin，或將外掛檔案解壓至 .obsidian/plugins/nimbus-vault-sync',
      'connect.step2_title': '第二步：填入伺服器連線參數',
      'connect.server_url': '伺服器位址 (Server URL)',
      'connect.auth_token': '認證權杖 (Auth Token)',
      'connect.vault_id': 'Vault ID',
      'connect.step3_title': '第三步：點擊測試連線並開啟自動同步',
      'connect.copy_all': '📋 一鍵複製全部連線配置',

      // MCP 配置
      'mcp.title': '🤖 AI / MCP (Model Context Protocol) 介面配置',
      'mcp.subtitle': '讓 Claude Desktop、Cursor、Cline 等 AI 助手直接理解並檢索您的 Obsidian 筆記',
      'mcp.claude_title': 'Claude Desktop 設定檔 (claude_desktop_config.json)',
      'mcp.cursor_title': 'Cursor / Windsurf / Cline 配置',
      'mcp.copy_btn': '📋 複製 JSON 配置',
      'mcp.tools_title': '已啟用的 20 個 MCP 原生知識庫檢索與管理工具',

      // REST API
      'docs.title': '📖 REST API 開發者文件',
      'docs.subtitle': '標準 HTTP RESTful 介面規範，支援與第三方系統或腳本自動化對接',
      'docs.auth_header': '認證請求標頭',

      // 贊助支持
      'sponsor.title': '❤️ 贊助與支持 Nimbus Vault Sync',
      'sponsor.subtitle': '如果這個專案幫助到您，歡迎支持作者持續開發與維護！',
      'sponsor.kofi_title': '請作者喝杯咖啡 (Ko-fi)',
      'sponsor.kofi_desc': '支援國際信用卡、PayPal 等快捷贊助方式',
      'sponsor.wechat_title': '微信打賞支持',
      'sponsor.wechat_desc': '開啟微信「掃一掃」即可直接支持',
      'sponsor.alipay_title': '支付寶支持',
      'sponsor.config_btn': '⚙️ 贊助方式配置',
      'sponsor.wall_title': '🌟 贊助者芳名錄',
      'sponsor.total_amount': '累計獲贈贊助',
      'sponsor.supporters_count': '位支持者',
      'sponsor.empty_wall': '暫無贊助記錄，感謝每一位支持開源的朋友！',
    },

    'en': {
      // Common
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.confirm': 'Confirm',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.close': 'Close',
      'common.refresh': 'Refresh',
      'common.search': 'Search',
      'common.copy': 'Copy',
      'common.copied': 'Copied to clipboard',
      'common.loading': 'Loading…',
      'common.success': 'Success',
      'common.failed': 'Operation Failed',
      'common.error': 'Error',
      'common.warning': 'Warning',
      'common.all': 'All',
      'common.action': 'Action',
      'common.status': 'Status',
      'common.created': 'Created At',
      'common.updated': 'Updated At',
      'common.size': 'Size',
      'common.name': 'Name',
      'common.details': 'Details',
      'common.back': 'Back',
      'common.next': 'Next',
      'common.download': 'Download',
      'common.upload': 'Upload',
      'common.export': 'Export',
      'common.import': 'Import',
      'common.enabled': 'Enabled',
      'common.disabled': 'Disabled',
      'common.view': 'View',
      'common.preview': 'Preview',
      'common.none': 'None',
      'common.total': 'Total',
      'common.yes': 'Yes',
      'common.no': 'No',
      'common.tip': 'Tip',
      'common.unknown': 'Unknown',
      'common.save_changes': 'Save Changes',

      // Login
      'login.title': 'Nimbus Vault Sync',
      'login.subtitle': 'High-performance Obsidian Sync Server & Dashboard',
      'login.server_label': 'Server Address',
      'login.server_placeholder': 'Leave empty for current server (auto-detected port)',
      'login.username_label': 'Username',
      'login.password_label': 'Password',
      'login.submit_btn': 'Sign In',
      'login.logging_in': 'Signing in…',
      'login.err_empty': 'Please enter both username and password',
      'login.err_failed': 'Sign-in failed. Please verify credentials or server URL.',

      // Topbar
      'topbar.search_placeholder': 'Search all notes and contents...',
      'topbar.search_shortcut': 'Ctrl K',
      'topbar.search_title': 'Global Fast Search (Ctrl+K)',
      'topbar.sync_ready': 'Sync Service Ready',
      'topbar.sync_running': 'Syncing…',
      'topbar.sync_title': 'Realtime Sync Service Online',
      'topbar.theme_title': 'Switch Theme & Color Palette',
      'topbar.lang_title': 'Language / 多语言',
      'topbar.logout': 'Sign Out',
      'topbar.role_admin': 'Admin',
      'topbar.role_user': 'User',

      // Themes
      'theme.default': 'Classic Cyber Blue (Default)',
      'theme.obsidian': 'Obsidian Midnight Purple',
      'theme.emerald': 'Emerald Aurora Green',
      'theme.azure': 'Deep Sea Azure',
      'theme.rose': 'Amber Velvet Rose',
      'theme.mono': 'OLED Pure Minimal Dark',
      'theme.light': 'Bright Daylight (Light)',

      // Sidebar
      'sidebar.my_vaults': 'My Vaults',
      'sidebar.new_vault': 'New Vault',
      'sidebar.quick_tools': 'Quick Tools',
      'sidebar.settings': '⚙️ Settings',
      'sidebar.devices': '📱 Device Management',
      'sidebar.connect_guide': '⚡ Obsidian Connect Guide',
      'sidebar.mcp_config': '🤖 AI / MCP Integration',
      'sidebar.api_docs': '📖 REST API Documentation',
      'sidebar.sponsor': '❤️ Support Project',
      'sidebar.admin_section': 'System Admin',
      'sidebar.database': '🗄️ Database Engine',
      'sidebar.webhooks': '🔔 Webhooks & Alerts',
      'sidebar.synclogs': '📋 Sync Audit Logs',
      'sidebar.all_devices': '📱 Global Devices',
      'sidebar.users': '👥 User Management',
      'sidebar.all_vaults': '📚 Global Vaults',
      'sidebar.sponsor_admin': '❤️ Sponsor & Support',
      'sidebar.version': 'Version',

      // Empty states
      'empty.welcome_title': 'Welcome to Nimbus Vault Sync',
      'empty.welcome_desc': 'Select a Vault from the left sidebar to manage notes, or create a new Vault for Obsidian sync.',
      'empty.no_vaults': 'No vaults available. Click the "+" button in the top left to create your first vault.',
      'empty.create_vault_btn': '➕ Create First Vault',

      // Vault details
      'vault.tab_files': '📄 Notes & Files',
      'vault.tab_stats': '📊 Analytics',
      'vault.tab_shares': '🔗 Sharing',
      'vault.tab_rules': '🛡️ Sync Rules',
      'vault.tab_trash': '🗑️ Trash Bin',
      'vault.overview_files': 'Total Files',
      'vault.overview_size': 'Storage Used',
      'vault.overview_last_sync': 'Last Synced',
      'vault.never_synced': 'Never synced',
      'vault.sync_guide_btn': '⚡ Obsidian Setup Guide',
      'vault.settings_btn': '⚙️ Vault Settings',

      // Files
      'files.tree_view': 'Tree View',
      'files.flat_view': 'Flat List',
      'files.filter_all': 'All Files',
      'files.filter_md': 'Markdown Notes',
      'files.filter_media': 'Media & Attachments',
      'files.filter_config': 'Configs & Data',
      'files.sort_ctime_desc': 'Created (Newest First)',
      'files.sort_ctime_asc': 'Created (Oldest First)',
      'files.sort_mtime_desc': 'Modified (Recently Updated)',
      'files.sort_name_asc': 'Name (A→Z)',
      'files.search_placeholder': 'Filter files or paths in this Vault…',
      'files.upload_btn': '📤 Upload Files',
      'files.new_note_btn': '➕ New Note',
      'files.download_zip': '📦 Download Zip',
      'files.empty_vault': 'This Vault is empty. Sync from Obsidian client or upload files directly.',
      'files.drop_hint': 'Drop files or folders here to upload instantly',
      'files.delete_confirm': 'Are you sure you want to delete this file? It can be restored from the Trash.',
      'files.history': 'Version History',
      'files.diff': 'Diff Changes',
      'files.rename': 'Rename',
      'files.preview': 'Preview / Edit',

      // Stats
      'stats.title': 'Vault Analytics & Insights',
      'stats.total_files': 'Total Files',
      'stats.md_files': 'Markdown Notes',
      'stats.media_files': 'Media Attachments',
      'stats.other_files': 'Other Files',
      'stats.total_size': 'Total Storage Size',
      'stats.growth_trend': 'Storage & Activity Trends',
      'stats.top_large_files': 'Largest Files Overview',

      // Shares
      'shares.title': 'Public & Encrypted Share Links',
      'shares.create_btn': '➕ Create Share Link',
      'shares.link': 'Share URL',
      'shares.pwd': 'Passcode',
      'shares.expires': 'Expires At',
      'shares.permission': 'Permissions',
      'shares.readonly': 'Read-only',
      'shares.readwrite': 'Editable',
      'shares.no_shares': 'No active share links created yet.',

      // Rules
      'rules.title': 'Sync Filter & Ignore Rules',
      'rules.desc': 'Specify patterns of files/directories to ignore during sync (glob pattern per line)',
      'rules.save_btn': 'Save Ignore Rules',

      // Trash
      'trash.title': 'Vault Trash Bin',
      'trash.desc': 'Deleted files are temporarily stored here and can be restored or permanently removed anytime.',
      'trash.restore_btn': 'Restore File',
      'trash.delete_forever': 'Delete Permanently',
      'trash.empty_btn': 'Empty Trash',
      'trash.empty_confirm': 'Are you sure you want to empty the trash? All deleted items will be lost forever!',
      'trash.no_items': 'Trash bin is completely empty.',

      // Settings
      'settings.title': '⚙️ System & User Preferences',
      'settings.server_info': 'Server Runtime & Environment',
      'settings.version': 'App Version',
      'settings.uptime': 'Uptime',
      'settings.storage_path': 'Data Directory',
      'settings.git_backup': 'Git Auto Backup & Remote Sync',
      'settings.git_desc': 'Automatically commit and push all Vaults to a remote GitHub/Gitee private repository.',
      'settings.git_remote': 'Remote Git Repo URL',
      'settings.git_branch': 'Target Branch',
      'settings.git_push_now': '🚀 Trigger Git Backup Now',
      'settings.token_title': 'API Tokens & Access Credentials',
      'settings.token_desc': 'Used for Obsidian Plugin, MCP Server, or external automated scripts.',
      'settings.lang_title': 'Interface Language',
      'settings.theme_title': 'Theme Palette',

      // Database
      'db.title': '🗄️ Database Engine & Migration',
      'db.current_engine': 'Active Database Engine',
      'db.sqlite': 'SQLite Local Storage',
      'db.mysql': 'MySQL / MariaDB Enterprise',
      'db.postgres': 'PostgreSQL High-Performance',
      'db.total_records': 'Total Records',
      'db.export_btn': '💾 Backup Database',
      'db.vacuum_btn': '🧹 Defragment & Vacuum',

      // Webhooks
      'webhooks.title': '🔔 Webhooks & Alert Notifications',
      'webhooks.desc': 'Receive instant push alerts on file sync, conflicts, or system security events.',
      'webhooks.add_btn': '➕ Add Webhook',
      'webhooks.url': 'Webhook Target URL',
      'webhooks.events': 'Subscribed Events',
      'webhooks.test_btn': '🧪 Send Test Payload',

      // Logs
      'logs.title': '📋 Realtime Sync & Audit Logs',
      'logs.desc': 'Inspect incoming multi-client sync requests, delta changes, and security events.',
      'logs.filter_vault': 'Filter by Vault',
      'logs.filter_device': 'Filter by Device',
      'logs.auto_refresh': 'Auto Poll & Stream',
      'logs.clear_btn': 'Clear Logs',
      'logs.export_btn': 'Export CSV Logs',

      // Devices
      'devices.title': '📱 Connected Devices & Clients',
      'devices.desc': 'Manage registered Obsidian desktop, tablet, and mobile sync clients.',
      'devices.device_name': 'Device Name',
      'devices.client_type': 'Client Type',
      'devices.ip': 'Client IP',
      'devices.last_active': 'Last Active Sync',
      'devices.revoke_btn': 'Revoke Access',

      // Users
      'users.title': '👥 Users & Access Control',
      'users.add_btn': '➕ Add New User',
      'users.username': 'Username',
      'users.role': 'Role',
      'users.admin': 'Administrator',
      'users.regular': 'Standard User',
      'users.reset_pwd': 'Reset Password',
      'users.delete': 'Delete User',

      // All Vaults
      'all_vaults.title': '📚 Global Vaults Inventory',
      'all_vaults.desc': 'Overview of all knowledge vaults created across the organization and their storage sizes.',
      'all_vaults.owner': 'Owner',

      // Obsidian Guide
      'connect.title': '⚡ Obsidian Fast Connection Guide',
      'connect.subtitle': 'Synchronize your notes between Desktop and Mobile in 3 easy steps.',
      'connect.step1_title': 'Step 1: Install Nimbus Sync Plugin',
      'connect.step1_desc': 'Install the Community Plugin in Obsidian settings, or unzip into .obsidian/plugins/nimbus-vault-sync',
      'connect.step2_title': 'Step 2: Configure Server Parameters',
      'connect.server_url': 'Server URL',
      'connect.auth_token': 'Auth Token',
      'connect.vault_id': 'Vault ID',
      'connect.step3_title': 'Step 3: Test Connection & Enable Auto Sync',
      'connect.copy_all': '📋 Copy Full Connection Config',

      // MCP
      'mcp.title': '🤖 AI / MCP (Model Context Protocol) Setup',
      'mcp.subtitle': 'Empower Claude Desktop, Cursor, and Cline to index and query your Obsidian Vaults natively.',
      'mcp.claude_title': 'Claude Desktop Config (claude_desktop_config.json)',
      'mcp.cursor_title': 'Cursor / Windsurf / Cline Config',
      'mcp.copy_btn': '📋 Copy JSON Config',
      'mcp.tools_title': '20 Native MCP Knowledge Base Tools Configured',

      // Docs
      'docs.title': '📖 REST API Developer Documentation',
      'docs.subtitle': 'Standard HTTP RESTful API endpoints for external integrations and scripting.',
      'docs.auth_header': 'Authentication Header',

      // Sponsor
      'sponsor.title': '❤️ Sponsor & Support Nimbus Vault Sync',
      'sponsor.subtitle': 'If this open-source tool has helped your workflow, consider supporting ongoing development!',
      'sponsor.kofi_title': 'Support on Ko-fi',
      'sponsor.kofi_desc': 'Support via Credit Card, PayPal, and international payment methods.',
      'sponsor.wechat_title': 'WeChat Pay Reward',
      'sponsor.wechat_desc': 'Scan with WeChat Pay app to support the author.',
      'sponsor.alipay_title': 'Alipay Support',
      'sponsor.config_btn': '⚙️ Payment & Tip Config',
      'sponsor.wall_title': '🌟 Wall of Supporters',
      'sponsor.total_amount': 'Total Donations Received',
      'sponsor.supporters_count': 'Supporters',
      'sponsor.empty_wall': 'No sponsorship records yet. Thank you for supporting open source!',
    },

    'ko': {
      // Common
      'common.save': '저장',
      'common.cancel': '취소',
      'common.confirm': '확인',
      'common.delete': '삭제',
      'common.edit': '편집',
      'common.close': '닫기',
      'common.refresh': '새로고침',
      'common.search': '검색',
      'common.copy': '복사',
      'common.copied': '클립보드에 복사되었습니다',
      'common.loading': '로딩 중…',
      'common.success': '성공',
      'common.failed': '작업 실패',
      'common.error': '오류',
      'common.warning': '경고',
      'common.all': '전체',
      'common.action': '작업',
      'common.status': '상태',
      'common.created': '생성일',
      'common.updated': '수정일',
      'common.size': '크기',
      'common.name': '이름',
      'common.details': '상세 정보',
      'common.back': '뒤로',
      'common.next': '다음',
      'common.download': '다운로드',
      'common.upload': '업로드',
      'common.export': '내보내기',
      'common.import': '가져오기',
      'common.enabled': '활성화됨',
      'common.disabled': '비활성화됨',
      'common.view': '보기',
      'common.preview': '미리보기',
      'common.none': '없음',
      'common.total': '합계',
      'common.yes': '예',
      'common.no': '아니오',
      'common.tip': '안내',
      'common.unknown': '알 수 없음',
      'common.save_changes': '변경 사항 저장',

      // Login
      'login.title': 'Nimbus Vault Sync',
      'login.subtitle': 'Obsidian 초고속 실시간 동기화 서버 & 관리 대시보드',
      'login.server_label': '서버 주소',
      'login.server_placeholder': '현재 서버 기본값 사용 (포트 자동 감지)',
      'login.username_label': '사용자 이름',
      'login.password_label': '비밀번호',
      'login.submit_btn': '로그인',
      'login.logging_in': '로그인 중…',
      'login.err_empty': '사용자 이름과 비밀번호를 모두 입력하세요',
      'login.err_failed': '로그인 실패. 계정 정보 또는 서버 주소를 확인하세요.',

      // Topbar
      'topbar.search_placeholder': '모든 노트 및 콘텐츠 검색...',
      'topbar.search_shortcut': 'Ctrl K',
      'topbar.search_title': '전역 빠른 검색 (Ctrl+K)',
      'topbar.sync_ready': '동기화 서비스 준비 완료',
      'topbar.sync_running': '동기화 중…',
      'topbar.sync_title': '실시간 동기화 서비스 작동 중',
      'topbar.theme_title': '테마 및 색상 변경',
      'topbar.lang_title': '언어 변경 / Language',
      'topbar.logout': '로그아웃',
      'topbar.role_admin': '관리자',
      'topbar.role_user': '일반 사용자',

      // Themes
      'theme.default': '클래식 사이버 블루 (기본)',
      'theme.obsidian': '옵시디언 미드나잇 퍼플',
      'theme.emerald': '에메랄드 오로라 그린',
      'theme.azure': '딥 오션 아주르',
      'theme.rose': '앰버 벨벳 로즈',
      'theme.mono': 'OLED 퓨어 미니멀 다크',
      'theme.light': '브라이트 데이라이트 (라이트)',

      // Sidebar
      'sidebar.my_vaults': '내 Vault 목록',
      'sidebar.new_vault': '새 Vault 생성',
      'sidebar.quick_tools': '빠른 도구',
      'sidebar.settings': '⚙️ 환경설정',
      'sidebar.devices': '📱 연결된 기기 관리',
      'sidebar.connect_guide': '⚡ Obsidian 연결 가이드',
      'sidebar.mcp_config': '🤖 AI / MCP 연동 설정',
      'sidebar.api_docs': '📖 REST API 개발자 문서',
      'sidebar.sponsor': '❤️ 프로젝트 후원하기',
      'sidebar.admin_section': '시스템 관리',
      'sidebar.database': '🗄️ 데이터베이스 관리',
      'sidebar.webhooks': '🔔 웹훅 & 알림',
      'sidebar.synclogs': '📋 동기화 감사 로그',
      'sidebar.all_devices': '📱 전체 기기 현황',
      'sidebar.users': '👥 사용자 계정 관리',
      'sidebar.all_vaults': '📚 전체 Vault 목록',
      'sidebar.sponsor_admin': '❤️ 후원 및 지원 관리',
      'sidebar.version': '버전',

      // Empty states
      'empty.welcome_title': 'Nimbus Vault Sync에 오신 것을 환영합니다',
      'empty.welcome_desc': '왼쪽 사이드바에서 Vault를 선택하여 노트를 관리하거나 새 Vault를 생성하세요.',
      'empty.no_vaults': '사용 가능한 Vault가 없습니다. 왼쪽 상단의 "+" 버튼을 눌러 새 볼트를 생성하세요.',
      'empty.create_vault_btn': '➕ 첫 번째 Vault 생성',

      // Vault details
      'vault.tab_files': '📄 노트 및 파일',
      'vault.tab_stats': '📊 통계 분석',
      'vault.tab_shares': '🔗 공유 및 협업',
      'vault.tab_rules': '🛡️ 동기화 규칙',
      'vault.tab_trash': '🗑️ 휴지통',
      'vault.overview_files': '전체 파일 수',
      'vault.overview_size': '사용 중인 용량',
      'vault.overview_last_sync': '최근 동기화',
      'vault.never_synced': '동기화 이력 없음',
      'vault.sync_guide_btn': '⚡ Obsidian 동기화 가이드',
      'vault.settings_btn': '⚙️ Vault 설정',

      // Files
      'files.tree_view': '트리 보기',
      'files.flat_view': '목록 보기',
      'files.filter_all': '모든 파일',
      'files.filter_md': '마크다운 노트',
      'files.filter_media': '미디어 및 첨부파일',
      'files.filter_config': '설정 및 데이터',
      'files.sort_ctime_desc': '생성일 (최신순)',
      'files.sort_ctime_asc': '생성일 (오래된순)',
      'files.sort_mtime_desc': '수정일 (최근 변경)',
      'files.sort_name_asc': '이름순 (A→Z)',
      'files.search_placeholder': '이 Vault 내에서 파일 또는 경로 검색…',
      'files.upload_btn': '📤 파일 업로드',
      'files.new_note_btn': '➕ 새 노트 작성',
      'files.download_zip': '📦 ZIP 압축 다운로드',
      'files.empty_vault': '이 Vault는 비어 있습니다. Obsidian 클라이언트에서 동기화하거나 직접 업로드하세요.',
      'files.drop_hint': '여기에 파일 또는 폴더를 드래그하여 즉시 업로드하세요',
      'files.delete_confirm': '이 파일을 삭제하시겠습니까? 삭제된 항목은 휴지통에서 복구할 수 있습니다.',
      'files.history': '버전 기록',
      'files.diff': '차이점 비교',
      'files.rename': '이름 변경',
      'files.preview': '미리보기 / 편집',

      // Stats
      'stats.title': 'Vault 통계 및 분석',
      'stats.total_files': '총 파일 수',
      'stats.md_files': '마크다운 노트',
      'stats.media_files': '미디어 첨부파일',
      'stats.other_files': '기타 파일',
      'stats.total_size': '총 스토리지 용량',
      'stats.growth_trend': '저장소 및 활동 트렌드',
      'stats.top_large_files': '대용량 파일 순위',

      // Shares
      'shares.title': '공개 및 암호화 공유 링크',
      'shares.create_btn': '➕ 공유 링크 생성',
      'shares.link': '공유 URL',
      'shares.pwd': '비밀번호',
      'shares.expires': '만료 일시',
      'shares.permission': '접근 권한',
      'shares.readonly': '읽기 전용',
      'shares.readwrite': '편집 허용',
      'shares.no_shares': '생성된 공유 링크가 없습니다.',

      // Rules
      'rules.title': '동기화 필터 및 무시 규칙',
      'rules.desc': '동기화에서 제외할 파일 또는 폴더 패턴을 설정합니다 (한 줄에 하나의 glob 패턴)',
      'rules.save_btn': '무시 규칙 저장',

      // Trash
      'trash.title': 'Vault 휴지통',
      'trash.desc': '삭제된 파일은 여기에 임시 보관되며 언제든지 복원하거나 영구 삭제할 수 있습니다.',
      'trash.restore_btn': '파일 복원',
      'trash.delete_forever': '영구 삭제',
      'trash.empty_btn': '휴지통 비우기',
      'trash.empty_confirm': '휴지통을 완전히 비우시겠습니까? 영구 삭제된 파일은 복구할 수 없습니다!',
      'trash.no_items': '휴지통이 비어 있습니다.',

      // Settings
      'settings.title': '⚙️ 시스템 및 사용자 환경설정',
      'settings.server_info': '서버 상태 및 런타임 정보',
      'settings.version': '앱 버전',
      'settings.uptime': '가동 시간',
      'settings.storage_path': '데이터 저장 경로',
      'settings.git_backup': 'Git 자동 백업 및 원격 동기화',
      'settings.git_desc': '모든 Vault를 정기적으로 커밋하고 GitHub/Gitee 비공개 저장소로 자동 푸시합니다.',
      'settings.git_remote': '원격 Git 저장소 URL',
      'settings.git_branch': '대상 브랜치',
      'settings.git_push_now': '🚀 지금 즉시 Git 백업 실행',
      'settings.token_title': 'API 토큰 및 접근 자격 증명',
      'settings.token_desc': 'Obsidian 플러그인, MCP 서버 또는 자동화 스크립트 인증에 사용됩니다.',
      'settings.lang_title': '인터페이스 언어 설정',
      'settings.theme_title': '테마 색상 팔레트',

      // Database
      'db.title': '🗄️ 데이터베이스 엔진 및 관리',
      'db.current_engine': '현재 활성 데이터베이스',
      'db.sqlite': 'SQLite 로컬 경량 데이터베이스',
      'db.mysql': 'MySQL / MariaDB 분산 데이터베이스',
      'db.postgres': 'PostgreSQL 고성능 데이터베이스',
      'db.total_records': '총 레코드 수',
      'db.export_btn': '💾 데이터베이스 백업',
      'db.vacuum_btn': '🧹 조각 모음 및 최적화',

      // Webhooks
      'webhooks.title': '🔔 웹훅 & 이벤트 알림',
      'webhooks.desc': 'Vault 동기화, 충돌, 파일 변경 또는 보안 이벤트 발생 시 실시간 알림을 수신합니다.',
      'webhooks.add_btn': '➕ 웹훅 추가',
      'webhooks.url': '웹훅 대상 URL',
      'webhooks.events': '구독 이벤트',
      'webhooks.test_btn': '🧪 테스트 알림 전송',

      // Logs
      'logs.title': '📋 실시간 동기화 및 감사 로그',
      'logs.desc': '다중 클라이언트의 동기화 요청, 변경 내역 및 오류 로그를 모니터링합니다.',
      'logs.filter_vault': 'Vault별 필터',
      'logs.filter_device': '기기별 필터',
      'logs.auto_refresh': '실시간 자동 갱신',
      'logs.clear_btn': '로그 비우기',
      'logs.export_btn': 'CSV 로그 내보내기',

      // Devices
      'devices.title': '📱 연결된 기기 및 클라이언트 관리',
      'devices.desc': '동기화가 승인된 Obsidian 데스크톱, 태블릿, 모바일 기기를 관리합니다.',
      'devices.device_name': '기기 이름',
      'devices.client_type': '클라이언트 유형',
      'devices.ip': '접속 IP',
      'devices.last_active': '최근 동기화 활동',
      'devices.revoke_btn': '권한 취소',

      // Users
      'users.title': '👥 사용자 및 권한 관리',
      'users.add_btn': '➕ 새 사용자 추가',
      'users.username': '사용자 이름',
      'users.role': '역할',
      'users.admin': '시스템 관리자',
      'users.regular': '일반 사용자',
      'users.reset_pwd': '비밀번호 재설정',
      'users.delete': '사용자 삭제',

      // All Vaults
      'all_vaults.title': '📚 전체 Vault 현황 총괄',
      'all_vaults.desc': '시스템 내 모든 사용자의 지식 저장소 목록 및 용량 사용량 현황입니다.',
      'all_vaults.owner': '소유자',

      // Obsidian Guide
      'connect.title': '⚡ Obsidian 초고속 연결 가이드',
      'connect.subtitle': '3단계로 데스크톱과 모바일 간 실시간 자동 동기화를 시작하세요.',
      'connect.step1_title': '1단계: Nimbus Sync 플러그인 설치',
      'connect.step1_desc': 'Obsidian 커뮤니티 플러그인에서 설치하거나 .obsidian/plugins/nimbus-vault-sync 경로에 압축을 해제합니다.',
      'connect.step2_title': '2단계: 서버 연결 정보 입력',
      'connect.server_url': '서버 주소 (Server URL)',
      'connect.auth_token': '인증 토큰 (Auth Token)',
      'connect.vault_id': 'Vault ID',
      'connect.step3_title': '3단계: 연결 테스트 및 자동 동기화 활성화',
      'connect.copy_all': '📋 전체 연결 설정 원클릭 복사',

      // MCP
      'mcp.title': '🤖 AI / MCP (Model Context Protocol) 연동 설정',
      'mcp.subtitle': 'Claude Desktop, Cursor, Cline 등의 AI가 귀하의 Obsidian 노트를 직접 인덱싱하고 검색할 수 있습니다.',
      'mcp.claude_title': 'Claude Desktop 설정 파일 (claude_desktop_config.json)',
      'mcp.cursor_title': 'Cursor / Windsurf / Cline 설정',
      'mcp.copy_btn': '📋 JSON 설정 복사',
      'mcp.tools_title': '활성화된 20개의 MCP 네이티브 지식 베이스 도구',

      // Docs
      'docs.title': '📖 REST API 개발자 문서',
      'docs.subtitle': '외부 자동화 및 서드파티 연동을 위한 표준 HTTP RESTful API 규격입니다.',
      'docs.auth_header': '인증 헤더',

      // Sponsor
      'sponsor.title': '❤️ Nimbus Vault Sync 후원 및 지원',
      'sponsor.subtitle': '이 프로젝트가 도움이 되셨다면 지속적인 개발과 유지보수를 위해 후원해 주세요!',
      'sponsor.kofi_title': 'Ko-fi 커피 후원',
      'sponsor.kofi_desc': '신용카드, PayPal 등 해외 간편 결제를 지원합니다.',
      'sponsor.wechat_title': '위챗 페이 (WeChat Pay) 후원',
      'sponsor.wechat_desc': '위챗 스캔 기능으로 간편하게 후원할 수 있습니다.',
      'sponsor.alipay_title': '알리페이 (Alipay) 후원',
      'sponsor.config_btn': '⚙️ 후원 수단 설정',
      'sponsor.wall_title': '🌟 소중한 후원자 명단',
      'sponsor.total_amount': '누적 후원 금액',
      'sponsor.supporters_count': '명의 후원자',
      'sponsor.empty_wall': '아직 후원 기록이 없습니다. 오픈소스를 응원해 주셔서 감사합니다!',
    },

    'ja': {
      // Common
      'common.save': '保存',
      'common.cancel': 'キャンセル',
      'common.confirm': '確認',
      'common.delete': '削除',
      'common.edit': '編集',
      'common.close': '閉じる',
      'common.refresh': '更新',
      'common.search': '検索',
      'common.copy': 'コピー',
      'common.copied': 'クリップボードにコピーしました',
      'common.loading': '読み込み中…',
      'common.success': '成功しました',
      'common.failed': '処理に失敗しました',
      'common.error': 'エラー',
      'common.warning': '警告',
      'common.all': 'すべて',
      'common.action': '操作',
      'common.status': 'ステータス',
      'common.created': '作成日時',
      'common.updated': '更新日時',
      'common.size': 'サイズ',
      'common.name': '名前',
      'common.details': '詳細',
      'common.back': '戻る',
      'common.next': '次へ',
      'common.download': 'ダウンロード',
      'common.upload': 'アップロード',
      'common.export': 'エクスポート',
      'common.import': 'インポート',
      'common.enabled': '有効',
      'common.disabled': '無効',
      'common.view': '表示',
      'common.preview': 'プレビュー',
      'common.none': 'なし',
      'common.total': '合計',
      'common.yes': 'はい',
      'common.no': 'いいえ',
      'common.tip': 'ヒント',
      'common.unknown': '不明',
      'common.save_changes': '変更を保存',

      // Login
      'login.title': 'Nimbus Vault Sync',
      'login.subtitle': 'Obsidian 高速リアルタイム同期サーバー · 管理ダッシュボード',
      'login.server_label': 'サーバーアドレス',
      'login.server_placeholder': '空欄で現在のサーバーを使用 (ポート自動認識)',
      'login.username_label': 'ユーザー名',
      'login.password_label': 'パスワード',
      'login.submit_btn': 'ログイン',
      'login.logging_in': 'ログイン中…',
      'login.err_empty': 'ユーザー名とパスワードを入力してください',
      'login.err_failed': 'ログインに失敗しました。認証情報またはサーバーURLをご確認ください。',

      // Topbar
      'topbar.search_placeholder': 'ノートやコンテンツを検索...',
      'topbar.search_shortcut': 'Ctrl K',
      'topbar.search_title': 'グローバルクイック検索 (Ctrl+K)',
      'topbar.sync_ready': '同期サービス準備完了',
      'topbar.sync_running': '同期中…',
      'topbar.sync_title': 'リアルタイム同期サービス稼働中',
      'topbar.theme_title': 'テーマと配色の切り替え',
      'topbar.lang_title': '言語切り替え / Language',
      'topbar.logout': 'ログアウト',
      'topbar.role_admin': '管理者',
      'topbar.role_user': '一般ユーザー',

      // Themes
      'theme.default': 'クラシックサイバーブルー (デフォルト)',
      'theme.obsidian': 'Obsidian ミッドナイトパープル',
      'theme.emerald': 'エメラルドオーロラグリーン',
      'theme.azure': 'ディープシーアズール',
      'theme.rose': 'アンバーベルベットローズ',
      'theme.mono': 'OLED ピュアミニマルダーク',
      'theme.light': 'ブライトデイライト (Light)',

      // Sidebar
      'sidebar.my_vaults': 'マイ Vaults',
      'sidebar.new_vault': '新規 Vault 作成',
      'sidebar.quick_tools': 'クイックツール',
      'sidebar.settings': '⚙️ 設定',
      'sidebar.devices': '📱 接続デバイス管理',
      'sidebar.connect_guide': '⚡ Obsidian 接続ガイド',
      'sidebar.mcp_config': '🤖 AI / MCP 連携設定',
      'sidebar.api_docs': '📖 REST API 開発者ドキュメント',
      'sidebar.sponsor': '❤️ プロジェクトを支援',
      'sidebar.admin_section': 'システム管理',
      'sidebar.database': '🗄️ データベース管理',
      'sidebar.webhooks': '🔔 Webhook 通知',
      'sidebar.synclogs': '📋 同期ログ',
      'sidebar.all_devices': '📱 全体デバイス',
      'sidebar.users': '👥 ユーザー管理',
      'sidebar.all_vaults': '📚 全体 Vault',
      'sidebar.sponsor_admin': '❤️ スポンサー支援管理',
      'sidebar.version': 'バージョン',

      // Empty states
      'empty.welcome_title': 'Nimbus Vault Sync へようこそ',
      'empty.welcome_desc': '左側のサイドバーから Vault を選択してノートを管理するか、新しい Vault を作成して Obsidian と同期してください。',
      'empty.no_vaults': '利用可能な Vault がありません。左上の「+」ボタンをクリックして新しい保管庫を作成してください。',
      'empty.create_vault_btn': '➕ 最初の Vault を作成',

      // Vault details
      'vault.tab_files': '📄 ノート・ファイル',
      'vault.tab_stats': '📊 統計・分析',
      'vault.tab_shares': '🔗 共有・コラボレーション',
      'vault.tab_rules': '🛡️ 同期ルール',
      'vault.tab_trash': '🗑️ ゴミ箱',
      'vault.overview_files': 'ファイル数',
      'vault.overview_size': '使用容量',
      'vault.overview_last_sync': '最終同期日時',
      'vault.never_synced': '未同期',
      'vault.sync_guide_btn': '⚡ Obsidian 設定ガイド',
      'vault.settings_btn': '⚙️ 保管庫設定',

      // Files
      'files.tree_view': 'ツリー表示',
      'files.flat_view': 'フラット一覧',
      'files.filter_all': 'すべてのファイル',
      'files.filter_md': 'Markdown ノート',
      'files.filter_media': 'メディア・添付ファイル',
      'files.filter_config': '設定・データ',
      'files.sort_ctime_desc': '作成日時 (新しい順)',
      'files.sort_ctime_asc': '作成日時 (古い順)',
      'files.sort_mtime_desc': '更新日時 (最新順)',
      'files.sort_name_asc': '名前順 (A→Z)',
      'files.search_placeholder': '現在の Vault 内でファイルやパスを絞り込み…',
      'files.upload_btn': '📤 ファイルアップロード',
      'files.new_note_btn': '➕ 新規ノート',
      'files.download_zip': '📦 ZIP ダウンロード',
      'files.empty_vault': 'この Vault にはファイルがありません。Obsidian クライアントから同期するか直接アップロードしてください。',
      'files.drop_hint': 'ここにファイルやフォルダをドラッグ＆ドロップして即時アップロード',
      'files.delete_confirm': 'このファイルを削除しますか？削除されたファイルはゴミ箱から復元できます。',
      'files.history': 'バージョン履歴',
      'files.diff': '差分比較',
      'files.rename': '名前の変更',
      'files.preview': 'プレビュー / 編集',

      // Stats
      'stats.title': '保管庫の統計とインサイト',
      'stats.total_files': '総ファイル数',
      'stats.md_files': 'Markdown ノート',
      'stats.media_files': 'メディア添付ファイル',
      'stats.other_files': 'その他ファイル',
      'stats.total_size': '総ストレージ容量',
      'stats.growth_trend': 'ストレージとアクティビティ傾向',
      'stats.top_large_files': '大容量ファイル一覧',

      // Shares
      'shares.title': '公開および暗号化共有リンク',
      'shares.create_btn': '➕ 共有リンクを作成',
      'shares.link': '共有 URL',
      'shares.pwd': 'パスワード',
      'shares.expires': '有効期限',
      'shares.permission': 'アクセス権限',
      'shares.readonly': '読み取り専用',
      'shares.readwrite': '編集可能',
      'shares.no_shares': '共有リンクはまだ作成されていません。',

      // Rules
      'rules.title': '同期除外・フィルタールール',
      'rules.desc': '同期から除外するファイルやディレクトリのパターンを指定します（1行に1つの glob パターン）',
      'rules.save_btn': '除外ルールを保存',

      // Trash
      'trash.title': '保管庫のゴミ箱',
      'trash.desc': '削除されたファイルはここに一時保管され、いつでも復元または完全削除できます。',
      'trash.restore_btn': 'ファイルを復元',
      'trash.delete_forever': '完全に削除',
      'trash.empty_btn': 'ゴミ箱を空にする',
      'trash.empty_confirm': '本当にゴミ箱を空にしますか？削除されたファイルは二度と復旧できません！',
      'trash.no_items': 'ゴミ箱は空です。',

      // Settings
      'settings.title': '⚙️ システムおよびユーザー設定',
      'settings.server_info': 'サーバー稼働情報',
      'settings.version': 'バージョン',
      'settings.uptime': '稼働時間',
      'settings.storage_path': 'データ保存先',
      'settings.git_backup': 'Git 自動バックアップとリモート同期',
      'settings.git_desc': 'すべての Vault を定期的に自動コミットし、GitHub/Gitee プライベートリポジトリへプッシュします。',
      'settings.git_remote': 'リモート Git リポジトリ URL',
      'settings.git_branch': '対象ブランチ',
      'settings.git_push_now': '🚀 今すぐ Git バックアップを実行',
      'settings.token_title': 'API トークンとアクセスキー',
      'settings.token_desc': 'Obsidian プラグイン、MCP サーバー、または自動化スクリプトの認証に使用されます。',
      'settings.lang_title': 'インターフェース言語',
      'settings.theme_title': 'テーマカラー',

      // Database
      'db.title': '🗄️ データベースエンジンと移行',
      'db.current_engine': '稼働中のデータベース',
      'db.sqlite': 'SQLite ローカルデータベース',
      'db.mysql': 'MySQL / MariaDB 分散データベース',
      'db.postgres': 'PostgreSQL 高性能データベース',
      'db.total_records': '総レコード数',
      'db.export_btn': '💾 データベースをバックアップ',
      'db.vacuum_btn': '🧹 デフラグと最適化',

      // Webhooks
      'webhooks.title': '🔔 Webhook アラートとイベント通知',
      'webhooks.desc': 'Vault の同期、競合、ファイル変更、またはセキュリティイベント発生時に即座に通知します。',
      'webhooks.add_btn': '➕ Webhook を追加',
      'webhooks.url': 'Webhook 送信先 URL',
      'webhooks.events': '購読イベント',
      'webhooks.test_btn': '🧪 テスト通知を送信',

      // Logs
      'logs.title': '📋 リアルタイム同期・監査ログ',
      'logs.desc': '各クライアントからの同期リクエスト、変更履歴、エラーログを確認できます。',
      'logs.filter_vault': 'Vault で絞り込み',
      'logs.filter_device': 'デバイスで絞り込み',
      'logs.auto_refresh': '自動更新ストリーム',
      'logs.clear_btn': 'ログを消去',
      'logs.export_btn': 'CSV ログをエクスポート',

      // Devices
      'devices.title': '📱 接続デバイス・クライアント管理',
      'devices.desc': '同期が許可された Obsidian デスクトップ、タブレット、モバイルクライアントを管理します。',
      'devices.device_name': 'デバイス名',
      'devices.client_type': 'クライアント種別',
      'devices.ip': '接続元 IP',
      'devices.last_active': '最終同期アクティビティ',
      'devices.revoke_btn': 'アクセス権を取り消す',

      // Users
      'users.title': '👥 ユーザーとアクセス権限管理',
      'users.add_btn': '➕ 新規ユーザー追加',
      'users.username': 'ユーザー名',
      'users.role': 'ロール',
      'users.admin': 'システム管理者',
      'users.regular': '一般ユーザー',
      'users.reset_pwd': 'パスワード再設定',
      'users.delete': 'ユーザーを削除',

      // All Vaults
      'all_vaults.title': '📚 全体 Vault リソース一覧',
      'all_vaults.desc': 'システム内のすべてのユーザーが作成した保管庫とストレージ使用量の概要です。',
      'all_vaults.owner': '所有者',

      // Obsidian Guide
      'connect.title': '⚡ Obsidian 高速接続ガイド',
      'connect.subtitle': '3ステップでデスクトップとモバイル間の自動同期を開始できます。',
      'connect.step1_title': 'ステップ 1: Nimbus Sync プラグインをインストール',
      'connect.step1_desc': 'Obsidian のコミュニティプラグインからインストールするか、.obsidian/plugins/nimbus-vault-sync へ展開します。',
      'connect.step2_title': 'ステップ 2: サーバー接続パラメータを設定',
      'connect.server_url': 'サーバー URL (Server URL)',
      'connect.auth_token': '認証トークン (Auth Token)',
      'connect.vault_id': 'Vault ID',
      'connect.step3_title': 'ステップ 3: 接続テストを実行して自動同期を有効化',
      'connect.copy_all': '📋 接続設定を一括コピー',

      // MCP
      'mcp.title': '🤖 AI / MCP (Model Context Protocol) 連携設定',
      'mcp.subtitle': 'Claude Desktop、Cursor、Cline 等の AI アシスタントが Obsidian ノートを直接検索・参照できるようにします。',
      'mcp.claude_title': 'Claude Desktop 設定ファイル (claude_desktop_config.json)',
      'mcp.cursor_title': 'Cursor / Windsurf / Cline 設定',
      'mcp.copy_btn': '📋 JSON 設定をコピー',
      'mcp.tools_title': '有効化された 20 種類の MCP ネイティブ知識ベースツール',

      // Docs
      'docs.title': '📖 REST API 開発者ドキュメント',
      'docs.subtitle': '外部連携やスクリプト自動化のための標準 HTTP RESTful API 仕様です。',
      'docs.auth_header': '認証ヘッダー',

      // Sponsor
      'sponsor.title': '❤️ Nimbus Vault Sync へのご支援・スポンサー',
      'sponsor.subtitle': 'このプロジェクトがお役に立ちましたら、継続的な開発とメンテナンスへのご支援を歓迎いたします！',
      'sponsor.kofi_title': 'Ko-fi でコーヒーを奢る',
      'sponsor.kofi_desc': 'クレジットカードや PayPal などの国際決済に対応しています。',
      'sponsor.wechat_title': 'WeChat Pay で支援',
      'sponsor.wechat_desc': 'WeChat アプリの「スキャン」機能で直接ご支援いただけます。',
      'sponsor.alipay_title': 'Alipay で支援',
      'sponsor.config_btn': '⚙️ 支援・決済設定',
      'sponsor.wall_title': '🌟 スポンサーの皆様',
      'sponsor.total_amount': 'これまでのご支援総額',
      'sponsor.supporters_count': '名のサポーター',
      'sponsor.empty_wall': '支援履歴はまだありません。オープンソースへのご支援に感謝いたします！',
    }
  };

  /**
   * Determine the best starting language
   */
  function detectLanguage() {
    const saved = localStorage.getItem('nimbus_lang');
    if (saved && LANGUAGES[saved]) {
      return saved;
    }
    const navLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (navLang.startsWith('zh-tw') || navLang.startsWith('zh-hk') || navLang.startsWith('zh-hant')) {
      return 'zh-TW';
    }
    if (navLang.startsWith('zh')) {
      return 'zh-CN';
    }
    if (navLang.startsWith('ja')) {
      return 'ja';
    }
    if (navLang.startsWith('ko')) {
      return 'ko';
    }
    if (navLang.startsWith('en')) {
      return 'en';
    }
    return 'zh-CN';
  }

  let currentLang = detectLanguage();

  /**
   * Translate key with optional parameter substitution
   */
  function t(key, fallbackOrParams, params) {
    let fallback = '';
    let data = params;
    if (typeof fallbackOrParams === 'object' && fallbackOrParams !== null) {
      data = fallbackOrParams;
      fallback = key;
    } else if (typeof fallbackOrParams === 'string') {
      fallback = fallbackOrParams;
    } else {
      fallback = key;
    }

    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS['zh-CN'];
    let text = dict ? dict[key] : null;
    if (!text && TRANSLATIONS['zh-CN']) {
      text = TRANSLATIONS['zh-CN'][key];
    }
    if (!text && typeof PHRASE_MAP !== 'undefined') {
      if (currentLang === 'zh-CN') {
        if (PHRASE_MAP[key]) text = key;
      } else if (PHRASE_MAP[key] && PHRASE_MAP[key][currentLang]) {
        text = PHRASE_MAP[key][currentLang];
      }
    }
    if (!text) {
      text = fallback;
    }

    if (data && typeof data === 'object') {
      Object.keys(data).forEach((paramKey) => {
        text = text.replace(new RegExp(`{${paramKey}}`, 'g'), data[paramKey]);
      });
    }

    return text;
  }

  /**
   * Apply translations to all DOM elements with data-i18n attributes,
   * and automatically translate text nodes and common attributes when switching language.
   */
  function translateDOM(root) {
    const elRoot = root || document;
    if (elRoot === document) {
      document.documentElement.setAttribute('lang', currentLang);
    }

    // 1. Attribute-driven translations
    elRoot.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        // Store original text on first read so we can re-translate later if needed
        if (!el._origText) el._origText = el.textContent;
        el.textContent = t(key, el._origText || el.textContent);
      }
    });

    elRoot.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        if (!el._origPlaceholder) el._origPlaceholder = el.getAttribute('placeholder');
        el.setAttribute('placeholder', t(key, el._origPlaceholder || ''));
      }
    });

    elRoot.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        if (!el._origTitle) el._origTitle = el.getAttribute('title');
        el.setAttribute('title', t(key, el._origTitle || ''));
      }
    });

    // 2. Intelligent phrase auto-replacer for dynamically generated content
    if (currentLang !== 'zh-CN') {
      applyPhraseTranslations(elRoot, currentLang);
    }
  }

  // Common UI phrase dictionary across all languages
  const PHRASE_MAP = {
    "监控与管理连接至 Obsidian Nimbus 同步服务的客户端设备、在线状态、专用授权 Token 及最后活动记录": {"en":"Monitor and manage client devices connected to Obsidian Nimbus Sync, online status, dedicated auth tokens, and last active records","zh-TW":"監控與管理連接至 Obsidian Nimbus 同步服務的用戶端裝置、線上狀態、專用授權權杖及最後活動記錄","ko":"Obsidian Nimbus 동기화 서비스에 연결된 클라이언트 기기, 온라인 상태, 전용 인증 토큰 및 최근 활동 기록을 모니터링하고 관리합니다","ja":"Obsidian Nimbus 同期サービスに接続されているクライアントデバイス、オンライン状態、専用認証トークン、最終アクティビティログを監視・管理します"},
    "添加新用户并分配权限": {"en":"Add New User & Assign Permissions","zh-TW":"新增使用者並分配權限","ko":"새 사용자 추가 및 권한 할당","ja":"新規ユーザー追加と権限割り当て"},
    "➕ 添加新用户并分配权限": {"en":"➕ Add New User & Assign Permissions","zh-TW":"➕ 新增使用者並分配權限","ko":"➕ 새 사용자 추가 및 권한 할당","ja":"➕ 新規ユーザー追加と権限割り当て"},
    "关联并授权 Vaults 笔记库 (可选)": {"en":"Associate & Authorize Vaults (Optional)","zh-TW":"關聯並授權 Vaults 筆記庫 (可選)","ko":"Vault 노트 저장소 연결 및 권한 부여 (선택사항)","ja":"Vault ノートの関連付けと権限付与 (任意)"},
    "📂 关联并授权 Vaults 笔记库 (可选)": {"en":"📂 Associate & Authorize Vaults (Optional)","zh-TW":"📂 關聯並授權 Vaults 筆記庫 (可選)","ko":"📂 Vault 노트 저장소 연결 및 권한 부여 (선택사항)","ja":"📂 Vault ノートの関連付けと権限付与 (任意)"},
    "关联并授权 Vaults 笔记库": {"en":"Associate & Authorize Vaults","zh-TW":"關聯並授權 Vaults 筆記庫","ko":"Vault 노트 저장소 연결 및 권한 부여","ja":"Vault ノートの関連付けと権限付与"},
    "监控审计所有客户端在所有 Vault 上的实时同步活动记录": {"en":"Monitor and audit real-time synchronization activity logs across all clients and vaults","zh-TW":"監控審計所有用戶端在所有 Vault 上的即時同步活動記錄","ko":"모든 클라이언트와 Vault에서 발생하는 실시간 동기화 활동 기록 모니터링 및 감사","ja":"すべてのクライアントおよび全 Vault におけるリアルタイム同期アクティビティの監視・監査"},
    "🔌 Obsidian 插件配置对接": {"en":"🔌 Obsidian Plugin Setup","zh-TW":"🔌 Obsidian 外掛設定對接","ko":"🔌 Obsidian 플러그인 연동 설정","ja":"🔌 Obsidian プラグイン接続設定"},
    "Obsidian 插件配置对接": {"en":"Obsidian Plugin Setup","zh-TW":"Obsidian 外掛設定對接","ko":"Obsidian 플러그인 연동 설정","ja":"Obsidian プラグイン接続設定"},
    "设备专属令牌": {"en":"Dedicated Device Tokens","zh-TW":"裝置專屬權杖","ko":"기기 전용 토큰","ja":"デバイス専用トークン"},
    "🔑 设备专属令牌": {"en":"🔑 Dedicated Device Tokens","zh-TW":"🔑 裝置專屬權杖","ko":"🔑 기기 전용 토큰","ja":"🔑 デバイス専用トークン"},
    "多端专属设备令牌 (Device Access Tokens)": {"en":"Multi-Device Access Tokens (Device Access Tokens)","zh-TW":"多端專屬裝置權杖 (Device Access Tokens)","ko":"멀티 디바이스 전용 기기 토큰 (Device Access Tokens)","ja":"マルチデバイス専用トークン (Device Access Tokens)"},
    "🔑 多端专属设备令牌 (Device Access Tokens)": {"en":"🔑 Multi-Device Access Tokens (Device Access Tokens)","zh-TW":"🔑 多端專屬裝置權杖 (Device Access Tokens)","ko":"🔑 멀티 디바이스 전용 기기 토큰 (Device Access Tokens)","ja":"🔑 マルチデバイス専用トークン (Device Access Tokens)"},
    "为每台设备（如 MacBook、iPhone、Windows 办公电脑）签发独立 Token，支持随时查看、复制、到期延期、重新生成与注销，各端独立鉴权便于安全管理": {"en":"Issue independent tokens for each device (e.g. MacBook, iPhone, Windows PC), with support for viewing, copying, extending expiry, renewing, and revoking for secure multi-device management.","zh-TW":"為每台裝置（如 MacBook、iPhone、Windows 辦公電腦）簽發獨立權杖，支援隨時檢視、複製、到期延期、重新產生與註銷，各端獨立鑑權便於安全管理。","ko":"각 기기(MacBook, iPhone, Windows PC 등)별 독립 토큰을 발급하여 조회, 복사, 만료 연장, 재발급 및 취소를 지원하며, 안전한 기기별 인증 관리가 가능합니다.","ja":"各デバイス（MacBook、iPhone、Windows PC など）に独立したトークンを発行し、確認・コピー・有効期限延長・再生成・失効をいつでも行えます。"},
    "设备名称 / 备注": {"en":"Device Name / Note","zh-TW":"裝置名稱 / 備註","ko":"기기 이름 / 메모","ja":"デバイス名 / 備考"},
    "访问令牌 (Token)": {"en":"Access Token","zh-TW":"存取權杖 (Token)","ko":"액세스 토큰 (Token)","ja":"アクセストークン (Token)"},
    "令牌期限": {"en":"Token Validity","zh-TW":"權杖期限","ko":"토큰 유효기간","ja":"トークン有効期限"},
    "令牌有效期 (Token Expiration)": {"en":"Token Expiration","zh-TW":"權杖有效期限 (Token Expiration)","ko":"토큰 유효기간 (Token Expiration)","ja":"トークン有効期限 (Token Expiration)"},
    "新建专属设备 Token": {"en":"Create New Device Token","zh-TW":"新建專屬裝置 Token","ko":"새 기기 전용 토큰 생성","ja":"新規デバイス専用 Token を作成"},
    "➕ 新建专属设备 Token": {"en":"➕ Create New Device Token","zh-TW":"➕ 新建專屬裝置 Token","ko":"➕ 새 기기 전용 토큰 생성","ja":"➕ 新規デバイス専用 Token を作成"},
    "创建后系统将自动保存并支持随时查看或复制，可直接用于 Obsidian 同步插件鉴权": {"en":"Once created, the token is saved for quick viewing or copying, and can be used directly for Obsidian sync plugin authentication.","zh-TW":"建立後系統將自動儲存並支援隨時檢視或複製，可直接用於 Obsidian 同步外掛鑑權。","ko":"생성 후 시스템에 자동 저장되어 언제든지 확인 및 복사가 가능하며, Obsidian 동기화 플러그인 인증에 직접 사용할 수 있습니다.","ja":"作成後はいつでも確認・コピー可能で、Obsidian 同期プラグインの認証に直接利用できます。"},
    "设备名称 / 备注 (如: iMac 27-inch, iPhone 16)": {"en":"Device Name / Note (e.g. iMac 27-inch, iPhone 16)","zh-TW":"裝置名稱 / 備註 (如: iMac 27-inch, iPhone 16)","ko":"기기 이름 / 메모 (예: iMac 27-inch, iPhone 16)","ja":"デバイス名 / 備考 (例: iMac 27-inch, iPhone 16)"},
    "＋ 生成设备 Token": {"en":"＋ Generate Device Token","zh-TW":"＋ 產生裝置 Token","ko":"＋ 기기 Token 생성","ja":"＋ デバイス Token を生成"},
    "暂无专属设备令牌，您可点击下方创建": {"en":"No device tokens found. You can create one below.","zh-TW":"暫無專屬裝置權杖，您可點擊下方建立","ko":"등록된 기기 토큰이 없습니다. 아래에서 새로 생성할 수 있습니다.","ja":"デバイス専用トークンはありません。下部から作成できます。"},
    "从未使用": {"en":"Never used","zh-TW":"從未使用","ko":"사용한 적 없음","ja":"未使用"},
    "⚡ 配置": {"en":"⚡ Config","zh-TW":"⚡ 設定","ko":"⚡ 설정","ja":"⚡ 設定"},
    "⏳ 延期": {"en":"⏳ Extend","zh-TW":"⏳ 延期","ko":"⏳ 연장","ja":"⏳ 延長"},
    "🔄 重签": {"en":"🔄 Renew","zh-TW":"🔄 重簽","ko":"🔄 재발급","ja":"🔄 再生成"},
    "注销": {"en":"Revoke","zh-TW":"註銷","ko":"취소","ja":"失効"},
    "👁️ 查看": {"en":"👁️ View","zh-TW":"👁️ 檢視","ko":"👁️ 보기","ja":"👁️ 表示"},
    "🙈 隐藏": {"en":"🙈 Hide","zh-TW":"🙈 隱藏","ko":"🙈 숨기기","ja":"🙈 非表示"},
    "30 天": {"en":"30 Days","zh-TW":"30 天","ko":"30일","ja":"30日"},
    "90 天": {"en":"90 Days","zh-TW":"90 天","ko":"90일","ja":"90日"},
    "1 年 (365 天)": {"en":"1 Year (365 Days)","zh-TW":"1 年 (365 天)","ko":"1년 (365일)","ja":"1年 (365日)"},
    "永久有效 (10 年)": {"en":"Never Expires (10 Years)","zh-TW":"永久有效 (10 年)","ko":"무기한 (10년)","ja":"無期限 (10年)"},
    "+ 30 天 (1 个月)": {"en":"+ 30 Days (1 Month)","zh-TW":"+ 30 天 (1 個月)","ko":"+ 30일 (1개월)","ja":"+ 30日 (1ヶ月)"},
    "+ 90 天 (3 个月)": {"en":"+ 90 Days (3 Months)","zh-TW":"+ 90 天 (3 個月)","ko":"+ 90일 (3개월)","ja":"+ 90日 (3ヶ月)"},
    "+ 1 年 (365 天)": {"en":"+ 1 Year (365 Days)","zh-TW":"+ 1 年 (365 天)","ko":"+ 1년 (365일)","ja":"+ 1年 (365日)"},
    "+ 永久有效 (10 年)": {"en":"+ Never Expires (10 Years)","zh-TW":"+ 永久有效 (10 年)","ko":"+ 무기한 (10년)","ja":"+ 無期限 (10年)"},
    "⏳ 延长设备令牌有效期": {"en":"⏳ Extend Device Token Expiration","zh-TW":"⏳ 延長裝置權杖有效期限","ko":"⏳ 기기 토큰 유효기간 연장","ja":"⏳ デバイストークン有効期限を延長"},
    "选择延长时长 (Extend Duration)": {"en":"Select Extension Duration","zh-TW":"選擇延長時長 (Extend Duration)","ko":"연장 기간 선택 (Extend Duration)","ja":"延長期間を選択 (Extend Duration)"},
    "平滑延期说明": {"en":"Seamless Extension Details","zh-TW":"平滑延期說明","ko":"연장 안내","ja":"スムーズ延長について"},
    "⏳ 确认延长有效期": {"en":"⏳ Confirm Extension","zh-TW":"⏳ 確認延長有效期限","ko":"⏳ 유효기간 연장 확인","ja":"⏳ 延長を確認"},
    "🔄 重新生成设备访问令牌": {"en":"🔄 Regenerate Device Access Token","zh-TW":"🔄 重新產生裝置存取權杖","ko":"🔄 기기 액세스 토큰 재발급","ja":"🔄 デバイスアクセストークンを再生成"},
    "安全重置提醒": {"en":"Security Reset Notice","zh-TW":"安全重設提醒","ko":"보안 재설정 안내","ja":"セキュリティ再設定に関する注意"},
    "⚠️ 安全重置提醒": {"en":"⚠️ Security Reset Notice","zh-TW":"⚠️ 安全重設提醒","ko":"⚠️ 보안 재설정 안내","ja":"⚠️ セキュリティ再設定に関する注意"},
    "新令牌有效期 (Token Expiration)": {"en":"New Token Expiration","zh-TW":"新權杖有效期限 (Token Expiration)","ko":"새 토큰 유효기간 (Token Expiration)","ja":"新規トークン有効期限 (Token Expiration)"},
    "🔄 确认重新生成": {"en":"🔄 Confirm Regeneration","zh-TW":"🔄 確認重新產生","ko":"🔄 재발급 확인","ja":"🔄 再生成を確認"},
    "🎉 新令牌生成成功": {"en":"🎉 New Token Generated Successfully","zh-TW":"🎉 新權杖產生成功","ko":"🎉 새 토큰 생성 완료","ja":"🎉 新規トークンの生成に成功しました"},
    "注销设备专属令牌": {"en":"Revoke Device Token","zh-TW":"註銷裝置專屬權杖","ko":"기기 전용 토큰 취소","ja":"デバイス専用トークンを失効"},
    "确认注销": {"en":"Confirm Revocation","zh-TW":"確認註銷","ko":"취소 확인","ja":"失効を確認"},
    "推荐在「设备专属令牌」标签页为每个端创建独立 Token": {"en":"Recommended to create independent tokens for each device under the \"Dedicated Device Tokens\" tab","zh-TW":"推薦在「裝置專屬權杖」標籤頁為每個端建立獨立 Token","ko":"「기기 전용 토큰」 탭에서 기기별로 독립된 Token을 생성하는 것을 권장합니다","ja":"「デバイス専用トークン」タブで端末ごとに個別の Token を作成することをお勧めします"},
    "📋 复制 data.json 配置": {"en":"📋 Copy data.json Config","zh-TW":"📋 複製 data.json 設定","ko":"📋 data.json 설정 복사","ja":"📋 data.json 設定をコピー"},
    "如果这个项目帮助到您，并且想要它继续开发，请在以下方式支持我们，感谢您对开源软件的支持！": {"en":"If this project has helped you and you'd like to support continued development, please consider supporting us below. Thank you for supporting open source!","zh-TW":"如果這個專案幫助到您，並且想要它繼續開發，請在以下方式支持我們，感謝您對開源軟體的支持！","ko":"이 프로젝트가 도움이 되었고 지속적인 개발을 원하신다면 아래 방법으로 후원해 주세요. 오픈소스에 대한 성원에 감사드립니다!","ja":"このプロジェクトがお役に立ち、継続的な開発を応援していただける場合は、以下の方法でご支援をお願いいたします。オープンソースへのご支援に感謝します！"},
    "支持该项目": {"en":"Support This Project","zh-TW":"支持該專案","ko":"프로젝트 후원하기","ja":"プロジェクトを支援"},
    "Webhook 告警与实时第三方推送": {"en":"Webhook Alerts & Real-Time Third-Party Push","zh-TW":"Webhook 告警與即時第三方推送","ko":"웹훅 알림 및 실시간 서드파티 푸시","ja":"Webhook アラートとサードパーティリアルタイム通知"},
    "🔔 Webhook 告警与实时第三方推送": {"en":"🔔 Webhook Alerts & Real-Time Third-Party Push","zh-TW":"🔔 Webhook 告警與即時第三方推送","ko":"🔔 웹훅 알림 및 실시간 서드파티 푸시","ja":"🔔 Webhook アラートとサードパーティリアルタイム通知"},
    "当多端发生并发冲突、全库快照备份完成、新设备上线或文件变动时，实时推送告警消息至飞书、钉钉、企业微信、Discord 或自定义 HTTP 终端": {"en":"Real-time alert push to Feishu, DingTalk, WeCom, Discord, or custom HTTP endpoints upon multi-device conflicts, snapshot completions, new devices, or file changes.","zh-TW":"當多端發生並發衝突、全庫快照備份完成、新裝置上線或檔案變動時，即時推送告警訊息至飛書、釘釘、企業微信、Discord 或自訂 HTTP 端點。","ko":"다중 기기 동시 편집 충돌, 전체 스냅샷 생성 완료, 새 기기 연결 또는 파일 변경 시 Feishu, DingTalk, WeCom, Discord 또는 사용자 정의 HTTP 엔드포인트로 실시간 알림을 전송합니다.","ja":"マルチデバイスの同時競合、バックアップ完了、新規デバイス接続、ファイル変更時に Feishu、DingTalk、WeCom、Discord またはカスタム HTTP エンドポイントへリアルタイム通知します。"},
    "发送测试通知": {"en":"Send Test Notification","zh-TW":"發送測試通知","ko":"테스트 알림 전송","ja":"テスト通知を送信"},
    "🚀 发送测试通知": {"en":"🚀 Send Test Notification","zh-TW":"🚀 發送測試通知","ko":"🚀 테스트 알림 전송","ja":"🚀 テスト通知を送信"},
    "🧪 发送测试通知": {"en":"🧪 Send Test Notification","zh-TW":"🧪 發送測試通知","ko":"🧪 테스트 알림 전송","ja":"🧪 テスト通知を送信"},
    "保存 Webhook 配置": {"en":"Save Webhook Config","zh-TW":"儲存 Webhook 設定","ko":"웹훅 설정 저장","ja":"Webhook 設定を保存"},
    "💾 保存 Webhook 配置": {"en":"💾 Save Webhook Config","zh-TW":"💾 儲存 Webhook 設定","ko":"💾 웹훅 설정 저장","ja":"💾 Webhook 設定を保存"},
    "Webhook 推送端点配置": {"en":"Webhook Push Endpoint Configuration","zh-TW":"Webhook 推送端點設定","ko":"웹훅 푸시 엔드포인트 설정","ja":"Webhook 通知先エンドポイント設定"},
    "⚙️ Webhook 推送端点配置": {"en":"⚙️ Webhook Push Endpoint Configuration","zh-TW":"⚙️ Webhook 推送端點設定","ko":"⚙️ 웹훅 푸시 엔드포인트 설정","ja":"⚙️ Webhook 通知先エンドポイント設定"},
    "启用 Webhook 告警通知功能": {"en":"Enable Webhook Alert Notifications","zh-TW":"啟用 Webhook 告警通知功能","ko":"웹훅 알림 기능 활성화","ja":"Webhook アラート通知を有効化"},
    "推送目标平台": {"en":"Target Platform","zh-TW":"推送目標平台","ko":"푸시 대상 플랫폼","ja":"通知先プラットフォーム"},
    "自定义 HTTP POST JSON 终端": {"en":"Custom HTTP POST JSON Endpoint","zh-TW":"自訂 HTTP POST JSON 端點","ko":"사용자 정의 HTTP POST JSON 엔드포인트","ja":"カスタム HTTP POST JSON エンドポイント"},
    "🌐 自定义 HTTP POST JSON 终端": {"en":"🌐 Custom HTTP POST JSON Endpoint","zh-TW":"🌐 自訂 HTTP POST JSON 端點","ko":"🌐 사용자 정의 HTTP POST JSON 엔드포인트","ja":"🌐 カスタム HTTP POST JSON エンドポイント"},
    "飞书自定义机器人 (Feishu Bot)": {"en":"Feishu Custom Bot","zh-TW":"飛書自訂機器人 (Feishu Bot)","ko":"Feishu 봇","ja":"Feishu カスタムボット"},
    "🕊️ 飞书群机器人 (Feishu Webhook)": {"en":"🕊️ Feishu Bot (Feishu Webhook)","zh-TW":"🕊️ 飛書群機器人 (Feishu Webhook)","ko":"🕊️ Feishu 그룹 봇","ja":"🕊️ Feishu ボット"},
    "钉钉群自定义机器人 (DingTalk Bot)": {"en":"DingTalk Group Custom Bot","zh-TW":"釘釘群自訂機器人 (DingTalk Bot)","ko":"DingTalk 그룹 봇","ja":"DingTalk グループボット"},
    "🎯 钉钉自定义机器人 (DingTalk Webhook)": {"en":"🎯 DingTalk Custom Bot (DingTalk Webhook)","zh-TW":"🎯 釘釘自訂機器人 (DingTalk Webhook)","ko":"🎯 DingTalk 봇","ja":"🎯 DingTalk カスタムボット"},
    "企业微信群机器人 (WeCom Bot)": {"en":"WeCom Group Bot","zh-TW":"企業微信群機器人 (WeCom Bot)","ko":"WeCom 그룹 봇","ja":"WeCom グループボット"},
    "💬 企业微信群机器人 (WeCom Webhook)": {"en":"💬 WeCom Group Bot (WeCom Webhook)","zh-TW":"💬 企業微信群機器人 (WeCom Webhook)","ko":"💬 WeCom 봇","ja":"💬 WeCom ボット"},
    "Discord Webhook": {"en":"Discord Webhook","zh-TW":"Discord Webhook","ko":"Discord 웹훅","ja":"Discord Webhook"},
    "Slack Webhook": {"en":"Slack Webhook","zh-TW":"Slack Webhook","ko":"Slack 웹훅","ja":"Slack Webhook"},
    "Webhook 回调 URL 地址": {"en":"Webhook Callback URL","zh-TW":"Webhook 回調 URL 位址","ko":"웹훅 콜백 URL 주소","ja":"Webhook コールバック URL"},
    "接收 Nimbus 发送 POST 请求的完整 Webhook 链接": {"en":"Full Webhook URL receiving POST requests from Nimbus","zh-TW":"接收 Nimbus 發送 POST 請求的完整 Webhook 連結","ko":"Nimbus가 POST 요청을 전송할 전체 웹훅 URL","ja":"Nimbus から POST リクエストを受信する完全な Webhook URL"},
    "签名校验密钥 (Secret / 签名密钥, 可选)": {"en":"Signature Secret (Secret / Sign Key, Optional)","zh-TW":"簽名校驗密鑰 (Secret / 簽名金鑰, 可選)","ko":"서명 검증 비밀키 (Secret / 서명키, 선택사항)","ja":"署名検証シークレット (Secret / 署名キー、任意)"},
    "若机器人启用了安全加签校验请输入": {"en":"Enter secret if bot has enabled security signature verification","zh-TW":"若機器人啟用了安全加簽校驗請輸入","ko":"봇의 보안 서명 검증이 활성화된 경우 입력하세요","ja":"ボットのセキュリティ署名検証が有効な場合に入力してください"},
    "订阅触发事件 (Event Subscriptions)": {"en":"Event Subscriptions","zh-TW":"訂閱觸發事件 (Event Subscriptions)","ko":"이벤트 구독 (Event Subscriptions)","ja":"イベント購読 (Event Subscriptions)"},
    "🎉 订阅触发事件 (Event Subscriptions)": {"en":"🎉 Event Subscriptions","zh-TW":"🎉 訂閱觸發事件 (Event Subscriptions)","ko":"🎉 이벤트 구독 (Event Subscriptions)","ja":"🎉 イベント購読 (Event Subscriptions)"},
    "conflict.detected (检测到多设备并发冲突)": {"en":"conflict.detected (Multi-device concurrent conflict detected)","zh-TW":"conflict.detected (檢測到多裝置並發衝突)","ko":"conflict.detected (다중 기기 동시 편집 충돌 감지됨)","ja":"conflict.detected (マルチデバイス同時編集の競合を検出)"},
    "⚔️ conflict.detected (检测到多设备并发冲突)": {"en":"⚔️ conflict.detected (Multi-device concurrent conflict detected)","zh-TW":"⚔️ conflict.detected (檢測到多裝置並發衝突)","ko":"⚔️ conflict.detected (다중 기기 동시 편집 충돌 감지됨)","ja":"⚔️ conflict.detected (マルチデバイス同時編集の競合を検出)"},
    "当两台设备同时编辑同一笔记并在同步中产生冲突副本时触发": {"en":"Triggered when two devices edit the same note simultaneously and create a conflict copy during sync","zh-TW":"當兩台裝置同時編輯同一筆記並在同步中產生衝突副本時觸發","ko":"두 기기가 동일한 노트를 동시에 편집하여 동기화 중 충돌 복사본이 생성될 때 트리거됩니다","ja":"2台のデバイスが同一ノートを同時編集し同期競合コピーが発生した際に通知"},
    "conflict.resolved (冲突已成功解决)": {"en":"conflict.resolved (Conflict successfully resolved)","zh-TW":"conflict.resolved (衝突已成功解決)","ko":"conflict.resolved (충돌이 성공적으로 해결됨)","ja":"conflict.resolved (競合が正常に解決されました)"},
    "✓ conflict.resolved (冲突已成功解决)": {"en":"✓ conflict.resolved (Conflict successfully resolved)","zh-TW":"✓ conflict.resolved (衝突已成功解決)","ko":"✓ conflict.resolved (충돌이 성공적으로 해결됨)","ja":"✓ conflict.resolved (競合が正常に解決されました)"},
    "当管理员或用户在控制台手动合并或采纳冲突版本后触发": {"en":"Triggered when an admin or user manually resolves, merges, or accepts a conflict version in the console","zh-TW":"當管理員或使用者在控制台手動合併或採納衝突版本後觸發","ko":"관리자 또는 사용자가 콘솔에서 수동으로 충돌을 병합하거나 해결했을 때 트리거됩니다","ja":"管理者またはユーザーがダッシュボード上で競合を手動統合または解決した際に通知"},
    "backup.created (全库快照备份完成)": {"en":"backup.created (Full vault snapshot backup created)","zh-TW":"backup.created (全庫快照備份完成)","ko":"backup.created (전체 Vault 스냅샷 백업 생성 완료)","ja":"backup.created (全 Vault スナップショット作成完了)"},
    "💾 backup.created (全库快照备份完成)": {"en":"💾 backup.created (Full vault snapshot backup created)","zh-TW":"💾 backup.created (全庫快照備份完成)","ko":"💾 backup.created (전체 Vault 스냅샷 백업 생성 완료)","ja":"💾 backup.created (全 Vault スナップショット作成完了)"},
    "当系统或用户完成全库 ZIP 归档快照创建时触发": {"en":"Triggered when the system or user finishes creating a full vault ZIP archive snapshot","zh-TW":"當系統或使用者完成全庫 ZIP 歸檔快照建立時觸發","ko":"시스템 또는 사용자가 전체 Vault ZIP 아카이브 스냅샷 생성을 완료했을 때 트리거됩니다","ja":"システムまたはユーザーが全 Vault の ZIP アーカイブ作成を完了した際に通知"},
    "device.connected (新设备接入与上线)": {"en":"device.connected (New device connected & online)","zh-TW":"device.connected (新裝置接入與上線)","ko":"device.connected (새 기기 연결 및 온라인 활성화)","ja":"device.connected (新規デバイス接続・オンライン)"},
    "📱 device.connected (新设备接入与上线)": {"en":"📱 device.connected (New device connected & online)","zh-TW":"📱 device.connected (新裝置接入與上線)","ko":"📱 device.connected (새 기기 연결 및 온라인 활성화)","ja":"📱 device.connected (新規デバイス接続・オンライン)"},
    "当有新客户端设备首次接入或发起全量同步时触发": {"en":"Triggered when a new client device connects for the first time or initiates initial full sync","zh-TW":"當有新用戶端裝置首次接入或發起全量同步時觸發","ko":"새 클라이언트 기기가 처음 연결되거나 전체 동기화를 시작할 때 트리거됩니다","ja":"新規クライアントデバイスが初めて接続または全同期を開始した際に通知"},
    "file.deleted (文件移入回收站)": {"en":"file.deleted (File moved to trash)","zh-TW":"file.deleted (檔案移入資源回收筒)","ko":"file.deleted (파일 휴지통 이동)","ja":"file.deleted (ファイルをゴミ箱へ移動)"},
    "🗑️ file.deleted (文件移入回收站)": {"en":"🗑️ file.deleted (File moved to trash)","zh-TW":"🗑️ file.deleted (檔案移入資源回收筒)","ko":"🗑️ file.deleted (파일 휴지통 이동)","ja":"🗑️ file.deleted (ファイルをゴミ箱へ移動)"},
    "当客户端同步删除文件或用户从控制台删除笔记时触发": {"en":"Triggered when a client syncs file deletion or user deletes a note from the console","zh-TW":"當用戶端同步刪除檔案或使用者從控制台刪除筆記時觸發","ko":"클라이언트 동기화로 파일이 삭제되거나 콘솔에서 노트가 삭제될 때 트리거됩니다","ja":"クライアント同期によりファイルが削除されたか、管理画面から削除された際に通知"},
    "接入设备与多端令牌管理": {"en":"Connected Devices & Multi-Device Token Management","zh-TW":"接入裝置與多端權杖管理","ko":"연결된 기기 및 멀티 디바이스 토큰 관리","ja":"接続デバイスおよびマルチトークン管理"},
    "📱 接入设备与多端令牌管理": {"en":"📱 Connected Devices & Multi-Device Token Management","zh-TW":"📱 接入裝置與多端權杖管理","ko":"📱 연결된 기기 및 멀티 디바이스 토큰 관리","ja":"📱 接続デバイスおよびマルチトークン管理"},
    "监控与管理连接至 Obsidian Nimbus 同步服务的客户端设备、在线状态、专用授权 Token 及最近活跃时间": {"en":"Monitor and manage client devices connected to Obsidian Nimbus Sync, their online status, dedicated auth tokens, and recent activity.","zh-TW":"監控與管理連接至 Obsidian Nimbus 同步服務的用戶端裝置、線上狀態、專用授權權杖及最近活躍時間。","ko":"Obsidian Nimbus 동기화 서비스에 연결된 클라이언트 기기, 온라인 상태, 전용 인증 토큰 및 최근 활동 시간을 모니터링하고 관리합니다.","ja":"Obsidian Nimbus 同期サービスに接続されているクライアントデバイス、オンライン状態、専用認証トークン、最新のアクティビティを監視・管理します。"},
    "生成新设备令牌": {"en":"Generate New Device Token","zh-TW":"產生新裝置權杖","ko":"새 기기 토큰 생성","ja":"新規デバイストークンを生成"},
    "➕ 生成新设备令牌": {"en":"➕ Generate New Device Token","zh-TW":"➕ 產生新裝置權杖","ko":"➕ 새 기기 토큰 생성","ja":"➕ 新規デバイストークンを生成"},
    "刷新列表": {"en":"Refresh List","zh-TW":"重新整理清單","ko":"목록 새로고침","ja":"一覧を更新"},
    "🔄 刷新列表": {"en":"🔄 Refresh List","zh-TW":"🔄 重新整理清單","ko":"🔄 목록 새로고침","ja":"🔄 一覧を更新"},
    "Windows PC (默认设备)": {"en":"Windows PC (Default Device)","zh-TW":"Windows PC (預設裝置)","ko":"Windows PC (기본 기기)","ja":"Windows PC (デフォルトデバイス)"},
    "离线 就绪": {"en":"Offline Ready","zh-TW":"離線 就緒","ko":"오프라인 대기","ja":"オフライン 待機中"},
    "⚪ 离线 就绪": {"en":"⚪ Offline Ready","zh-TW":"⚪ 離線 就緒","ko":"⚪ 오프라인 대기","ja":"⚪ オフライン 待機中"},
    "在线 活跃": {"en":"Online Active","zh-TW":"線上 活躍","ko":"온라인 활성","ja":"オンライン 稼働中"},
    "🟢 在线 活跃": {"en":"🟢 Online Active","zh-TW":"🟢 線上 活躍","ko":"🟢 온라인 활성","ja":"🟢 オンライン 稼働中"},
    "离线": {"en":"Offline","zh-TW":"離線","ko":"오프라인","ja":"オフライン"},
    "在线": {"en":"Online","zh-TW":"線上","ko":"온라인","ja":"オンライン"},
    "设备 ID:": {"en":"Device ID: ","zh-TW":"裝置 ID: ","ko":"기기 ID: ","ja":"デバイス ID: "},
    "最后同步活跃:": {"en":"Last Active: ","zh-TW":"最後同步活躍: ","ko":"최근 동기화 활동: ","ja":"最終同期アクティビティ: "},
    "客户端 IP:": {"en":"Client IP: ","zh-TW":"用戶端 IP: ","ko":"클라이언트 IP: ","ja":"クライアント IP: "},
    "专属 Token:": {"en":"Dedicated Token: ","zh-TW":"專屬權杖: ","ko":"전용 토큰: ","ja":"専用トークン: "},
    "Copy Token": {"en":"Copy Token","zh-TW":"複製權杖","ko":"토큰 복사","ja":"トークンをコピー"},
    "📋 Copy Token": {"en":"📋 Copy Token","zh-TW":"📋 複製權杖","ko":"📋 토큰 복사","ja":"📋 トークンをコピー"},
    "View Connection Config": {"en":"View Connection Config","zh-TW":"檢視連線設定","ko":"연결 설정 보기","ja":"接続設定を表示"},
    "⚡ View Connection Config": {"en":"⚡ View Connection Config","zh-TW":"⚡ 檢視連線設定","ko":"⚡ 연결 설정 보기","ja":"⚡ 接続設定を表示"},
    "撤销令牌": {"en":"Revoke Token","zh-TW":"撤銷權杖","ko":"토큰 취소","ja":"トークンを失効"},
    "🚫 撤销令牌": {"en":"🚫 Revoke Token","zh-TW":"🚫 撤銷權杖","ko":"🚫 토큰 취소","ja":"🚫 トークンを失効"},
    "全局 Vault 状态与管理": {"en":"Global Vault Status & Management","zh-TW":"全域 Vault 狀態與管理","ko":"전체 Vault 상태 및 관리","ja":"グローバル Vault 状態と管理"},
    "📚 全局 Vault 状态与管理": {"en":"📚 Global Vault Status & Management","zh-TW":"📚 全域 Vault 狀態與管理","ko":"📚 전체 Vault 상태 및 관리","ja":"📚 グローバル Vault 状態と管理"},
    "全局 Vault 资源概览": {"en":"Global Vault Resources Overview","zh-TW":"全域 Vault 資源概覽","ko":"전체 Vault 리소스 개요","ja":"グローバル Vault リソース概要"},
    "VAULT NAME": {"en":"VAULT NAME","zh-TW":"VAULT 名稱","ko":"VAULT 이름","ja":"VAULT 名"},
    "OWNER": {"en":"OWNER","zh-TW":"擁有者","ko":"소유자","ja":"所有者"},
    "VAULT ID": {"en":"VAULT ID","zh-TW":"VAULT ID","ko":"VAULT ID","ja":"VAULT ID"},
    "CREATED AT": {"en":"CREATED AT","zh-TW":"建立時間","ko":"생성 일시","ja":"作成日時"},
    "ACTIONS": {"en":"ACTIONS","zh-TW":"操作","ko":"작업","ja":"操作"},
    "打开浏览": {"en":"Open & Browse","zh-TW":"開啟瀏覽","ko":"열기 및 둘러보기","ja":"開いて閲覧"},
    "权限设置": {"en":"Permissions","zh-TW":"權限設定","ko":"권한 설정","ja":"権限設定"},
    "👥 权限设置": {"en":"👥 Permissions","zh-TW":"👥 權限設定","ko":"👥 권한 설정","ja":"👥 権限設定"},
    "暂无全局 Vault": {"en":"No global vaults found","zh-TW":"暫無全域 Vault","ko":"전체 Vault가 없습니다","ja":"Vault は存在しません"},
    "支持 Nimbus Vault Sync 开源项目": {"en":"Support Nimbus Vault Sync Open Source Project","zh-TW":"支持 Nimbus Vault Sync 開源專案","ko":"Nimbus Vault Sync 오픈소스 프로젝트 후원하기","ja":"Nimbus Vault Sync オープンソースプロジェクトを支援"},
    "请作者喝杯咖啡": {"en":"Buy Me a Coffee","zh-TW":"請作者喝杯咖啡","ko":"개발자에게 커피 한 잔 후원하기","ja":"開発者にコーヒーをご馳走する"},
    "☕ 请作者喝杯咖啡": {"en":"☕ Buy Me a Coffee","zh-TW":"☕ 請作者喝杯咖啡","ko":"☕ 개발자에게 커피 한 잔 후원하기","ja":"☕ 開発者にコーヒーをご馳走する"},
    "微信打赏支持": {"en":"Support via WeChat Pay","zh-TW":"微信打賞支持","ko":"WeChat Pay로 후원하기","ja":"WeChat Pay で支援"},
    "🧧 微信打赏支持": {"en":"🧧 Support via WeChat Pay","zh-TW":"🧧 微信打賞支持","ko":"🧧 WeChat Pay로 후원하기","ja":"🧧 WeChat Pay で支援"},
    "如果这个项目帮助到您，并且您希望它继续保持开发，请通过以下方式支持我们，感谢您对开源软件的支持！": {"en":"If this project helps you and you want to support continued development, consider supporting us below. Thank you for supporting open source!","zh-TW":"如果這個專案幫助到您，並且您希望它繼續保持開發，請透過以下方式支持我們，感謝您對開源軟體的支持！","ko":"이 프로젝트가 도움이 되었고 지속적인 개발을 응원하고 싶으시다면 아래 방법을 통해 후원해 주세요. 오픈소스 생태계를 지지해 주셔서 감사합니다!","ja":"このプロジェクトがお役に立ち、継続的な開発を応援していただける場合は、以下の方法でご支援をお願いいたします。オープンソースへのご支援に感謝します！"},
    "已支持清单 (三个月以内)": {"en":"Recent Supporters (Last 3 Months)","zh-TW":"已支持清單 (三個月以內)","ko":"최근 후원자 목록 (최근 3개월)","ja":"支援者リスト (直近3ヶ月以内)"},
    "🏆 已支持清单 (三个月以内)": {"en":"🏆 Recent Supporters (Last 3 Months)","zh-TW":"🏆 已支持清單 (三個月以內)","ko":"🏆 최근 후원자 목록 (최근 3개월)","ja":"🏆 支援者リスト (直近3ヶ月以内)"},
    "默认排序": {"en":"Default Sort","zh-TW":"預設排序","ko":"기본 정렬","ja":"デフォルト順"},
    "全部金额": {"en":"All Amounts","zh-TW":"全部金額","ko":"모든 금액","ja":"全額"},
    "全部时间": {"en":"All Time","zh-TW":"全部時間","ko":"전체 기간","ja":"全期間"},
    "感谢开发出这么好的插件，希望能越做越好！": {"en":"Thank you for developing such a great tool! Keep up the amazing work!","zh-TW":"感謝開發出這麼好的外掛，希望能越做越好！","ko":"이렇게 훌륭한 플러그인을 개발해 주셔서 감사합니다. 앞으로도 파이팅!","ja":"素晴らしいツールの開発ありがとうございます！これからの発展を期待しています！"},
    "再次支持！加油！！！": {"en":"Supporting again! Keep going!!!","zh-TW":"再次支持！加油！！！","ko":"다시 후원합니다! 힘내세요!!!","ja":"再度支援します！応援しています！！！"},
    "感谢你的作品，希望继续更新！谢谢": {"en":"Thank you for your work, hope updates continue! Thanks","zh-TW":"感謝你的作品，希望繼續更新！謝謝","ko":"작품에 감사드리며 계속 업데이트되길 바랍니다! 감사합니다","ja":"素晴らしい作品をありがとうございます。継続的なアップデートを期待しています！"},
    "兄弟，太强了，你治好了我的选择困难症，所有终端秒级同步，还能OSS、Git备份！": {"en":"Incredible work! Solved all sync headaches with instant sync across all devices, plus OSS & Git backups!","zh-TW":"兄弟，太強了，你治好了我的選擇困難症，所有終端秒級同步，還能OSS、Git備份！","ko":"정말 대단합니다! 모든 기기에서 초단위 실시간 동기화와 OSS/Git 백업까지 완벽하네요!","ja":"最高です！全デバイスの瞬時同期と OSS・Git バックアップで同期の悩みが完全に解消しました！"},
    "希望持续更新，越做越好": {"en":"Hope you keep updating and making it even better","zh-TW":"希望持續更新，越做越好","ko":"지속적인 업데이트와 발전을 응원합니다","ja":"継続的なアップデートと更なる進化を願っています"},
    "非常有用，支持一下": {"en":"Very useful, happy to support","zh-TW":"非常實用，支持一下","ko":"매우 유용해서 후원합니다","ja":"とても役立っています。応援しています"},
    "感谢大神 使用了一个多星期了 很流畅": {"en":"Thanks a lot! Been using it for over a week, very smooth","zh-TW":"感謝大神 使用了一個多星期了 很流暢","ko":"감사합니다! 일주일 넘게 사용 중인데 정말 부드럽고 쾌적합니다","ja":"感謝します！1週間以上使っていますが非常にスムーズです"},
    "插件非常棒，感谢开发，小小心意": {"en":"Plugin is fantastic, thanks for the development, a small token of gratitude","zh-TW":"外掛非常棒，感謝開發，小小心意","ko":"플러그인이 정말 훌륭합니다. 감사한 마음을 담아 작은 성의를 보냅니다","ja":"素晴らしいプラグインです。開発への感謝を込めて心ばかりの支援を贈ります"},
    "喝咖啡": {"en":"Have a coffee","zh-TW":"喝咖啡","ko":"커피 한 잔","ja":"コーヒーブレイク"},
    "加载差异比对中…": {"en":"Loading diff comparison…","zh-TW":"載入差異比對中…","ko":"차이점 비교 불러오는 중…","ja":"差分比較を読み込み中…"},
    "该文件为二进制媒体或附件文件，无法进行纯文本差异比对。": {"en":"This file is a binary media or attachment file and cannot be compared as plain text.","zh-TW":"該檔案為二進位媒體或附件檔案，無法進行純文字差異比對。","ko":"이 파일은 바이너리 미디어 또는 첨부파일이므로 텍스트 차이점 비교가 불가능합니다.","ja":"このファイルはバイナリまたは添付ファイルのためプレーンテキスト差分比較はできません。"},
    "🖥️ 服务端当前版本 (Server Current)": {"en":"🖥️ Server Version (Server Current)","zh-TW":"🖥️ 伺服端目前版本 (Server Current)","ko":"🖥️ 서버 현재 버전 (Server Current)","ja":"🖥️ サーバー現行版 (Server Current)"},
    "📱 客户端上传冲突版本 (Client Conflict)": {"en":"📱 Client Conflict Version (Client Conflict)","zh-TW":"📱 用戶端上傳衝突版本 (Client Conflict)","ko":"📱 클라이언트 충돌 버전 (Client Conflict)","ja":"📱 クライアント競合版 (Client Conflict)"},
    "⚡ 快速解决策略:": {"en":"⚡ Quick Resolution Strategy:","zh-TW":"⚡ 快速解決策略:","ko":"⚡ 빠른 해결 전략:","ja":"⚡ クイック解決戦略:"},
    "🛡️ 保留当前版本": {"en":"🛡️ Keep Server Version","zh-TW":"🛡️ 保留目前版本","ko":"🛡️ 서버 버전 유지","ja":"🛡️ サーバー版を保持"},
    "⚡ 采纳冲突版本": {"en":"⚡ Accept Client Conflict","zh-TW":"⚡ 採納衝突版本","ko":"⚡ 클라이언트 버전 채택","ja":"⚡ クライアント版を採用"},
    "🔀 智能合并两者 (带标记)": {"en":"🔀 Smart Merge Both (With Markers)","zh-TW":"🔀 智慧合併兩者 (帶標記)","ko":"🔀 스마트 병합 (마커 포함)","ja":"🔀 スマート統合 (マーカー付き)"},
    "自定义最终合并内容:": {"en":"Custom Merged Content:","zh-TW":"自訂最終合併內容:","ko":"사용자 정의 최종 병합 내용:","ja":"統合内容を手動編集:"},
    "💾 保存并解决冲突": {"en":"💾 Save & Resolve Conflict","zh-TW":"💾 儲存並解決衝突","ko":"💾 저장 및 충돌 해결","ja":"💾 保存して競合を解決"},
    "加载快照与备份中…": {"en":"Loading snapshots & backups…","zh-TW":"載入快照與備份中…","ko":"스냅샷 및 백업 불러오는 중…","ja":"スナップショットとバックアップを読み込み中…"},
    "📦 实时导出 ZIP": {"en":"📦 Export Vault ZIP","zh-TW":"📦 即時匯出 ZIP","ko":"📦 Vault ZIP 내보내기","ja":"📦 ZIP エクスポート"},
    "暂无历史快照备份": {"en":"No historical snapshots yet","zh-TW":"暫無歷史快照備份","ko":"히스토리 스냅샷이 없습니다","ja":"履歴スナップショットはありません"},
    "点击右上角「立即创建全库快照」即可一键将当前 Vault 打包存档": {"en":"Click \"Create Snapshot Now\" in the top right to archive the current vault with one click","zh-TW":"點擊右上角「立即建立全庫快照」即可一鍵將目前 Vault 打包存檔","ko":"오른쪽 상단의 '지금 전체 스냅샷 생성'을 클릭하여 현재 Vault를 보관하세요","ja":"右上の「今すぐスナップショットを作成」をクリックして現在の Vault をアーカイブできます"},
    "快照文件名": {"en":"Snapshot Name","zh-TW":"快照檔名","ko":"스냅샷 파일 이름","ja":"スナップショット名"},
    "备注说明": {"en":"Notes & Remarks","zh-TW":"備註說明","ko":"메모 및 설명","ja":"備考"},
    "⬇️ 下载 ZIP": {"en":"⬇️ Download ZIP","zh-TW":"⬇️ 下載 ZIP","ko":"⬇️ ZIP 다운로드","ja":"⬇️ ZIP ダウンロード"},
    "正在读取 Git 版本控制与远端同步状态…": {"en":"Reading Git repository and remote sync status…","zh-TW":"正在讀取 Git 版本控制與遠端同步狀態…","ko":"Git 저장소 및 원격 동기화 상태 읽는 중…","ja":"Git リポジトリとリモート同期状態を確認中…"},
    "🔗 远端仓库：": {"en":"🔗 Remote Repo: ","zh-TW":"🔗 遠端倉庫：","ko":"🔗 원격 저장소: ","ja":"🔗 リモートリポジトリ: "},
    "🔗 暂未配置远端 Git 仓库地址": {"en":"🔗 Remote Git repository URL not configured yet","zh-TW":"🔗 暫未設定遠端 Git 倉庫位址","ko":"🔗 원격 Git 저장소 주소가 설정되지 않았습니다","ja":"🔗 リモート Git リポジトリ URL が未設定です"},
    "未提交变更": {"en":"Uncommitted Changes","zh-TW":"未提交變更","ko":"커밋되지 않은 변경사항","ja":"未コミットの変更"},
    "待推送提交": {"en":"Pending Commits to Push","zh-TW":"待推送提交","ko":"푸시 대기 커밋","ja":"未プッシュのコミット"},
    "最近一次提交": {"en":"Latest Commit","zh-TW":"最近一次提交","ko":"최근 커밋","ja":"最新コミット"},
    "无提交记录": {"en":"No commit records","zh-TW":"無提交記錄","ko":"커밋 기록 없음","ja":"コミット履歴なし"},
    "上次远端推送": {"en":"Last Remote Push","zh-TW":"上次遠端推送","ko":"최근 원격 푸시","ja":"最終リモートプッシュ"},
    "❌ 失败": {"en":"❌ Failed","zh-TW":"❌ 失敗","ko":"❌ 실패","ja":"❌ 失敗"},
    "暂无推送记录": {"en":"No push records yet","zh-TW":"暫無推送記錄","ko":"푸시 기록 없음","ja":"プッシュ履歴なし"},
    "🚀 立即提交并推送": {"en":"🚀 Commit & Push Now","zh-TW":"🚀 立即提交並推送","ko":"🚀 지금 커밋 및 푸시","ja":"🚀 今すぐコミット＆プッシュ"},
    "📥 拉取远端更新": {"en":"📥 Pull Remote Updates","zh-TW":"📥 拉取遠端更新","ko":"📥 원격 업데이트 가져오기","ja":"📥 リモート更新を取得"},
    "🔍 测试连通性": {"en":"🔍 Test Connectivity","zh-TW":"🔍 測試連通性","ko":"🔍 연결 테스트","ja":"🔍 接続テスト"},
    "⚡ 初始化本地 Git 仓库": {"en":"⚡ Initialize Local Git Repo","zh-TW":"⚡ 初始化本機 Git 倉庫","ko":"⚡ 로컬 Git 저장소 초기화","ja":"⚡ ローカル Git リポジトリ初期化"},
    "📝 本地工作区变更": {"en":"📝 Working Tree Changes","zh-TW":"📝 本機工作區變更","ko":"📝 로컬 작업 영역 변경사항","ja":"📝 ワークツリーの変更"},
    "工作区干净": {"en":"Working tree clean","zh-TW":"工作區乾淨","ko":"작업 영역 깨끗함","ja":"ワークツリーはクリーンです"},
    "当前笔记库所有文件均已保存并纳入 Git 版本控制": {"en":"All vault files are saved and tracked under Git version control","zh-TW":"目前筆記庫所有檔案均已儲存並納入 Git 版本控制","ko":"현재 Vault의 모든 파일이 저장되어 Git 버전 관리에 포함되어 있습니다","ja":"ノートのすべてのファイルが保存され、Git で追跡されています"},
    "📜 Git 提交历史 (最近 20 条)": {"en":"📜 Git Commit History (Recent 20)","zh-TW":"📜 Git 提交歷史 (最近 20 條)","ko":"📜 Git 커밋 히스토리 (최근 20개)","ja":"📜 Git コミット履歴 (最新20件)"},
    "暂无 Git 提交历史，点击上方「立即提交并推送」创建首个提交快照": {"en":"No Git commit history yet. Click \"Commit & Push Now\" above to create your first commit snapshot","zh-TW":"暫無 Git 提交歷史，點擊上方「立即提交並推送」建立首個提交快照","ko":"Git 커밋 히스토리가 없습니다. 위의 '지금 커밋 및 푸시'를 클릭하여 첫 번째 커밋을 생성하세요","ja":"Git コミット履歴がありません。上の「今すぐコミット＆プッシュ」で最初のコミットを作成してください"},
    "⚙️ Git 仓库与自动推送设置": {"en":"⚙️ Git Repository & Auto Push Settings","zh-TW":"⚙️ Git 倉庫與自動推送設定","ko":"⚙️ Git 저장소 및 자동 푸시 설정","ja":"⚙️ Git リポジトリと自動プッシュ設定"},
    "启用 Git 备份": {"en":"Enable Git Backup","zh-TW":"啟用 Git 備份","ko":"Git 백업 활성화","ja":"Git バックアップを有効化"},
    "远端 Git 仓库地址 (Remote URL)": {"en":"Remote Git URL (Remote URL)","zh-TW":"遠端 Git 倉庫位址 (Remote URL)","ko":"원격 Git 저장소 주소 (Remote URL)","ja":"リモート Git リポジトリ URL"},
    "支持 GitHub、Gitee、GitLab、Coding 或私有 Git 仓库": {"en":"Supports GitHub, Gitee, GitLab, Coding, or self-hosted Git repositories","zh-TW":"支援 GitHub、Gitee、GitLab、Coding 或私有 Git 倉庫","ko":"GitHub, Gitee, GitLab 또는 자체 호스팅 Git 저장소를 지원합니다","ja":"GitHub、Gitee、GitLab またはセルフホスト Git リポジトリに対応"},
    "目标分支 (Branch)": {"en":"Target Branch (Branch)","zh-TW":"目標分支 (Branch)","ko":"대상 브랜치 (Branch)","ja":"対象ブランチ (Branch)"},
    "认证用户名 (Username)": {"en":"Auth Username (Username)","zh-TW":"認證使用者名稱 (Username)","ko":"인증 사용자 이름 (Username)","ja":"認証ユーザー名 (Username)"},
    "Committer 姓名": {"en":"Committer Name","zh-TW":"Committer 姓名","ko":"Committer 이름","ja":"Committer 氏名"},
    "Committer 邮箱": {"en":"Committer Email","zh-TW":"Committer 電子郵件","ko":"Committer 이메일","ja":"Committer メールアドレス"},
    "提交说明模板 (Commit Template)": {"en":"Commit Message Template","zh-TW":"提交說明範本 (Commit Template)","ko":"커밋 메시지 템플릿","ja":"コミットメッセージテンプレート"},
    "可用变量：": {"en":"Variables: ","zh-TW":"可用變數：","ko":"사용 가능 변수: ","ja":"利用可能な変数: "},
    "笔记修改后自动提交并推送 (实时防抖)": {"en":"Auto commit & push on note change (debounced)","zh-TW":"筆記修改後自動提交並推送 (即時防抖)","ko":"노트 변경 시 자동 커밋 및 푸시 (디바운스)","ja":"ノート編集時に自動コミット＆プッシュ (デバウンス)"},
    "防抖延迟：": {"en":"Debounce Delay: ","zh-TW":"防抖延遲：","ko":"디바운스 지연: ","ja":"デバウンス遅延: "},
    "推送前自动执行": {"en":"Auto pull before push: ","zh-TW":"推送前自動執行 ","ko":"푸시 전 자동 실행: ","ja":"プッシュ前自動実行: "},
    "合并远端": {"en":"merge remote","zh-TW":"合併遠端","ko":"원격 병합","ja":"リモートをマージ"},
    "💾 保存 Git 设置": {"en":"💾 Save Git Settings","zh-TW":"💾 儲存 Git 設定","ko":"💾 Git 설정 저장","ja":"💾 Git 設定を保存"},
    "🔍 测试连接": {"en":"🔍 Test Connection","zh-TW":"🔍 測試連線","ko":"🔍 연결 테스트","ja":"🔍 接続テスト"},
    "加载同步日志中…": {"en":"Loading sync logs…","zh-TW":"載入同步日誌中…","ko":"동기화 로그 불러오는 중…","ja":"同期ログを読み込み中…"},
    "📋 笔记同步日志 (Sync Logs)": {"en":"📋 Vault Sync Logs","zh-TW":"📋 筆記同步日誌 (Sync Logs)","ko":"📋 Vault 동기화 로그","ja":"📋 ノート同期ログ (Sync Logs)"},
    "🗑️ 清空此库日志": {"en":"🗑️ Clear Vault Logs","zh-TW":"🗑️ 清空此庫日誌","ko":"🗑️ 이 Vault 로그 지우기","ja":"🗑️ この Vault のログをクリア"},
    "全部同步动作 (All Actions)": {"en":"All Actions","zh-TW":"全部同步動作 (All Actions)","ko":"모든 동기화 동작","ja":"すべてのアクション"},
    "📝 更新 / 推送 (Push/Update)": {"en":"📝 Push / Update","zh-TW":"📝 更新 / 推送 (Push/Update)","ko":"📝 푸시 / 업데이트","ja":"📝 プッシュ / 更新"},
    "📥 读取 / 拉取 (Pull)": {"en":"📥 Pull / Read","zh-TW":"📥 讀取 / 拉取 (Pull)","ko":"📥 풀 / 읽기","ja":"📥 プル / 取得"},
    "⚠️ 冲突副本 (Conflict)": {"en":"⚠️ Conflict Copy","zh-TW":"⚠️ 衝突副本 (Conflict)","ko":"⚠️ 충돌 복사본","ja":"⚠️ 競合コピー"},
    "🗑️ 删除文件 (Delete)": {"en":"🗑️ Delete File","zh-TW":"🗑️ 刪除檔案 (Delete)","ko":"🗑️ 파일 삭제","ja":"🗑️ ファイル削除"},
    "🚫 规则忽略 (Ignored)": {"en":"🚫 Rule Ignored","zh-TW":"🚫 規則忽略 (Ignored)","ko":"🚫 규칙에 의해 무시됨","ja":"🚫 ルール除外"},
    "❌ 异常错误 (Error)": {"en":"❌ Error","zh-TW":"❌ 異常錯誤 (Error)","ko":"❌ 오류 발생","ja":"❌ エラー"},
    "全部状态 (All Status)": {"en":"All Statuses","zh-TW":"全部狀態 (All Status)","ko":"모든 상태","ja":"すべてのステータス"},
    "✓ 成功 (Success)": {"en":"✓ Success","zh-TW":"✓ 成功 (Success)","ko":"✓ 성공","ja":"✓ 成功"},
    "⚠️ 冲突 (Conflict)": {"en":"⚠️ Conflict","zh-TW":"⚠️ 衝突 (Conflict)","ko":"⚠️ 충돌","ja":"⚠️ 競合"},
    "✕ 错误 (Error)": {"en":"✕ Error","zh-TW":"✕ 錯誤 (Error)","ko":"✕ 오류","ja":"✕ エラー"},
    "- 忽略 (Ignored)": {"en":"- Ignored","zh-TW":"- 忽略 (Ignored)","ko":"- 무시됨","ja":"- 除外"},
    "🔍 筛选": {"en":"🔍 Filter","zh-TW":"🔍 篩選","ko":"🔍 필터","ja":"🔍 絞り込み"},
    "时间戳": {"en":"Timestamp","zh-TW":"時間戳記","ko":"타임스탬프","ja":"タイムスタンプ"},
    "动作": {"en":"Action","zh-TW":"動作","ko":"동작","ja":"アクション"},
    "笔记 / 文件路径": {"en":"File Path","zh-TW":"筆記 / 檔案路徑","ko":"파일 경로","ja":"ファイルパス"},
    "客户端设备 / IP": {"en":"Device / IP","zh-TW":"用戶端裝置 / IP","ko":"기기 / IP","ja":"デバイス / IP"},
    "详细说明": {"en":"Details","zh-TW":"詳細說明","ko":"상세 정보","ja":"詳細"},
    "加载全局同步日志中…": {"en":"Loading global sync logs…","zh-TW":"載入全域同步日誌中…","ko":"전체 동기화 로그 불러오는 중…","ja":"グローバル同期ログを読み込み中…"},
    "用户 / 设备": {"en":"User / Device","zh-TW":"使用者 / 裝置","ko":"사용자 / 기기","ja":"ユーザー / デバイス"},
    "加载用户列表中…": {"en":"Loading user list…","zh-TW":"載入使用者清單中…","ko":"사용자 목록 불러오는 중…","ja":"ユーザー一覧を読み込み中…"},
    "👥 用户管理与 Vault 授权": {"en":"👥 User Management & Vault Permissions","zh-TW":"👥 使用者管理與 Vault 授權","ko":"👥 사용자 관리 및 Vault 권한 부여","ja":"👥 ユーザー管理と Vault 権限"},
    "管理员权限（允许管理系统数据库、全局用户及所有 Vault 配置）": {"en":"Administrator Privileges (Full access to database, users, and all vaults)","zh-TW":"管理員權限（允許管理系統資料庫、全域使用者及所有 Vault 設定）","ko":"관리자 권한 (데이터베이스, 전체 사용자 및 모든 Vault 설정 관리 허용)","ja":"管理者権限 (データベース、全ユーザー、全 Vault 設定の管理を許可)"},
    "全选": {"en":"Select All","zh-TW":"全選","ko":"전체 선택","ja":"すべて選択"},
    "＋ 创建用户并分配权限": {"en":"＋ Create User & Assign Permissions","zh-TW":"＋ 建立使用者並分配權限","ko":"＋ 사용자 생성 및 권한 할당","ja":"＋ ユーザーを作成して権限を割り当て"},
    "授权笔记库 (Vaults)": {"en":"Authorized Vaults","zh-TW":"授權筆記庫 (Vaults)","ko":"인가된 Vault 목록","ja":"許可された Vault"},
    "暂无关联 Vault": {"en":"No associated vaults","zh-TW":"暫無關聯 Vault","ko":"연결된 Vault 없음","ja":"関連付けられた Vault はありません"},
    "✏️ 编辑用户": {"en":"✏️ Edit User","zh-TW":"✏️ 編輯使用者","ko":"✏️ 사용자 수정","ja":"✏️ ユーザーを編集"},
    "编辑用户:": {"en":"Edit User: ","zh-TW":"編輯使用者：","ko":"사용자 수정: ","ja":"ユーザー編集: "},
    "🔒 已创建用户禁止修改用户名": {"en":"🔒 Username cannot be changed after creation","zh-TW":"🔒 已建立使用者禁止修改使用者名稱","ko":"🔒 생성된 사용자의 사용자 이름은 변경할 수 없습니다","ja":"🔒 作成済みユーザーのユーザー名は変更できません"},
    "重置密码 (留空保持原密码不变)": {"en":"Reset Password (Leave blank to keep unchanged)","zh-TW":"重設密碼 (留空保持原密碼不變)","ko":"비밀번호 재설정 (비워두면 기존 비밀번호 유지)","ja":"パスワード再設定 (空欄の場合は変更なし)"},
    "用户角色权限": {"en":"User Role & Permissions","zh-TW":"使用者角色權限","ko":"사용자 역할 및 권한","ja":"ユーザーの役割と権限"},
    "系统管理员 (Admin)": {"en":"System Admin (Admin)","zh-TW":"系統管理員 (Admin)","ko":"시스템 관리자 (Admin)","ja":"システム管理者 (Admin)"},
    "💡 正在编辑自身账号，无法降级管理员权限": {"en":"💡 Editing current account; admin privileges cannot be downgraded","zh-TW":"💡 正在編輯自身帳號，無法降級管理員權限","ko":"💡 본인 계정 수정 중에는 관리자 권한을 강등할 수 없습니다","ja":"💡 自身のアカウントを編集中です。管理者権限の降格はできません"},
    "加载 Vault 列表中…": {"en":"Loading vaults list…","zh-TW":"載入 Vault 清單中…","ko":"Vault 목록 불러오는 중…","ja":"Vault 一覧を読み込み中…"},
    "修改将即时生效": {"en":"Changes take effect immediately","zh-TW":"修改將即時生效","ko":"변경사항이 즉시 적용됩니다","ja":"変更は即座に有効になります"},
    "保存修改": {"en":"Save Changes","zh-TW":"儲存修改","ko":"변경사항 저장","ja":"変更を保存"},
    "多数据库配置与管理": {"en":"Multi-Database Configuration & Management","zh-TW":"多資料庫設定與管理","ko":"다중 데이터베이스 구성 및 관리","ja":"マルチデータベース構成と管理"},
    "🗄️ 多数据库配置与管理": {"en":"🗄️ Multi-Database Configuration & Management","zh-TW":"🗄️ 多資料庫設定與管理","ko":"🗄️ 다중 데이터베이스 구성 및 관리","ja":"🗄️ マルチデータベース構成と管理"},
    "加载数据库配置中…": {"en":"Loading database configuration…","zh-TW":"載入資料庫設定中…","ko":"데이터베이스 구성 불러오는 중…","ja":"データベース設定を読み込み中…"},
    "当前激活引擎": {"en":"Active Engine","zh-TW":"目前啟用引擎","ko":"현재 활성 엔진","ja":"稼働中エンジン"},
    "运行中": {"en":"Running","zh-TW":"運作中","ko":"실행 중","ja":"稼働中"},
    "支持热切换至 SQLite / PostgreSQL / MySQL，数据可一键迁移。": {"en":"Supports hot switching to SQLite / PostgreSQL / MySQL with one-click data migration.","zh-TW":"支援熱切換至 SQLite / PostgreSQL / MySQL，資料可一鍵遷移。","ko":"SQLite / PostgreSQL / MySQL로 핫 스위칭 및 원클릭 데이터 마이그레이션을 지원합니다.","ja":"SQLite / PostgreSQL / MySQL へのホット切り替えとワンクリックデータ移行に対応。"},
    "已持久化实体统计": {"en":"Persisted Entity Statistics","zh-TW":"已持久化實體統計","ko":"영구 저장된 엔티티 통계","ja":"永続化エンティティ統計"},
    "用户": {"en":"Users","zh-TW":"使用者","ko":"사용자","ja":"ユーザー"},
    "Vaults": {"en":"Vaults","zh-TW":"Vaults","ko":"Vaults","ja":"Vaults"},
    "分享链接": {"en":"Share Links","zh-TW":"分享連結","ko":"공유 링크","ja":"共有リンク"},
    "切换或配置数据库引擎": {"en":"Switch or Configure Database Engine","zh-TW":"切換或設定資料庫引擎","ko":"데이터베이스 엔진 전환 및 구성","ja":"データベースエンジンの切り替えと設定"},
    "SQLite (单文件极简推荐)": {"en":"SQLite (Single File, Recommended)","zh-TW":"SQLite (單一檔案極簡推薦)","ko":"SQLite (단일 파일, 가볍고 간편함 추천)","ja":"SQLite (単一ファイル・推奨)"},
    "PostgreSQL (企业级关系数据库)": {"en":"PostgreSQL (Enterprise Relational DB)","zh-TW":"PostgreSQL (企業級關聯式資料庫)","ko":"PostgreSQL (엔터프라이즈 관계형 데이터베이스)","ja":"PostgreSQL (エンタープライズ RDBMS)"},
    "MySQL (标准生产数据库)": {"en":"MySQL (Standard Production DB)","zh-TW":"MySQL (標準生產資料庫)","ko":"MySQL (표준 프로덕션 데이터베이스)","ja":"MySQL (標準プロダクション DB)"},
    "JSON 文件 (基础轻量)": {"en":"JSON Files (Basic & Lightweight)","zh-TW":"JSON 檔案 (基礎輕量)","ko":"JSON 파일 (기본 경량)","ja":"JSON ファイル (基本・軽量)"},
    "JSON 本地文件存储": {"en":"JSON Local File Storage","zh-TW":"JSON 本機檔案儲存","ko":"JSON 로컬 파일 스토리지","ja":"JSON ローカルファイルストレージ"},
    "使用 data/users.json 和 data/vaults.json 保存用户与配置。无需独立数据库，适合轻量单机运行。": {"en":"Uses data/users.json and data/vaults.json to store users and configurations. No external database needed, ideal for lightweight standalone operation.","zh-TW":"使用 data/users.json 和 data/vaults.json 儲存使用者與設定。無需獨立資料庫，適合輕量單機運作。","ko":"data/users.json 및 data/vaults.json을 사용하여 사용자와 설정을 저장합니다. 별도 DB가 필요 없어 단독 경량 실행에 적합합니다.","ja":"data/users.json と data/vaults.json を使用してユーザーと設定を保存します。外部 DB 不要で軽量なスタンドアロン運用に適しています。"},
    "应用 JSON 文件模式": {"en":"Apply JSON File Mode","zh-TW":"套用 JSON 檔案模式","ko":"JSON 파일 모드 적용","ja":"JSON ファイルモードを適用"},
    "SQLite 文件配置": {"en":"SQLite Configuration","zh-TW":"SQLite 檔案設定","ko":"SQLite 파일 설정","ja":"SQLite 構成"},
    "SQLite 数据库文件存储路径": {"en":"SQLite Database File Path","zh-TW":"SQLite 資料庫檔案儲存路徑","ko":"SQLite 데이터베이스 파일 저장 경로","ja":"SQLite データベースファイル保存パス"},
    "同时将现有用户与配置数据迁移到新数据库": {"en":"Simultaneously migrate existing users and configuration data to the new database","zh-TW":"同時將現有使用者與設定資料遷移到新資料庫","ko":"기존 사용자와 설정 데이터를 새 데이터베이스로 함께 마이그레이션","ja":"既存のユーザーおよび設定データを新規データベースへ同時に移行"},
    "测试连接": {"en":"Test Connection","zh-TW":"測試連線","ko":"연결 테스트","ja":"接続テスト"},
    "保存并应用 SQLite 引擎": {"en":"Save & Apply SQLite Engine","zh-TW":"儲存並套用 SQLite 引擎","ko":"SQLite 엔진 저장 및 적용","ja":"SQLite エンジンを保存して適用"},
    "PostgreSQL 连接配置": {"en":"PostgreSQL Connection Configuration","zh-TW":"PostgreSQL 連線設定","ko":"PostgreSQL 연결 구성","ja":"PostgreSQL 接続構成"},
    "Host 主机": {"en":"Host","zh-TW":"Host 主機","ko":"호스트 (Host)","ja":"ホスト (Host)"},
    "Port 端口": {"en":"Port","zh-TW":"Port 連接埠","ko":"포트 (Port)","ja":"ポート (Port)"},
    "Database 数据库名": {"en":"Database Name","zh-TW":"Database 資料庫名稱","ko":"데이터베이스 이름","ja":"データベース名"},
    "User 用户名": {"en":"Username","zh-TW":"User 使用者名稱","ko":"사용자 이름 (User)","ja":"ユーザー名 (User)"},
    "Password 密码": {"en":"Password","zh-TW":"Password 密碼","ko":"비밀번호 (Password)","ja":"パスワード (Password)"},
    "留空则无密码或沿用现有密码": {"en":"Leave blank for no password or to keep existing password","zh-TW":"留空則無密碼或沿用現有密碼","ko":"비워두면 비밀번호 없음 또는 기존 비밀번호 유지","ja":"空白の場合はパスワードなし、または既存のパスワードを維持"},
    "保存并应用 PostgreSQL 引擎": {"en":"Save & Apply PostgreSQL Engine","zh-TW":"儲存並套用 PostgreSQL 引擎","ko":"PostgreSQL 엔진 저장 및 적용","ja":"PostgreSQL エンジンを保存して適用"},
    "MySQL 连接配置": {"en":"MySQL Connection Configuration","zh-TW":"MySQL 連線設定","ko":"MySQL 연결 구성","ja":"MySQL 接続構成"},
    "保存并应用 MySQL 引擎": {"en":"Save & Apply MySQL Engine","zh-TW":"儲存並套用 MySQL 引擎","ko":"MySQL 엔진 저장 및 적용","ja":"MySQL エンジンを保存して適用"},
    "正在测试连接…": {"en":"Testing connection…","zh-TW":"正在測試連線…","ko":"연결 테스트 중…","ja":"接続をテスト中…"},
    "连接测试成功": {"en":"Connection test succeeded","zh-TW":"連線測試成功","ko":"연결 테스트 성공","ja":"接続テストに成功しました"},
    "连接失败:": {"en":"Connection failed:","zh-TW":"連線失敗:","ko":"연결 실패:","ja":"接続失敗:"},
    "正在应用数据库设置并初始化表结构…": {"en":"Applying database settings and initializing schemas…","zh-TW":"正在套用資料庫設定並初始化資料表結構…","ko":"데이터베이스 설정 적용 및 테이블 스키마 초기화 중…","ja":"データベース設定を適用しスキーマを初期化中…"},
    "数据库切换成功": {"en":"Database engine switched successfully","zh-TW":"資料庫切換成功","ko":"데이터베이스 전환 성공","ja":"データベースの切り替えに成功しました"},
    "📖 数据库支持说明": {"en":"📖 Database Engine Overview & Notes","zh-TW":"📖 資料庫支援說明","ko":"📖 데이터베이스 지원 안내","ja":"📖 データベースサポート仕様"},
    "Nimbus 现已内置对": {"en":"Nimbus now includes built-in abstraction support for ","zh-TW":"Nimbus 現已內建對 ","ko":"Nimbus는 ","ja":"Nimbus は "},
    "三种主流数据库及本地 JSON 存储引擎的完整抽象支持：": {"en":"three mainstream databases and local JSON storage engines:","zh-TW":"三種主流資料庫及本機 JSON 儲存引擎的完整抽象支援：","ko":"3대 주요 데이터베이스 및 로컬 JSON 스토리지 엔진을 완벽히 지원합니다:","ja":"の主要3種データベースおよびローカル JSON ストレージエンジンを標準サポートしています:"},
    "用户数据 (Users)": {"en":"User Data (Users)","zh-TW":"使用者資料 (Users)","ko":"사용자 데이터 (Users)","ja":"ユーザーデータ (Users)"},
    "：账号、权限、密码哈希与创建时间均完整保存在选定数据库中。": {"en":": Accounts, roles, password hashes, and timestamps are fully stored in the selected database.","zh-TW":"：帳號、權限、密碼雜湊與建立時間均完整儲存在選定資料庫中。","ko":": 계정, 권한, 비밀번호 해시 및 생성 일시가 선택한 데이터베이스에 안전하게 저장됩니다.","ja":": アカウント、権限、パスワードハッシュ、作成日時は選択した DB に保存されます。"},
    "配置数据 (Sync Rules & Metadata)": {"en":"Configuration Data (Sync Rules & Metadata)","zh-TW":"設定資料 (Sync Rules & Metadata)","ko":"설정 데이터 (Sync Rules & Metadata)","ja":"構成データ (Sync Rules & Metadata)"},
    "：黑名单规则、同步策略、分片配置自动持久化到数据库。": {"en":": Ignore patterns, sync policies, and chunk configurations are automatically persisted.","zh-TW":"：黑名單規則、同步策略、分片設定自動持久化到資料庫。","ko":": 무시 패턴, 동기화 정책, 청크 분할 설정이 자동으로 데이터베이스에 유지됩니다.","ja":": 除外ルール、同期ポリシー、チャンク構成が自動的にデータベースへ永続化されます。"},
    "Vault 与外链元数据 (Vaults & Shares)": {"en":"Vault & Share Metadata (Vaults & Shares)","zh-TW":"Vault 與外鏈元資料 (Vaults & Shares)","ko":"Vault 및 공유 메타데이터 (Vaults & Shares)","ja":"Vault および共有メタデータ (Vaults & Shares)"},
    "：Vault 归属权、公开分享链接与访问密码完整同步。": {"en":": Vault ownership, public share links, and access passwords are fully synchronized.","zh-TW":"：Vault 歸屬權、公開分享連結與存取密碼完整同步。","ko":": Vault 소유권, 공개 공유 링크 및 접근 비밀번호가 완벽하게 동기화됩니다.","ja":": Vault 所有権、公開共有リンク、アクセスパスワードが完全に同期されます。"},
    "环境变量支持": {"en":"Environment Variable Support","zh-TW":"環境變數支援","ko":"환경 변수 지원","ja":"環境変数サポート"},
    "：也可直接在": {"en":": You can also configure directly in ","zh-TW":"：也可直接在 ","ko":": 또한 ","ja":": または "},
    "中配置": {"en":" with ","zh-TW":" 中設定 ","ko":" 파일에 ","ja":" に "},
    "启动自动连接。": {"en":" to auto-connect on server startup.","zh-TW":" 啟動自動連線。","ko":"를 구성하여 서버 시작 시 자동 연결할 수 있습니다.","ja":" を設定して起動時に自動接続できます。"},
    "从左侧选择一个 vault": {"en":"Select a vault from the left sidebar","zh-TW":"從左側選擇一個 vault","ko":"왼쪽 사이드바에서 Vault를 선택하세요","ja":"左側のサイドバーから Vault を選択してください"},
    "统计数据加载中…": {"en":"Loading stats…","zh-TW":"統計資料載入中…","ko":"통계 불러오는 중…","ja":"統計を読み込み中…"},
    "⚡ 实时 WebSocket 双向同步": {"en":"⚡ Real-time WebSocket Two-Way Sync","zh-TW":"⚡ 即時 WebSocket 雙向同步","ko":"⚡ 실시간 WebSocket 양방향 동기화","ja":"⚡ リアルタイム WebSocket 双方向同期"},
    "实时 WebSocket 同步中": {"en":"WebSocket Sync Active","zh-TW":"即時 WebSocket 同步中","ko":"실시간 WebSocket 동기화 중","ja":"WebSocket 同期中"},
    "实时追踪已接入此 Vault 的 Obsidian 客户端与编辑节点": {"en":"Real-time tracking of connected Obsidian clients and sync nodes for this vault","zh-TW":"即時追蹤已接入此 Vault 的 Obsidian 用戶端與編輯節點","ko":"이 Vault에 연결된 Obsidian 클라이언트 및 편집 노드를 실시간 추적합니다","ja":"この Vault に接続されている Obsidian クライアントと同期ノードをリアルタイム監視"},
    "个标准端点": {"en":"Standard Endpoints","zh-TW":"個標準端點","ko":"개 표준 엔드포인트","ja":"個の標準エンドポイント"},
    "调用指引": {"en":"API Usage Guide","zh-TW":"呼叫指引","ko":"호출 안내","ja":"呼び出しガイド"},
    "：所有接口请求基础地址为": {"en":": Base URL for all API requests is ","zh-TW":"：所有介面請求基礎位址為 ","ko":": 모든 API 요청의 기본 주소는 ","ja":": すべての API リクエストのベース URL は "},
    "。需要认证的接口请在 Header 中添加": {"en":". For authenticated endpoints, include Header: ","zh-TW":"。需要認證的介面請在 Header 中加入 ","ko":". 인증이 필요한 API는 헤더에 다음을 추가하세요: ","ja":"。認証が必要な API はヘッダーに次を追加してください: "},
    "加载分享列表中…": {"en":"Loading shares list…","zh-TW":"載入分享清單中…","ko":"공유 목록 불러오는 중…","ja":"共有一覧を読み込み中…"},
    "🔗 已公开分享的笔记": {"en":"🔗 Publicly Shared Notes","zh-TW":"🔗 已公開分享的筆記","ko":"🔗 공개 공유된 노트","ja":"🔗 公開共有ノート"},
    "1 天后过期": {"en":"Expires in 1 day","zh-TW":"1 天後過期","ko":"1일 후 만료","ja":"1日後に期限切れ"},
    "7 天后过期": {"en":"Expires in 7 days","zh-TW":"7 天後過期","ko":"7일 후 만료","ja":"7日後に期限切れ"},
    "30 天后过期": {"en":"Expires in 30 days","zh-TW":"30 天後過期","ko":"30일 후 만료","ja":"30日後に期限切れ"},
    "加载成员与权限信息中…": {"en":"Loading members & permissions…","zh-TW":"載入成員與權限資訊中…","ko":"멤버 및 권한 정보 불러오는 중…","ja":"メンバーと権限情報を読み込み中…"},
    "笔记库权限与成员管理": {"en":"Vault Members & Access Control","zh-TW":"筆記庫權限與成員管理","ko":"Vault 멤버 및 권한 관리","ja":"Vault メンバーと権限管理"},
    "· 创建者:": {"en":"· Creator:","zh-TW":"· 建立者:","ko":"· 생성자:","ja":"· 作成者:"},
    "您是所有者": {"en":"You are the Owner","zh-TW":"您是所有者","ko":"귀하는 소유자입니다","ja":"あなたはこの Vault の所有者です"},
    "选择用户": {"en":"Select User","zh-TW":"選擇使用者","ko":"사용자 선택","ja":"ユーザーを選択"},
    "-- 请选择要授权的用户 --": {"en":"-- Select user to grant access --","zh-TW":"-- 請選擇要授權的使用者 --","ko":"-- 권한을 부여할 사용자를 선택하세요 --","ja":"-- 権限を付与するユーザーを選択 --"},
    "赋予权限": {"en":"Grant Permission","zh-TW":"賦予權限","ko":"권한 부여","ja":"権限を付与"},
    "读写 (Read & Write) - 允许同步修改": {"en":"Read & Write - Allows editing & syncing","zh-TW":"讀寫 (Read & Write) - 允許同步修改","ko":"읽기/쓰기 (Read & Write) - 수정 및 동기화 허용","ja":"読み書き (Read & Write) - 編集と同期を許可"},
    "只读 (Read Only) - 仅允许拉取与查看": {"en":"Read Only - View & pull only","zh-TW":"唯讀 (Read Only) - 僅允許拉取與檢視","ko":"읽기 전용 (Read Only) - 조회 및 풀 전용","ja":"読み取り専用 (Read Only) - 閲覧と取得のみ"},
    "＋ 确认授权": {"en":"＋ Grant Access","zh-TW":"＋ 確認授權","ko":"＋ 권한 부여 확인","ja":"＋ 権限を付与"},
    "所有者享有最高管理与删除权限": {"en":"Owner holds full administrative and deletion privileges","zh-TW":"所有者享有最高管理與刪除權限","ko":"소유자는 최고 관리 및 삭제 권한을 가집니다","ja":"所有者は最高管理および削除権限を保持します"},
    "Vault 权限级别": {"en":"Vault Permission Level","zh-TW":"Vault 權限級別","ko":"Vault 권한 수준","ja":"Vault 権限レベル"},
    "授权时间": {"en":"Granted At","zh-TW":"授權時間","ko":"권한 부여 일시","ja":"付与日時"},
    "所有者 (Owner)": {"en":"Owner (Owner)","zh-TW":"所有者 (Owner)","ko":"소유자 (Owner)","ja":"所有者 (Owner)"},
    "全部权限 (所有者)": {"en":"Full Access (Owner)","zh-TW":"全部權限 (所有者)","ko":"모든 권한 (소유자)","ja":"全権限 (所有者)"},
    "创建者 (不可撤销)": {"en":"Creator (Irrevocable)","zh-TW":"建立者 (不可撤銷)","ko":"생성자 (취소 불가)","ja":"作成者 (失効不可)"},
    "✏️ 读写 (Read-Write)": {"en":"✏️ Read-Write","zh-TW":"✏️ 讀寫 (Read-Write)","ko":"✏️ 읽기-쓰기","ja":"✏️ 読み書き"},
    "👁️ 只读 (Read-Only)": {"en":"👁️ Read-Only","zh-TW":"👁️ 唯讀 (Read-Only)","ko":"👁️ 읽기 전용","ja":"👁️ 読み取り専用"},
    "✏️ 读写 (可同步修改)": {"en":"✏️ Read & Write (Sync Allowed)","zh-TW":"✏️ 讀寫 (可同步修改)","ko":"✏️ 읽기 및 쓰기 (동기화 가능)","ja":"✏️ 読み書き (同期可能)"},
    "👁️ 只读 (仅查看拉取)": {"en":"👁️ Read Only (Pull Only)","zh-TW":"👁️ 唯讀 (僅檢視拉取)","ko":"👁️ 읽기 전용 (조회 전용)","ja":"👁️ 読み取り専用 (閲覧のみ)"},
    "移除权限": {"en":"Revoke Access","zh-TW":"移除權限","ko":"권한 회수","ja":"権限を削除"},
    "加载同步规则中…": {"en":"Loading sync rules…","zh-TW":"載入同步規則中…","ko":"동기화 규칙 불러오는 중…","ja":"同期ルールを読み込み中…"},
    "加载回收站中…": {"en":"Loading trash…","zh-TW":"載入資源回收筒中…","ko":"휴지통 불러오는 중…","ja":"ごみ箱を読み込み中…"},
    "检测冲突文件中…": {"en":"Checking file conflicts…","zh-TW":"檢測衝突檔案中…","ko":"파일 충돌 검사 중…","ja":"ファイル競合をチェック中…"},
    "⚠️ 冲突源文件:": {"en":"⚠️ Original File:","zh-TW":"⚠️ 衝突來源檔案:","ko":"⚠️ 충돌 원본 파일:","ja":"⚠️ 競合元ファイル:"},
    "冲突副本:": {"en":"Conflict Copy:","zh-TW":"衝突副本:","ko":"충돌 복사본:","ja":"競合コピー:"},
    "冲突时间:": {"en":"Conflict Time:","zh-TW":"衝突時間:","ko":"충돌 발생 시간:","ja":"競合発生日時:"},
    "产生冲突的客户端:": {"en":"Conflicting Client:","zh-TW":"產生衝突的用戶端:","ko":"충돌 발생 클라이언트:","ja":"競合元クライアント:"},
    "差异对比 (Diff)": {"en":"Diff Comparison","zh-TW":"差異對比 (Diff)","ko":"차이점 비교 (Diff)","ja":"差分比較 (Diff)"},
    "服务端最新内容": {"en":"Server Version","zh-TW":"伺服端最新內容","ko":"서버 최신 버전","ja":"サーバー側最新内容"},
    "客户端修改副本": {"en":"Client Conflict Version","zh-TW":"用戶端修改副本","ko":"클라이언트 수정본","ja":"クライアント側変更コピー"},
    "告警与事件通知 (Webhooks)": {"en":"Webhooks & Alerts","zh-TW":"告警與事件通知 (Webhooks)","ko":"웹훅 및 이벤트 알림","ja":"Webhook とイベント通知"},
    "配置 Webhook 接收笔记同步、冲突、成员变动与系统异常实时通知": {"en":"Configure webhooks for note sync events, conflicts, member updates, and alerts","zh-TW":"設定 Webhook 接收筆記同步、衝突、成員變動與系統異常即時通知","ko":"노트 동기화, 충돌, 멤버 변경 및 시스템 알림을 수신할 웹훅을 설정합니다","ja":"ノート同期、競合、メンバー変更およびシステム警告を受信する Webhook を設定"},
    "➕ 添加 Webhook 订阅": {"en":"➕ Add Webhook","zh-TW":"➕ 加入 Webhook 訂閱","ko":"➕ 새 웹훅 추가","ja":"➕ Webhook を追加"},
    "Webhook 名称 (如 钉钉 / 飞书 / Slack / 自建服务)": {"en":"Webhook Name (e.g. Slack / Discord / DingTalk / Custom)","zh-TW":"Webhook 名稱 (如 釘釘 / 飛書 / Slack / 自建服務)","ko":"웹훅 이름 (예: Slack / Discord / 잔디 / 자체 서버)","ja":"Webhook 名 (例: Slack / Discord / Teams / 自作サービス)"},
    "Webhook 接收地址 (Target URL)": {"en":"Webhook Target URL","zh-TW":"Webhook 接收位址 (Target URL)","ko":"웹훅 수신 주소 (Target URL)","ja":"Webhook 送信先 URL (Target URL)"},
    "签名密钥 (Secret Key, 选填)": {"en":"Secret Key (Optional)","zh-TW":"簽章金鑰 (Secret Key, 選填)","ko":"서명 비밀키 (Secret Key, 선택사항)","ja":"署名シークレット (Secret Key, 任意)"},
    "订阅事件": {"en":"Subscribed Events","zh-TW":"訂閱事件","ko":"구독 이벤트","ja":"購読イベント"},
    "测试发送": {"en":"Test Delivery","zh-TW":"測試發送","ko":"테스트 전송","ja":"テスト送信"},
    "删除订阅": {"en":"Delete Webhook","zh-TW":"刪除訂閱","ko":"웹훅 삭제","ja":"Webhook を削除"},
    "用户账户与权限管理": {"en":"User Management & Permissions","zh-TW":"使用者帳戶與權限管理","ko":"사용자 계정 및 권한 관리","ja":"ユーザーアカウントと権限管理"},
    "管理系统所有注册用户、角色分配与账号状态": {"en":"Manage registered users, role assignments, and account statuses","zh-TW":"管理系統所有註冊使用者、角色分配與帳號狀態","ko":"모든 등록된 사용자, 역할 할당 및 계정 상태를 관리합니다","ja":"登録ユーザー、役割の割り当ておよびアカウント状態を管理"},
    "➕ 创建新用户": {"en":"➕ Create New User","zh-TW":"➕ 建立新使用者","ko":"➕ 새 사용자 생성","ja":"➕ 新規ユーザーを作成"},
    "用户名 (Username)": {"en":"Username","zh-TW":"使用者名稱 (Username)","ko":"사용자 이름 (Username)","ja":"ユーザー名 (Username)"},
    "登录密码 (Password)": {"en":"Password","zh-TW":"登入密碼 (Password)","ko":"비밀번호 (Password)","ja":"パスワード (Password)"},
    "系统角色 (Role)": {"en":"System Role","zh-TW":"系統角色 (Role)","ko":"시스템 역할 (Role)","ja":"システム権限 (Role)"},
    "重置密码": {"en":"Reset Password","zh-TW":"重設密碼","ko":"비밀번호 재설정","ja":"パスワードをリセット"},
    "禁用用户": {"en":"Disable User","zh-TW":"停用使用者","ko":"사용자 비활성화","ja":"ユーザーを無効化"},
    "启用用户": {"en":"Enable User","zh-TW":"啟用使用者","ko":"사용자 활성화","ja":"ユーザーを有効化"},
    "删除用户": {"en":"Delete User","zh-TW":"刪除使用者","ko":"사용자 삭제","ja":"ユーザーを削除"},
    "全局 Vault 资源概览": {"en":"Global Vaults Overview","zh-TW":"全域 Vault 資源概覽","ko":"전체 Vault 자원 개요","ja":"グローバル Vault 概要"},
    "查看与管理服务器上托管的所有 Vault 库及空间占用": {"en":"View and manage all hosted vaults and storage consumption across the server","zh-TW":"檢視與管理伺服器上託管的所有 Vault 庫及空間佔用","ko":"서버에 호스팅된 모든 Vault 및 스토리지 사용량을 확인하고 관리합니다","ja":"サーバー上にホストされているすべての Vault とストレージ使用状況を管理"},
    "Vault 名称": {"en":"Vault Name","zh-TW":"Vault 名稱","ko":"Vault 이름","ja":"Vault 名"},
    "文件数": {"en":"Files","zh-TW":"檔案數","ko":"파일 수","ja":"ファイル数"},
    "空间占用": {"en":"Storage Size","zh-TW":"空間佔用","ko":"저장 공간","ja":"使用容量"},
    "所有者": {"en":"Owner","zh-TW":"所有者","ko":"소유자","ja":"所有者"},
    "操作": {"en":"Actions","zh-TW":"操作","ko":"작업","ja":"操作"},
    "支持 Nimbus Vault Sync 开源项目": {"en":"Support Nimbus Vault Sync Open Source Project","zh-TW":"支持 Nimbus Vault Sync 開源專案","ko":"Nimbus Vault Sync 오픈소스 프로젝트 후원","ja":"Nimbus Vault Sync オープンソースプロジェクトを支援"},
    "您的支持与赞助是项目持续迭代与高质量维护的最大动力 ❤️": {"en":"Your generous support and sponsorship empower continuous maintenance and improvements ❤️","zh-TW":"您的支持與贊助是專案持續迭代與高品質維護的最大動力 ❤️","ko":"여러분의 후원과 지원은 프로젝트의 지속적인 개발과 유지보수의 큰 힘이 됩니다 ❤️","ja":"皆様のご支援とスポンサーシップが、継続的な開発と高品質な保守の原動力です ❤️"},
    "☕ 请作者喝杯咖啡 (¥15)": {"en":"☕ Buy Me a Coffee (¥15)","zh-TW":"☕ 請作者喝杯咖啡 (¥15)","ko":"☕ 커피 한 잔 후원 (¥15)","ja":"☕ コーヒーを奢る (¥15)"},
    "🌟 进阶开发者赞助 (¥50)": {"en":"🌟 Pro Backer (¥50)","zh-TW":"🌟 進階開發者贊助 (¥50)","ko":"🌟 프로 후원자 (¥50)","ja":"🌟 プロスポンサー (¥50)"},
    "🚀 企业与商业支持 (¥200)": {"en":"🚀 Enterprise Backer (¥200)","zh-TW":"🚀 企業與商業支持 (¥200)","ko":"🚀 엔터프라이즈 후원 (¥200)","ja":"🚀 エンタープライズ支援 (¥200)"},
    "微信支付": {"en":"WeChat Pay","zh-TW":"微信支付","ko":"WeChat Pay","ja":"WeChat Pay"},
    "支付宝": {"en":"Alipay","zh-TW":"支付寶","ko":"Alipay","ja":"Alipay"},
    "GitHub Sponsors": {"en":"GitHub Sponsors","zh-TW":"GitHub Sponsors","ko":"GitHub Sponsors","ja":"GitHub Sponsors"},
    "🙏 感谢每一位贡献者与支持者": {"en":"🙏 Special Thanks to All Contributors & Backers","zh-TW":"🙏 感謝每一位貢獻者與支持者","ko":"🙏 모든 기여자 및 후원자 여러분께 감사드립니다","ja":"🙏 すべての貢献者とサポーターの皆様に感謝いたします"},
    "设置 (Nimbus Vault Sync)": {"en":"Settings (Nimbus Vault Sync)","zh-TW":"設定 (Nimbus Vault Sync)","ko":"설정 (Nimbus Vault Sync)","ja":"設定 (Nimbus Vault Sync)"},
    "配置 Obsidian 客户端同步参数、实时冲突裁决机制、多端专属令牌与数据保留策略": {"en":"Configure Obsidian client sync parameters, real-time conflict arbitration, dedicated device tokens, and data retention policies","zh-TW":"設定 Obsidian 用戶端同步參數、即時衝突裁決機制、多端專屬權杖與資料保留策略","ko":"Obsidian 클라이언트 동기화 매개변수, 실시간 충돌 중재 메커니즘, 전용 기기 토큰 및 데이터 보존 정책 설정","ja":"Obsidian クライアント同期設定、リアルタイム競合調停、端末専用トークンおよびデータ保持ポリシーを設定"},
    "👑 系统管理员": {"en":"👑 System Administrator","zh-TW":"👑 系統管理員","ko":"👑 시스템 관리자","ja":"👑 システム管理者"},
    "👤 普通用户": {"en":"👤 Standard User","zh-TW":"👤 一般使用者","ko":"👤 일반 사용자","ja":"👤 一般ユーザー"},
    "⚡ Obsidian 插件配置": {"en":"⚡ Obsidian Plugin Config","zh-TW":"⚡ Obsidian 外掛設定","ko":"⚡ Obsidian 플러그인 설정","ja":"⚡ Obsidian プラグイン設定"},
    "🔄 同步策略与冲突处理": {"en":"🔄 Sync & Conflicts","zh-TW":"🔄 同步策略與衝突處理","ko":"🔄 동기화 정책 및 충돌 처리","ja":"🔄 同期ポリシーと競合処理"},
    "🗄️ 数据库与存储引擎": {"en":"🗄️ Database & Storage","zh-TW":"🗄️ 資料庫與儲存引擎","ko":"🗄️ 데이터베이스 및 스토리지","ja":"🗄️ データベースとストレージ"},
    "🕒 版本快照与回收站": {"en":"🕒 Snapshots & Trash","zh-TW":"🕒 版本快照與資源回收筒","ko":"🕒 버전 스냅샷 및 휴지통","ja":"🕒 履歴スナップショットとごみ箱"},
    "🔑 设备专属令牌": {"en":"🔑 Device Tokens","zh-TW":"🔑 裝置專屬權杖","ko":"🔑 전용 기기 토큰","ja":"🔑 デバイス専用トークン"},
    "👤 账户安全与修改密码": {"en":"👤 Account & Security","zh-TW":"👤 帳戶安全與修改密碼","ko":"👤 계정 보안 및 비밀번호 변경","ja":"👤 アカウントとパスワード変更"},
    "正在加载设置…": {"en":"Loading settings…","zh-TW":"正在載入設定…","ko":"설정 불러오는 중…","ja":"設定を読み込み中…"},
    "Obsidian Nimbus 插件对接配置": {"en":"Obsidian Nimbus Plugin Setup","zh-TW":"Obsidian Nimbus 外掛對接設定","ko":"Obsidian Nimbus 플러그인 연동 설정","ja":"Obsidian Nimbus プラグイン連携設定"},
    "为您的 Obsidian 笔记库快速生成同步插件所需的一键配置": {"en":"Quickly generate one-click configuration required by the Obsidian sync plugin","zh-TW":"為您的 Obsidian 筆記庫快速產生同步外掛所需的一鍵設定","ko":"Obsidian 동기화 플러그인에 필요한 원클릭 설정을 빠르게 생성합니다","ja":"Obsidian ノート用同期プラグインに必要な一発設定を素早く生成します"},
    "选择要同步的 Vault 库": {"en":"Select Vault to Sync","zh-TW":"選擇要同步的 Vault 庫","ko":"동기화할 Vault 선택","ja":"同期する Vault を選択"},
    "暂无 Vault，请先在左侧新建": {"en":"No Vaults available. Create one from the left sidebar first.","zh-TW":"暫無 Vault，請先在左側新建","ko":"사용 가능한 Vault가 없습니다. 먼저 왼쪽에서 생성하세요.","ja":"利用可能な Vault がありません。左側で新規作成してください。"},
    "Obsidian 客户端将与选定的 Vault 库建立双向实时同步": {"en":"The Obsidian client will establish two-way real-time sync with the selected vault","zh-TW":"Obsidian 用戶端將與選定的 Vault 庫建立雙向即時同步","ko":"Obsidian 클라이언트가 선택한 Vault와 양방향 실시간 동기화를 구축합니다","ja":"Obsidian クライアントは選択した Vault と双方向リアルタイム同期を確立します"},
    "服务器连接地址 (Server URL)": {"en":"Server Connection URL","zh-TW":"伺服器連線位址 (Server URL)","ko":"서버 연결 주소 (Server URL)","ja":"サーバー接続 URL"},
    "局域网或公网访问地址，需确保 Obsidian 客户端可连通": {"en":"LAN or public URL reachable from your Obsidian client devices","zh-TW":"區域網路或公網存取位址，需確保 Obsidian 用戶端可連通","ko":"Obsidian 클라이언트에서 접근 가능한 로컬 네트워크 또는 공인 IP/도메인 주소","ja":"Obsidian クライアントからアクセス可能なローカルまたは公開 URL"},
    "客户端设备标识 (Device Name)": {"en":"Client Device Identifier","zh-TW":"用戶端裝置識別碼 (Device Name)","ko":"클라이언트 기기 식별자 (Device Name)","ja":"クライアントデバイス名 (Device Name)"},
    "用于在冲突备份与协同日志中标识设备来源": {"en":"Used to identify the device origin in conflict backups and sync audit logs","zh-TW":"用於在衝突備份與協同日誌中識別裝置來源","ko":"충돌 백업 및 동기화 로그에서 기기 출처를 식별하는 데 사용됩니다","ja":"競合バックアップおよび監査ログでデバイス元を識別するために使用されます"},
    "授权访问令牌 (Auth Token)": {"en":"Authorization Token","zh-TW":"授權存取權杖 (Auth Token)","ko":"인증 액세스 토큰 (Auth Token)","ja":"認証アクセストークン (Auth Token)"},
    "推荐在「设备专属令牌」标签页为每个端创建独立 Token": {"en":"Recommended to create independent tokens per device in the \"Device Tokens\" tab","zh-TW":"推薦在「裝置專屬權杖」標籤頁為每個端建立獨立 Token","ko":"'전용 기기 토큰' 탭에서 기기별 독립 토큰을 생성하는 것을 권장합니다","ja":"「デバイス専用トークン」タブで端末ごとに独立したトークンを作成することをお勧めします"},
    "⚡ 重新生成插件配置": {"en":"⚡ Regenerate Config","zh-TW":"⚡ 重新產生外掛設定","ko":"⚡ 플러그인 설정 다시 생성","ja":"⚡ プラグイン設定を再生成"},
    "🧪 测试服务端连通性": {"en":"🧪 Test Connectivity","zh-TW":"🧪 測試伺服端連通性","ko":"🧪 서버 연결 테스트","ja":"🧪 サーバー接続テスト"},
    "📋 复制 data.json 配置代码": {"en":"📋 Copy data.json Code","zh-TW":"📋 複製 data.json 設定代碼","ko":"📋 data.json 설정 복사","ja":"📋 data.json 設定コードをコピー"},
    "插件配置文件 data.json": {"en":"Plugin Config File data.json","zh-TW":"外掛設定檔 data.json","ko":"플러그인 설정 파일 data.json","ja":"プラグイン設定ファイル data.json"},
    "可直接在 Obsidian 笔记库的插件目录（如": {"en":"You can directly paste the following into your Obsidian vault plugin folder (e.g. ","zh-TW":"可直接在 Obsidian 筆記庫的外掛目錄（如","ko":"Obsidian Vault의 플러그인 폴더(예: ","ja":"Obsidian ノートのプラグインフォルダ (例: "},
    "）中粘贴以下内容：": {"en":") by pasting the content below:","zh-TW":"）中貼上下列內容：","ko":")에 아래 내용을 직접 붙여넣을 수 있습니다:","ja":") に以下の内容を直接貼り付けることができます:"},
    "客户端安装与使用步骤": {"en":"Client Installation & Quick Guide","zh-TW":"用戶端安裝與使用步驟","ko":"클라이언트 설치 및 사용 안내","ja":"クライアントのインストールと使用手順"},
    "1. 在 Obsidian 中安装并启用同步插件（支持": {"en":"1. Install and enable the sync plugin in Obsidian (supports ","zh-TW":"1. 在 Obsidian 中安裝並啟用同步外掛（支援 ","ko":"1. Obsidian에서 동기화 플러그인을 설치하고 활성화합니다 (","ja":"1. Obsidian で同期プラグインをインストールして有効化します ("},
    "及兼容的": {"en":" and compatible ","zh-TW":" 及相容的 ","ko":" 및 호환되는 ","ja":" および互換の "},
    "插件）。": {"en":" plugins).","zh-TW":" 外掛）。","ko":" 플러그인 지원).","ja":" プラグインに対応)。"},
    "2. 打开 Obsidian 插件设置，将上方生成的": {"en":"2. Open Obsidian plugin settings, enter the generated ","zh-TW":"2. 開啟 Obsidian 外掛設定，將上方產生的 ","ko":"2. Obsidian 플러그인 설정을 열고 상단의 ","ja":"2. Obsidian プラグイン設定を開き、上記で生成された "},
    "填入插件配置界面。": {"en":" into the plugin configuration form.","zh-TW":" 填入外掛設定介面。","ko":" 값을 플러그인 설정 화면에 입력합니다.","ja":" をプラグイン設定画面に入力します。"},
    "3. 或者直接将上方": {"en":"3. Alternatively, copy the generated ","zh-TW":"3. 或者直接將上方 ","ko":"3. 또는 위의 ","ja":"3. または上記の "},
    "复制保存到对应插件目录，即可免输所有参数。": {"en":" directly into the plugin directory to skip manual input.","zh-TW":" 複製儲存到對應外掛目錄，即可免輸所有參數。","ko":" 파일을 플러그인 폴더에 저장하면 모든 설정을 한 번에 완료할 수 있습니다.","ja":" をプラグインフォルダに保存すれば、パラメータの手動入力が不要になります。"},
    "4. Obsidian 启动后即可享受多端毫秒级实时 WebSocket 增量双向同步。": {"en":"4. Enjoy millisecond-level two-way WebSocket incremental sync across all devices once Obsidian starts.","zh-TW":"4. Obsidian 啟動後即可享受多端毫秒級即時 WebSocket 增量雙向同步。","ko":"4. Obsidian 실행 즉시 밀리초 단위의 실시간 WebSocket 증분 양방향 동기화가 동작합니다.","ja":"4. Obsidian 起動後、マルチデバイスでのミリ秒級リアルタイム WebSocket 差分同期が有効になります。"},
    "正在测试与服务器握手…": {"en":"Testing handshake with server…","zh-TW":"正在測試與伺服端交握…","ko":"서버와 핸드셰이크 테스트 중…","ja":"サーバーとの接続テストを実行中…"},
    "同步策略与冲突处理 (Nimbus Sync Engine)": {"en":"Sync Strategy & Conflict Arbitration","zh-TW":"同步策略與衝突處理 (Nimbus Sync Engine)","ko":"동기화 정책 및 충돌 중재 (Nimbus Sync Engine)","ja":"同期ポリシーと競合調停 (Nimbus Sync Engine)"},
    "控制文件冲突时的自动裁决机制、传输限制与全局忽略黑名单": {"en":"Control automatic resolution mechanisms, transfer limits, and global ignore filters during file conflicts","zh-TW":"控制檔案衝突時的自動裁決機制、傳輸限制與全域忽略黑名單","ko":"파일 충돌 시 자동 중재 메커니즘, 전송 제한 및 전역 무시 패턴을 제어합니다","ja":"ファイル競合時の自動調停、転送制限、グローバル除外リストを制御します"},
    "冲突裁决策略 (Conflict Strategy)": {"en":"Conflict Resolution Strategy","zh-TW":"衝突裁決策略 (Conflict Strategy)","ko":"충돌 해결 전략 (Conflict Strategy)","ja":"競合調停戦略 (Conflict Strategy)"},
    "自动创建冲突副本 (推荐，零数据丢失)": {"en":"Create Conflict Copy (Recommended, zero data loss)","zh-TW":"自動建立衝突副本 (推薦，零資料遺失)","ko":"충돌 복사본 자동 생성 (권장, 데이터 무손실)","ja":"競合コピーを自動作成 (推奨、データ損失なし)"},
    "以最新修改时间覆盖 (LWW - Last Write Wins)": {"en":"Last Write Wins (LWW - Overwrite with newest timestamp)","zh-TW":"以最新修改時間覆蓋 (LWW - Last Write Wins)","ko":"최신 수정본 우선 (LWW - 가장 최근 타임스탬프로 덮어쓰기)","ja":"最新更新日時を優先 (LWW - 最新版で上書き)"},
    "以服务端版本为准 (拒绝并回退客户端)": {"en":"Server Version Wins (Reject and rollback client)","zh-TW":"以伺服端版本為準 (拒絕並復原用戶端)","ko":"서버 버전 우선 (클라이언트 변경 거부 및 롤백)","ja":"サーバー版を優先 (クライアントの変更を拒否してロールバック)"},
    "当两台设备几乎同时修改了同一篇笔记且内容不一致时系统的应对策略": {"en":"System behavior when two devices modify the same note concurrently with divergent content","zh-TW":"當兩台裝置幾乎同時修改了同一篇筆記且內容不一致時系統的應對策略","ko":"두 기기에서 동일한 노트를 동시에 수정하여 내용이 불일치할 때의 시스템 동작 방식","ja":"2台のデバイスが同時に同一ノートを編集し不一致が生じた場合のシステム動作"},
    "单文件体积上限 (Max File Size)": {"en":"Max File Size Limit","zh-TW":"單一檔案體積上限 (Max File Size)","ko":"단일 파일 크기 제한 (Max File Size)","ja":"単一ファイル最大サイズ (Max File Size)"},
    "超过此大小的大文件将跳过同步，避免耗尽带宽（单位：MB）": {"en":"Files exceeding this size will be skipped to conserve bandwidth (in MB)","zh-TW":"超過此大小的大檔案將略過同步，避免耗盡頻寬（單位：MB）","ko":"대역폭 보호를 위해 이 크기를 초과하는 대용량 파일은 동기화에서 제외됩니다 (단위: MB)","ja":"帯域幅保護のため、このサイズを超える大容量ファイルは同期をスキップします (単位: MB)"},
    "大文件分块大小 (Chunk Size)": {"en":"Chunk Upload Size","zh-TW":"大檔案分塊大小 (Chunk Size)","ko":"청크 분할 업로드 크기 (Chunk Size)","ja":"チャンク分割サイズ (Chunk Size)"},
    "对大附件进行切片传输的单块大小（单位：MB，推荐 2~10MB）": {"en":"Chunk slicing size for large attachment uploads (in MB, recommended 2–10MB)","zh-TW":"對大附件進行切片傳輸的單塊大小（單位：MB，推薦 2~10MB）","ko":"대용량 첨부파일 분할 전송 크기 (단위: MB, 권장 2~10MB)","ja":"大容量添付ファイルの分割転送サイズ (単位: MB、推奨 2〜10MB)"},
    "WebSocket 心跳与长连接检测 (秒)": {"en":"WebSocket Heartbeat Interval (Seconds)","zh-TW":"WebSocket 活動訊號與長連線檢測 (秒)","ko":"WebSocket 하트비트 주기 (초)","ja":"WebSocket ハートビート間隔 (秒)"},
    "多端长连接保活心跳频率，用于毫秒级感知设备在线状态": {"en":"Heartbeat interval to keep persistent connections active and track device status","zh-TW":"多端長連線保持活躍活動訊號頻率，用於毫秒級感知裝置上線狀態","ko":"기기 온라인 상태를 밀리초 단위로 감지하기 위한 연결 유지 하트비트 주기","ja":"デバイスのオンライン状態を検知するための接続維持ハートビート頻度"},
    "全局同步忽略黑名单 (Ignore Patterns)": {"en":"Global Ignore Patterns","zh-TW":"全域同步忽略黑名單 (Ignore Patterns)","ko":"전역 동기화 무시 패턴 (Ignore Patterns)","ja":"グローバル同期除外パターン (Ignore Patterns)"},
    "支持通配符 glob，每行一条规则。匹配的文件将不会被同步到服务器": {"en":"Supports glob wildcards, one rule per line. Matching files will not sync to the server","zh-TW":"支援萬用字元 glob，每行一條規則。符合的檔案將不會被同步到伺服器","ko":"glob 와일드카드 지원, 한 줄에 하나의 규칙. 일치하는 파일은 동기화되지 않습니다","ja":"glob ワイルドカード対応、1行に1ルール。一致するファイルは同期されません"},
    "同步 .obsidian 隐藏配置与插件": {"en":"Sync .obsidian hidden configs & plugins","zh-TW":"同步 .obsidian 隱藏設定與外掛","ko":".obsidian 숨김 설정 및 플러그인 동기화","ja":".obsidian 隠し設定とプラグインを同期"},
    "是否将 Obsidian 的工作区、外观主题、第三方插件配置纳入多端同步": {"en":"Whether to sync Obsidian workspaces, visual themes, and community plugin configs across devices","zh-TW":"是否將 Obsidian 的工作區、外觀佈景主題、第三方外掛設定納入多端同步","ko":"Obsidian 워크스페이스, 테마, 서드파티 플러그인 설정을 동기화에 포함할지 여부","ja":"Obsidian のワークスペース、テーマ、プラグイン設定をマルチデバイス同期に含めるか"},
    "同步图片、音频与二进制附件": {"en":"Sync images, audio & binary attachments","zh-TW":"同步圖片、音訊與二進位附件","ko":"이미지, 오디오 및 바이너리 첨부파일 동기화","ja":"画像、音声、バイナリ添付ファイルを同期"},
    "是否同步除了 Markdown 纯文本以外的资源文件": {"en":"Whether to sync non-markdown asset files such as images, PDFs, and audio","zh-TW":"是否同步除了 Markdown 純文字以外的資源檔案","ko":"Markdown 텍스트 외의 이미지, PDF 등 리소스 파일 동기화 여부","ja":"Markdown 以外の画像や PDF などのリソースファイルを同期するか"},
    "💾 保存同步策略配置": {"en":"💾 Save Sync Settings","zh-TW":"💾 儲存同步策略設定","ko":"💾 동기화 설정 저장","ja":"💾 同期設定を保存"},
    "数据库与存储引擎设置": {"en":"Database & Storage Engine Settings","zh-TW":"資料庫與儲存引擎設定","ko":"데이터베이스 및 스토리지 엔진 설정","ja":"データベースとストレージエンジン設定"},
    "查看当前数据库类型、数据表行数与存储引擎迁移": {"en":"View current database engine, record counts, and perform storage migration","zh-TW":"檢視目前資料庫類型、資料表行數與儲存引擎遷移","ko":"현재 데이터베이스 유형, 레코드 수 확인 및 스토리지 엔진 마이그레이션","ja":"稼働中データベース種類、総レコード数の確認およびストレージ移行"},
    "存储引擎类型": {"en":"Storage Engine Type","zh-TW":"儲存引擎類型","ko":"스토리지 엔진 유형","ja":"ストレージエンジン種別"},
    "连接状态": {"en":"Connection Status","zh-TW":"連線狀態","ko":"연결 상태","ja":"接続状態"},
    "正常连接": {"en":"Connected & Healthy","zh-TW":"正常連線","ko":"정상 연결됨","ja":"正常接続中"},
    "数据库总大小": {"en":"Total Database Size","zh-TW":"資料庫總大小","ko":"데이터베이스 총 용량","ja":"データベース総容量"},
    "数据表总数": {"en":"Total Tables","zh-TW":"資料表總數","ko":"총 테이블 수","ja":"総テーブル数"},
    "全表数据行数": {"en":"Total Rows","zh-TW":"全表資料行數","ko":"총 데이터 행 수","ja":"全テーブル総行数"},
    "迁移至新存储引擎 (PostgreSQL / MySQL / SQLite)": {"en":"Migrate to New Storage Engine (PostgreSQL / MySQL / SQLite)","zh-TW":"遷移至新儲存引擎 (PostgreSQL / MySQL / SQLite)","ko":"새 스토리지 엔진으로 마이그레이션 (PostgreSQL / MySQL / SQLite)","ja":"新規ストレージエンジンへ移行 (PostgreSQL / MySQL / SQLite)"},
    "目标数据库引擎": {"en":"Target Database Engine","zh-TW":"目標資料庫引擎","ko":"대상 데이터베이스 엔진","ja":"対象データベースエンジン"},
    "连接字符串 (Connection String / URI)": {"en":"Connection String (URI)","zh-TW":"連線字串 (Connection String / URI)","ko":"연결 문자열 (URI)","ja":"接続文字列 (URI)"},
    "例如：postgresql://user:pass@localhost:5432/nimbus": {"en":"e.g. postgresql://user:pass@localhost:5432/nimbus","zh-TW":"例如：postgresql://user:pass@localhost:5432/nimbus","ko":"예: postgresql://user:pass@localhost:5432/nimbus","ja":"例: postgresql://user:pass@localhost:5432/nimbus"},
    "用于企业级多实例高并发扩展或分布式部署": {"en":"For enterprise multi-instance scalability and distributed deployments","zh-TW":"用於企業級多實例高並行擴充或分散式部署","ko":"엔터프라이즈 다중 인스턴스 확장 및 분산 배포용","ja":"エンタープライズ向けマルチインスタンス拡張や分散配置用"},
    "🧪 测试目标连接": {"en":"🧪 Test Target Connection","zh-TW":"🧪 測試目標連線","ko":"🧪 대상 연결 테스트","ja":"🧪 接続テスト"},
    "🚀 开始数据平滑迁移并切换": {"en":"🚀 Migrate & Switch Engine","zh-TW":"🚀 開始資料平滑遷移並切換","ko":"🚀 데이터 마이그레이션 및 전환 시작","ja":"🚀 データ移行とエンジン切り替えを開始"},
    "📦 备份当前 SQLite 数据库文件": {"en":"📦 Backup Current SQLite Database","zh-TW":"📦 備份目前 SQLite 資料庫檔案","ko":"📦 현재 SQLite 데이터베이스 백업","ja":"📦 現在の SQLite データベースをバックアップ"},
    "🧹 执行数据库 VACUUM 碎片整理与紧缩": {"en":"🧹 Run Database VACUUM & Optimize","zh-TW":"🧹 執行資料庫 VACUUM 磁碟重組與緊縮","ko":"🧹 데이터베이스 VACUUM 최적화 실행","ja":"🧹 データベース VACUUM 最適化を実行"},
    "版本历史快照与回收站生命周期": {"en":"Version Snapshots & Trash Lifecycle","zh-TW":"版本歷史快照與資源回收筒生命週期","ko":"버전 히스토리 스냅샷 및 휴지통 수명 주기","ja":"履歴スナップショットとごみ箱ライフサイクル"},
    "管理笔记修改历史快照的版本上限、保存周期与回收站清理策略": {"en":"Manage maximum versions, retention periods, and automated trash purge rules","zh-TW":"管理筆記修改歷史快照的版本上限、儲存週期與資源回收筒清理策略","ko":"노트 수정 히스토리 버전 한도, 보존 기간 및 휴지통 정리 정책 관리","ja":"ノート編集履歴の保持件数、保存期間およびごみ箱自動クリーンアップ設定"},
    "单个文件最大历史版本数 (Max Versions)": {"en":"Max Historical Versions per File","zh-TW":"單一檔案最大歷史版本數 (Max Versions)","ko":"파일당 최대 히스토리 버전 수","ja":"ファイルごとの最大履歴保持数"},
    "单个文件历史版本数超过设定值时，最早的旧快照将自动轮替清除": {"en":"When versions exceed this limit, oldest snapshots are automatically rotated and purged","zh-TW":"單一檔案歷史版本數超過設定值時，最早的舊快照將自動輪替清除","ko":"버전 수가 초과되면 가장 오래된 스냅샷이 자동으로 정리됩니다","ja":"上限を超えると最も古いスナップショットが自動的にローテーション削除されます"},
    "历史版本最长保留天数 (Retention Days)": {"en":"Snapshot Retention Days","zh-TW":"歷史版本最長保留天數 (Retention Days)","ko":"히스토리 스냅샷 보존 일수","ja":"履歴スナップショット保持日数"},
    "超过此天数的历史快照将自动淘汰": {"en":"Historical snapshots older than this duration will be automatically expired","zh-TW":"超過此天數的歷史快照將自動淘汰","ko":"이 기간이 지난 이전 스냅샷은 자동으로 정리됩니다","ja":"この日数を超えた古い履歴は自動的に破棄されます"},
    "回收站保留天数 (Trash Retention)": {"en":"Trash Retention Days","zh-TW":"資源回收筒保留天數 (Trash Retention)","ko":"휴지통 보존 일수 (Trash Retention)","ja":"ごみ箱保持日数 (Trash Retention)"},
    "删除的文件在回收站中暂存的天数，超期后彻底粉碎": {"en":"Days deleted files stay in trash before permanent deletion","zh-TW":"刪除的檔案在資源回收筒中暫存的天數，超期後徹底粉碎","ko":"삭제된 파일이 휴지통에 보관되는 기간이며 만료 후 영구 삭제됩니다","ja":"削除されたファイルがごみ箱に保持される日数 (期限後に完全削除)"},
    "启用定时自动清空超期回收站": {"en":"Enable automated purge of expired trash","zh-TW":"啟用定時自動清空超期資源回收筒","ko":"만료된 휴지통 자동 비우기 활성화","ja":"期限切れごみ箱の自動消去を有効化"},
    "每天后台自动清理超过保留天数的已删除笔记文件": {"en":"Automatically cleans up expired trash files daily in the background","zh-TW":"每天後台自動清理超過保留天數的已刪除筆記檔案","ko":"보존 기간이 지난 삭제된 노트를 매일 백그라운드에서 자동 청소합니다","ja":"保持期間を過ぎ過した削除済みノートを毎日バックグラウンドで自動消去します"},
    "💾 保存生命周期策略": {"en":"💾 Save Lifecycle Policy","zh-TW":"💾 儲存生命週期策略","ko":"💾 수명 주기 정책 저장","ja":"💾 ライフサイクル設定を保存"},
    "🧹 立即执行一次回收站过期清理": {"en":"🧹 Run Trash Purge Now","zh-TW":"🧹 立即執行一次資源回收筒過期清理","ko":"🧹 지금 만료된 휴지통 정리 실행","ja":"🧹 今すぐ期限切れごみ箱をクリーンアップ"},
    "设备专属令牌管理 (Device Access Tokens)": {"en":"Dedicated Device Access Tokens","zh-TW":"裝置專屬權杖管理 (Device Access Tokens)","ko":"전용 기기 액세스 토큰 관리","ja":"デバイス専用アクセストークン管理"},
    "为您的每台电脑、手机或平板生成独立的授权令牌，即使单端遗失也可一键注销，不影响其他设备": {"en":"Generate independent tokens per device. If a device is lost, revoke it with one click without affecting other clients","zh-TW":"為您的每台電腦、手機或平板產生獨立的授權權杖，即使單端遺失也可一鍵註銷，不影響其他裝置","ko":"기기별 독립 토큰을 발급하여 한 기기를 분실해도 다른 기기에 영향 없이 단독 취소할 수 있습니다","ja":"端末ごとに独立したトークンを発行。紛失時も他の端末に影響を与えず即座に単独失効可能です"},
    "➕ 创建专属设备令牌": {"en":"➕ Create Dedicated Token","zh-TW":"➕ 建立專屬裝置權杖","ko":"➕ 새 전용 토큰 생성","ja":"➕ 専用デバイストークンを作成"},
    "设备名称 / 标识 (如 iPhone 16 Pro / M3 Mac)": {"en":"Device Name (e.g. iPhone 16 Pro / M3 Mac)","zh-TW":"裝置名稱 / 識別碼 (如 iPhone 16 Pro / M3 Mac)","ko":"기기 이름 (예: iPhone 16 Pro / M3 Mac)","ja":"デバイス名 (例: iPhone 16 Pro / M3 Mac)"},
    "选择绑定的默认 Vault (选填)": {"en":"Default Vault (Optional)","zh-TW":"選擇綁定的預設 Vault (選填)","ko":"기본 Vault 선택 (선택사항)","ja":"デフォルトの Vault (任意)"},
    "全部权限 (读写)": {"en":"Full Access (Read & Write)","zh-TW":"全部權限 (讀寫)","ko":"모든 권한 (읽기 및 쓰기)","ja":"全権限 (読み書き可能)"},
    "只读权限 (仅拉取)": {"en":"Read Only (Pull Only)","zh-TW":"唯讀權限 (僅拉取)","ko":"읽기 전용 (풀 전용)","ja":"読み取り専用 (取得のみ)"},
    "生成并激活令牌": {"en":"Generate & Activate Token","zh-TW":"產生並啟用權杖","ko":"토큰 생성 및 활성화","ja":"トークンを生成して有効化"},
    "当前已授权的专属设备列表": {"en":"Authorized Devices List","zh-TW":"目前已授權的專屬裝置清單","ko":"인증된 전용 기기 목록","ja":"認証済み専用デバイス一覧"},
    "专属 Token 预览": {"en":"Token Preview","zh-TW":"專屬 Token 預覽","ko":"토큰 미리보기","ja":"トークンプレビュー"},
    "创建时间": {"en":"Created Time","zh-TW":"建立時間","ko":"생성 일시","ja":"作成日時"},
    "注销令牌": {"en":"Revoke Token","zh-TW":"註銷權杖","ko":"토큰 취소","ja":"トークンを失効"},
    "账户安全与密码修改": {"en":"Account Security & Password","zh-TW":"帳戶安全與密碼修改","ko":"계정 보안 및 비밀번호 변경","ja":"アカウントセキュリティとパスワード変更"},
    "修改当前登录账户的登录密码，保障笔记云端数据安全": {"en":"Change your account password to protect your cloud vault data","zh-TW":"修改目前登入帳戶的登入密碼，保障筆記雲端資料安全","ko":"클라우드 노트 데이터를 보호하기 위해 비밀번호를 변경합니다","ja":"クラウドアカウントのパスワードを変更してノートを保護します"},
    "当前登录用户名": {"en":"Logged in Username","zh-TW":"目前登入使用者名稱","ko":"현재 로그인 계정","ja":"現在のログインユーザー名"},
    "当前账户角色": {"en":"Account Role","zh-TW":"目前帳戶角色","ko":"계정 역할","ja":"アカウントの役割"},
    "原密码 (当前正在使用的密码)": {"en":"Current Password","zh-TW":"原密碼 (目前正在使用的密碼)","ko":"현재 비밀번호","ja":"現在のパスワード"},
    "新密码 (至少 6 位字符)": {"en":"New Password (min 6 characters)","zh-TW":"新密碼 (至少 6 位字元)","ko":"새 비밀번호 (최소 6자 이상)","ja":"新しいパスワード (6文字以上)"},
    "确认新密码 (再次输入新密码)": {"en":"Confirm New Password","zh-TW":"確認新密碼 (再次輸入新密碼)","ko":"새 비밀번호 확인","ja":"新しいパスワード (確認)"},
    "🔒 提交修改密码": {"en":"🔒 Update Password","zh-TW":"🔒 提交修改密碼","ko":"🔒 비밀번호 변경 제출","ja":"🔒 パスワードを更新"},
    "界面外观主题风格 (UI Theme)": {"en":"Interface Theme & Style","zh-TW":"介面外觀佈景主題風格 (UI Theme)","ko":"인터페이스 테마 스타일 (UI Theme)","ja":"UI テーマと外観 (UI Theme)"},
    "选择您喜爱的色彩基调，支持深色沉浸、极简白昼与高对比度模式": {"en":"Choose your preferred color theme supporting dark, light, and high-contrast modes","zh-TW":"選擇您喜愛的色彩基調，支援深色沉浸、極簡白晝與高對比度模式","ko":"다크 모드, 라이트 모드 등 선호하는 테마를 선택하세요","ja":"ダークモードやライトモードなどお好みのテーマを選択できます"},
    "当前 Vault 笔记概览": {"en":"Vault Overview","zh-TW":"目前 Vault 筆記概覽","ko":"현재 Vault 개요","ja":"現在の Vault 概要"},
    "笔记文件总数": {"en":"Total Note Files","zh-TW":"筆記檔案總數","ko":"총 노트 파일 수","ja":"総ノートファイル数"},
    "附件与资源数": {"en":"Total Attachments","zh-TW":"附件與資源數","ko":"총 첨부파일 수","ja":"総添付ファイル数"},
    "版本历史总数": {"en":"Total Snapshots","zh-TW":"版本歷史總數","ko":"총 스냅샷 수","ja":"総履歴スナップショット数"},
    "回收站文件数": {"en":"Files in Trash","zh-TW":"資源回收筒檔案數","ko":"휴지통 파일 수","ja":"ごみ箱内ファイル数"},
    "外链分享总数": {"en":"Active Shares","zh-TW":"外鏈分享總數","ko":"공개 공유 수","ja":"有効な共有リンク数"},
    "在线协作成员": {"en":"Collaborators","zh-TW":"線上協作成員","ko":"협업 멤버","ja":"コラボレーター"},
    "创建新笔记": {"en":"Create New Note","zh-TW":"建立新筆記","ko":"새 노트 생성","ja":"新規ノートを作成"},
    "创建新文件夹": {"en":"Create New Folder","zh-TW":"建立新資料夾","ko":"새 폴더 생성","ja":"新規フォルダを作成"},
    "上传本地文件": {"en":"Upload Local File","zh-TW":"上傳本機檔案","ko":"로컬 파일 업로드","ja":"ローカルファイルをアップロード"},
    "全库下载 ZIP": {"en":"Download Vault ZIP","zh-TW":"全庫下載 ZIP","ko":"전체 Vault ZIP 다운로드","ja":"Vault 全体を ZIP ダウンロード"},
    "重命名笔记": {"en":"Rename Note","zh-TW":"重新命名筆記","ko":"노트 이름 변경","ja":"ノートの名前を変更"},
    "移动笔记": {"en":"Move Note","zh-TW":"移動筆記","ko":"노트 이동","ja":"ノートを移動"},
    "删除笔记": {"en":"Delete Note","zh-TW":"刪除筆記","ko":"노트 삭제","ja":"ノートを削除"},
    "彻底粉碎": {"en":"Purge Permanently","zh-TW":"徹底粉碎","ko":"영구 삭제","ja":"完全に消去"},
    "还原此文件": {"en":"Restore File","zh-TW":"還原此檔案","ko":"파일 복원","ja":"ファイルを復元"},
    "清空回收站": {"en":"Empty Trash","zh-TW":"清空資源回收筒","ko":"휴지통 비우기","ja":"ごみ箱を空にする"},
    "回滚到此版本": {"en":"Rollback to Version","zh-TW":"復原到此版本","ko":"이 버전으로 롤백","ja":"このバージョンにロールバック"},
    "对比当前版本": {"en":"Diff with Current","zh-TW":"對比目前版本","ko":"현재 버전과 비교","ja":"現行バージョンと比較"},
    "我的 Vaults": {"en":"My Vaults","zh-TW":"我的 Vaults","ko":"내 Vaults","ja":"マイ Vaults"},
    "新建 Vault": {"en":"New Vault","zh-TW":"新建 Vault","ko":"새 Vault","ja":"新規 Vault"},
    "快捷工具": {"en":"Quick Tools","zh-TW":"快捷工具","ko":"빠른 도구","ja":"クイックツール"},
    "⚙️ 设置": {"en":"⚙️ Settings","zh-TW":"⚙️ 設定","ko":"⚙️ 설정","ja":"⚙️ 設定"},
    "设置": {"en":"Settings","zh-TW":"設定","ko":"설정","ja":"設定"},
    "📱 接入设备管理": {"en":"📱 Connected Devices","zh-TW":"📱 接入裝置管理","ko":"📱 연결된 기기 관리","ja":"📱 接続デバイス管理"},
    "接入设备管理": {"en":"Connected Devices","zh-TW":"接入裝置管理","ko":"연결된 기기 관리","ja":"接続デバイス管理"},
    "⚡ Obsidian 连接指引": {"en":"⚡ Obsidian Connect Guide","zh-TW":"⚡ Obsidian 連線指引","ko":"⚡ Obsidian 연결 가이드","ja":"⚡ Obsidian 接続ガイド"},
    "Obsidian 连接指引": {"en":"Obsidian Connect Guide","zh-TW":"Obsidian 連線指引","ko":"Obsidian 연결 가이드","ja":"Obsidian 接続ガイド"},
    "🤖 AI / MCP 接口配置": {"en":"🤖 AI / MCP Interface","zh-TW":"🤖 AI / MCP 介面設定","ko":"🤖 AI / MCP 인터페이스 설정","ja":"🤖 AI / MCP 設定"},
    "AI / MCP 接口配置": {"en":"AI / MCP Interface","zh-TW":"AI / MCP 介面設定","ko":"AI / MCP 인터페이스 설정","ja":"AI / MCP 設定"},
    "📖 REST API 开发者文档": {"en":"📖 REST API Docs","zh-TW":"📖 REST API 開發者文件","ko":"📖 REST API 개발자 문서","ja":"📖 REST API 開発者ドキュメント"},
    "REST API 开发者文档": {"en":"REST API Docs","zh-TW":"REST API 開發者文件","ko":"REST API 개발자 문서","ja":"REST API 開発者ドキュメント"},
    "❤️ 支持该项目": {"en":"❤️ Support Project","zh-TW":"❤️ 支持該專案","ko":"❤️ 프로젝트 후원","ja":"❤️ プロジェクトを支援"},
    "支持该项目": {"en":"Support Project","zh-TW":"支持該專案","ko":"프로젝트 후원","ja":"プロジェクトを支援"},
    "系统管理": {"en":"System Admin","zh-TW":"系統管理","ko":"시스템 관리","ja":"システム管理"},
    "🗄️ 数据库管理": {"en":"🗄️ Database Admin","zh-TW":"🗄️ 資料庫管理","ko":"🗄️ 데이터베이스 관리","ja":"🗄️ データベース管理"},
    "数据库管理": {"en":"Database Admin","zh-TW":"資料庫管理","ko":"데이터베이스 관리","ja":"データベース管理"},
    "🔔 Webhook 告警": {"en":"🔔 Webhooks & Alerts","zh-TW":"🔔 Webhook 告警","ko":"🔔 Webhook 알림","ja":"🔔 Webhook アラート"},
    "Webhook 告警": {"en":"Webhooks & Alerts","zh-TW":"Webhook 告警","ko":"Webhook 알림","ja":"Webhook アラート"},
    "📋 同步日志": {"en":"📋 Sync Logs","zh-TW":"📋 同步日誌","ko":"📋 동기화 로그","ja":"📋 同期ログ"},
    "同步日志": {"en":"Sync Logs","zh-TW":"同步日誌","ko":"동기화 로그","ja":"同期ログ"},
    "📱 全局设备": {"en":"📱 Global Devices","zh-TW":"📱 全域裝置","ko":"📱 전체 기기","ja":"📱 グローバルデバイス"},
    "全局设备": {"en":"Global Devices","zh-TW":"全域裝置","ko":"전체 기기","ja":"グローバルデバイス"},
    "👥 用户管理": {"en":"👥 User Management","zh-TW":"👥 使用者管理","ko":"👥 사용자 관리","ja":"👥 ユーザー管理"},
    "用户管理": {"en":"User Management","zh-TW":"使用者管理","ko":"사용자 관리","ja":"ユーザー管理"},
    "📚 全局 Vault": {"en":"📚 Global Vaults","zh-TW":"📚 全域 Vault","ko":"📚 전체 Vault","ja":"📚 グローバル Vault"},
    "全局 Vault": {"en":"Global Vaults","zh-TW":"全域 Vault","ko":"전체 Vault","ja":"グローバル Vault"},
    "❤️ 赞助支持": {"en":"❤️ Sponsor & Support","zh-TW":"❤️ 贊助支持","ko":"❤️ 후원 지원","ja":"❤️ スポンサー支援"},
    "赞助支持": {"en":"Sponsor & Support","zh-TW":"贊助支持","ko":"후원 지원","ja":"スポンサー支援"},
    "当前版本": {"en":"Current Version","zh-TW":"目前版本","ko":"현재 버전","ja":"現在のバージョン"},
    "退出": {"en":"Logout","zh-TW":"登出","ko":"로그아웃","ja":"ログアウト"},
    "备份当前数据库": {"en":"Backup Database","zh-TW":"備份目前資料庫","ko":"데이터베이스 백업","ja":"データベースをバックアップ"},
    "💾 备份当前数据库": {"en":"💾 Backup Database","zh-TW":"💾 備份目前資料庫","ko":"💾 데이터베이스 백업","ja":"💾 データベースをバックアップ"},
    "⚡ 连接 Obsidian Nimbus 同步插件": {"en":"⚡ Connect Obsidian Nimbus Sync Plugin","zh-TW":"⚡ 連線 Obsidian Nimbus 同步外掛","ko":"⚡ Obsidian Nimbus 동기화 플러그인 연결","ja":"⚡ Obsidian Nimbus 同期プラグインを接続"},
    "在 Obsidian 中安装 <code>nimbus</code> (或兼容的 <code>fast-note-sync</code>) 插件后，将以下配置导入或填入插件设置，即可开启多端毫秒级实时双向同步：": {"en":"After installing the <code>nimbus</code> (or compatible <code>fast-note-sync</code>) plugin in Obsidian, import or paste the following configuration into plugin settings to enable real-time multi-device sync:","zh-TW":"在 Obsidian 中安裝 <code>nimbus</code> (或相容的 <code>fast-note-sync</code>) 外掛後，將以下設定匯入或填入外掛設定，即可開啟多端毫秒級即時雙向同步：","ko":"Obsidian에 <code>nimbus</code> (또는 호환되는 <code>fast-note-sync</code>) 플러그인을 설치한 후 아래 설정을 플러그인에 입력하여 실시간 다중 기기 동기화를 활성화하세요:","ja":"Obsidian に <code>nimbus</code> (または互換の <code>fast-note-sync</code>) プラグインをインストール後、以下の設定をインポートまたは入力してリアルタイム双方向同期を開始します:"},
    "目标笔记库:": {"en":"Target Vault:","zh-TW":"目標筆記庫:","ko":"대상 Vault:","ja":"対象 Vault:"},
    "选择授权令牌:": {"en":"Select Auth Token:","zh-TW":"選擇授權權杖:","ko":"인증 토큰 선택:","ja":"認証トークンを選択:"},
    "客户端设备标识:": {"en":"Client Device ID:","zh-TW":"用戶端裝置識別碼:","ko":"클라이언트 기기 식별자:","ja":"クライアントデバイス識別子:"},
    "当前完整 Token:": {"en":"Full Token Value:","zh-TW":"目前完整 Token:","ko":"현재 전체 Token:","ja":"現在の完全な Token:"},
    "👁️ 查看": {"en":"👁️ View","zh-TW":"👁️ 檢視","ko":"👁️ 보기","ja":"👁️ 表示"},
    "🙈 隐藏": {"en":"🙈 Hide","zh-TW":"🙈 隱藏","ko":"🙈 숨기기","ja":"🙈 非表示"},
    "📋 复制 Token": {"en":"📋 Copy Token","zh-TW":"📋 複製 Token","ko":"📋 Token 복사","ja":"📋 Token をコピー"},
    "一键插件配置文件 (": {"en":"Plugin Config File (","zh-TW":"一鍵外掛設定檔 (","ko":"원클릭 플러그인 설정 파일 (","ja":"プラグイン設定ファイル ("},
    "保存在 .obsidian/plugins/nimbus/ 目录": {"en":"Saved under .obsidian/plugins/nimbus/ directory","zh-TW":"儲存在 .obsidian/plugins/nimbus/ 目錄","ko":".obsidian/plugins/nimbus/ 폴더에 저장됨","ja":".obsidian/plugins/nimbus/ ディレクトリに保存"},
    "💡 提示：支持全平台（macOS, Windows, iOS, Android, Linux）Obsidian 客户端，各端可独立设置设备标识与专属令牌。": {"en":"💡 Tip: Supports all platforms (macOS, Windows, iOS, Android, Linux). Each client can have a unique Device ID and dedicated token.","zh-TW":"💡 提示：支援全平台（macOS, Windows, iOS, Android, Linux）Obsidian 用戶端，各端可獨立設定裝置識別碼與專屬權杖。","ko":"💡 팁: 모든 플랫폼(macOS, Windows, iOS, Android, Linux)을 지원하며 기기별 전용 토큰을 설정할 수 있습니다.","ja":"💡 ヒント: 全プラットフォーム (macOS, Windows, iOS, Android, Linux) に対応し、デバイスごとに専用トークンを設定可能です。"},
    "📋 一键复制 data.json 完整配置": {"en":"📋 Copy data.json Config","zh-TW":"📋 一鍵複製 data.json 完整設定","ko":"📋 data.json 전체 설정 복사","ja":"📋 data.json 完全設定をコピー"},
    "🔑 当前主登录令牌": {"en":"🔑 Main Login Token","zh-TW":"🔑 目前主要登入權杖","ko":"🔑 기본 로그인 토큰","ja":"🔑 メインログイントークン"},
    "📱 [专属设备]": {"en":"📱 [Dedicated Device]","zh-TW":"📱 [專屬裝置]","ko":"📱 [전용 기기]","ja":"📱 [専用デバイス]"},
    "Model Context Protocol (MCP) 服务与工具接口": {"en":"Model Context Protocol (MCP) Server & Tool Interface","zh-TW":"Model Context Protocol (MCP) 服務與工具介面","ko":"Model Context Protocol (MCP) 서버 및 도구 인터페이스","ja":"Model Context Protocol (MCP) サーバーおよびツール連携"},
    "支持 Cursor、Cherry Studio、Claude Desktop、Cline 等 AI 客户端实时读写 Obsidian 笔记": {"en":"Enable Cursor, Cherry Studio, Claude Desktop, Cline, and AI clients to read and write Obsidian notes in real time","zh-TW":"支援 Cursor、Cherry Studio、Claude Desktop、Cline 等 AI 用戶端即時讀寫 Obsidian 筆記","ko":"Cursor, Cherry Studio, Claude Desktop, Cline 등 AI 클라이언트에서 Obsidian 노트를 실시간으로 읽고 쓸 수 있도록 지원합니다","ja":"Cursor、Cherry Studio、Claude Desktop、Cline などの AI クライアントから Obsidian ノートをリアルタイムで読み書き可能にします"},
    "⚙️ 客户端连接配置": {"en":"⚙️ Client Configuration","zh-TW":"⚙️ 用戶端連線設定","ko":"⚙️ 클라이언트 연결 설정","ja":"⚙️ クライアント接続設定"},
    "选择绑定的默认笔记库：": {"en":"Select Default Vault:","zh-TW":"選擇綁定的預設筆記庫：","ko":"연결할 기본 Vault 선택:","ja":"バインドするデフォルトの Vault を選択:"},
    "将以下配置填入 AI 编辑器或客户端（如 Cursor <code>Settings > MCP</code>、Cherry Studio、Claude <code>mcp.json</code>）：": {"en":"Paste the configuration into your AI client (e.g., Cursor <code>Settings > MCP</code>, Cherry Studio, Claude <code>mcp.json</code>):","zh-TW":"將以下設定填入 AI 編輯器或用戶端（如 Cursor <code>Settings > MCP</code>、Cherry Studio、Claude <code>mcp.json</code>）：","ko":"아래 설정을 AI 에디터 또는 클라이언트(예: Cursor <code>Settings > MCP</code>, Cherry Studio, Claude <code>mcp.json</code>)에 입력하세요:","ja":"以下の設定を AI エディタまたはクライアント (例: Cursor <code>Settings > MCP</code>、Cherry Studio、Claude <code>mcp.json</code>) に入力してください:"},
    "⚡ 实时同步与高并发特性：": {"en":"⚡ Realtime Sync & Concurrency Features:","zh-TW":"⚡ 即時同步與高並行特性：","ko":"⚡ 실시간 동기화 및 동시성 기능:","ja":"⚡ リアルタイム同期と高並行機能:"},
    "双向即时生效": {"en":"Instant Two-Way Sync","zh-TW":"雙向即時生效","ko":"양방향 즉시 반영","ja":"双方向即時反映"},
    "：AI 写入、追加或重命名笔记后，自动通过 WebSocket 实时推送到所有手机、电脑的 Obsidian 客户端。": {"en":": When AI writes, appends, or renames notes, updates are pushed via WebSocket to all connected Obsidian clients immediately.","zh-TW":"：AI 寫入、附加或重新命名筆記後，自動透過 WebSocket 即時推送到所有手機、電腦的 Obsidian 用戶端。","ko":": AI가 노트를 작성, 추가, 이름 변경하면 WebSocket을 통해 모든 모바일 및 PC의 Obsidian 클라이언트에 실시간 푸시됩니다.","ja":": AI がノートの書き込み、追記、名前変更を行うと、WebSocket 経由ですべての端末の Obsidian クライアントへ即座にプッシュされます。"},
    "防冲突保护 (Conflict-Safe)": {"en":"Conflict-Safe Protection","zh-TW":"防衝突保護 (Conflict-Safe)","ko":"충돌 방지 보호 (Conflict-Safe)","ja":"競合防止保護 (Conflict-Safe)"},
    "：当多人或多端同时修改时，自动保存冲突快照，避免内容被意外覆盖。": {"en":": Automatically creates conflict snapshots when multiple devices modify the same note concurrently, preventing accidental data loss.","zh-TW":"：當多人或多端同時修改時，自動儲存衝突快照，避免內容被意外覆蓋。","ko":": 여러 기기에서 동시에 수정할 때 충돌 스냅샷을 자동 보존하여 데이터 유실을 방지합니다.","ja":": 複数端末が同時に編集した場合、競合スナップショットを自動作成して上書きによるデータ消失を防ぎます。"},
    "历史快照备份": {"en":"Version History Snapshots","zh-TW":"歷史快照備份","ko":"버전 히스토리 스냅샷","ja":"履歴スナップショットバックアップ"},
    "：每次 AI 修改均在服务器自动归档版本历史，可随时溯源与回滚。": {"en":": Every AI change is archived as a version snapshot on the server, allowing instant review and rollback.","zh-TW":"：每次 AI 修改均在伺服器自動封存版本歷史，可隨時溯源與復原。","ko":": AI의 모든 변경 사항은 서버에 버전 기록으로 자동 아카이빙되어 언제든 복구할 수 있습니다.","ja":": AI によるすべての変更はサーバーに履歴として自動保存され、いつでもロールバック可能です。"},
    "🔍 搜索 MCP 工具名称、分类或描述...": {"en":"🔍 Search MCP tool name, category, or description...","zh-TW":"🔍 搜尋 MCP 工具名稱、分類或描述...","ko":"🔍 MCP 도구 이름, 카테고리 또는 설명 검색...","ja":"🔍 MCP ツール名、カテゴリ、説明を検索..."},
    "核心工具": {"en":"Core Tool","zh-TW":"核心工具","ko":"핵심 도구","ja":"コアツール"},
    "参数：": {"en":"Parameters:","zh-TW":"參數：","ko":"매개변수:","ja":"パラメータ:"},
    "无必填参数": {"en":"No required parameters","zh-TW":"無必填參數","ko":"필수 매개변수 없음","ja":"必須パラメータなし"},
    "📋 复制当前 MCP 配置": {"en":"📋 Copy MCP JSON Config","zh-TW":"📋 複製目前 MCP 設定","ko":"📋 MCP JSON 설정 복사","ja":"📋 MCP JSON 設定をコピー"},
    "REST API 开发者与接口说明文档": {"en":"REST API Developer & Endpoint Reference","zh-TW":"REST API 開發者與介面說明文件","ko":"REST API 개발자 및 엔드포인트 참조 문서","ja":"REST API 開発者向けインターフェース仕様書"},
    "涵盖认证、笔记库、文件增量读写、历史快照、回收站、冲突管理、外链分享及 MCP 接口": {"en":"Covers Auth, Vaults, Incremental Sync, Snapshots, Trash Bin, Conflicts, Shares, and MCP endpoints","zh-TW":"涵蓋認證、筆記庫、檔案增量讀寫、歷史快照、資源回收筒、衝突管理、外鏈分享及 MCP 介面","ko":"인증, Vault, 파일 증분 동기화, 스냅샷, 휴지통, 충돌 관리, 공개 공유 및 MCP 인터페이스 포함","ja":"認証、Vault、差分同期、履歴、ごみ箱、競合管理、共有リンク、MCP インターフェースを網羅"},
    "🔍 快速搜索 API 路径、方法 (如 GET /api/vaults)、描述...": {"en":"🔍 Search API endpoint path, method (e.g. GET /api/vaults), summary...","zh-TW":"🔍 快速搜尋 API 路徑、方法 (如 GET /api/vaults)、描述...","ko":"🔍 API 경로, 메서드(예: GET /api/vaults), 설명 검색...","ja":"🔍 API パス、メソッド (例: GET /api/vaults)、説明を検索..."},
    "📄 查看 JSON 规范": {"en":"📄 View OpenAPI / JSON Spec","zh-TW":"📄 檢視 JSON 規範","ko":"📄 OpenAPI / JSON 규격 보기","ja":"📄 OpenAPI / JSON 仕様を表示"},
    "公开": {"en":"Public","zh-TW":"公開","ko":"공개","ja":"公開"},
    "URL 参数：": {"en":"URL Query Params:","zh-TW":"URL 參數：","ko":"URL 매개변수:","ja":"URL パラメータ:"},
    "请求体 (Body)：": {"en":"Request Body:","zh-TW":"請求主體 (Body)：","ko":"요청 본문 (Body):","ja":"リクエストボディ (Body):"},
    "📋 复制 cURL": {"en":"📋 Copy cURL","zh-TW":"📋 複製 cURL","ko":"📋 cURL 복사","ja":"📋 cURL をコピー"},
    "关闭文档": {"en":"Close Docs","zh-TW":"關閉文件","ko":"문서 닫기","ja":"ドキュメントを閉じる"},
    "⚙️ 系统与个人偏好设置": {"en":"⚙️ Settings & Preferences","zh-TW":"⚙️ 系統與個人偏好設定","ko":"⚙️ 시스템 및 개인 설정","ja":"⚙️ システムおよび個人設定"},
    "运行概览与系统信息": {"en":"System Overview & Runtime","zh-TW":"運作概覽與系統資訊","ko":"시스템 개요 및 런타임 정보","ja":"システム概要と稼働情報"},
    "专属设备与 API 令牌": {"en":"Device Tokens & API Keys","zh-TW":"專屬裝置與 API 權杖","ko":"전용 기기 및 API 토큰","ja":"デバイスと API トークン"},
    "存储空间与限额": {"en":"Storage Quota & Usage","zh-TW":"儲存空間與配額","ko":"저장 공간 및 할당량","ja":"ストレージ容量と制限"},
    "安全与密码修改": {"en":"Security & Password","zh-TW":"安全性與密碼修改","ko":"보안 및 비밀번호 변경","ja":"セキュリティとパスワード変更"},
    "Git 自动备份与远程同步": {"en":"Git Backup & Remote Sync","zh-TW":"Git 自動備份與遠端同步","ko":"Git 자동 백업 및 원격 동기화","ja":"Git 自動バックアップとリモート同期"},
    "Webhook 告警订阅": {"en":"Webhook Alerts Subscription","zh-TW":"Webhook 告警訂閱","ko":"Webhook 알림 구독","ja":"Webhook アラート購読"},
    "高级选项与重置": {"en":"Advanced Options","zh-TW":"進階選項與重設","ko":"고급 옵션 및 재설정","ja":"高度な設定とリセット"},
    "服务器版本": {"en":"Server Version","zh-TW":"伺服器版本","ko":"서버 버전","ja":"サーバーバージョン"},
    "Node.js 运行时": {"en":"Node.js Runtime","zh-TW":"Node.js 執行階段","ko":"Node.js 런타임","ja":"Node.js ランタイム"},
    "服务器运行时间": {"en":"Server Uptime","zh-TW":"伺服器運作時間","ko":"서버 가동 시간","ja":"サーバー稼働時間"},
    "数据存储路径": {"en":"Data Storage Path","zh-TW":"資料儲存路徑","ko":"데이터 저장 경로","ja":"データ保存パス"},
    "当前数据库类型": {"en":"Current Database Type","zh-TW":"目前資料庫類型","ko":"현재 데이터베이스 유형","ja":"現在のデータベース種類"},
    "总 Vault 数量": {"en":"Total Vaults","zh-TW":"總 Vault 數量","ko":"총 Vault 수","ja":"総 Vault 数"},
    "总文件记录": {"en":"Total File Records","zh-TW":"總檔案記錄","ko":"총 파일 기록","ja":"総ファイルレコード"},
    "活跃设备数": {"en":"Active Devices","zh-TW":"活躍裝置數","ko":"활성 기기 수","ja":"アクティブデバイス数"},
    "系统内存占用": {"en":"Memory Usage","zh-TW":"系統記憶體佔用","ko":"메모리 사용량","ja":"メモリ使用量"},
    "修改管理员密码": {"en":"Change Admin Password","zh-TW":"修改管理員密碼","ko":"관리자 비밀번호 변경","ja":"管理者パスワードを変更"},
    "修改密码": {"en":"Change Password","zh-TW":"修改密碼","ko":"비밀번호 변경","ja":"パスワードを変更"},
    "原密码": {"en":"Current Password","zh-TW":"原密碼","ko":"현재 비밀번호","ja":"現在のパスワード"},
    "新密码 (至少 6 位)": {"en":"New Password (min 6 chars)","zh-TW":"新密碼 (至少 6 位)","ko":"새 비밀번호 (최소 6자)","ja":"新しいパスワード (6文字以上)"},
    "确认新密码": {"en":"Confirm New Password","zh-TW":"確認新密碼","ko":"새 비밀번호 확인","ja":"新しいパスワードを確認"},
    "更新密码": {"en":"Update Password","zh-TW":"更新密碼","ko":"비밀번호 업데이트","ja":"パスワードを更新"},
    "专属设备同步令牌 (Device Tokens)": {"en":"Dedicated Device Sync Tokens","zh-TW":"專屬裝置同步權杖 (Device Tokens)","ko":"전용 기기 동기화 토큰 (Device Tokens)","ja":"専用デバイス同期トークン (Device Tokens)"},
    "创建新设备令牌": {"en":"Create New Device Token","zh-TW":"建立新裝置權杖","ko":"새 기기 토큰 생성","ja":"新規デバイストークンを作成"},
    "设备标识名称": {"en":"Device Name / Label","zh-TW":"裝置識別名稱","ko":"기기 식별 이름","ja":"デバイス識別名"},
    "权限范围": {"en":"Permission Scope","zh-TW":"權限範圍","ko":"권한 범위","ja":"権限スコープ"},
    "创建令牌": {"en":"Create Token","zh-TW":"建立權杖","ko":"토큰 생성","ja":"トークンを作成"},
    "令牌名称": {"en":"Token Name","zh-TW":"權杖名稱","ko":"토큰 이름","ja":"トークン名"},
    "令牌预览": {"en":"Token Preview","zh-TW":"權杖預覽","ko":"토큰 미리보기","ja":"トークンプレビュー"},
    "最后活跃时间": {"en":"Last Active Time","zh-TW":"最後活躍時間","ko":"마지막 활동 시간","ja":"最終アクティブ日時"},
    "注销": {"en":"Revoke","zh-TW":"註銷","ko":"취소","ja":"失効"},
    "暂无专属设备令牌": {"en":"No dedicated device tokens yet","zh-TW":"暫無專屬裝置權杖","ko":"전용 기기 토큰이 없습니다","ja":"専用デバイストークンはありません"},
    "Git 远程同步配置": {"en":"Git Remote Sync Config","zh-TW":"Git 遠端同步設定","ko":"Git 원격 동기화 설정","ja":"Git リモート同期設定"},
    "启用自动 Git 提交与推送": {"en":"Enable Auto Git Commit & Push","zh-TW":"啟用自動 Git 提交與推送","ko":"자동 Git 커밋 및 푸시 활성화","ja":"Git 自動コミット＆プッシュを有効化"},
    "远程仓库 URL (HTTPS / SSH)": {"en":"Remote Repository URL (HTTPS / SSH)","zh-TW":"遠端倉庫 URL (HTTPS / SSH)","ko":"원격 저장소 URL (HTTPS / SSH)","ja":"リモートリポジトリ URL (HTTPS / SSH)"},
    "分支名称 (如 main / master)": {"en":"Branch Name (e.g. main / master)","zh-TW":"分支名稱 (如 main / master)","ko":"브랜치 이름 (예: main / master)","ja":"ブランチ名 (例: main / master)"},
    "自动推送频率 (分钟)": {"en":"Auto Push Frequency (mins)","zh-TW":"自動推送頻率 (分鐘)","ko":"자동 푸시 주기 (분)","ja":"自動プッシュ間隔 (分)"},
    "保存 Git 配置": {"en":"Save Git Settings","zh-TW":"儲存 Git 設定","ko":"Git 설정 저장","ja":"Git 設定を保存"},
    "🚀 立即手动执行 Git 备份": {"en":"🚀 Run Git Backup Now","zh-TW":"🚀 立即手動執行 Git 備份","ko":"🚀 지금 Git 백업 실행","ja":"🚀 今すぐ手動で Git バックアップを実行"},
    "🗄️ 数据库管理与引擎切换": {"en":"🗄️ Database Management & Engine Migration","zh-TW":"🗄️ 資料庫管理與引擎切換","ko":"🗄️ 데이터베이스 관리 및 엔진 전환","ja":"🗄️ データベース管理とエンジン移行"},
    "当前运行数据库引擎": {"en":"Current Database Engine","zh-TW":"目前運作資料庫引擎","ko":"현재 실행 중인 데이터베이스 엔진","ja":"稼働中データベースエンジン"},
    "数据库状态": {"en":"Database Status","zh-TW":"資料庫狀態","ko":"데이터베이스 상태","ja":"データベース状態"},
    "正常运行中": {"en":"Healthy & Running","zh-TW":"正常運作中","ko":"정상 작동 중","ja":"正常稼働中"},
    "连接异常": {"en":"Connection Error","zh-TW":"連線異常","ko":"연결 오류","ja":"接続エラー"},
    "总数据表数量": {"en":"Total Database Tables","zh-TW":"總資料表數量","ko":"총 데이터베이스 테이블 수","ja":"テーブル総数"},
    "总数据行数": {"en":"Total Records Count","zh-TW":"總資料行數","ko":"총 레코드 수","ja":"総レコード行数"},
    "数据库文件大小": {"en":"Database Size","zh-TW":"資料庫檔案大小","ko":"데이터베이스 크기","ja":"データベース容量"},
    "切换数据库存储引擎": {"en":"Switch Storage Engine","zh-TW":"切換資料庫儲存引擎","ko":"스토리지 엔진 전환","ja":"ストレージエンジンを切り替え"},
    "选择目标引擎：": {"en":"Target Engine:","zh-TW":"選擇目標引擎：","ko":"대상 엔진 선택:","ja":"対象エンジンを選択:"},
    "SQLite (单机轻量默认)": {"en":"SQLite (Lightweight Local Default)","zh-TW":"SQLite (單機輕量預設)","ko":"SQLite (가벼운 로컬 기본값)","ja":"SQLite (軽量ローカル標準)"},
    "PostgreSQL (高性能企业级)": {"en":"PostgreSQL (High-Performance Enterprise)","zh-TW":"PostgreSQL (高效能企業級)","ko":"PostgreSQL (고성능 엔터프라이즈)","ja":"PostgreSQL (高性能エンタープライズ)"},
    "MySQL / MariaDB (分布式支持)": {"en":"MySQL / MariaDB (Distributed Database)","zh-TW":"MySQL / MariaDB (分散式支援)","ko":"MySQL / MariaDB (분산 데이터베이스)","ja":"MySQL / MariaDB (分散データベース)"},
    "连接字符串 / URL：": {"en":"Connection String / URL:","zh-TW":"連線字串 / URL：","ko":"연결 문자열 / URL:","ja":"接続文字列 / URL:"},
    "测试数据库连接": {"en":"Test Connection","zh-TW":"測試資料庫連線","ko":"연결 테스트","ja":"接続テスト"},
    "开始数据迁移并切换引擎": {"en":"Migrate & Switch Engine","zh-TW":"開始資料遷移並切換引擎","ko":"데이터 마이그레이션 및 엔진 전환","ja":"データ移行とエンジン切り替えを開始"},
    "💾 备份当前数据库": {"en":"💾 Backup Database","zh-TW":"💾 備份目前資料庫","ko":"💾 데이터베이스 백업","ja":"💾 データベースをバックアップ"},
    "🧹 数据库碎片整理与压缩 (VACUUM)": {"en":"🧹 Vacuum & Optimize Database","zh-TW":"🧹 資料庫磁碟重組與壓縮 (VACUUM)","ko":"🧹 데이터베이스 최적화 및 압축 (VACUUM)","ja":"🧹 データベース最適化と圧縮 (VACUUM)"},
    "⚠️ 数据库优化或迁移期间可能会短暂中断同步连接，请提前知晓。": {"en":"⚠️ Sync connections may briefly pause during database vacuuming or migration.","zh-TW":"⚠️ 資料庫最佳化或遷移期間可能會短暫中斷同步連線，請事先知悉。","ko":"⚠️ 데이터베이스 최적화 또는 마이그레이션 중 일시적으로 연결이 중단될 수 있습니다.","ja":"⚠️ 最適化や移行中は同期接続が一時的に中断される場合があります。"},
    "🔔 Webhook 告警与事件通知": {"en":"🔔 Webhook Alerts & Event Notifications","zh-TW":"🔔 Webhook 告警與事件通知","ko":"🔔 Webhook 알림 및 이벤트 전송","ja":"🔔 Webhook アラートとイベント通知"},
    "当系统发生文件同步、多端冲突、设备接入或异常事件时，自动向指定的 HTTP URL 发送 JSON Webhook 回调通知。": {"en":"Automatically sends JSON Webhook payloads to external HTTP endpoints upon file sync, conflicts, device auth, or system events.","zh-TW":"當系統發生檔案同步、多端衝突、裝置接入或異常事件時，自動向指定的 HTTP URL 發送 JSON Webhook 回呼通知。","ko":"파일 동기화, 충돌, 기기 접속 또는 예외 발생 시 지정된 HTTP URL로 JSON Webhook 알림을 자동 전송합니다.","ja":"ファイル同期、競合、デバイス接続、異常発生時に指定の HTTP URL へ JSON Webhook を自動送信します。"},
    "➕ 添加 Webhook 订阅": {"en":"➕ Add Webhook Subscription","zh-TW":"➕ 新增 Webhook 訂閱","ko":"➕ Webhook 구독 추가","ja":"➕ Webhook を追加"},
    "接收地址 (Target URL)": {"en":"Target URL","zh-TW":"接收位址 (Target URL)","ko":"수신 주소 (Target URL)","ja":"送信先 URL (Target URL)"},
    "订阅的事件类型": {"en":"Subscribed Events","zh-TW":"訂閱的事件類型","ko":"구독 이벤트 유형","ja":"購読イベントの種類"},
    "全部事件 (*)": {"en":"All Events (*)","zh-TW":"全部事件 (*)","ko":"모든 이벤트 (*)","ja":"すべてのイベント (*)"},
    "文件创建与修改 (file:change)": {"en":"File Changes (file:change)","zh-TW":"檔案建立與修改 (file:change)","ko":"파일 생성 및 수정 (file:change)","ja":"ファイルの変更 (file:change)"},
    "多设备冲突产生 (conflict:detect)": {"en":"Conflict Detected (conflict:detect)","zh-TW":"多裝置衝突產生 (conflict:detect)","ko":"기기 충돌 발생 (conflict:detect)","ja":"競合の検出 (conflict:detect)"},
    "设备接入与授权 (device:auth)": {"en":"Device Auth (device:auth)","zh-TW":"裝置接入與授權 (device:auth)","ko":"기기 접속 및 인증 (device:auth)","ja":"デバイス認証 (device:auth)"},
    "系统错误与警告 (system:error)": {"en":"System Errors (system:error)","zh-TW":"系統錯誤與警告 (system:error)","ko":"시스템 오류 (system:error)","ja":"システムエラー (system:error)"},
    "签名密钥 Secret (选填)": {"en":"HMAC Secret Key (Optional)","zh-TW":"簽章金鑰 Secret (選填)","ko":"서명 비밀키 Secret (선택사항)","ja":"署名シークレット Secret (任意)"},
    "已启用": {"en":"Active","zh-TW":"已啟用","ko":"활성화됨","ja":"有効"},
    "已禁用": {"en":"Disabled","zh-TW":"已停用","ko":"비활성화됨","ja":"無効"},
    "🧪 测试发送": {"en":"🧪 Test Send","zh-TW":"🧪 測試發送","ko":"🧪 테스트 전송","ja":"🧪 テスト送信"},
    "暂无配置任何 Webhook 告警订阅": {"en":"No Webhook alert subscriptions configured yet","zh-TW":"暫無設定任何 Webhook 告警訂閱","ko":"설정된 Webhook 알림이 없습니다","ja":"Webhook アラート設定はありません"},
    "📋 全局多终端实时同步日志": {"en":"📋 Global Real-Time Sync Logs","zh-TW":"📋 全域多終端即時同步日誌","ko":"📋 전체 기기 실시간 동기화 로그","ja":"📋 グローバル端末リアルタイム同期ログ"},
    "审计所有设备与 Vault 的每一次同步推送、拉取、冲突检测与文件操作": {"en":"Audit every push, pull, conflict detection, and file operation across all devices and vaults","zh-TW":"審計所有裝置與 Vault 的每一次同步推送、拉取、衝突檢測與檔案操作","ko":"모든 기기와 Vault의 푸시, 풀, 충돌 감지 및 파일 작업을 기록하고 감사합니다","ja":"全端末と Vault における同期プッシュ、プル、競合検出、ファイル操作を監査します"},
    "全部 Vault": {"en":"All Vaults","zh-TW":"全部 Vault","ko":"모든 Vault","ja":"すべての Vault"},
    "全部操作类型": {"en":"All Action Types","zh-TW":"全部操作類型","ko":"모든 작업 유형","ja":"すべての操作種類"},
    "创建 / 上传": {"en":"Create / Upload","zh-TW":"建立 / 上傳","ko":"생성 / 업로드","ja":"作成 / アップロード"},
    "更新 / 保存": {"en":"Update / Save","zh-TW":"更新 / 儲存","ko":"업데이트 / 저장","ja":"更新 / 保存"},
    "重命名 / 移动": {"en":"Rename / Move","zh-TW":"重新命名 / 移動","ko":"이름 변경 / 이동","ja":"名前変更 / 移動"},
    "删除到回收站": {"en":"Move to Trash","zh-TW":"刪除到資源回收筒","ko":"휴지통으로 이동","ja":"ごみ箱へ移動"},
    "冲突产生": {"en":"Conflict Generated","zh-TW":"衝突產生","ko":"충돌 발생","ja":"競合発生"},
    "全部状态": {"en":"All Statuses","zh-TW":"全部狀態","ko":"모든 상태","ja":"すべてのステータス"},
    "成功": {"en":"Success","zh-TW":"成功","ko":"성공","ja":"成功"},
    "警告": {"en":"Warning","zh-TW":"警告","ko":"경고","ja":"警告"},
    "错误": {"en":"Error","zh-TW":"錯誤","ko":"오류","ja":"エラー"},
    "时间": {"en":"Timestamp","zh-TW":"時間","ko":"시간","ja":"日時"},
    "Vault 笔记库": {"en":"Vault","zh-TW":"Vault 筆記庫","ko":"Vault","ja":"Vault"},
    "客户端设备": {"en":"Client Device","zh-TW":"用戶端裝置","ko":"클라이언트 기기","ja":"クライアントデバイス"},
    "文件路径": {"en":"File Path","zh-TW":"檔案路徑","ko":"파일 경로","ja":"ファイルパス"},
    "详情与结果": {"en":"Details & Result","zh-TW":"詳細資訊與結果","ko":"세부 정보 및 결과","ja":"詳細と結果"},
    "暂无符合条件的全局同步日志": {"en":"No matching sync logs found","zh-TW":"暫無符合條件的全域同步日誌","ko":"일치하는 동기화 로그가 없습니다","ja":"該当する同期ログはありません"},
    "📥 导出 CSV 日志": {"en":"📥 Export CSV Logs","zh-TW":"📥 匯出 CSV 日誌","ko":"📥 CSV 로그 내보내기","ja":"📥 CSV ログをエクスポート"},
    "📱 接入设备与专属客户端管理": {"en":"📱 Connected Devices & Client Authorization","zh-TW":"📱 接入裝置與專屬用戶端管理","ko":"📱 연결된 기기 및 클라이언트 관리","ja":"📱 接続デバイスと専用クライアント管理"},
    "查看已授权连接到此服务端的所有 Obsidian 客户端、移动端设备、平板及自动化脚本": {"en":"View and manage all authorized Obsidian clients, mobile devices, tablets, and scripts connected to this server","zh-TW":"檢視已授權連線到此伺服端的所有 Obsidian 用戶端、行動裝置、平板及自動化指令碼","ko":"이 서버에 연결된 모든 Obsidian 클라이언트, 모바일 기기, 태블릿 및 자동화 스크립트를 관리합니다","ja":"このサーバーに接続が許可されているすべての Obsidian クライアント、モバイル端末、スクリプトを管理します"},
    "➕ 注册并授权新设备": {"en":"➕ Register & Authorize Device","zh-TW":"➕ 註冊並授權新裝置","ko":"➕ 새 기기 등록 및 인증","ja":"➕ 新規デバイスを登録・認証"},
    "设备名称 (如 MacBook Pro / iPhone 16)": {"en":"Device Name (e.g. MacBook Pro / iPhone 16)","zh-TW":"裝置名稱 (如 MacBook Pro / iPhone 16)","ko":"기기 이름 (예: MacBook Pro / iPhone 16)","ja":"デバイス名 (例: MacBook Pro / iPhone 16)"},
    "客户端类型": {"en":"Client Platform / Type","zh-TW":"用戶端類型","ko":"클라이언트 유형","ja":"クライアント種別"},
    "Obsidian 桌面端": {"en":"Obsidian Desktop","zh-TW":"Obsidian 桌面端","ko":"Obsidian 데스크톱","ja":"Obsidian デスクトップ"},
    "Obsidian 移动端 (iOS/Android)": {"en":"Obsidian Mobile (iOS/Android)","zh-TW":"Obsidian 行動端 (iOS/Android)","ko":"Obsidian 모바일 (iOS/Android)","ja":"Obsidian モバイル (iOS/Android)"},
    "CLI 命令行 / 自动化脚本": {"en":"CLI / Automation Script","zh-TW":"CLI 命令列 / 自動化指令碼","ko":"CLI / 자동화 스크립트","ja":"CLI / 自動化スクリプト"},
    "生成专属设备 Token": {"en":"Generate Dedicated Device Token","zh-TW":"產生專屬裝置 Token","ko":"전용 기기 Token 생성","ja":"専用デバイストークンを生成"},
    "客户端": {"en":"Client","zh-TW":"用戶端","ko":"클라이언트","ja":"クライアント"},
    "专属 Token": {"en":"Dedicated Token","zh-TW":"專屬 Token","ko":"전용 Token","ja":"専用 Token"},
    "接入 IP": {"en":"IP Address","zh-TW":"接入 IP","ko":"접속 IP","ja":"アクセス IP"},
    "最近同步时间": {"en":"Last Sync Time","zh-TW":"最近同步時間","ko":"최근 동기화 시간","ja":"最終同期日時"},
    "⚡ 查看连接配置": {"en":"⚡ View Connection Config","zh-TW":"⚡ 檢視連線設定","ko":"⚡ 연결 설정 보기","ja":"⚡ 接続設定を表示"},
    "🚫 注销设备授权": {"en":"🚫 Revoke Authorization","zh-TW":"🚫 註銷裝置授權","ko":"🚫 기기 인증 취소","ja":"🚫 デバイス認証を失効"},
    "暂无接入设备": {"en":"No devices connected yet","zh-TW":"暫無接入裝置","ko":"연결된 기기가 없습니다","ja":"接続中のデバイスはありません"},
    "👥 系统用户与多库权限管理": {"en":"👥 User & Multi-Vault Access Management","zh-TW":"👥 系統使用者與多庫權限管理","ko":"👥 사용자 및 Vault 권한 관리","ja":"👥 ユーザーおよび Vault 権限管理"},
    "管理本实例的所有登录用户、系统角色（管理员 / 普通用户）以及对各 Vault 的访问权限（只读 / 读写 / 无权）": {"en":"Manage accounts, system roles (Admin / User), and permissions across all vaults (Read-only / Read-Write / No Access)","zh-TW":"管理本實例的所有登入使用者、系統角色（管理員 / 一般使用者）以及對各 Vault 的存取權限（唯讀 / 讀寫 / 無權）","ko":"모든 사용자 계정, 시스템 역할(관리자 / 일반 사용자) 및 Vault별 접근 권한(읽기 전용 / 읽기 및 쓰기 / 권한 없음)을 관리합니다","ja":"全ユーザーアカウント、システム役割 (管理者 / 一般ユーザー)、各 Vault のアクセス権限 (読み取り専用 / 読み書き / アクセス不可) を管理します"},
    "➕ 创建新用户": {"en":"➕ Create New User","zh-TW":"➕ 建立新使用者","ko":"➕ 새 사용자 생성","ja":"➕ 新規ユーザーを作成"},
    "用户名": {"en":"Username","zh-TW":"使用者名稱","ko":"사용자 이름","ja":"ユーザー名"},
    "初始密码": {"en":"Initial Password","zh-TW":"初始密碼","ko":"초기 비밀번호","ja":"初期パスワード"},
    "用户角色": {"en":"User Role","zh-TW":"使用者角色","ko":"사용자 역할","ja":"ユーザー役割"},
    "管理员 (Admin)": {"en":"Admin (Full Access)","zh-TW":"管理員 (Admin)","ko":"관리자 (Admin)","ja":"管理者 (Admin)"},
    "普通用户 (User)": {"en":"Standard User (User)","zh-TW":"一般使用者 (User)","ko":"일반 사용자 (User)","ja":"一般ユーザー (User)"},
    "创建用户": {"en":"Create User","zh-TW":"建立使用者","ko":"사용자 생성","ja":"ユーザーを作成"},
    "用户列表": {"en":"User Directory","zh-TW":"使用者清單","ko":"사용자 목록","ja":"ユーザー一覧"},
    "关联 Vault 数": {"en":"Assigned Vaults","zh-TW":"關聯 Vault 數","ko":"연결된 Vault 수","ja":"関連 Vault 数"},
    "注册时间": {"en":"Registered Date","zh-TW":"註冊時間","ko":"가입일","ja":"登録日時"},
    "最近登录": {"en":"Last Login","zh-TW":"最近登入","ko":"마지막 로그인","ja":"最終ログイン"},
    "⚙️ Vault 权限": {"en":"⚙️ Vault Access","zh-TW":"⚙️ Vault 權限","ko":"⚙️ Vault 권한","ja":"⚙️ Vault 権限"},
    "🔑 重置密码": {"en":"🔑 Reset Password","zh-TW":"🔑 重設密碼","ko":"🔑 비밀번호 재설정","ja":"🔑 パスワードを再設定"},
    "🗑️ 删除用户": {"en":"🗑️ Delete User","zh-TW":"🗑️ 刪除使用者","ko":"🗑️ 사용자 삭제","ja":"🗑️ ユーザーを削除"},
    "用户 Vault 权限分配": {"en":"Assign User Vault Permissions","zh-TW":"使用者 Vault 權限分配","ko":"사용자 Vault 권한 할당","ja":"ユーザー Vault 権限割り当て"},
    "允许访问": {"en":"Grant Access","zh-TW":"允許存取","ko":"접근 허용","ja":"アクセス許可"},
    "访问权限": {"en":"Permission Level","zh-TW":"存取權限","ko":"접근 권한","ja":"アクセス権限"},
    "只读 (Read Only)": {"en":"Read Only (Read Only)","zh-TW":"唯讀 (Read Only)","ko":"읽기 전용 (Read Only)","ja":"読み取り専用 (Read Only)"},
    "读写 (Read & Write)": {"en":"Read & Write (Read & Write)","zh-TW":"讀寫 (Read & Write)","ko":"읽기 및 쓰기 (Read & Write)","ja":"読み書き可能 (Read & Write)"},
    "📚 全局 Vault 资源总览": {"en":"📚 Global Vaults Overview","zh-TW":"📚 全域 Vault 資源總覽","ko":"📚 전체 Vault 리소스 개요","ja":"📚 グローバル Vault リソース概要"},
    "查看并管理服务器上所有用户创建的知识库、文件总数、存储占用与最后同步活跃时间": {"en":"View and manage all knowledge vaults, total files, storage quotas, and recent activity across the server","zh-TW":"檢視並管理伺服器上所有使用者建立的知識庫、檔案總數、儲存佔用與最後同步活躍時間","ko":"서버의 모든 지식 베이스, 파일 수, 저장 공간 사용량 및 최근 동기화 활동을 관리합니다","ja":"サーバー上のすべての知識ベース、総ファイル数、容量使用状況、最終同期日時を管理します"},
    "Vault 名称": {"en":"Vault Name","zh-TW":"Vault 名稱","ko":"Vault 이름","ja":"Vault 名"},
    "Vault ID": {"en":"Vault ID","zh-TW":"Vault ID","ko":"Vault ID","ja":"Vault ID"},
    "创建者 / 所有者": {"en":"Creator / Owner","zh-TW":"建立者 / 擁有者","ko":"생성자 / 소유자","ja":"作成者 / オーナー"},
    "文件数量": {"en":"File Count","zh-TW":"檔案數量","ko":"파일 수","ja":"ファイル数"},
    "存储占用": {"en":"Storage Usage","zh-TW":"儲存佔用","ko":"저장 공간","ja":"ストレージ容量"},
    "最后活跃": {"en":"Last Active","zh-TW":"最後活躍","ko":"마지막 활동","ja":"最終アクティブ"},
    "📂 打开查看": {"en":"📂 Open Vault","zh-TW":"📂 開啟檢視","ko":"📂 열기","ja":"📂 開く"},
    "🗑️ 删除 Vault": {"en":"🗑️ Delete Vault","zh-TW":"🗑️ 刪除 Vault","ko":"🗑️ Vault 삭제","ja":"🗑️ Vault を削除"},
    "暂无任何 Vault 笔记库": {"en":"No Vaults created yet","zh-TW":"暫無任何 Vault 筆記庫","ko":"생성된 Vault가 없습니다","ja":"Vault はまだありません"},
    "❤️ 支持 Nimbus Vault Sync 开源项目": {"en":"❤️ Support Nimbus Vault Sync Open Source","zh-TW":"❤️ 支持 Nimbus Vault Sync 開源專案","ko":"❤️ Nimbus Vault Sync 오픈소스 프로젝트 후원","ja":"❤️ Nimbus Vault Sync オープンソースプロジェクトを支援"},
    "如果您觉得 Nimbus Vault Sync 为您的 Obsidian 笔记多端同步带来了便利与价值，欢迎赞助支持作者持续维护与迭代！": {"en":"If Nimbus Vault Sync brings speed and peace of mind to your Obsidian notes, your sponsorship helps keep the project maintained!","zh-TW":"如果您覺得 Nimbus Vault Sync 為您的 Obsidian 筆記多端同步帶來了便利與價值，歡迎贊助支持作者持續維護與迭代！","ko":"Nimbus Vault Sync가 편안한 Obsidian 동기화 경험을 제공했다면, 지속적인 개발을 위해 후원해 주세요!","ja":"Nimbus Vault Sync が Obsidian の同期に役立っている場合は、継続的なメンテナンスのためのご支援を歓迎いたします！"},
    "☕ 请作者喝杯咖啡 (Ko-fi)": {"en":"☕ Buy the Author a Coffee (Ko-fi)","zh-TW":"☕ 請作者喝杯咖啡 (Ko-fi)","ko":"☕ 커피 한 잔 후원하기 (Ko-fi)","ja":"☕ コーヒーを奢る (Ko-fi)"},
    "支持国际信用卡、PayPal、Apple Pay 等多种赞助方式": {"en":"Supports International Credit Cards, PayPal, Apple Pay, etc.","zh-TW":"支援國際信用卡、PayPal、Apple Pay 等多種贊助方式","ko":"국제 신용카드, PayPal, Apple Pay 등 다양한 결제 수단 지원","ja":"国際クレジットカード、PayPal、Apple Pay などの決済に対応"},
    "立即在 Ko-fi 上赞助": {"en":"Donate on Ko-fi Now","zh-TW":"立即在 Ko-fi 上贊助","ko":"지금 Ko-fi에서 후원하기","ja":"今すぐ Ko-fi で支援する"},
    "💚 微信扫码赞助": {"en":"💚 WeChat Pay Donation","zh-TW":"💚 微信掃碼贊助","ko":"💚 WeChat Pay 후원","ja":"💚 WeChat Pay で支援"},
    "使用微信扫一扫支持开发者": {"en":"Scan QR Code with WeChat to support","zh-TW":"使用微信掃一掃支持開發者","ko":"WeChat으로 QR 코드를 스캔하여 후원","ja":"WeChat アプリで QR コードをスキャンして支援"},
    "💙 支付宝扫码赞助": {"en":"💙 Alipay Donation","zh-TW":"💙 支付寶掃碼贊助","ko":"💙 Alipay 후원","ja":"💙 Alipay で支援"},
    "使用支付宝扫一扫支持开发者": {"en":"Scan QR Code with Alipay to support","zh-TW":"使用支付寶掃一掃支持開發者","ko":"Alipay로 QR 코드를 스캔하여 후원","ja":"Alipay アプリで QR コードをスキャンして支援"},
    "🌟 赞助者芳名录 (Supporters Wall)": {"en":"🌟 Supporters Wall","zh-TW":"🌟 贊助者芳名錄 (Supporters Wall)","ko":"🌟 후원자 명예의 전당","ja":"🌟 スポンサーの皆様 (Supporters Wall)"},
    "感谢所有支持本项目发展的朋友们！": {"en":"Thank you to everyone supporting the project!","zh-TW":"感謝所有支持本專案發展的朋友們！","ko":"프로젝트를 후원해 주신 모든 분께 감사드립니다!","ja":"本プロジェクトをご支援くださるすべての皆様に感謝いたします！"},
    "➕ 登记赞助记录 (管理员)": {"en":"➕ Record Donation (Admin)","zh-TW":"➕ 登記贊助記錄 (管理員)","ko":"➕ 후원 기록 등록 (관리자)","ja":"➕ 支援を記録 (管理者)"},
    "⚙️ 配置收款二维码与文案": {"en":"⚙️ Configure QR Codes & Copy","zh-TW":"⚙️ 設定收款二維碼與文案","ko":"⚙️ 결제 QR 코드 및 문구 설정","ja":"⚙️ 決済 QR コードと説明を設定"},
    "赞助者": {"en":"Supporter","zh-TW":"贊助者","ko":"후원자","ja":"スポンサー"},
    "金额": {"en":"Amount","zh-TW":"金額","ko":"금액","ja":"金額"},
    "留言与寄语": {"en":"Message","zh-TW":"留言與寄語","ko":"응원 메시지","ja":"メッセージ"},
    "日期": {"en":"Date","zh-TW":"日期","ko":"날짜","ja":"日付"},
    "暂无赞助记录，期待成为第一位支持者！": {"en":"No donations recorded yet. Be the first supporter!","zh-TW":"暫無贊助記錄，期待成為第一位支持者！","ko":"아직 후원 기록이 없습니다. 첫 번째 후원자가 되어보세요!","ja":"支援履歴はまだありません。最初のサポーターをお待ちしています！"},
    // Buttons & Actions
    '+ 新建笔记': { en: '+ New Note', 'zh-TW': '+ 新增筆記', ko: '+ 새 노트', ja: '+ 新規ノート' },
    '新建笔记': { en: 'New Note', 'zh-TW': '新增筆記', ko: '새 노트', ja: '新規ノート' },
    '⬆️ 上传文件': { en: '⬆️ Upload Files', 'zh-TW': '⬆️ 上傳檔案', ko: '⬆️ 파일 업로드', ja: '⬆️ ファイルをアップロード' },
    '上传文件': { en: 'Upload Files', 'zh-TW': '上傳檔案', ko: '파일 업로드', ja: 'ファイルをアップロード' },
    '📦 导出 ZIP': { en: '📦 Export ZIP', 'zh-TW': '📦 匯出 ZIP', ko: '📦 ZIP 내보내기', ja: '📦 ZIP をエクスポート' },
    '导出 ZIP': { en: 'Export ZIP', 'zh-TW': '匯出 ZIP', ko: 'ZIP 내보내기', ja: 'ZIP をエクスポート' },
    '⚡ Obsidian 连接': { en: '⚡ Obsidian Connect', 'zh-TW': '⚡ Obsidian 連線', ko: '⚡ Obsidian 연결', ja: '⚡ Obsidian 接続' },
    'Obsidian 连接': { en: 'Obsidian Connect', 'zh-TW': 'Obsidian 連線', ko: 'Obsidian 연결', ja: 'Obsidian 接続' },

    // Subtabs
    '📄 笔记与文件': { en: '📄 Notes & Files', 'zh-TW': '📄 筆記與檔案', ko: '📄 노트 및 파일', ja: '📄 ノートとファイル' },
    '⚔️ 冲突解决中心': { en: '⚔️ Conflict Resolver', 'zh-TW': '⚔️ 衝突解決中心', ko: '⚔️ 충돌 해결 센터', ja: '⚔️ 競合解決センター' },
    '💾 快照与备份': { en: '💾 Snapshots & Backups', 'zh-TW': '💾 快照與備份', ko: '💾 스냅샷 및 백업', ja: '💾 スナップショットとバックアップ' },
    '🚀 Git 自动备份': { en: '🚀 Git Auto-Backup', 'zh-TW': '🚀 Git 自動備份', ko: '🚀 Git 자동 백업', ja: '🚀 Git 自動バックアップ' },
    '👥 成员与权限': { en: '👥 Members & Access', 'zh-TW': '👥 成員與權限', ko: '👥 멤버 및 권한', ja: '👥 メンバーと権限' },
    '📊 统计与监控': { en: '📊 Stats & Analytics', 'zh-TW': '📊 統計與監控', ko: '📊 통계 및 모니터링', ja: '📊 統計とモニタリング' },
    '📋 同步日志': { en: '📋 Sync Logs', 'zh-TW': '📋 同步日誌', ko: '📋 동기화 로그', ja: '📋 同期ログ' },
    '🔗 公开分享': { en: '🔗 Public Shares', 'zh-TW': '🔗 公開分享', ko: '🔗 공개 공유', ja: '🔗 公開共有' },
    '⚙️ 同步规则': { en: '⚙️ Sync Rules', 'zh-TW': '⚙️ 同步規則', ko: '⚙️ 동기화 규칙', ja: '⚙️ 同期ルール' },
    '🗑️ 回收站': { en: '🗑️ Trash Bin', 'zh-TW': '🗑️ 資源回收筒', ko: '🗑️ 휴지통', ja: '🗑️ ごみ箱' },

    // Toolbar filters & view modes
    '全部': { en: 'All', 'zh-TW': '全部', ko: '전체', ja: 'すべて' },
    'HTML 网页': { en: 'HTML Pages', 'zh-TW': 'HTML 網頁', ko: 'HTML 웹페이지', ja: 'HTML ページ' },
    '媒体/附件': { en: 'Media / Attachments', 'zh-TW': '媒體/附件', ko: '미디어 / 첨부파일', ja: 'メディア / 添付ファイル' },
    '配置 (.obsidian)': { en: 'Config (.obsidian)', 'zh-TW': '設定 (.obsidian)', ko: '설정 (.obsidian)', ja: '設定 (.obsidian)' },
    '🌲 树状目录': { en: '🌲 Tree View', 'zh-TW': '🌲 樹狀目錄', ko: '🌲 트리 뷰', ja: '🌲 ツリー表示' },
    '树状目录': { en: 'Tree View', 'zh-TW': '樹狀目錄', ko: '트리 뷰', ja: 'ツリー表示' },
    '📋 平铺列表': { en: '📋 Flat List', 'zh-TW': '📋 平鋪列表', ko: '📋 플랫 목록', ja: '📋 リスト表示' },
    '平铺列表': { en: 'Flat List', 'zh-TW': '平鋪列表', ko: '플랫 목록', ja: 'リスト表示' },
    '🔄 刷新': { en: '🔄 Refresh', 'zh-TW': '🔄 重新整理', ko: '🔄 새로고침', ja: '🔄 更新' },
    '刷新': { en: 'Refresh', 'zh-TW': '重新整理', ko: '새로고침', ja: '更新' },
    '刷新中...': { en: 'Refreshing…', 'zh-TW': '重新整理中…', ko: '새로고침 중…', ja: '更新中…' },
    '⏳ 刷新中...': { en: '⏳ Refreshing…', 'zh-TW': '⏳ 重新整理中…', ko: '⏳ 새로고침 중…', ja: '⏳ 更新中…' },

    // Empty & Drop hints
    '📥 拖拽文件到此处，或点击右上角「上传文件」快速存入 Vault': {
      en: '📥 Drag & drop files here, or click "Upload Files" to store into Vault',
      'zh-TW': '📥 拖曳檔案至此處，或點擊右上角「上傳檔案」快速存入 Vault',
      ko: '📥 여기로 파일을 드래그하거나 우측 상단 \'파일 업로드\'를 클릭하세요',
      ja: '📥 ここにファイルをドラッグするか、右上の「ファイルをアップロード」をクリックしてください'
    },
    '拖拽文件到此处，或点击右上角「上传文件」快速存入 Vault': {
      en: 'Drag & drop files here, or click "Upload Files" to store into Vault',
      'zh-TW': '拖曳檔案至此處，或點擊右上角「上傳檔案」快速存入 Vault',
      ko: '여기로 파일을 드래그하거나 우측 상단 \'파일 업로드\'를 클릭하세요',
      ja: 'ここにファイルをドラッグするか、右上の「ファイルをアップロード」をクリックしてください'
    },
    '没有符合条件的文件': {
      en: 'No matching files found',
      'zh-TW': '沒有符合條件的檔案',
      ko: '일치하는 파일이 없습니다',
      ja: '該当するファイルが見つかりません'
    },

    // Tree View
    '原始目录结构': { en: 'Directory Structure', 'zh-TW': '原始目錄結構', ko: '기본 폴더 구조', ja: 'フォルダ階層構造' },
    '排序:': { en: 'Sort:', 'zh-TW': '排序:', ko: '정렬:', ja: '並び替え:' },
    '⏳ 创建时间 (最新优先)': { en: '⏳ Created (Newest First)', 'zh-TW': '⏳ 建立時間 (最新優先)', ko: '⏳ 생성일 (최신순)', ja: '⏳ 作成日時 (新しい順)' },
    '⌛ 创建时间 (最旧优先)': { en: '⌛ Created (Oldest First)', 'zh-TW': '⌛ 建立時間 (最舊優先)', ko: '⌛ 생성일 (오래된순)', ja: '⌛ 作成日時 (古い順)' },
    '📝 修改时间 (最新优先)': { en: '📝 Modified (Newest First)', 'zh-TW': '📝 修改時間 (最新優先)', ko: '📝 수정일 (최신순)', ja: '📝 更新日時 (新しい順)' },
    '🔤 文件名称 (A-Z)': { en: '🔤 File Name (A-Z)', 'zh-TW': '🔤 檔案名稱 (A-Z)', ko: '🔤 파일명 (A-Z)', ja: '🔤 ファイル名 (A-Z)' },
    '➕ 全部展开': { en: '➕ Expand All', 'zh-TW': '➕ 全部展開', ko: '➕ 모두 펼치기', ja: '➕ すべて展開' },
    '全部展开': { en: 'Expand All', 'zh-TW': '全部展開', ko: '모두 펼치기', ja: 'すべて展開' },
    '➖ 全部折叠': { en: '➖ Collapse All', 'zh-TW': '➖ 全部摺疊', ko: '➖ 모두 접기', ja: '➖ すべて折りたたむ' },
    '全部折叠': { en: 'Collapse All', 'zh-TW': '全部摺疊', ko: '모두 접기', ja: 'すべて折りたたむ' },

    // Table columns & Headers
    '名称 / 目录层级': { en: 'Name / Directory Level', 'zh-TW': '名稱 / 目錄層級', ko: '이름 / 디렉터리 수준', ja: '名前 / 階層' },
    '文件路径': { en: 'File Path', 'zh-TW': '檔案路徑', ko: '파일 경로', ja: 'ファイルパス' },
    '匹配文件与内容片段': { en: 'Matching Files & Snippets', 'zh-TW': '相符檔案與內容片段', ko: '일치하는 파일 및 내용 스니펫', ja: '一致したファイルと本文抜粋' },
    '大小': { en: 'Size', 'zh-TW': '大小', ko: '크기', ja: 'サイズ' },
    '创建时间': { en: 'Created At', 'zh-TW': '建立時間', ko: '생성일시', ja: '作成日時' },
    '修改时间': { en: 'Modified At', 'zh-TW': '修改時間', ko: '수정일시', ja: '更新日時' },
    '操作': { en: 'Actions', 'zh-TW': '操作', ko: '작업', ja: '操作' },
    '匹配摘要': { en: 'Match Snippet', 'zh-TW': '相符摘要', ko: '일치 스니펫', ja: '一致スニペット' },
    '状态': { en: 'Status', 'zh-TW': '狀態', ko: '상태', ja: 'ステータス' },
    '文件名': { en: 'File Name', 'zh-TW': '檔案名稱', ko: '파일명', ja: 'ファイル名' },
    '版本': { en: 'Version', 'zh-TW': '版本', ko: '버전', ja: 'バージョン' },
    '用户名': { en: 'Username', 'zh-TW': '使用者名稱', ko: '사용자 이름', ja: 'ユーザー名' },
    '邮箱': { en: 'Email', 'zh-TW': '電子郵件', ko: '이메일', ja: 'メールアドレス' },
    '角色': { en: 'Role', 'zh-TW': '角色', ko: '역할', ja: '役割' },
    '设备名称': { en: 'Device Name', 'zh-TW': '裝置名稱', ko: '기기 이름', ja: 'デバイス名' },
    '最后活跃': { en: 'Last Active', 'zh-TW': '最後活躍', ko: '마지막 활동', ja: '最終アクティブ' },
    '授权令牌': { en: 'Auth Token', 'zh-TW': '授權權杖', ko: '인증 토큰', ja: '認証トークン' },

    // Actions in rows & cards
    '历史': { en: 'History', 'zh-TW': '歷史', ko: '기록', ja: '履歴' },
    '⏱️ 历史': { en: '⏱️ History', 'zh-TW': '⏱️ 歷史', ko: '⏱️ 기록', ja: '⏱️ 履歴' },
    '分享': { en: 'Share', 'zh-TW': '分享', ko: '공유', ja: '共有' },
    '🔗 分享': { en: '🔗 Share', 'zh-TW': '🔗 分享', ko: '🔗 공유', ja: '🔗 共有' },
    '打开': { en: 'Open', 'zh-TW': '開啟', ko: '열기', ja: '開く' },
    '重命名': { en: 'Rename', 'zh-TW': '重新命名', ko: '이름 바꾸기', ja: '名前変更' },
    '删除': { en: 'Delete', 'zh-TW': '刪除', ko: '삭제', ja: '削除' },
    '下载': { en: 'Download', 'zh-TW': '下載', ko: '다운로드', ja: 'ダウンロード' },
    '还原': { en: 'Restore', 'zh-TW': '還原', ko: '복원', ja: '復元' },
    '彻底删除': { en: 'Delete Forever', 'zh-TW': '永久刪除', ko: '영구 삭제', ja: '完全削除' },
    '清空回收站': { en: 'Empty Trash', 'zh-TW': '清空資源回收筒', ko: '휴지통 비우기', ja: 'ごみ箱を空にする' },
    '暂无已删除的文件': { en: 'No deleted files in trash', 'zh-TW': '資源回收筒為空', ko: '휴지통이 비어 있습니다', ja: '削除されたファイルはありません' },
    '未找到包含此关键词的笔记': { en: 'No notes found matching this keyword', 'zh-TW': '未找到包含此關鍵字的筆記', ko: '이 키워드와 일치하는 노트를 찾을 수 없습니다', ja: 'このキーワードを含むノートは見つかりませんでした' },
    '移至回收站': { en: 'Move to Trash', 'zh-TW': '移至資源回收筒', ko: '휴지통으로 이동', ja: 'ごみ箱に移動' },
    '移入回收站确认': { en: 'Confirm Move to Trash', 'zh-TW': '移入資源回收筒確認', ko: '휴지통 이동 확인', ja: 'ごみ箱への移動の確認' },
    '清空日志': { en: 'Clear Logs', 'zh-TW': '清空日誌', ko: '로그 비우기', ja: 'ログをクリア' },
    '自动刷新': { en: 'Auto Refresh', 'zh-TW': '自動重新整理', ko: '자동 새로고침', ja: '自動更新' },
    '+ 创建即时快照': { en: '+ Create Snapshot', 'zh-TW': '+ 建立即時快照', ko: '+ 즉시 스냅샷 생성', ja: '+ 即時スナップショット作成' },
    '还原至此快照': { en: 'Restore to Snapshot', 'zh-TW': '還原至此快照', ko: '이 스냅샷으로 복원', ja: 'このスナップショットに復元' },
    '下载快照包': { en: 'Download Archive', 'zh-TW': '下載快照包', ko: '스냅샷 아카이브 다운로드', ja: 'アーカイブをダウンロード' },
    '删除快照': { en: 'Delete Snapshot', 'zh-TW': '刪除快照', ko: '스냅샷 삭제', ja: 'スナップショット削除' },
    '立即执行 Git 备份': { en: 'Run Git Backup Now', 'zh-TW': '立即執行 Git 備份', ko: '지금 Git 백업 실행', ja: '今すぐGitバックアップを実行' },
    '+ 添加协作者': { en: '+ Add Collaborator', 'zh-TW': '+ 新增協作者', ko: '+ 협업자 추가', ja: '+ 共同作業者を追加' },
    '移出协作者': { en: 'Remove Collaborator', 'zh-TW': '移出協作者', ko: '협업자 제거', ja: '共同作業者を削除' },
    '+ 创建公开分享': { en: '+ Create Share Link', 'zh-TW': '+ 建立公開分享', ko: '+ 공개 공유 링크 생성', ja: '+ 共有リンクを作成' },
    '复制链接': { en: 'Copy Link', 'zh-TW': '複製連結', ko: '링크 복사', ja: 'リンクをコピー' },
    '关闭分享': { en: 'Revoke Share', 'zh-TW': '關閉分享', ko: '공유 취소', ja: '共有を停止' },
    '保存同步规则': { en: 'Save Sync Rules', 'zh-TW': '儲存同步規則', ko: '동기화 규칙 저장', ja: '同期ルールを保存' },
    '关闭': { en: 'Close', 'zh-TW': '關閉', ko: '닫기', ja: '閉じる' },
    '取消': { en: 'Cancel', 'zh-TW': '取消', ko: '취소', ja: 'キャンセル' },
    '确定': { en: 'Confirm', 'zh-TW': '確認', ko: '확인', ja: '確認' },
    '确认': { en: 'Confirm', 'zh-TW': '確認', ko: '확인', ja: '確認' },
    '保存': { en: 'Save', 'zh-TW': '儲存', ko: '저장', ja: '保存' },
    '保存配置': { en: 'Save Settings', 'zh-TW': '儲存設定', ko: '설정 저장', ja: '設定を保存' },
    '正在保存…': { en: 'Saving…', 'zh-TW': '正在儲存…', ko: '저장 중…', ja: '保存中…' },
    '编辑配置': { en: 'Edit Config', 'zh-TW': '編輯設定', ko: '설정 편집', ja: '設定を編集' },
    '录入赞助': { en: 'Record Sponsor', 'zh-TW': '錄入贊助', ko: '후원 기록', ja: 'スポンサーを記録' },

    // Conflict Resolver & Subtabs
    '暂无文件版本冲突，所有客户端同步数据均保持一致！': {
      en: 'No file conflicts detected. All client sync data is consistent!',
      'zh-TW': '暫無檔案版本衝突，所有用戶端同步資料均保持一致！',
      ko: '파일 버전 충돌이 없습니다. 모든 클라이언트 동기화 데이터가 일치합니다!',
      ja: 'ファイルの競合はありません。すべてのクライアントの同期データが一致しています！'
    },
    '保留服务端版本': { en: 'Keep Server Version', 'zh-TW': '保留伺服端版本', ko: '서버 버전 유지', ja: 'サーバー版を保持' },
    '保留客户端版本': { en: 'Keep Client Version', 'zh-TW': '保留用戶端版本', ko: '클라이언트 버전 유지', ja: 'クライアント版を保持' },
    '对比差异并合并': { en: 'Compare Diff & Merge', 'zh-TW': '比對差異並合併', ko: '차이 비교 및 병합', ja: '差分を比較して結合' },
    '解决此冲突': { en: 'Resolve Conflict', 'zh-TW': '解決此衝突', ko: '이 충돌 해결', ja: 'この競合を解決' },
    '放弃本地变更': { en: 'Discard Local Changes', 'zh-TW': '放棄本機變更', ko: '로컬 변경 사항 취소', ja: 'ローカルの変更を破棄' },

    // Stats & Monitoring
    '总文件数': { en: 'Total Files', 'zh-TW': '總檔案數', ko: '총 파일 수', ja: '総ファイル数' },
    '存储空间': { en: 'Storage Used', 'zh-TW': '儲存空間', ko: '저장 공간', ja: 'ストレージ容量' },
    '在线同步设备': { en: 'Active Sync Devices', 'zh-TW': '線上同步裝置', ko: '온라인 동기화 기기', ja: 'オンライン同期デバイス' },
    '版本与回收站': { en: 'Versions & Trash', 'zh-TW': '版本與資源回收筒', ko: '버전 및 휴지통', ja: 'バージョンとごみ箱' },
    '当前暂无在线连接的客户端设备': {
      en: 'No client devices currently connected online',
      'zh-TW': '目前暫無線上連線的用戶端裝置',
      ko: '현재 온라인으로 연결된 클라이언트 기기가 없습니다',
      ja: '現在オンラインで接続されているクライアントデバイスはありません'
    },
    '暂无近期同步活动': { en: 'No recent sync activity', 'zh-TW': '暫無近期同步活動', ko: '최근 동기화 활동이 없습니다', ja: '最近の同期アクティビティはありません' },
    '🔄 刷新设备与状态': { en: '🔄 Refresh Devices & Status', 'zh-TW': '🔄 重新整理裝置與狀態', ko: '🔄 기기 및 상태 새로고침', ja: '🔄 デバイスとステータスを更新' },
    '⚡ 实时同步活动流': { en: '⚡ Realtime Sync Activity Stream', 'zh-TW': '⚡ 即時同步活動流', ko: '⚡ 실시간 동기화 활동 스트림', ja: '⚡ リアルタイム同期アクティビティストリーム' },
    '在线': { en: 'Online', 'zh-TW': '線上', ko: '온라인', ja: 'オンライン' },
    '离线': { en: 'Offline', 'zh-TW': '離線', ko: '오프라인', ja: 'オフライン' },
    '更新/推送': { en: 'Update/Push', 'zh-TW': '更新/推送', ko: '업데이트/푸시', ja: '更新/プッシュ' },
    '产生冲突': { en: 'Conflict', 'zh-TW': '產生衝突', ko: '충돌 발생', ja: '競合発生' },

    // Subtab: Trash & Rules
    '原始路径': { en: 'Original Path', 'zh-TW': '原始路徑', ko: '원래 경로', ja: '元のパス' },
    '删除时间': { en: 'Deleted Time', 'zh-TW': '刪除時間', ko: '삭제 시간', ja: '削除日時' },
    '预览': { en: 'Preview', 'zh-TW': '預覽', ko: '미리보기', ja: 'プレビュー' },
    '恢复': { en: 'Restore', 'zh-TW': '恢復', ko: '복원', ja: '復元' },
    '回收站是空的': { en: 'Trash is empty', 'zh-TW': '資源回收筒是空的', ko: '휴지통이 비어 있습니다', ja: 'ごみ箱は空です' },
    '⚙️ 忽略规则与同步策略': { en: '⚙️ Ignore Rules & Sync Policy', 'zh-TW': '⚙️ 忽略規則與同步策略', ko: '⚙️ 무시 규칙 및 동기화 정책', ja: '⚙️ 除外ルールと同期ポリシー' },
    '💾 保存规则': { en: '💾 Save Rules', 'zh-TW': '💾 儲存規則', ko: '💾 규칙 저장', ja: '💾 ルールを保存' },
    '单文件最大同步限制 (MB)': { en: 'Max Single File Size (MB)', 'zh-TW': '單一檔案最大同步限制 (MB)', ko: '단일 파일 최대 동기화 크기 (MB)', ja: '単一ファイル最大同期サイズ (MB)' },

    // Permissions & Owners
    '所有者': { en: 'Owner', 'zh-TW': '擁有者', ko: '소유자', ja: 'オーナー' },
    '只读': { en: 'Read-Only', 'zh-TW': '唯讀', ko: '읽기 전용', ja: '読み取り専用' },
    '读写': { en: 'Read & Write', 'zh-TW': '讀寫', ko: '읽기/쓰기', ja: '読み書き可能' },
    '标准用户': { en: 'Standard User', 'zh-TW': '一般使用者', ko: '일반 사용자', ja: '一般ユーザー' },
    '系统管理员': { en: 'Administrator', 'zh-TW': '系統管理員', ko: '시스템 관리자', ja: '管理者' },
    '管理员': { en: 'Admin', 'zh-TW': '管理員', ko: '관리자', ja: '管理者' },
    '普通用户': { en: 'User', 'zh-TW': '一般使用者', ko: '일반 사용자', ja: '一般ユーザー' },

    // Placeholders & tooltips
    '搜索文件名或全文内容...': { en: 'Search filename or full content...', 'zh-TW': '搜尋檔案名稱或全文內容...', ko: '파일명 또는 전문 검색...', ja: 'ファイル名または全文を検索...' },
    '按库的原始树状目录结构层级显示': { en: 'Show hierarchical tree directory structure', 'zh-TW': '按庫的原始樹狀目錄結構層級顯示', ko: '폴더 계층 구조로 표시', ja: 'フォルダ階層構造で表示' },
    '平铺文件路径列表显示': { en: 'Show flat list of all file paths', 'zh-TW': '平鋪檔案路徑列表顯示', ko: '모든 파일 플랫 목록 표시', ja: '全ファイル一覧表示' },
    '从服务端重新加载文件清单': { en: 'Reload file list from server', 'zh-TW': '從伺服端重新載入檔案清單', ko: '서버에서 파일 목록 새로고침', ja: 'サーバーから一覧を再読み込み' },
    '选择目录内笔记文件的排序规则': { en: 'Select sorting order for notes & files', 'zh-TW': '選擇目錄內筆記檔案的排序規則', ko: '노트 및 파일 정렬 기준 선택', ja: 'ノート・ファイルの並び順を選択' },
    '重新从服务端刷新文件列表': { en: 'Refresh file list from server', 'zh-TW': '重新從伺服端重新整理檔案列表', ko: '서버에서 파일 목록 다시 가져오기', ja: 'サーバーからファイルを更新' },

    // Editor & Viewers
    '← 返回': { en: '← Back', 'zh-TW': '← 返回', ko: '← 뒤로', ja: '← 戻る' },
    '🌐 网页视图': { en: '🌐 Web View', 'zh-TW': '🌐 網頁檢視', ko: '🌐 웹 뷰', ja: '🌐 Webビュー' },
    '👁️ 实时双栏': { en: '👁️ Split View', 'zh-TW': '👁️ 即時雙欄', ko: '👁️ 분할 뷰', ja: '👁️ 分割ビュー' },
    '📝 源码编辑': { en: '📝 Source Code', 'zh-TW': '📝 原始碼編輯', ko: '📝 소스 코드', ja: '📝 ソースコード' },
    '🚀 新窗口打开': { en: '🚀 Open in New Tab', 'zh-TW': '🚀 新視窗開啟', ko: '🚀 새 탭에서 열기', ja: '🚀 新しいタブで開く' },
    '👁️ 切换双栏预览': { en: '👁️ Toggle Preview', 'zh-TW': '👁️ 切換雙欄預覽', ko: '👁️ 분할 미리보기 전환', ja: '👁️ プレビュー切替' },
    '⏱️ 历史版本': { en: '⏱️ Version History', 'zh-TW': '⏱️ 歷史版本', ko: '⏱️ 버전 기록', ja: '⏱️ 履歴バージョン' },
    '💾 保存': { en: '💾 Save', 'zh-TW': '💾 儲存', ko: '💾 저장', ja: '💾 保存' },
    'HTML 网页': { en: 'HTML Page', 'zh-TW': 'HTML 網頁', ko: 'HTML 웹페이지', ja: 'HTML Webページ' },
    '⬇️ 下载原图': { en: '⬇️ Download Image', 'zh-TW': '⬇️ 下載原圖', ko: '⬇️ 원본 이미지 다운로드', ja: '⬇️ 元画像をダウンロード' },

    // Conflict Resolver & Backups
    '📸 立即创建全库快照': { en: '📸 Create Snapshot Now', 'zh-TW': '📸 立即建立全庫快照', ko: '📸 지금 스냅샷 생성', ja: '📸 即時スナップショット作成' },
    '全库快照与归档备份': { en: 'Vault Snapshots & Archives', 'zh-TW': '全庫快照與歸檔備份', ko: '전체 Vault 스냅샷 및 백업', ja: 'Vault全体のスナップショットとアーカイブ' },
    '多设备并发冲突解决中心': { en: 'Multi-Device Conflict Resolution Center', 'zh-TW': '多裝置並行衝突解決中心', ko: '다중 기기 동시 충돌 해결 센터', ja: 'マルチデバイス競合解決センター' },
    '笔记库暂无文件冲突': { en: 'No File Conflicts in Vault', 'zh-TW': '筆記庫暫無檔案衝突', ko: 'Vault에 파일 충돌이 없습니다', ja: 'Vault内に競合はありません' },
    '所有多端同步数据均已正常统一': { en: 'All multi-device sync data is unified', 'zh-TW': '所有多端同步資料均已正常統一', ko: '모든 다중 기기 동기화 데이터가 정상적으로 통합되었습니다', ja: 'すべての端末の同期データが正常に統一されています' },
    '🔄 重新检测': { en: '🔄 Recheck Conflicts', 'zh-TW': '🔄 重新檢測', ko: '🔄 다시 검사', ja: '🔄 再チェック' },
    '🔍 查看差异与合并': { en: '🔍 View Diff & Merge', 'zh-TW': '🔍 檢視差異與合併', ko: '🔍 차이 확인 및 병합', ja: '🔍 差分確認と結合' },
    '🗑️ 放弃此冲突副本': { en: '🗑️ Discard Conflict Copy', 'zh-TW': '🗑️ 放棄此衝突副本', ko: '🗑️ 이 충돌 복사본 취소', ja: '🗑️ この競合コピーを破棄' },
    '收起差异面板 ▲': { en: 'Collapse Diff Panel ▲', 'zh-TW': '收起差異面板 ▲', ko: '차이 패널 접기 ▲', ja: '差分パネルを折りたたむ ▲' },
    '🛡️ 保留服务端当前版本': { en: '🛡️ Keep Current Server Version', 'zh-TW': '🛡️ 保留伺服端目前版本', ko: '🛡️ 현재 서버 버전 유지', ja: '🛡️ 現在のサーバー版を保持' },
    '⚡ 采用客户端冲突副本覆盖': { en: '⚡ Overwrite with Client Version', 'zh-TW': '⚡ 採用用戶端衝突副本覆蓋', ko: '⚡ 클라이언트 버전으로 덮어쓰기', ja: '⚡ クライアント版で上書き' },
    '✍️ 手动编辑合并后内容': { en: '✍️ Custom Edit & Merge', 'zh-TW': '✍️ 手動編輯合併後內容', ko: '✍️ 직접 편집 및 병합', ja: '✍️ 手動で結合内容を編集' },
    '✅ 保存并解决冲突': { en: '✅ Save & Resolve Conflict', 'zh-TW': '✅ 儲存並解決衝突', ko: '✅ 저장 및 충돌 해결', ja: '✅ 保存して競合を解決' },

    // Shares & Sync Logs
    '已公开分享的笔记': { en: 'Publicly Shared Notes', 'zh-TW': '已公開分享的筆記', ko: '공개 공유된 노트', ja: '公開共有中のノート' },
    '尚未创建任何公开分享链接。在笔记列表中点击「🔗 分享」即可生成。': {
      en: 'No public share links created yet. Click "🔗 Share" in note list to create one.',
      'zh-TW': '尚未建立任何公開分享連結。在筆記列表中點擊「🔗 分享」即可產生。',
      ko: '생성된 공개 공유 링크가 없습니다. 노트 목록에서 \'🔗 공유\'를 클릭하여 생성하세요.',
      ja: '公開共有リンクはまだありません。ノート一覧で「🔗 共有」をクリックして作成してください。'
    },
    '全局笔记同步日志 (Global Sync Logs)': { en: 'Global Note Sync Logs', 'zh-TW': '全域筆記同步日誌 (Global Sync Logs)', ko: '전체 노트 동기화 로그 (Global Sync Logs)', ja: 'グローバル同期ログ (Global Sync Logs)' },
    '全部 Vault (All Vaults)': { en: 'All Vaults', 'zh-TW': '全部 Vault (All Vaults)', ko: '모든 Vault (All Vaults)', ja: 'すべての Vault (All Vaults)' },
    '🔄 刷新数据': { en: '🔄 Refresh Data', 'zh-TW': '🔄 重新整理資料', ko: '🔄 데이터 새로고침', ja: '🔄 データを更新' },
    '暂无符合条件的全局同步日志': { en: 'No matching sync logs found', 'zh-TW': '暫無符合條件的全域同步日誌', ko: '일치하는 동기화 로그가 없습니다', ja: '該当する同期ログはありません' },
    '暂无符合条件的同步日志': { en: 'No matching sync logs found', 'zh-TW': '暫無符合條件的同步日誌', ko: '일치하는 동기화 로그가 없습니다', ja: '該当する同期ログはありません' },
    '标题 / 路径': { en: 'Title / Path', 'zh-TW': '標題 / 路徑', ko: '제목 / 경로', ja: 'タイトル / パス' },
    '保护状态': { en: 'Protection Status', 'zh-TW': '保護狀態', ko: '보호 상태', ja: '保護ステータス' },
    '阅读次数': { en: 'Views', 'zh-TW': '閱讀次數', ko: '조회수', ja: '閲覧回数' },
    '有效期': { en: 'Expiration', 'zh-TW': '有效期限', ko: '유효기간', ja: '有効期限' },
    '永久有效': { en: 'Permanent', 'zh-TW': '永久有效', ko: '영구 유효', ja: '無期限' },
    '🔒 密码保护': { en: '🔒 Password Protected', 'zh-TW': '🔒 密碼保護', ko: '🔒 비밀번호 보호', ja: '🔒 パスワード保護' },
    '🌐 公开可读': { en: '🌐 Publicly Accessible', 'zh-TW': '🌐 公開可讀', ko: '🌐 공개 읽기 가능', ja: '🌐 公開アクセス可能' },
    '撤销': { en: 'Revoke', 'zh-TW': '撤銷', ko: '취소', ja: '取り消し' },
    '撤销分享': { en: 'Revoke Share', 'zh-TW': '撤銷分享', ko: '공유 취소', ja: '共有を取り消す' },
    '生成分享链接': { en: 'Generate Share Link', 'zh-TW': '產生分享連結', ko: '공유 링크 생성', ja: '共有リンクを生成' },
    '分享标题': { en: 'Share Title', 'zh-TW': '分享標題', ko: '공유 제목', ja: '共有タイトル' },
    '访问密码 (选填，留空则免密访问)': { en: 'Access Password (Optional, leave blank for open access)', 'zh-TW': '存取密碼 (選填，留空則免密存取)', ko: '접근 비밀번호 (선택사항, 비워두면 공개)', ja: 'アクセスパスワード (任意、空欄で制限なし)' },
    '允许访客一键复制全文正文': { en: 'Allow visitors to copy note content with one click', 'zh-TW': '允許訪客一鍵複製全文正文', ko: '방문자의 전체 본문 원클릭 복사 허용', ja: '訪問者によるワンクリック全文コピーを許可' },
    '🎉 分享链接已生成': { en: '🎉 Share Link Generated', 'zh-TW': '🎉 分享連結已產生', ko: '🎉 공유 링크가 생성되었습니다', ja: '🎉 共有リンクが生成されました' },
    '📋 复制链接': { en: '📋 Copy Link', 'zh-TW': '📋 複製連結', ko: '📋 링크 복사', ja: '📋 リンクをコピー' },
    '立即打开': { en: 'Open Now', 'zh-TW': '立即開啟', ko: '지금 열기', ja: '今すぐ開く' },
    '完成': { en: 'Done', 'zh-TW': '完成', ko: '완료', ja: '完了' }
  };

  function applyPhraseTranslations(root, lang) {
    if (!root) return;

    // A. Walk all text nodes
    const showTextFilter = (typeof NodeFilter !== 'undefined' && NodeFilter.SHOW_TEXT) ? NodeFilter.SHOW_TEXT : 4;
    const walker = document.createTreeWalker ? document.createTreeWalker(root, showTextFilter, null, false) : null;
    let node;
    while (walker && (node = walker.nextNode())) {
      let text = node.nodeValue;
      if (!text || !text.trim()) continue;

      let trimmed = text.trim();

      // Direct dictionary match
      if (PHRASE_MAP[trimmed] && PHRASE_MAP[trimmed][lang]) {
        node.nodeValue = text.replace(trimmed, PHRASE_MAP[trimmed][lang]);
        continue;
      }

      // Regex / Pattern replacements
      // 1. "X 个文件"
      if (/^(\d+)\s*个文件$/.test(trimmed)) {
        const count = trimmed.match(/^(\d+)\s*个文件$/)[1];
        if (lang === 'en') node.nodeValue = `${count} files`;
        else if (lang === 'zh-TW') node.nodeValue = `${count} 個檔案`;
        else if (lang === 'ko') node.nodeValue = `${count}개 파일`;
        else if (lang === 'ja') node.nodeValue = `${count} 個のファイル`;
        continue;
      }

      // 2. "权限: 所有者" / "权限: 读写" / "权限: 只读"
      if (/^权限:\s*(.+)$/.test(trimmed)) {
        const m = trimmed.match(/^权限:\s*(.+)$/)[1];
        const translatedRole = PHRASE_MAP[m] ? PHRASE_MAP[m][lang] : m;
        if (lang === 'en') node.nodeValue = `Permission: ${translatedRole}`;
        else if (lang === 'zh-TW') node.nodeValue = `權限: ${translatedRole}`;
        else if (lang === 'ko') node.nodeValue = `권한: ${translatedRole}`;
        else if (lang === 'ja') node.nodeValue = `権限: ${translatedRole}`;
        continue;
      }

      // 3. "全部 (X)"
      if (/^全部\s*\((\d+)\)$/.test(trimmed)) {
        const count = trimmed.match(/^全部\s*\((\d+)\)$/)[1];
        if (lang === 'en') node.nodeValue = `All (${count})`;
        else if (lang === 'zh-TW') node.nodeValue = `全部 (${count})`;
        else if (lang === 'ko') node.nodeValue = `전체 (${count})`;
        else if (lang === 'ja') node.nodeValue = `すべて (${count})`;
        continue;
      }

      // 4. "共 X 个文件夹 · Y 个文件"
      if (/📁\s*<strong>原始目录结构<\/strong>\s*·\s*共\s*(\d+)\s*个文件夹\s*·\s*(\d+)\s*个文件/.test(trimmed) || /共\s*(\d+)\s*个文件夹\s*·\s*(\d+)\s*个文件/.test(trimmed)) {
        const m = trimmed.match(/共\s*(\d+)\s*个文件夹\s*·\s*(\d+)\s*个文件/);
        if (m) {
          const fCount = m[1];
          const fileCount = m[2];
          if (lang === 'en') node.nodeValue = text.replace(m[0], `${fCount} folders · ${fileCount} files total`);
          else if (lang === 'zh-TW') node.nodeValue = text.replace(m[0], `共 ${fCount} 個資料夾 · ${fileCount} 個檔案`);
          else if (lang === 'ko') node.nodeValue = text.replace(m[0], `총 ${fCount}개 폴더 · ${fileCount}개 파일`);
          else if (lang === 'ja') node.nodeValue = text.replace(m[0], `合計 ${fCount} フォルダ · ${fileCount} ファイル`);
          continue;
        }
      }

      // 5. "X 台在线 / 共 Y 台设备"
      if (/(\d+)\s*台在线\s*\/\s*共\s*(\d+)\s*台设备/.test(trimmed)) {
        const m = trimmed.match(/(\d+)\s*台在线\s*\/\s*共\s*(\d+)\s*台设备/);
        if (m) {
          const online = m[1];
          const total = m[2];
          if (lang === 'en') node.nodeValue = text.replace(m[0], `${online} online / ${total} total devices`);
          else if (lang === 'zh-TW') node.nodeValue = text.replace(m[0], `${online} 台線上 / 共 ${total} 台裝置`);
          else if (lang === 'ko') node.nodeValue = text.replace(m[0], `${online}대 온라인 / 총 ${total}대 기기`);
          else if (lang === 'ja') node.nodeValue = text.replace(m[0], `${online}台オンライン / 合計 ${total}台`);
          continue;
        }
      }

      // 6. "已支持清单 (三个月以内)"
      if (/已支持清单\s*\(([^)]+)\)/.test(trimmed)) {
        const sub = trimmed.match(/已支持清单\s*\(([^)]+)\)/)[1];
        let subTr = sub;
        if (sub.includes('三个月以内')) {
          if (lang === 'en') subTr = 'Last 3 Months';
          else if (lang === 'zh-TW') subTr = '三個月以內';
          else if (lang === 'ko') subTr = '최근 3개월';
          else if (lang === 'ja') subTr = '直近3ヶ月以内';
        }
        if (lang === 'en') node.nodeValue = `Supporters List (${subTr})`;
        else if (lang === 'zh-TW') node.nodeValue = `已支持清單 (${subTr})`;
        else if (lang === 'ko') node.nodeValue = `후원자 목록 (${subTr})`;
        else if (lang === 'ja') node.nodeValue = `支援者リスト (${subTr})`;
        continue;
      }

      // 7. "🔑 设备专属令牌 (X)" or "设备专属令牌 (X)"
      if (/(🔑\s*)?设备专属令牌\s*\((\d+)\)/.test(trimmed)) {
        const m = trimmed.match(/(🔑\s*)?设备专属令牌\s*\((\d+)\)/);
        const icon = m[1] || '';
        const count = m[2];
        if (lang === 'en') node.nodeValue = `${icon}Dedicated Device Tokens (${count})`;
        else if (lang === 'zh-TW') node.nodeValue = `${icon}裝置專屬權杖 (${count})`;
        else if (lang === 'ko') node.nodeValue = `${icon}기기 전용 토큰 (${count})`;
        else if (lang === 'ja') node.nodeValue = `${icon}デバイス専用トークン (${count})`;
        continue;
      }

      // 8. "监控审计所有客户端在所有 Vault 上的实时同步活动记录 (共 N 条)"
      if (/监控审计所有客户端在所有 Vault 上的实时同步活动记录\s*\(共\s*(\d+)\s*条\)/.test(trimmed)) {
        const m = trimmed.match(/监控审计所有客户端在所有 Vault 上的实时同步活动记录\s*\(共\s*(\d+)\s*条\)/);
        const count = m[1];
        if (lang === 'en') node.nodeValue = `Monitor and audit real-time synchronization activity logs across all clients and vaults (${count} records total)`;
        else if (lang === 'zh-TW') node.nodeValue = `監控審計所有用戶端在所有 Vault 上的即時同步活動記錄 (共 ${count} 筆)`;
        else if (lang === 'ko') node.nodeValue = `모든 클라이언트와 Vault에서 발생하는 실시간 동기화 활동 기록 모니터링 및 감사 (총 ${count}건)`;
        else if (lang === 'ja') node.nodeValue = `すべてのクライアントおよび全 Vault におけるリアルタイム同期アクティビティの監視・監査 (合計 ${count} 件)`;
        continue;
      }
    }

    // B. Options in select elements
    root.querySelectorAll('option').forEach((opt) => {
      const txt = opt.textContent.trim();
      if (PHRASE_MAP[txt] && PHRASE_MAP[txt][lang]) {
        opt.textContent = PHRASE_MAP[txt][lang];
      }
    });

    // C. Input Placeholders & Button Titles
    root.querySelectorAll('input[placeholder], textarea[placeholder]').forEach((el) => {
      const ph = el.getAttribute('placeholder');
      if (ph && PHRASE_MAP[ph.trim()] && PHRASE_MAP[ph.trim()][lang]) {
        el.setAttribute('placeholder', PHRASE_MAP[ph.trim()][lang]);
      }
    });

    root.querySelectorAll('[title]').forEach((el) => {
      const tit = el.getAttribute('title');
      if (tit && PHRASE_MAP[tit.trim()] && PHRASE_MAP[tit.trim()][lang]) {
        el.setAttribute('title', PHRASE_MAP[tit.trim()][lang]);
      }
    });
  }

  /**
   * Switch language, update UI, and notify listeners
   */
  function setLanguage(langCode) {
    if (!LANGUAGES[langCode]) {
      console.warn('Unsupported language:', langCode);
      return;
    }
    currentLang = langCode;
    localStorage.setItem('nimbus_lang', langCode);
    updateLangUI();
    translateDOM();

    // Dispatch global event for components in app.js
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: langCode } }));
  }

  function getLanguage() {
    return currentLang;
  }

  function getLanguages() {
    return LANGUAGES;
  }

  function updateLangUI() {
    const langInfo = LANGUAGES[currentLang] || LANGUAGES['zh-CN'];
    const label = document.getElementById('lang-label-name');
    const flag = document.getElementById('lang-current-flag');
    if (label) label.textContent = langInfo.name;
    if (flag) flag.textContent = langInfo.flag;

    // Login page language indicators if present
    const loginLabel = document.getElementById('login-lang-label');
    if (loginLabel) loginLabel.textContent = `${langInfo.flag} ${langInfo.name}`;

    document.querySelectorAll('.lang-opt-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.langVal === currentLang);
    });
  }

  function initLangSwitcher() {
    const menuBtn = document.getElementById('lang-menu-btn');
    const menu = document.getElementById('lang-dropdown-menu');
    if (menuBtn && menu) {
      menuBtn.onclick = (e) => {
        e.stopPropagation();
        menu.classList.toggle('hidden');
        // Close theme dropdown if open
        const themeMenu = document.getElementById('theme-dropdown-menu');
        if (themeMenu) themeMenu.classList.add('hidden');
      };

      menu.querySelectorAll('.lang-opt-item').forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const targetLang = btn.dataset.langVal;
          if (targetLang) {
            setLanguage(targetLang);
          }
          menu.classList.add('hidden');
        };
      });
    }

    // Login page language switcher
    const loginLangBtn = document.getElementById('login-lang-btn');
    const loginLangMenu = document.getElementById('login-lang-dropdown');
    if (loginLangBtn && loginLangMenu) {
      loginLangBtn.onclick = (e) => {
        e.stopPropagation();
        loginLangMenu.classList.toggle('hidden');
      };
      loginLangMenu.querySelectorAll('.lang-opt-item').forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const targetLang = btn.dataset.langVal;
          if (targetLang) {
            setLanguage(targetLang);
          }
          loginLangMenu.classList.add('hidden');
        };
      });
    }

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (menu && !menu.contains(e.target) && menuBtn && !menuBtn.contains(e.target)) {
        menu.classList.add('hidden');
      }
      if (loginLangMenu && !loginLangMenu.contains(e.target) && loginLangBtn && !loginLangBtn.contains(e.target)) {
        loginLangMenu.classList.add('hidden');
      }
    });

    updateLangUI();
    translateDOM();

    // Observe dynamic DOM insertions and re-translate automatically
    let observerTimeout = null;
    const observer = new MutationObserver((mutations) => {
      if (currentLang === 'zh-CN') return;
      let hasRelevantChange = false;
      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length > 0) {
          hasRelevantChange = true;
          break;
        }
      }
      if (hasRelevantChange) {
        if (observerTimeout) clearTimeout(observerTimeout);
        observerTimeout = setTimeout(() => {
          translateDOM();
        }, 16);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Expose global i18n object and helper
  window.i18n = {
    t,
    getLanguage,
    setLanguage,
    getLanguages,
    LANGUAGES,
    TRANSLATIONS,
    translateDOM,
    updateLangUI,
    initLangSwitcher,
  };
  window.t = t;

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initLangSwitcher();
    });
  } else {
    initLangSwitcher();
  }
})();
