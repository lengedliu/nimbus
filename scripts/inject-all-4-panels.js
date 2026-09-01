const fs = require('fs');
const path = require('path');

const i18nPath = path.join(__dirname, '..', 'public', 'i18n.js');
let currentCode = fs.readFileSync(i18nPath, 'utf8');

const TARGET_PHRASES = {
  // Panel 1: Webhook
  'Webhook 告警与实时第三方推送': {
    en: 'Webhook Alerts & Real-Time Third-Party Push',
    'zh-TW': 'Webhook 告警與即時第三方推送',
    ko: '웹훅 알림 및 실시간 서드파티 푸시',
    ja: 'Webhook アラートとサードパーティリアルタイム通知'
  },
  '🔔 Webhook 告警与实时第三方推送': {
    en: '🔔 Webhook Alerts & Real-Time Third-Party Push',
    'zh-TW': '🔔 Webhook 告警與即時第三方推送',
    ko: '🔔 웹훅 알림 및 실시간 서드파티 푸시',
    ja: '🔔 Webhook アラートとサードパーティリアルタイム通知'
  },
  '当多端发生并发冲突、全库快照备份完成、新设备上线或文件变动时，实时推送告警消息至飞书、钉钉、企业微信、Discord 或自定义 HTTP 终端': {
    en: 'Real-time alert push to Feishu, DingTalk, WeCom, Discord, or custom HTTP endpoints upon multi-device conflicts, snapshot completions, new devices, or file changes.',
    'zh-TW': '當多端發生並發衝突、全庫快照備份完成、新裝置上線或檔案變動時，即時推送告警訊息至飛書、釘釘、企業微信、Discord 或自訂 HTTP 端點。',
    ko: '다중 기기 동시 편집 충돌, 전체 스냅샷 생성 완료, 새 기기 연결 또는 파일 변경 시 Feishu, DingTalk, WeCom, Discord 또는 사용자 정의 HTTP 엔드포인트로 실시간 알림을 전송합니다.',
    ja: 'マルチデバイスの同時競合、バックアップ完了、新規デバイス接続、ファイル変更時に Feishu、DingTalk、WeCom、Discord またはカスタム HTTP エンドポイントへリアルタイム通知します。'
  },
  '发送测试通知': { en: 'Send Test Notification', 'zh-TW': '發送測試通知', ko: '테스트 알림 전송', ja: 'テスト通知を送信' },
  '🚀 发送测试通知': { en: '🚀 Send Test Notification', 'zh-TW': '🚀 發送測試通知', ko: '🚀 테스트 알림 전송', ja: '🚀 テスト通知を送信' },
  '🧪 发送测试通知': { en: '🧪 Send Test Notification', 'zh-TW': '🧪 發送測試通知', ko: '🧪 테스트 알림 전송', ja: '🧪 テスト通知を送信' },
  '保存 Webhook 配置': { en: 'Save Webhook Config', 'zh-TW': '儲存 Webhook 設定', ko: '웹훅 설정 저장', ja: 'Webhook 設定を保存' },
  '💾 保存 Webhook 配置': { en: '💾 Save Webhook Config', 'zh-TW': '💾 儲存 Webhook 設定', ko: '💾 웹훅 설정 저장', ja: '💾 Webhook 設定を保存' },
  'Webhook 推送端点配置': { en: 'Webhook Push Endpoint Configuration', 'zh-TW': 'Webhook 推送端點設定', ko: '웹훅 푸시 엔드포인트 설정', ja: 'Webhook 通知先エンドポイント設定' },
  '⚙️ Webhook 推送端点配置': { en: '⚙️ Webhook Push Endpoint Configuration', 'zh-TW': '⚙️ Webhook 推送端點設定', ko: '⚙️ 웹훅 푸시 엔드포인트 설정', ja: '⚙️ Webhook 通知先エンドポイント設定' },
  '启用 Webhook 告警通知功能': { en: 'Enable Webhook Alert Notifications', 'zh-TW': '啟用 Webhook 告警通知功能', ko: '웹훅 알림 기능 활성화', ja: 'Webhook アラート通知を有効化' },
  '推送目标平台': { en: 'Target Platform', 'zh-TW': '推送目標平台', ko: '푸시 대상 플랫폼', ja: '通知先プラットフォーム' },
  '自定义 HTTP POST JSON 终端': { en: 'Custom HTTP POST JSON Endpoint', 'zh-TW': '自訂 HTTP POST JSON 端點', ko: '사용자 정의 HTTP POST JSON 엔드포인트', ja: 'カスタム HTTP POST JSON エンドポイント' },
  '🌐 自定义 HTTP POST JSON 终端': { en: '🌐 Custom HTTP POST JSON Endpoint', 'zh-TW': '🌐 自訂 HTTP POST JSON 端點', ko: '🌐 사용자 정의 HTTP POST JSON 엔드포인트', ja: '🌐 カスタム HTTP POST JSON エンドポイント' },
  '飞书自定义机器人 (Feishu Bot)': { en: 'Feishu Custom Bot', 'zh-TW': '飛書自訂機器人 (Feishu Bot)', ko: 'Feishu 봇', ja: 'Feishu カスタムボット' },
  '🕊️ 飞书群机器人 (Feishu Webhook)': { en: '🕊️ Feishu Bot (Feishu Webhook)', 'zh-TW': '🕊️ 飛書群機器人 (Feishu Webhook)', ko: '🕊️ Feishu 그룹 봇', ja: '🕊️ Feishu ボット' },
  '钉钉群自定义机器人 (DingTalk Bot)': { en: 'DingTalk Group Custom Bot', 'zh-TW': '釘釘群自訂機器人 (DingTalk Bot)', ko: 'DingTalk 그룹 봇', ja: 'DingTalk グループボット' },
  '🎯 钉钉自定义机器人 (DingTalk Webhook)': { en: '🎯 DingTalk Custom Bot (DingTalk Webhook)', 'zh-TW': '🎯 釘釘自訂機器人 (DingTalk Webhook)', ko: '🎯 DingTalk 봇', ja: '🎯 DingTalk カスタムボット' },
  '企业微信群机器人 (WeCom Bot)': { en: 'WeCom Group Bot', 'zh-TW': '企業微信群機器人 (WeCom Bot)', ko: 'WeCom 그룹 봇', ja: 'WeCom グループボット' },
  '💬 企业微信群机器人 (WeCom Webhook)': { en: '💬 WeCom Group Bot (WeCom Webhook)', 'zh-TW': '💬 企業微信群機器人 (WeCom Webhook)', ko: '💬 WeCom 봇', ja: '💬 WeCom ボット' },
  'Discord Webhook': { en: 'Discord Webhook', 'zh-TW': 'Discord Webhook', ko: 'Discord 웹훅', ja: 'Discord Webhook' },
  'Slack Webhook': { en: 'Slack Webhook', 'zh-TW': 'Slack Webhook', ko: 'Slack 웹훅', ja: 'Slack Webhook' },
  'Webhook 回调 URL 地址': { en: 'Webhook Callback URL', 'zh-TW': 'Webhook 回調 URL 位址', ko: '웹훅 콜백 URL 주소', ja: 'Webhook コールバック URL' },
  '接收 Nimbus 发送 POST 请求的完整 Webhook 链接': {
    en: 'Full Webhook URL receiving POST requests from Nimbus',
    'zh-TW': '接收 Nimbus 發送 POST 請求的完整 Webhook 連結',
    ko: 'Nimbus가 POST 요청을 전송할 전체 웹훅 URL',
    ja: 'Nimbus から POST リクエストを受信する完全な Webhook URL'
  },
  '签名校验密钥 (Secret / 签名密钥, 可选)': {
    en: 'Signature Secret (Secret / Sign Key, Optional)',
    'zh-TW': '簽名校驗密鑰 (Secret / 簽名金鑰, 可選)',
    ko: '서명 검증 비밀키 (Secret / 서명키, 선택사항)',
    ja: '署名検証シークレット (Secret / 署名キー、任意)'
  },
  '若机器人启用了安全加签校验请输入': {
    en: 'Enter secret if bot has enabled security signature verification',
    'zh-TW': '若機器人啟用了安全加簽校驗請輸入',
    ko: '봇의 보안 서명 검증이 활성화된 경우 입력하세요',
    ja: 'ボットのセキュリティ署名検証が有効な場合に入力してください'
  },
  '订阅触发事件 (Event Subscriptions)': {
    en: 'Event Subscriptions',
    'zh-TW': '訂閱觸發事件 (Event Subscriptions)',
    ko: '이벤트 구독 (Event Subscriptions)',
    ja: 'イベント購読 (Event Subscriptions)'
  },
  '🎉 订阅触发事件 (Event Subscriptions)': {
    en: '🎉 Event Subscriptions',
    'zh-TW': '🎉 訂閱觸發事件 (Event Subscriptions)',
    ko: '🎉 이벤트 구독 (Event Subscriptions)',
    ja: '🎉 イベント購読 (Event Subscriptions)'
  },
  'conflict.detected (检测到多设备并发冲突)': {
    en: 'conflict.detected (Multi-device concurrent conflict detected)',
    'zh-TW': 'conflict.detected (檢測到多裝置並發衝突)',
    ko: 'conflict.detected (다중 기기 동시 편집 충돌 감지됨)',
    ja: 'conflict.detected (マルチデバイス同時編集の競合を検出)'
  },
  '⚔️ conflict.detected (检测到多设备并发冲突)': {
    en: '⚔️ conflict.detected (Multi-device concurrent conflict detected)',
    'zh-TW': '⚔️ conflict.detected (檢測到多裝置並發衝突)',
    ko: '⚔️ conflict.detected (다중 기기 동시 편집 충돌 감지됨)',
    ja: '⚔️ conflict.detected (マルチデバイス同時編集の競合を検出)'
  },
  '当两台设备同时编辑同一笔记并在同步中产生冲突副本时触发': {
    en: 'Triggered when two devices edit the same note simultaneously and create a conflict copy during sync',
    'zh-TW': '當兩台裝置同時編輯同一筆記並在同步中產生衝突副本時觸發',
    ko: '두 기기가 동일한 노트를 동시에 편집하여 동기화 중 충돌 복사본이 생성될 때 트리거됩니다',
    ja: '2台のデバイスが同一ノートを同時編集し同期競合コピーが発生した際に通知'
  },
  'conflict.resolved (冲突已成功解决)': {
    en: 'conflict.resolved (Conflict successfully resolved)',
    'zh-TW': 'conflict.resolved (衝突已成功解決)',
    ko: 'conflict.resolved (충돌이 성공적으로 해결됨)',
    ja: 'conflict.resolved (競合が正常に解決されました)'
  },
  '✓ conflict.resolved (冲突已成功解决)': {
    en: '✓ conflict.resolved (Conflict successfully resolved)',
    'zh-TW': '✓ conflict.resolved (衝突已成功解決)',
    ko: '✓ conflict.resolved (충돌이 성공적으로 해결됨)',
    ja: '✓ conflict.resolved (競合が正常に解決されました)'
  },
  '当管理员或用户在控制台手动合并或采纳冲突版本后触发': {
    en: 'Triggered when an admin or user manually resolves, merges, or accepts a conflict version in the console',
    'zh-TW': '當管理員或使用者在控制台手動合併或採納衝突版本後觸發',
    ko: '관리자 또는 사용자가 콘솔에서 수동으로 충돌을 병합하거나 해결했을 때 트리거됩니다',
    ja: '管理者またはユーザーがダッシュボード上で競合を手動統合または解決した際に通知'
  },
  'backup.created (全库快照备份完成)': {
    en: 'backup.created (Full vault snapshot backup created)',
    'zh-TW': 'backup.created (全庫快照備份完成)',
    ko: 'backup.created (전체 Vault 스냅샷 백업 생성 완료)',
    ja: 'backup.created (全 Vault スナップショット作成完了)'
  },
  '💾 backup.created (全库快照备份完成)': {
    en: '💾 backup.created (Full vault snapshot backup created)',
    'zh-TW': '💾 backup.created (全庫快照備份完成)',
    ko: '💾 backup.created (전체 Vault 스냅샷 백업 생성 완료)',
    ja: '💾 backup.created (全 Vault スナップショット作成完了)'
  },
  '当系统或用户完成全库 ZIP 归档快照创建时触发': {
    en: 'Triggered when the system or user finishes creating a full vault ZIP archive snapshot',
    'zh-TW': '當系統或使用者完成全庫 ZIP 歸檔快照建立時觸發',
    ko: '시스템 또는 사용자가 전체 Vault ZIP 아카이브 스냅샷 생성을 완료했을 때 트리거됩니다',
    ja: 'システムまたはユーザーが全 Vault の ZIP アーカイブ作成を完了した際に通知'
  },
  'device.connected (新设备接入与上线)': {
    en: 'device.connected (New device connected & online)',
    'zh-TW': 'device.connected (新裝置接入與上線)',
    ko: 'device.connected (새 기기 연결 및 온라인 활성화)',
    ja: 'device.connected (新規デバイス接続・オンライン)'
  },
  '📱 device.connected (新设备接入与上线)': {
    en: '📱 device.connected (New device connected & online)',
    'zh-TW': '📱 device.connected (新裝置接入與上線)',
    ko: '📱 device.connected (새 기기 연결 및 온라인 활성화)',
    ja: '📱 device.connected (新規デバイス接続・オンライン)'
  },
  '当有新客户端设备首次接入或发起全量同步时触发': {
    en: 'Triggered when a new client device connects for the first time or initiates initial full sync',
    'zh-TW': '當有新用戶端裝置首次接入或發起全量同步時觸發',
    ko: '새 클라이언트 기기가 처음 연결되거나 전체 동기화를 시작할 때 트리거됩니다',
    ja: '新規クライアントデバイスが初めて接続または全同期を開始した際に通知'
  },
  'file.deleted (文件移入回收站)': {
    en: 'file.deleted (File moved to trash)',
    'zh-TW': 'file.deleted (檔案移入資源回收筒)',
    ko: 'file.deleted (파일 휴지통 이동)',
    ja: 'file.deleted (ファイルをゴミ箱へ移動)'
  },
  '🗑️ file.deleted (文件移入回收站)': {
    en: '🗑️ file.deleted (File moved to trash)',
    'zh-TW': '🗑️ file.deleted (檔案移入資源回收筒)',
    ko: '🗑️ file.deleted (파일 휴지통 이동)',
    ja: '🗑️ file.deleted (ファイルをゴミ箱へ移動)'
  },
  '当客户端同步删除文件或用户从控制台删除笔记时触发': {
    en: 'Triggered when a client syncs file deletion or user deletes a note from the console',
    'zh-TW': '當用戶端同步刪除檔案或使用者從控制台刪除筆記時觸發',
    ko: '클라이언트 동기화로 파일이 삭제되거나 콘솔에서 노트가 삭제될 때 트리거됩니다',
    ja: 'クライアント同期によりファイルが削除されたか、管理画面から削除された際に通知'
  },

  // Panel 2: Devices
  '接入设备与多端令牌管理': {
    en: 'Connected Devices & Multi-Device Token Management',
    'zh-TW': '接入裝置與多端權杖管理',
    ko: '연결된 기기 및 멀티 디바이스 토큰 관리',
    ja: '接続デバイスおよびマルチトークン管理'
  },
  '📱 接入设备与多端令牌管理': {
    en: '📱 Connected Devices & Multi-Device Token Management',
    'zh-TW': '📱 接入裝置與多端權杖管理',
    ko: '📱 연결된 기기 및 멀티 디바이스 토큰 관리',
    ja: '📱 接続デバイスおよびマルチトークン管理'
  },
  '监控与管理连接至 Obsidian Nimbus 同步服务的客户端设备、在线状态、专用授权 Token 及最近活跃时间': {
    en: 'Monitor and manage client devices connected to Obsidian Nimbus Sync, their online status, dedicated auth tokens, and recent activity.',
    'zh-TW': '監控與管理連接至 Obsidian Nimbus 同步服務的用戶端裝置、線上狀態、專用授權權杖及最近活躍時間。',
    ko: 'Obsidian Nimbus 동기화 서비스에 연결된 클라이언트 기기, 온라인 상태, 전용 인증 토큰 및 최근 활동 시간을 모니터링하고 관리합니다.',
    ja: 'Obsidian Nimbus 同期サービスに接続されているクライアントデバイス、オンライン状態、専用認証トークン、最新のアクティビティを監視・管理します。'
  },
  '生成新设备令牌': { en: 'Generate New Device Token', 'zh-TW': '產生新裝置權杖', ko: '새 기기 토큰 생성', ja: '新規デバイストークンを生成' },
  '➕ 生成新设备令牌': { en: '➕ Generate New Device Token', 'zh-TW': '➕ 產生新裝置權杖', ko: '➕ 새 기기 토큰 생성', ja: '➕ 新規デバイストークンを生成' },
  '刷新列表': { en: 'Refresh List', 'zh-TW': '重新整理清單', ko: '목록 새로고침', ja: '一覧を更新' },
  '🔄 刷新列表': { en: '🔄 Refresh List', 'zh-TW': '🔄 重新整理清單', ko: '🔄 목록 새로고침', ja: '🔄 一覧を更新' },
  'Windows PC (默认设备)': { en: 'Windows PC (Default Device)', 'zh-TW': 'Windows PC (預設裝置)', ko: 'Windows PC (기본 기기)', ja: 'Windows PC (デフォルトデバイス)' },
  '离线 就绪': { en: 'Offline Ready', 'zh-TW': '離線 就緒', ko: '오프라인 대기', ja: 'オフライン 待機中' },
  '⚪ 离线 就绪': { en: '⚪ Offline Ready', 'zh-TW': '⚪ 離線 就緒', ko: '⚪ 오프라인 대기', ja: '⚪ オフライン 待機中' },
  '在线 活跃': { en: 'Online Active', 'zh-TW': '線上 活躍', ko: '온라인 활성', ja: 'オンライン 稼働中' },
  '🟢 在线 活跃': { en: '🟢 Online Active', 'zh-TW': '🟢 線上 活躍', ko: '🟢 온라인 활성', ja: '🟢 オンライン 稼働中' },
  '离线': { en: 'Offline', 'zh-TW': '離線', ko: '오프라인', ja: 'オフライン' },
  '在线': { en: 'Online', 'zh-TW': '線上', ko: '온라인', ja: 'オンライン' },
  '设备 ID:': { en: 'Device ID: ', 'zh-TW': '裝置 ID: ', ko: '기기 ID: ', ja: 'デバイス ID: ' },
  '最后同步活跃:': { en: 'Last Active: ', 'zh-TW': '最後同步活躍: ', ko: '최근 동기화 활동: ', ja: '最終同期アクティビティ: ' },
  '客户端 IP:': { en: 'Client IP: ', 'zh-TW': '用戶端 IP: ', ko: '클라이언트 IP: ', ja: 'クライアント IP: ' },
  '专属 Token:': { en: 'Dedicated Token: ', 'zh-TW': '專屬權杖: ', ko: '전용 토큰: ', ja: '専用トークン: ' },
  'Copy Token': { en: 'Copy Token', 'zh-TW': '複製權杖', ko: '토큰 복사', ja: 'トークンをコピー' },
  '📋 Copy Token': { en: '📋 Copy Token', 'zh-TW': '📋 複製權杖', ko: '📋 토큰 복사', ja: '📋 トークンをコピー' },
  'View Connection Config': { en: 'View Connection Config', 'zh-TW': '檢視連線設定', ko: '연결 설정 보기', ja: '接続設定を表示' },
  '⚡ View Connection Config': { en: '⚡ View Connection Config', 'zh-TW': '⚡ 檢視連線設定', ko: '⚡ 연결 설정 보기', ja: '⚡ 接続設定を表示' },
  '撤销令牌': { en: 'Revoke Token', 'zh-TW': '撤銷權杖', ko: '토큰 취소', ja: 'トークンを失効' },
  '🚫 撤销令牌': { en: '🚫 Revoke Token', 'zh-TW': '🚫 撤銷權杖', ko: '🚫 토큰 취소', ja: '🚫 トークンを失効' },

  // Panel 3: Global All Vaults
  '全局 Vault 状态与管理': {
    en: 'Global Vault Status & Management',
    'zh-TW': '全域 Vault 狀態與管理',
    ko: '전체 Vault 상태 및 관리',
    ja: 'グローバル Vault 状態と管理'
  },
  '📚 全局 Vault 状态与管理': {
    en: '📚 Global Vault Status & Management',
    'zh-TW': '📚 全域 Vault 狀態與管理',
    ko: '📚 전체 Vault 상태 및 관리',
    ja: '📚 グローバル Vault 状態と管理'
  },
  '全局 Vault 资源概览': {
    en: 'Global Vault Resources Overview',
    'zh-TW': '全域 Vault 資源概覽',
    ko: '전체 Vault 리소스 개요',
    ja: 'グローバル Vault リソース概要'
  },
  'VAULT NAME': { en: 'VAULT NAME', 'zh-TW': 'VAULT 名稱', ko: 'VAULT 이름', ja: 'VAULT 名' },
  'OWNER': { en: 'OWNER', 'zh-TW': '擁有者', ko: '소유자', ja: '所有者' },
  'VAULT ID': { en: 'VAULT ID', 'zh-TW': 'VAULT ID', ko: 'VAULT ID', ja: 'VAULT ID' },
  'CREATED AT': { en: 'CREATED AT', 'zh-TW': '建立時間', ko: '생성 일시', ja: '作成日時' },
  'ACTIONS': { en: 'ACTIONS', 'zh-TW': '操作', ko: '작업', ja: '操作' },
  '打开浏览': { en: 'Open & Browse', 'zh-TW': '開啟瀏覽', ko: '열기 및 둘러보기', ja: '開いて閲覧' },
  '权限设置': { en: 'Permissions', 'zh-TW': '權限設定', ko: '권한 설정', ja: '権限設定' },
  '👥 权限设置': { en: '👥 Permissions', 'zh-TW': '👥 權限設定', ko: '👥 권한 설정', ja: '👥 権限設定' },
  '暂无全局 Vault': { en: 'No global vaults found', 'zh-TW': '暫無全域 Vault', ko: '전체 Vault가 없습니다', ja: 'Vault は存在しません' },

  // Panel 4: Sponsor Page
  '支持 Nimbus Vault Sync 开源项目': {
    en: 'Support Nimbus Vault Sync Open Source Project',
    'zh-TW': '支持 Nimbus Vault Sync 開源專案',
    ko: 'Nimbus Vault Sync 오픈소스 프로젝트 후원하기',
    ja: 'Nimbus Vault Sync オープンソースプロジェクトを支援'
  },
  '请作者喝杯咖啡': { en: 'Buy Me a Coffee', 'zh-TW': '請作者喝杯咖啡', ko: '개발자에게 커피 한 잔 후원하기', ja: '開発者にコーヒーをご馳走する' },
  '☕ 请作者喝杯咖啡': { en: '☕ Buy Me a Coffee', 'zh-TW': '☕ 請作者喝杯咖啡', ko: '☕ 개발자에게 커피 한 잔 후원하기', ja: '☕ 開発者にコーヒーをご馳走する' },
  '微信打赏支持': { en: 'Support via WeChat Pay', 'zh-TW': '微信打賞支持', ko: 'WeChat Pay로 후원하기', ja: 'WeChat Pay で支援' },
  '🧧 微信打赏支持': { en: '🧧 Support via WeChat Pay', 'zh-TW': '🧧 微信打賞支持', ko: '🧧 WeChat Pay로 후원하기', ja: '🧧 WeChat Pay で支援' },
  '如果这个项目帮助到您，并且您希望它继续保持开发，请通过以下方式支持我们，感谢您对开源软件的支持！': {
    en: 'If this project helps you and you want to support continued development, consider supporting us below. Thank you for supporting open source!',
    'zh-TW': '如果這個專案幫助到您，並且您希望它繼續保持開發，請透過以下方式支持我們，感謝您對開源軟體的支持！',
    ko: '이 프로젝트가 도움이 되었고 지속적인 개발을 응원하고 싶으시다면 아래 방법을 통해 후원해 주세요. 오픈소스 생태계를 지지해 주셔서 감사합니다!',
    ja: 'このプロジェクトがお役に立ち、継続的な開発を応援していただける場合は、以下の方法でご支援をお願いいたします。オープンソースへのご支援に感謝します！'
  },
  '已支持清单 (三个月以内)': {
    en: 'Recent Supporters (Last 3 Months)',
    'zh-TW': '已支持清單 (三個月以內)',
    ko: '최근 후원자 목록 (최근 3개월)',
    ja: '支援者リスト (直近3ヶ月以内)'
  },
  '🏆 已支持清单 (三个月以内)': {
    en: '🏆 Recent Supporters (Last 3 Months)',
    'zh-TW': '🏆 已支持清單 (三個月以內)',
    ko: '🏆 최근 후원자 목록 (최근 3개월)',
    ja: '🏆 支援者リスト (直近3ヶ月以内)'
  },
  '默认排序': { en: 'Default Sort', 'zh-TW': '預設排序', ko: '기본 정렬', ja: 'デフォルト順' },
  '全部金额': { en: 'All Amounts', 'zh-TW': '全部金額', ko: '모든 금액', ja: '全額' },
  '全部时间': { en: 'All Time', 'zh-TW': '全部時間', ko: '전체 기간', ja: '全期間' },
  '感谢开发出这么好的插件，希望能越做越好！': {
    en: 'Thank you for developing such a great tool! Keep up the amazing work!',
    'zh-TW': '感謝開發出這麼好的外掛，希望能越做越好！',
    ko: '이렇게 훌륭한 플러그인을 개발해 주셔서 감사합니다. 앞으로도 파이팅!',
    ja: '素晴らしいツールの開発ありがとうございます！これからの発展を期待しています！'
  },
  '再次支持！加油！！！': {
    en: 'Supporting again! Keep going!!!',
    'zh-TW': '再次支持！加油！！！',
    ko: '다시 후원합니다! 힘내세요!!!',
    ja: '再度支援します！応援しています！！！'
  },
  '感谢你的作品，希望继续更新！谢谢': {
    en: 'Thank you for your work, hope updates continue! Thanks',
    'zh-TW': '感謝你的作品，希望繼續更新！謝謝',
    ko: '작품에 감사드리며 계속 업데이트되길 바랍니다! 감사합니다',
    ja: '素晴らしい作品をありがとうございます。継続的なアップデートを期待しています！'
  },
  '兄弟，太强了，你治好了我的选择困难症，所有终端秒级同步，还能OSS、Git备份！': {
    en: 'Incredible work! Solved all sync headaches with instant sync across all devices, plus OSS & Git backups!',
    'zh-TW': '兄弟，太強了，你治好了我的選擇困難症，所有終端秒級同步，還能OSS、Git備份！',
    ko: '정말 대단합니다! 모든 기기에서 초단위 실시간 동기화와 OSS/Git 백업까지 완벽하네요!',
    ja: '最高です！全デバイスの瞬時同期と OSS・Git バックアップで同期の悩みが完全に解消しました！'
  },
  '希望持续更新，越做越好': {
    en: 'Hope you keep updating and making it even better',
    'zh-TW': '希望持續更新，越做越好',
    ko: '지속적인 업데이트와 발전을 응원합니다',
    ja: '継続的なアップデートと更なる進化を願っています'
  },
  '非常有用，支持一下': {
    en: 'Very useful, happy to support',
    'zh-TW': '非常實用，支持一下',
    ko: '매우 유용해서 후원합니다',
    ja: 'とても役立っています。応援しています'
  },
  '感谢大神 使用了一个多星期了 很流畅': {
    en: 'Thanks a lot! Been using it for over a week, very smooth',
    'zh-TW': '感謝大神 使用了一個多星期了 很流暢',
    ko: '감사합니다! 일주일 넘게 사용 중인데 정말 부드럽고 쾌적합니다',
    ja: '感謝します！1週間以上使っていますが非常にスムーズです'
  },
  '插件非常棒，感谢开发，小小心意': {
    en: 'Plugin is fantastic, thanks for the development, a small token of gratitude',
    'zh-TW': '外掛非常棒，感謝開發，小小心意',
    ko: '플러그인이 정말 훌륭합니다. 감사한 마음을 담아 작은 성의를 보냅니다',
    ja: '素晴らしいプラグインです。開発への感謝を込めて心ばかりの支援を贈ります'
  },
  '喝咖啡': { en: 'Have a coffee', 'zh-TW': '喝咖啡', ko: '커피 한 잔', ja: 'コーヒーブレイク' }
};

// Add to PHRASE_MAP
const phraseMapStart = currentCode.indexOf('const PHRASE_MAP = {');
if (phraseMapStart !== -1) {
  const insertPos = currentCode.indexOf('{', phraseMapStart) + 1;
  let serializedPhrases = '';
  for (const [key, translations] of Object.entries(TARGET_PHRASES)) {
    serializedPhrases += `\n    ${JSON.stringify(key)}: ${JSON.stringify(translations)},`;
  }
  currentCode = currentCode.slice(0, insertPos) + serializedPhrases + currentCode.slice(insertPos);
  fs.writeFileSync(i18nPath, currentCode, 'utf8');
  console.log('Successfully injected 4 panels target phrases into PHRASE_MAP.');
} else {
  console.error('Could not locate PHRASE_MAP in i18n.js');
}
