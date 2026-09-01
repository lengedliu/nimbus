const fs = require('fs');
const path = require('path');

const i18nPath = path.join(__dirname, '..', 'public', 'i18n.js');
let currentCode = fs.readFileSync(i18nPath, 'utf8');

const REMAINING_PHRASES = {
  // Vault Overview & Detail Header
  '从左侧选择一个 vault': { en: 'Select a vault from the left sidebar', 'zh-TW': '從左側選擇一個 vault', ko: '왼쪽 사이드바에서 Vault를 선택하세요', ja: '左側のサイドバーから Vault を選択してください' },
  '统计数据加载中…': { en: 'Loading stats…', 'zh-TW': '統計資料載入中…', ko: '통계 불러오는 중…', ja: '統計を読み込み中…' },
  '⚡ 实时 WebSocket 双向同步': { en: '⚡ Real-time WebSocket Two-Way Sync', 'zh-TW': '⚡ 即時 WebSocket 雙向同步', ko: '⚡ 실시간 WebSocket 양방향 동기화', ja: '⚡ リアルタイム WebSocket 双方向同期' },
  '实时 WebSocket 同步中': { en: 'WebSocket Sync Active', 'zh-TW': '即時 WebSocket 同步中', ko: '실시간 WebSocket 동기화 중', ja: 'WebSocket 同期中' },
  '实时追踪已接入此 Vault 的 Obsidian 客户端与编辑节点': {
    en: 'Real-time tracking of connected Obsidian clients and sync nodes for this vault',
    'zh-TW': '即時追蹤已接入此 Vault 的 Obsidian 用戶端與編輯節點',
    ko: '이 Vault에 연결된 Obsidian 클라이언트 및 편집 노드를 실시간 추적합니다',
    ja: 'この Vault に接続されている Obsidian クライアントと同期ノードをリアルタイム監視'
  },
  '个标准端点': { en: 'Standard Endpoints', 'zh-TW': '個標準端點', ko: '개 표준 엔드포인트', ja: '個の標準エンドポイント' },
  '调用指引': { en: 'API Usage Guide', 'zh-TW': '呼叫指引', ko: '호출 안내', ja: '呼び出しガイド' },
  '：所有接口请求基础地址为': { en: ': Base URL for all API requests is ', 'zh-TW': '：所有介面請求基礎位址為 ', ko: ': 모든 API 요청의 기본 주소는 ', ja: ': すべての API リクエストのベース URL は ' },
  '。需要认证的接口请在 Header 中添加': { en: '. For authenticated endpoints, include Header: ', 'zh-TW': '。需要認證的介面請在 Header 中加入 ', ko: '. 인증이 필요한 API는 헤더에 다음을 추가하세요: ', ja: '。認証が必要な API はヘッダーに次を追加してください: ' },

  // Shares Panel & Expirations
  '加载分享列表中…': { en: 'Loading shares list…', 'zh-TW': '載入分享清單中…', ko: '공유 목록 불러오는 중…', ja: '共有一覧を読み込み中…' },
  '🔗 已公开分享的笔记': { en: '🔗 Publicly Shared Notes', 'zh-TW': '🔗 已公開分享的筆記', ko: '🔗 공개 공유된 노트', ja: '🔗 公開共有ノート' },
  '1 天后过期': { en: 'Expires in 1 day', 'zh-TW': '1 天後過期', ko: '1일 후 만료', ja: '1日後に期限切れ' },
  '7 天后过期': { en: 'Expires in 7 days', 'zh-TW': '7 天後過期', ko: '7일 후 만료', ja: '7日後に期限切れ' },
  '30 天后过期': { en: 'Expires in 30 days', 'zh-TW': '30 天後過期', ko: '30일 후 만료', ja: '30日後に期限切れ' },

  // Vault Members & Permissions
  '加载成员与权限信息中…': { en: 'Loading members & permissions…', 'zh-TW': '載入成員與權限資訊中…', ko: '멤버 및 권한 정보 불러오는 중…', ja: 'メンバーと権限情報を読み込み中…' },
  '笔记库权限与成员管理': { en: 'Vault Members & Access Control', 'zh-TW': '筆記庫權限與成員管理', ko: 'Vault 멤버 및 권한 관리', ja: 'Vault メンバーと権限管理' },
  '· 创建者:': { en: '· Creator:', 'zh-TW': '· 建立者:', ko: '· 생성자:', ja: '· 作成者:' },
  '您是所有者': { en: 'You are the Owner', 'zh-TW': '您是所有者', ko: '귀하는 소유자입니다', ja: 'あなたはこの Vault の所有者です' },
  '选择用户': { en: 'Select User', 'zh-TW': '選擇使用者', ko: '사용자 선택', ja: 'ユーザーを選択' },
  '-- 请选择要授权的用户 --': { en: '-- Select user to grant access --', 'zh-TW': '-- 請選擇要授權的使用者 --', ko: '-- 권한을 부여할 사용자를 선택하세요 --', ja: '-- 権限を付与するユーザーを選択 --' },
  '赋予权限': { en: 'Grant Permission', 'zh-TW': '賦予權限', ko: '권한 부여', ja: '権限を付与' },
  '读写 (Read & Write) - 允许同步修改': { en: 'Read & Write - Allows editing & syncing', 'zh-TW': '讀寫 (Read & Write) - 允許同步修改', ko: '읽기/쓰기 (Read & Write) - 수정 및 동기화 허용', ja: '読み書き (Read & Write) - 編集と同期を許可' },
  '只读 (Read Only) - 仅允许拉取与查看': { en: 'Read Only - View & pull only', 'zh-TW': '唯讀 (Read Only) - 僅允許拉取與檢視', ko: '읽기 전용 (Read Only) - 조회 및 풀 전용', ja: '読み取り専用 (Read Only) - 閲覧と取得のみ' },
  '＋ 确认授权': { en: '＋ Grant Access', 'zh-TW': '＋ 確認授權', ko: '＋ 권한 부여 확인', ja: '＋ 権限を付与' },
  '所有者享有最高管理与删除权限': { en: 'Owner holds full administrative and deletion privileges', 'zh-TW': '所有者享有最高管理與刪除權限', ko: '소유자는 최고 관리 및 삭제 권한을 가집니다', ja: '所有者は最高管理および削除権限を保持します' },
  'Vault 权限级别': { en: 'Vault Permission Level', 'zh-TW': 'Vault 權限級別', ko: 'Vault 권한 수준', ja: 'Vault 権限レベル' },
  '授权时间': { en: 'Granted At', 'zh-TW': '授權時間', ko: '권한 부여 일시', ja: '付与日時' },
  '所有者 (Owner)': { en: 'Owner (Owner)', 'zh-TW': '所有者 (Owner)', ko: '소유자 (Owner)', ja: '所有者 (Owner)' },
  '全部权限 (所有者)': { en: 'Full Access (Owner)', 'zh-TW': '全部權限 (所有者)', ko: '모든 권한 (소유자)', ja: '全権限 (所有者)' },
  '创建者 (不可撤销)': { en: 'Creator (Irrevocable)', 'zh-TW': '建立者 (不可撤銷)', ko: '생성자 (취소 불가)', ja: '作成者 (失効不可)' },
  '✏️ 读写 (Read-Write)': { en: '✏️ Read-Write', 'zh-TW': '✏️ 讀寫 (Read-Write)', ko: '✏️ 읽기-쓰기', ja: '✏️ 読み書き' },
  '👁️ 只读 (Read-Only)': { en: '👁️ Read-Only', 'zh-TW': '👁️ 唯讀 (Read-Only)', ko: '👁️ 읽기 전용', ja: '👁️ 読み取り専用' },
  '✏️ 读写 (可同步修改)': { en: '✏️ Read & Write (Sync Allowed)', 'zh-TW': '✏️ 讀寫 (可同步修改)', ko: '✏️ 읽기 및 쓰기 (동기화 가능)', ja: '✏️ 読み書き (同期可能)' },
  '👁️ 只读 (仅查看拉取)': { en: '👁️ Read Only (Pull Only)', 'zh-TW': '👁️ 唯讀 (僅檢視拉取)', ko: '👁️ 읽기 전용 (조회 전용)', ja: '👁️ 読み取り専用 (閲覧のみ)' },
  '移除权限': { en: 'Revoke Access', 'zh-TW': '移除權限', ko: '권한 회수', ja: '権限を削除' },

  // Sync Rules, Trash & Conflicts
  '加载同步规则中…': { en: 'Loading sync rules…', 'zh-TW': '載入同步規則中…', ko: '동기화 규칙 불러오는 중…', ja: '同期ルールを読み込み中…' },
  '加载回收站中…': { en: 'Loading trash…', 'zh-TW': '載入資源回收筒中…', ko: '휴지통 불러오는 중…', ja: 'ごみ箱を読み込み中…' },
  '检测冲突文件中…': { en: 'Checking file conflicts…', 'zh-TW': '檢測衝突檔案中…', ko: '파일 충돌 검사 중…', ja: 'ファイル競合をチェック中…' },
  '⚠️ 冲突源文件:': { en: '⚠️ Original File:', 'zh-TW': '⚠️ 衝突來源檔案:', ko: '⚠️ 충돌 원본 파일:', ja: '⚠️ 競合元ファイル:' },
  '冲突副本:': { en: 'Conflict Copy:', 'zh-TW': '衝突副本:', ko: '충돌 복사본:', ja: '競合コピー:' },
  '冲突时间:': { en: 'Conflict Time:', 'zh-TW': '衝突時間:', ko: '충돌 발생 시간:', ja: '競合発生日時:' },
  '产生冲突的客户端:': { en: 'Conflicting Client:', 'zh-TW': '產生衝突的用戶端:', ko: '충돌 발생 클라이언트:', ja: '競合元クライアント:' },
  '差异对比 (Diff)': { en: 'Diff Comparison', 'zh-TW': '差異對比 (Diff)', ko: '차이점 비교 (Diff)', ja: '差分比較 (Diff)' },
  '服务端最新内容': { en: 'Server Version', 'zh-TW': '伺服端最新內容', ko: '서버 최신 버전', ja: 'サーバー側最新内容' },
  '客户端修改副本': { en: 'Client Conflict Version', 'zh-TW': '用戶端修改副本', ko: '클라이언트 수정본', ja: 'クライアント側変更コピー' },

  // Webhooks Panel
  '告警与事件通知 (Webhooks)': { en: 'Webhooks & Alerts', 'zh-TW': '告警與事件通知 (Webhooks)', ko: '웹훅 및 이벤트 알림', ja: 'Webhook とイベント通知' },
  '配置 Webhook 接收笔记同步、冲突、成员变动与系统异常实时通知': {
    en: 'Configure webhooks for note sync events, conflicts, member updates, and alerts',
    'zh-TW': '設定 Webhook 接收筆記同步、衝突、成員變動與系統異常即時通知',
    ko: '노트 동기화, 충돌, 멤버 변경 및 시스템 알림을 수신할 웹훅을 설정합니다',
    ja: 'ノート同期、競合、メンバー変更およびシステム警告を受信する Webhook を設定'
  },
  '➕ 添加 Webhook 订阅': { en: '➕ Add Webhook', 'zh-TW': '➕ 加入 Webhook 訂閱', ko: '➕ 새 웹훅 추가', ja: '➕ Webhook を追加' },
  'Webhook 名称 (如 钉钉 / 飞书 / Slack / 自建服务)': {
    en: 'Webhook Name (e.g. Slack / Discord / DingTalk / Custom)',
    'zh-TW': 'Webhook 名稱 (如 釘釘 / 飛書 / Slack / 自建服務)',
    ko: '웹훅 이름 (예: Slack / Discord / 잔디 / 자체 서버)',
    ja: 'Webhook 名 (例: Slack / Discord / Teams / 自作サービス)'
  },
  'Webhook 接收地址 (Target URL)': { en: 'Webhook Target URL', 'zh-TW': 'Webhook 接收位址 (Target URL)', ko: '웹훅 수신 주소 (Target URL)', ja: 'Webhook 送信先 URL (Target URL)' },
  '签名密钥 (Secret Key, 选填)': { en: 'Secret Key (Optional)', 'zh-TW': '簽章金鑰 (Secret Key, 選填)', ko: '서명 비밀키 (Secret Key, 선택사항)', ja: '署名シークレット (Secret Key, 任意)' },
  '订阅事件': { en: 'Subscribed Events', 'zh-TW': '訂閱事件', ko: '구독 이벤트', ja: '購読イベント' },
  '测试发送': { en: 'Test Delivery', 'zh-TW': '測試發送', ko: '테스트 전송', ja: 'テスト送信' },
  '删除订阅': { en: 'Delete Webhook', 'zh-TW': '刪除訂閱', ko: '웹훅 삭제', ja: 'Webhook を削除' },

  // User Management
  '用户账户与权限管理': { en: 'User Management & Permissions', 'zh-TW': '使用者帳戶與權限管理', ko: '사용자 계정 및 권한 관리', ja: 'ユーザーアカウントと権限管理' },
  '管理系统所有注册用户、角色分配与账号状态': {
    en: 'Manage registered users, role assignments, and account statuses',
    'zh-TW': '管理系統所有註冊使用者、角色分配與帳號狀態',
    ko: '모든 등록된 사용자, 역할 할당 및 계정 상태를 관리합니다',
    ja: '登録ユーザー、役割の割り当ておよびアカウント状態を管理'
  },
  '➕ 创建新用户': { en: '➕ Create New User', 'zh-TW': '➕ 建立新使用者', ko: '➕ 새 사용자 생성', ja: '➕ 新規ユーザーを作成' },
  '用户名 (Username)': { en: 'Username', 'zh-TW': '使用者名稱 (Username)', ko: '사용자 이름 (Username)', ja: 'ユーザー名 (Username)' },
  '登录密码 (Password)': { en: 'Password', 'zh-TW': '登入密碼 (Password)', ko: '비밀번호 (Password)', ja: 'パスワード (Password)' },
  '系统角色 (Role)': { en: 'System Role', 'zh-TW': '系統角色 (Role)', ko: '시스템 역할 (Role)', ja: 'システム権限 (Role)' },
  '重置密码': { en: 'Reset Password', 'zh-TW': '重設密碼', ko: '비밀번호 재설정', ja: 'パスワードをリセット' },
  '禁用用户': { en: 'Disable User', 'zh-TW': '停用使用者', ko: '사용자 비활성화', ja: 'ユーザーを無効化' },
  '启用用户': { en: 'Enable User', 'zh-TW': '啟用使用者', ko: '사용자 활성화', ja: 'ユーザーを有効化' },
  '删除用户': { en: 'Delete User', 'zh-TW': '刪除使用者', ko: '사용자 삭제', ja: 'ユーザーを削除' },

  // All Vaults Admin
  '全局 Vault 资源概览': { en: 'Global Vaults Overview', 'zh-TW': '全域 Vault 資源概覽', ko: '전체 Vault 자원 개요', ja: 'グローバル Vault 概要' },
  '查看与管理服务器上托管的所有 Vault 库及空间占用': {
    en: 'View and manage all hosted vaults and storage consumption across the server',
    'zh-TW': '檢視與管理伺服器上託管的所有 Vault 庫及空間佔用',
    ko: '서버에 호스팅된 모든 Vault 및 스토리지 사용량을 확인하고 관리합니다',
    ja: 'サーバー上にホストされているすべての Vault とストレージ使用状況を管理'
  },
  'Vault 名称': { en: 'Vault Name', 'zh-TW': 'Vault 名稱', ko: 'Vault 이름', ja: 'Vault 名' },
  '文件数': { en: 'Files', 'zh-TW': '檔案數', ko: '파일 수', ja: 'ファイル数' },
  '空间占用': { en: 'Storage Size', 'zh-TW': '空間佔用', ko: '저장 공간', ja: '使用容量' },
  '所有者': { en: 'Owner', 'zh-TW': '所有者', ko: '소유자', ja: '所有者' },
  '操作': { en: 'Actions', 'zh-TW': '操作', ko: '작업', ja: '操作' },

  // Sponsor & Support Panel
  '支持 Nimbus Vault Sync 开源项目': {
    en: 'Support Nimbus Vault Sync Open Source Project',
    'zh-TW': '支持 Nimbus Vault Sync 開源專案',
    ko: 'Nimbus Vault Sync 오픈소스 프로젝트 후원',
    ja: 'Nimbus Vault Sync オープンソースプロジェクトを支援'
  },
  '您的支持与赞助是项目持续迭代与高质量维护的最大动力 ❤️': {
    en: 'Your generous support and sponsorship empower continuous maintenance and improvements ❤️',
    'zh-TW': '您的支持與贊助是專案持續迭代與高品質維護的最大動力 ❤️',
    ko: '여러분의 후원과 지원은 프로젝트의 지속적인 개발과 유지보수의 큰 힘이 됩니다 ❤️',
    ja: '皆様のご支援とスポンサーシップが、継続的な開発と高品質な保守の原動力です ❤️'
  },
  '☕ 请作者喝杯咖啡 (¥15)': { en: '☕ Buy Me a Coffee (¥15)', 'zh-TW': '☕ 請作者喝杯咖啡 (¥15)', ko: '☕ 커피 한 잔 후원 (¥15)', ja: '☕ コーヒーを奢る (¥15)' },
  '🌟 进阶开发者赞助 (¥50)': { en: '🌟 Pro Backer (¥50)', 'zh-TW': '🌟 進階開發者贊助 (¥50)', ko: '🌟 프로 후원자 (¥50)', ja: '🌟 プロスポンサー (¥50)' },
  '🚀 企业与商业支持 (¥200)': { en: '🚀 Enterprise Backer (¥200)', 'zh-TW': '🚀 企業與商業支持 (¥200)', ko: '🚀 엔터프라이즈 후원 (¥200)', ja: '🚀 エンタープライズ支援 (¥200)' },
  '微信支付': { en: 'WeChat Pay', 'zh-TW': '微信支付', ko: 'WeChat Pay', ja: 'WeChat Pay' },
  '支付宝': { en: 'Alipay', 'zh-TW': '支付寶', ko: 'Alipay', ja: 'Alipay' },
  'GitHub Sponsors': { en: 'GitHub Sponsors', 'zh-TW': 'GitHub Sponsors', ko: 'GitHub Sponsors', ja: 'GitHub Sponsors' },
  '🙏 感谢每一位贡献者与支持者': { en: '🙏 Special Thanks to All Contributors & Backers', 'zh-TW': '🙏 感謝每一位貢獻者與支持者', ko: '🙏 모든 기여자 및 후원자 여러분께 감사드립니다', ja: '🙏 すべての貢献者とサポーターの皆様に感謝いたします' }
};

const phraseMapStart = currentCode.indexOf('const PHRASE_MAP = {');
if (phraseMapStart !== -1) {
  const insertPos = currentCode.indexOf('{', phraseMapStart) + 1;
  let serializedPhrases = '';
  for (const [key, translations] of Object.entries(REMAINING_PHRASES)) {
    serializedPhrases += `\n    ${JSON.stringify(key)}: ${JSON.stringify(translations)},`;
  }
  currentCode = currentCode.slice(0, insertPos) + serializedPhrases + currentCode.slice(insertPos);
  fs.writeFileSync(i18nPath, currentCode, 'utf8');
  console.log('Successfully injected second wave of remaining functional detail translations.');
}
