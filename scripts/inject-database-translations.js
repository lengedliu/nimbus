const fs = require('fs');
const path = require('path');

const i18nPath = path.join(__dirname, '..', 'public', 'i18n.js');
let currentCode = fs.readFileSync(i18nPath, 'utf8');

// Complete professional dictionary for Database Panel and all System Admin Pages
const DATABASE_AND_SYSTEM_ADMIN_PHRASES = {
  // Database Management Header & Status
  '多数据库配置与管理': {
    en: 'Multi-Database Configuration & Management',
    'zh-TW': '多資料庫設定與管理',
    ko: '다중 데이터베이스 구성 및 관리',
    ja: 'マルチデータベース構成と管理'
  },
  '🗄️ 多数据库配置与管理': {
    en: '🗄️ Multi-Database Configuration & Management',
    'zh-TW': '🗄️ 多資料庫設定與管理',
    ko: '🗄️ 다중 데이터베이스 구성 및 관리',
    ja: '🗄️ マルチデータベース構成と管理'
  },
  '加载数据库配置中…': {
    en: 'Loading database configuration…',
    'zh-TW': '載入資料庫設定中…',
    ko: '데이터베이스 구성 불러오는 중…',
    ja: 'データベース設定を読み込み中…'
  },
  '当前激活引擎': {
    en: 'Active Engine',
    'zh-TW': '目前啟用引擎',
    ko: '현재 활성 엔진',
    ja: '稼働中エンジン'
  },
  '运行中': {
    en: 'Running',
    'zh-TW': '運作中',
    ko: '실행 중',
    ja: '稼働中'
  },
  '支持热切换至 SQLite / PostgreSQL / MySQL，数据可一键迁移。': {
    en: 'Supports hot switching to SQLite / PostgreSQL / MySQL with one-click data migration.',
    'zh-TW': '支援熱切換至 SQLite / PostgreSQL / MySQL，資料可一鍵遷移。',
    ko: 'SQLite / PostgreSQL / MySQL로 핫 스위칭 및 원클릭 데이터 마이그레이션을 지원합니다.',
    ja: 'SQLite / PostgreSQL / MySQL へのホット切り替えとワンクリックデータ移行に対応。'
  },
  '已持久化实体统计': {
    en: 'Persisted Entity Statistics',
    'zh-TW': '已持久化實體統計',
    ko: '영구 저장된 엔티티 통계',
    ja: '永続化エンティティ統計'
  },
  '用户': { en: 'Users', 'zh-TW': '使用者', ko: '사용자', ja: 'ユーザー' },
  'Vaults': { en: 'Vaults', 'zh-TW': 'Vaults', ko: 'Vaults', ja: 'Vaults' },
  '分享链接': { en: 'Share Links', 'zh-TW': '分享連結', ko: '공유 링크', ja: '共有リンク' },

  // Database Engine Switcher Buttons
  '切换或配置数据库引擎': {
    en: 'Switch or Configure Database Engine',
    'zh-TW': '切換或設定資料庫引擎',
    ko: '데이터베이스 엔진 전환 및 구성',
    ja: 'データベースエンジンの切り替えと設定'
  },
  'SQLite (单文件极简推荐)': {
    en: 'SQLite (Single File, Recommended)',
    'zh-TW': 'SQLite (單一檔案極簡推薦)',
    ko: 'SQLite (단일 파일, 가볍고 간편함 추천)',
    ja: 'SQLite (単一ファイル・推奨)'
  },
  'PostgreSQL (企业级关系数据库)': {
    en: 'PostgreSQL (Enterprise Relational DB)',
    'zh-TW': 'PostgreSQL (企業級關聯式資料庫)',
    ko: 'PostgreSQL (엔터프라이즈 관계형 데이터베이스)',
    ja: 'PostgreSQL (エンタープライズ RDBMS)'
  },
  'MySQL (标准生产数据库)': {
    en: 'MySQL (Standard Production DB)',
    'zh-TW': 'MySQL (標準生產資料庫)',
    ko: 'MySQL (표준 프로덕션 데이터베이스)',
    ja: 'MySQL (標準プロダクション DB)'
  },
  'JSON 文件 (基础轻量)': {
    en: 'JSON Files (Basic & Lightweight)',
    'zh-TW': 'JSON 檔案 (基礎輕量)',
    ko: 'JSON 파일 (기본 경량)',
    ja: 'JSON ファイル (基本・軽量)'
  },

  // JSON Mode Form
  'JSON 本地文件存储': {
    en: 'JSON Local File Storage',
    'zh-TW': 'JSON 本機檔案儲存',
    ko: 'JSON 로컬 파일 스토리지',
    ja: 'JSON ローカルファイルストレージ'
  },
  '使用 data/users.json 和 data/vaults.json 保存用户与配置。无需独立数据库，适合轻量单机运行。': {
    en: 'Uses data/users.json and data/vaults.json to store users and configurations. No external database needed, ideal for lightweight standalone operation.',
    'zh-TW': '使用 data/users.json 和 data/vaults.json 儲存使用者與設定。無需獨立資料庫，適合輕量單機運作。',
    ko: 'data/users.json 및 data/vaults.json을 사용하여 사용자와 설정을 저장합니다. 별도 DB가 필요 없어 단독 경량 실행에 적합합니다.',
    ja: 'data/users.json と data/vaults.json を使用してユーザーと設定を保存します。外部 DB 不要で軽量なスタンドアロン運用に適しています。'
  },
  '应用 JSON 文件模式': {
    en: 'Apply JSON File Mode',
    'zh-TW': '套用 JSON 檔案模式',
    ko: 'JSON 파일 모드 적용',
    ja: 'JSON ファイルモードを適用'
  },

  // SQLite Form
  'SQLite 文件配置': {
    en: 'SQLite Configuration',
    'zh-TW': 'SQLite 檔案設定',
    ko: 'SQLite 파일 설정',
    ja: 'SQLite 構成'
  },
  'SQLite 数据库文件存储路径': {
    en: 'SQLite Database File Path',
    'zh-TW': 'SQLite 資料庫檔案儲存路徑',
    ko: 'SQLite 데이터베이스 파일 저장 경로',
    ja: 'SQLite データベースファイル保存パス'
  },
  '同时将现有用户与配置数据迁移到新数据库': {
    en: 'Simultaneously migrate existing users and configuration data to the new database',
    'zh-TW': '同時將現有使用者與設定資料遷移到新資料庫',
    ko: '기존 사용자와 설정 데이터를 새 데이터베이스로 함께 마이그레이션',
    ja: '既存のユーザーおよび設定データを新規データベースへ同時に移行'
  },
  '测试连接': { en: 'Test Connection', 'zh-TW': '測試連線', ko: '연결 테스트', ja: '接続テスト' },
  '保存并应用 SQLite 引擎': {
    en: 'Save & Apply SQLite Engine',
    'zh-TW': '儲存並套用 SQLite 引擎',
    ko: 'SQLite 엔진 저장 및 적용',
    ja: 'SQLite エンジンを保存して適用'
  },

  // PostgreSQL Form
  'PostgreSQL 连接配置': {
    en: 'PostgreSQL Connection Configuration',
    'zh-TW': 'PostgreSQL 連線設定',
    ko: 'PostgreSQL 연결 구성',
    ja: 'PostgreSQL 接続構成'
  },
  'Host 主机': { en: 'Host', 'zh-TW': 'Host 主機', ko: '호스트 (Host)', ja: 'ホスト (Host)' },
  'Port 端口': { en: 'Port', 'zh-TW': 'Port 連接埠', ko: '포트 (Port)', ja: 'ポート (Port)' },
  'Database 数据库名': { en: 'Database Name', 'zh-TW': 'Database 資料庫名稱', ko: '데이터베이스 이름', ja: 'データベース名' },
  'User 用户名': { en: 'Username', 'zh-TW': 'User 使用者名稱', ko: '사용자 이름 (User)', ja: 'ユーザー名 (User)' },
  'Password 密码': { en: 'Password', 'zh-TW': 'Password 密碼', ko: '비밀번호 (Password)', ja: 'パスワード (Password)' },
  '留空则无密码或沿用现有密码': {
    en: 'Leave blank for no password or to keep existing password',
    'zh-TW': '留空則無密碼或沿用現有密碼',
    ko: '비워두면 비밀번호 없음 또는 기존 비밀번호 유지',
    ja: '空白の場合はパスワードなし、または既存のパスワードを維持'
  },
  '保存并应用 PostgreSQL 引擎': {
    en: 'Save & Apply PostgreSQL Engine',
    'zh-TW': '儲存並套用 PostgreSQL 引擎',
    ko: 'PostgreSQL 엔진 저장 및 적용',
    ja: 'PostgreSQL エンジンを保存して適用'
  },

  // MySQL Form
  'MySQL 连接配置': {
    en: 'MySQL Connection Configuration',
    'zh-TW': 'MySQL 連線設定',
    ko: 'MySQL 연결 구성',
    ja: 'MySQL 接続構成'
  },
  '保存并应用 MySQL 引擎': {
    en: 'Save & Apply MySQL Engine',
    'zh-TW': '儲存並套用 MySQL 引擎',
    ko: 'MySQL 엔진 저장 및 적용',
    ja: 'MySQL エンジンを保存して適用'
  },

  // Actions & Feedbacks
  '正在测试连接…': { en: 'Testing connection…', 'zh-TW': '正在測試連線…', ko: '연결 테스트 중…', ja: '接続をテスト中…' },
  '连接测试成功': { en: 'Connection test succeeded', 'zh-TW': '連線測試成功', ko: '연결 테스트 성공', ja: '接続テストに成功しました' },
  '连接失败:': { en: 'Connection failed:', 'zh-TW': '連線失敗:', ko: '연결 실패:', ja: '接続失敗:' },
  '正在应用数据库设置并初始化表结构…': {
    en: 'Applying database settings and initializing schemas…',
    'zh-TW': '正在套用資料庫設定並初始化資料表結構…',
    ko: '데이터베이스 설정 적용 및 테이블 스키마 초기화 중…',
    ja: 'データベース設定を適用しスキーマを初期化中…'
  },
  '数据库切换成功': { en: 'Database engine switched successfully', 'zh-TW': '資料庫切換成功', ko: '데이터베이스 전환 성공', ja: 'データベースの切り替えに成功しました' },

  // Architecture Documentation Section
  '📖 数据库支持说明': {
    en: '📖 Database Engine Overview & Notes',
    'zh-TW': '📖 資料庫支援說明',
    ko: '📖 데이터베이스 지원 안내',
    ja: '📖 データベースサポート仕様'
  },
  'Nimbus 现已内置对': {
    en: 'Nimbus now includes built-in abstraction support for ',
    'zh-TW': 'Nimbus 現已內建對 ',
    ko: 'Nimbus는 ',
    ja: 'Nimbus は '
  },
  '三种主流数据库及本地 JSON 存储引擎的完整抽象支持：': {
    en: 'three mainstream databases and local JSON storage engines:',
    'zh-TW': '三種主流資料庫及本機 JSON 儲存引擎的完整抽象支援：',
    ko: '3대 주요 데이터베이스 및 로컬 JSON 스토리지 엔진을 완벽히 지원합니다:',
    ja: 'の主要3種データベースおよびローカル JSON ストレージエンジンを標準サポートしています:'
  },
  '用户数据 (Users)': { en: 'User Data (Users)', 'zh-TW': '使用者資料 (Users)', ko: '사용자 데이터 (Users)', ja: 'ユーザーデータ (Users)' },
  '：账号、权限、密码哈希与创建时间均完整保存在选定数据库中。': {
    en: ': Accounts, roles, password hashes, and timestamps are fully stored in the selected database.',
    'zh-TW': '：帳號、權限、密碼雜湊與建立時間均完整儲存在選定資料庫中。',
    ko: ': 계정, 권한, 비밀번호 해시 및 생성 일시가 선택한 데이터베이스에 안전하게 저장됩니다.',
    ja: ': アカウント、権限、パスワードハッシュ、作成日時は選択した DB に保存されます。'
  },
  '配置数据 (Sync Rules & Metadata)': {
    en: 'Configuration Data (Sync Rules & Metadata)',
    'zh-TW': '設定資料 (Sync Rules & Metadata)',
    ko: '설정 데이터 (Sync Rules & Metadata)',
    ja: '構成データ (Sync Rules & Metadata)'
  },
  '：黑名单规则、同步策略、分片配置自动持久化到数据库。': {
    en: ': Ignore patterns, sync policies, and chunk configurations are automatically persisted.',
    'zh-TW': '：黑名單規則、同步策略、分片設定自動持久化到資料庫。',
    ko: ': 무시 패턴, 동기화 정책, 청크 분할 설정이 자동으로 데이터베이스에 유지됩니다.',
    ja: ': 除外ルール、同期ポリシー、チャンク構成が自動的にデータベースへ永続化されます。'
  },
  'Vault 与外链元数据 (Vaults & Shares)': {
    en: 'Vault & Share Metadata (Vaults & Shares)',
    'zh-TW': 'Vault 與外鏈元資料 (Vaults & Shares)',
    ko: 'Vault 및 공유 메타데이터 (Vaults & Shares)',
    ja: 'Vault および共有メタデータ (Vaults & Shares)'
  },
  '：Vault 归属权、公开分享链接与访问密码完整同步。': {
    en: ': Vault ownership, public share links, and access passwords are fully synchronized.',
    'zh-TW': '：Vault 歸屬權、公開分享連結與存取密碼完整同步。',
    ko: ': Vault 소유권, 공개 공유 링크 및 접근 비밀번호가 완벽하게 동기화됩니다.',
    ja: ': Vault 所有権、公開共有リンク、アクセスパスワードが完全に同期されます。'
  },
  '环境变量支持': {
    en: 'Environment Variable Support',
    'zh-TW': '環境變數支援',
    ko: '환경 변수 지원',
    ja: '環境変数サポート'
  },
  '：也可直接在': {
    en: ': You can also configure directly in ',
    'zh-TW': '：也可直接在 ',
    ko: ': 또한 ',
    ja: ': または '
  },
  '中配置': {
    en: ' with ',
    'zh-TW': ' 中設定 ',
    ko: ' 파일에 ',
    ja: ' に '
  },
  '启动自动连接。': {
    en: ' to auto-connect on server startup.',
    'zh-TW': ' 啟動自動連線。',
    ko: '를 구성하여 서버 시작 시 자동 연결할 수 있습니다.',
    ja: ' を設定して起動時に自動接続できます。'
  }
};

const phraseMapStart = currentCode.indexOf('const PHRASE_MAP = {');
if (phraseMapStart !== -1) {
  const insertPos = currentCode.indexOf('{', phraseMapStart) + 1;
  let serializedPhrases = '';
  for (const [key, translations] of Object.entries(DATABASE_AND_SYSTEM_ADMIN_PHRASES)) {
    serializedPhrases += `\n    ${JSON.stringify(key)}: ${JSON.stringify(translations)},`;
  }
  currentCode = currentCode.slice(0, insertPos) + serializedPhrases + currentCode.slice(insertPos);
  fs.writeFileSync(i18nPath, currentCode, 'utf8');
  console.log('Successfully injected Database panel translations into PHRASE_MAP.');
} else {
  console.error('Could not locate PHRASE_MAP in i18n.js');
}
