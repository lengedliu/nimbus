const fs = require('fs');
const path = require('path');

const i18nPath = path.join(__dirname, '..', 'public', 'i18n.js');
let currentCode = fs.readFileSync(i18nPath, 'utf8');

const NEW_PHRASES = {
  "监控与管理连接至 Obsidian Nimbus 同步服务的客户端设备、在线状态、专用授权 Token 及最后活动记录": {
    en: "Monitor and manage client devices connected to Obsidian Nimbus Sync, online status, dedicated auth tokens, and last active records",
    "zh-TW": "監控與管理連接至 Obsidian Nimbus 同步服務的用戶端裝置、線上狀態、專用授權權杖及最後活動記錄",
    ko: "Obsidian Nimbus 동기화 서비스에 연결된 클라이언트 기기, 온라인 상태, 전용 인증 토큰 및 최근 활동 기록을 모니터링하고 관리합니다",
    ja: "Obsidian Nimbus 同期サービスに接続されているクライアントデバイス、オンライン状態、専用認証トークン、最終アクティビティログを監視・管理します"
  },
  "添加新用户并分配权限": {
    en: "Add New User & Assign Permissions",
    "zh-TW": "新增使用者並分配權限",
    ko: "새 사용자 추가 및 권한 할당",
    ja: "新規ユーザー追加と権限割り当て"
  },
  "➕ 添加新用户并分配权限": {
    en: "➕ Add New User & Assign Permissions",
    "zh-TW": "➕ 新增使用者並分配權限",
    ko: "➕ 새 사용자 추가 및 권한 할당",
    ja: "➕ 新規ユーザー追加と権限割り当て"
  },
  "关联并授权 Vaults 笔记库 (可选)": {
    en: "Associate & Authorize Vaults (Optional)",
    "zh-TW": "關聯並授權 Vaults 筆記庫 (可選)",
    ko: "Vault 노트 저장소 연결 및 권한 부여 (선택사항)",
    ja: "Vault ノートの関連付けと権限付与 (任意)"
  },
  "📂 关联并授权 Vaults 笔记库 (可选)": {
    en: "📂 Associate & Authorize Vaults (Optional)",
    "zh-TW": "📂 關聯並授權 Vaults 筆記庫 (可選)",
    ko: "📂 Vault 노트 저장소 연결 및 권한 부여 (선택사항)",
    ja: "📂 Vault ノートの関連付けと権限付与 (任意)"
  },
  "关联并授权 Vaults 笔记库": {
    en: "Associate & Authorize Vaults",
    "zh-TW": "關聯並授權 Vaults 筆記庫",
    ko: "Vault 노트 저장소 연결 및 권한 부여",
    ja: "Vault ノートの関連付けと権限付与"
  },
  "监控审计所有客户端在所有 Vault 上的实时同步活动记录": {
    en: "Monitor and audit real-time synchronization activity logs across all clients and vaults",
    "zh-TW": "監控審計所有用戶端在所有 Vault 上的即時同步活動記錄",
    ko: "모든 클라이언트와 Vault에서 발생하는 실시간 동기화 활동 기록 모니터링 및 감사",
    ja: "すべてのクライアントおよび全 Vault におけるリアルタイム同期アクティビティの監視・監査"
  }
};

const phraseMapStart = currentCode.indexOf('const PHRASE_MAP = {');
if (phraseMapStart !== -1) {
  const insertPos = currentCode.indexOf('{', phraseMapStart) + 1;
  let serializedPhrases = '';
  for (const [key, translations] of Object.entries(NEW_PHRASES)) {
    serializedPhrases += `\n    ${JSON.stringify(key)}: ${JSON.stringify(translations)},`;
  }
  currentCode = currentCode.slice(0, insertPos) + serializedPhrases + currentCode.slice(insertPos);
  fs.writeFileSync(i18nPath, currentCode, 'utf8');
  console.log('Successfully injected phrases into PHRASE_MAP.');
} else {
  console.error('Could not locate PHRASE_MAP in i18n.js');
}
