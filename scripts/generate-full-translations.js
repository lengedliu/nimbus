const fs = require('fs');
const path = require('path');

const i18nPath = path.join(__dirname, '..', 'public', 'i18n.js');
let currentCode = fs.readFileSync(i18nPath, 'utf8');

// Complete professional translation dictionaries for all functional detail pages
const ALL_FEATURE_DETAIL_PHRASES = {
  // Settings Top & Navigation
  '设置 (Nimbus Vault Sync)': {
    en: 'Settings (Nimbus Vault Sync)',
    'zh-TW': '設定 (Nimbus Vault Sync)',
    ko: '설정 (Nimbus Vault Sync)',
    ja: '設定 (Nimbus Vault Sync)'
  },
  '配置 Obsidian 客户端同步参数、实时冲突裁决机制、多端专属令牌与数据保留策略': {
    en: 'Configure Obsidian client sync parameters, real-time conflict arbitration, dedicated device tokens, and data retention policies',
    'zh-TW': '設定 Obsidian 用戶端同步參數、即時衝突裁決機制、多端專屬權杖與資料保留策略',
    ko: 'Obsidian 클라이언트 동기화 매개변수, 실시간 충돌 중재 메커니즘, 전용 기기 토큰 및 데이터 보존 정책 설정',
    ja: 'Obsidian クライアント同期設定、リアルタイム競合調停、端末専用トークンおよびデータ保持ポリシーを設定'
  },
  '👑 系统管理员': { en: '👑 System Administrator', 'zh-TW': '👑 系統管理員', ko: '👑 시스템 관리자', ja: '👑 システム管理者' },
  '👤 普通用户': { en: '👤 Standard User', 'zh-TW': '👤 一般使用者', ko: '👤 일반 사용자', ja: '👤 一般ユーザー' },
  '⚡ Obsidian 插件配置': { en: '⚡ Obsidian Plugin Config', 'zh-TW': '⚡ Obsidian 外掛設定', ko: '⚡ Obsidian 플러그인 설정', ja: '⚡ Obsidian プラグイン設定' },
  '🔄 同步策略与冲突处理': { en: '🔄 Sync & Conflicts', 'zh-TW': '🔄 同步策略與衝突處理', ko: '🔄 동기화 정책 및 충돌 처리', ja: '🔄 同期ポリシーと競合処理' },
  '🗄️ 数据库与存储引擎': { en: '🗄️ Database & Storage', 'zh-TW': '🗄️ 資料庫與儲存引擎', ko: '🗄️ 데이터베이스 및 스토리지', ja: '🗄️ データベースとストレージ' },
  '🕒 版本快照与回收站': { en: '🕒 Snapshots & Trash', 'zh-TW': '🕒 版本快照與資源回收筒', ko: '🕒 버전 스냅샷 및 휴지통', ja: '🕒 履歴スナップショットとごみ箱' },
  '🔑 设备专属令牌': { en: '🔑 Device Tokens', 'zh-TW': '🔑 裝置專屬權杖', ko: '🔑 전용 기기 토큰', ja: '🔑 デバイス専用トークン' },
  '👤 账户安全与修改密码': { en: '👤 Account & Security', 'zh-TW': '👤 帳戶安全與修改密碼', ko: '👤 계정 보안 및 비밀번호 변경', ja: '👤 アカウントとパスワード変更' },
  '正在加载设置…': { en: 'Loading settings…', 'zh-TW': '正在載入設定…', ko: '설정 불러오는 중…', ja: '設定を読み込み中…' },

  // Sub-tab 1: Plugin Configuration
  'Obsidian Nimbus 插件对接配置': {
    en: 'Obsidian Nimbus Plugin Setup',
    'zh-TW': 'Obsidian Nimbus 外掛對接設定',
    ko: 'Obsidian Nimbus 플러그인 연동 설정',
    ja: 'Obsidian Nimbus プラグイン連携設定'
  },
  '为您的 Obsidian 笔记库快速生成同步插件所需的一键配置': {
    en: 'Quickly generate one-click configuration required by the Obsidian sync plugin',
    'zh-TW': '為您的 Obsidian 筆記庫快速產生同步外掛所需的一鍵設定',
    ko: 'Obsidian 동기화 플러그인에 필요한 원클릭 설정을 빠르게 생성합니다',
    ja: 'Obsidian ノート用同期プラグインに必要な一発設定を素早く生成します'
  },
  '选择要同步的 Vault 库': { en: 'Select Vault to Sync', 'zh-TW': '選擇要同步的 Vault 庫', ko: '동기화할 Vault 선택', ja: '同期する Vault を選択' },
  '暂无 Vault，请先在左侧新建': { en: 'No Vaults available. Create one from the left sidebar first.', 'zh-TW': '暫無 Vault，請先在左側新建', ko: '사용 가능한 Vault가 없습니다. 먼저 왼쪽에서 생성하세요.', ja: '利用可能な Vault がありません。左側で新規作成してください。' },
  'Obsidian 客户端将与选定的 Vault 库建立双向实时同步': {
    en: 'The Obsidian client will establish two-way real-time sync with the selected vault',
    'zh-TW': 'Obsidian 用戶端將與選定的 Vault 庫建立雙向即時同步',
    ko: 'Obsidian 클라이언트가 선택한 Vault와 양방향 실시간 동기화를 구축합니다',
    ja: 'Obsidian クライアントは選択した Vault と双方向リアルタイム同期を確立します'
  },
  '服务器连接地址 (Server URL)': { en: 'Server Connection URL', 'zh-TW': '伺服器連線位址 (Server URL)', ko: '서버 연결 주소 (Server URL)', ja: 'サーバー接続 URL' },
  '局域网或公网访问地址，需确保 Obsidian 客户端可连通': {
    en: 'LAN or public URL reachable from your Obsidian client devices',
    'zh-TW': '區域網路或公網存取位址，需確保 Obsidian 用戶端可連通',
    ko: 'Obsidian 클라이언트에서 접근 가능한 로컬 네트워크 또는 공인 IP/도메인 주소',
    ja: 'Obsidian クライアントからアクセス可能なローカルまたは公開 URL'
  },
  '客户端设备标识 (Device Name)': { en: 'Client Device Identifier', 'zh-TW': '用戶端裝置識別碼 (Device Name)', ko: '클라이언트 기기 식별자 (Device Name)', ja: 'クライアントデバイス名 (Device Name)' },
  '用于在冲突备份与协同日志中标识设备来源': {
    en: 'Used to identify the device origin in conflict backups and sync audit logs',
    'zh-TW': '用於在衝突備份與協同日誌中識別裝置來源',
    ko: '충돌 백업 및 동기화 로그에서 기기 출처를 식별하는 데 사용됩니다',
    ja: '競合バックアップおよび監査ログでデバイス元を識別するために使用されます'
  },
  '授权访问令牌 (Auth Token)': { en: 'Authorization Token', 'zh-TW': '授權存取權杖 (Auth Token)', ko: '인증 액세스 토큰 (Auth Token)', ja: '認証アクセストークン (Auth Token)' },
  '推荐在「设备专属令牌」标签页为每个端创建独立 Token': {
    en: 'Recommended to create independent tokens per device in the "Device Tokens" tab',
    'zh-TW': '推薦在「裝置專屬權杖」標籤頁為每個端建立獨立 Token',
    ko: '\'전용 기기 토큰\' 탭에서 기기별 독립 토큰을 생성하는 것을 권장합니다',
    ja: '「デバイス専用トークン」タブで端末ごとに独立したトークンを作成することをお勧めします'
  },
  '⚡ 重新生成插件配置': { en: '⚡ Regenerate Config', 'zh-TW': '⚡ 重新產生外掛設定', ko: '⚡ 플러그인 설정 다시 생성', ja: '⚡ プラグイン設定を再生成' },
  '🧪 测试服务端连通性': { en: '🧪 Test Connectivity', 'zh-TW': '🧪 測試伺服端連通性', ko: '🧪 서버 연결 테스트', ja: '🧪 サーバー接続テスト' },
  '📋 复制 data.json 配置代码': { en: '📋 Copy data.json Code', 'zh-TW': '📋 複製 data.json 設定代碼', ko: '📋 data.json 설정 복사', ja: '📋 data.json 設定コードをコピー' },
  '插件配置文件 data.json': { en: 'Plugin Config File data.json', 'zh-TW': '外掛設定檔 data.json', ko: '플러그인 설정 파일 data.json', ja: 'プラグイン設定ファイル data.json' },
  '可直接在 Obsidian 笔记库的插件目录（如': {
    en: 'You can directly paste the following into your Obsidian vault plugin folder (e.g. ',
    'zh-TW': '可直接在 Obsidian 筆記庫的外掛目錄（如',
    ko: 'Obsidian Vault의 플러그인 폴더(예: ',
    ja: 'Obsidian ノートのプラグインフォルダ (例: '
  },
  '）中粘贴以下内容：': {
    en: ') by pasting the content below:',
    'zh-TW': '）中貼上下列內容：',
    ko: ')에 아래 내용을 직접 붙여넣을 수 있습니다:',
    ja: ') に以下の内容を直接貼り付けることができます:'
  },
  '客户端安装与使用步骤': { en: 'Client Installation & Quick Guide', 'zh-TW': '用戶端安裝與使用步驟', ko: '클라이언트 설치 및 사용 안내', ja: 'クライアントのインストールと使用手順' },
  '1. 在 Obsidian 中安装并启用同步插件（支持': {
    en: '1. Install and enable the sync plugin in Obsidian (supports ',
    'zh-TW': '1. 在 Obsidian 中安裝並啟用同步外掛（支援 ',
    ko: '1. Obsidian에서 동기화 플러그인을 설치하고 활성화합니다 (',
    ja: '1. Obsidian で同期プラグインをインストールして有効化します ('
  },
  '及兼容的': { en: ' and compatible ', 'zh-TW': ' 及相容的 ', ko: ' 및 호환되는 ', ja: ' および互換の ' },
  '插件）。': { en: ' plugins).', 'zh-TW': ' 外掛）。', ko: ' 플러그인 지원).', ja: ' プラグインに対応)。' },
  '2. 打开 Obsidian 插件设置，将上方生成的': {
    en: '2. Open Obsidian plugin settings, enter the generated ',
    'zh-TW': '2. 開啟 Obsidian 外掛設定，將上方產生的 ',
    ko: '2. Obsidian 플러그인 설정을 열고 상단의 ',
    ja: '2. Obsidian プラグイン設定を開き、上記で生成された '
  },
  '填入插件配置界面。': {
    en: ' into the plugin configuration form.',
    'zh-TW': ' 填入外掛設定介面。',
    ko: ' 값을 플러그인 설정 화면에 입력합니다.',
    ja: ' をプラグイン設定画面に入力します。'
  },
  '3. 或者直接将上方': {
    en: '3. Alternatively, copy the generated ',
    'zh-TW': '3. 或者直接將上方 ',
    ko: '3. 또는 위의 ',
    ja: '3. または上記の '
  },
  '复制保存到对应插件目录，即可免输所有参数。': {
    en: ' directly into the plugin directory to skip manual input.',
    'zh-TW': ' 複製儲存到對應外掛目錄，即可免輸所有參數。',
    ko: ' 파일을 플러그인 폴더에 저장하면 모든 설정을 한 번에 완료할 수 있습니다.',
    ja: ' をプラグインフォルダに保存すれば、パラメータの手動入力が不要になります。'
  },
  '4. Obsidian 启动后即可享受多端毫秒级实时 WebSocket 增量双向同步。': {
    en: '4. Enjoy millisecond-level two-way WebSocket incremental sync across all devices once Obsidian starts.',
    'zh-TW': '4. Obsidian 啟動後即可享受多端毫秒級即時 WebSocket 增量雙向同步。',
    ko: '4. Obsidian 실행 즉시 밀리초 단위의 실시간 WebSocket 증분 양방향 동기화가 동작합니다.',
    ja: '4. Obsidian 起動後、マルチデバイスでのミリ秒級リアルタイム WebSocket 差分同期が有効になります。'
  },
  '正在测试与服务器握手…': { en: 'Testing handshake with server…', 'zh-TW': '正在測試與伺服端交握…', ko: '서버와 핸드셰이크 테스트 중…', ja: 'サーバーとの接続テストを実行中…' },

  // Sub-tab 2: Sync Strategy & Conflicts
  '同步策略与冲突处理 (Nimbus Sync Engine)': {
    en: 'Sync Strategy & Conflict Arbitration',
    'zh-TW': '同步策略與衝突處理 (Nimbus Sync Engine)',
    ko: '동기화 정책 및 충돌 중재 (Nimbus Sync Engine)',
    ja: '同期ポリシーと競合調停 (Nimbus Sync Engine)'
  },
  '控制文件冲突时的自动裁决机制、传输限制与全局忽略黑名单': {
    en: 'Control automatic resolution mechanisms, transfer limits, and global ignore filters during file conflicts',
    'zh-TW': '控制檔案衝突時的自動裁決機制、傳輸限制與全域忽略黑名單',
    ko: '파일 충돌 시 자동 중재 메커니즘, 전송 제한 및 전역 무시 패턴을 제어합니다',
    ja: 'ファイル競合時の自動調停、転送制限、グローバル除外リストを制御します'
  },
  '冲突裁决策略 (Conflict Strategy)': { en: 'Conflict Resolution Strategy', 'zh-TW': '衝突裁決策略 (Conflict Strategy)', ko: '충돌 해결 전략 (Conflict Strategy)', ja: '競合調停戦略 (Conflict Strategy)' },
  '自动创建冲突副本 (推荐，零数据丢失)': { en: 'Create Conflict Copy (Recommended, zero data loss)', 'zh-TW': '自動建立衝突副本 (推薦，零資料遺失)', ko: '충돌 복사본 자동 생성 (권장, 데이터 무손실)', ja: '競合コピーを自動作成 (推奨、データ損失なし)' },
  '以最新修改时间覆盖 (LWW - Last Write Wins)': { en: 'Last Write Wins (LWW - Overwrite with newest timestamp)', 'zh-TW': '以最新修改時間覆蓋 (LWW - Last Write Wins)', ko: '최신 수정본 우선 (LWW - 가장 최근 타임스탬프로 덮어쓰기)', ja: '最新更新日時を優先 (LWW - 最新版で上書き)' },
  '以服务端版本为准 (拒绝并回退客户端)': { en: 'Server Version Wins (Reject and rollback client)', 'zh-TW': '以伺服端版本為準 (拒絕並復原用戶端)', ko: '서버 버전 우선 (클라이언트 변경 거부 및 롤백)', ja: 'サーバー版を優先 (クライアントの変更を拒否してロールバック)' },
  '当两台设备几乎同时修改了同一篇笔记且内容不一致时系统的应对策略': {
    en: 'System behavior when two devices modify the same note concurrently with divergent content',
    'zh-TW': '當兩台裝置幾乎同時修改了同一篇筆記且內容不一致時系統的應對策略',
    ko: '두 기기에서 동일한 노트를 동시에 수정하여 내용이 불일치할 때의 시스템 동작 방식',
    ja: '2台のデバイスが同時に同一ノートを編集し不一致が生じた場合のシステム動作'
  },
  '单文件体积上限 (Max File Size)': { en: 'Max File Size Limit', 'zh-TW': '單一檔案體積上限 (Max File Size)', ko: '단일 파일 크기 제한 (Max File Size)', ja: '単一ファイル最大サイズ (Max File Size)' },
  '超过此大小的大文件将跳过同步，避免耗尽带宽（单位：MB）': {
    en: 'Files exceeding this size will be skipped to conserve bandwidth (in MB)',
    'zh-TW': '超過此大小的大檔案將略過同步，避免耗盡頻寬（單位：MB）',
    ko: '대역폭 보호를 위해 이 크기를 초과하는 대용량 파일은 동기화에서 제외됩니다 (단위: MB)',
    ja: '帯域幅保護のため、このサイズを超える大容量ファイルは同期をスキップします (単位: MB)'
  },
  '大文件分块大小 (Chunk Size)': { en: 'Chunk Upload Size', 'zh-TW': '大檔案分塊大小 (Chunk Size)', ko: '청크 분할 업로드 크기 (Chunk Size)', ja: 'チャンク分割サイズ (Chunk Size)' },
  '对大附件进行切片传输的单块大小（单位：MB，推荐 2~10MB）': {
    en: 'Chunk slicing size for large attachment uploads (in MB, recommended 2–10MB)',
    'zh-TW': '對大附件進行切片傳輸的單塊大小（單位：MB，推薦 2~10MB）',
    ko: '대용량 첨부파일 분할 전송 크기 (단위: MB, 권장 2~10MB)',
    ja: '大容量添付ファイルの分割転送サイズ (単位: MB、推奨 2〜10MB)'
  },
  'WebSocket 心跳与长连接检测 (秒)': { en: 'WebSocket Heartbeat Interval (Seconds)', 'zh-TW': 'WebSocket 活動訊號與長連線檢測 (秒)', ko: 'WebSocket 하트비트 주기 (초)', ja: 'WebSocket ハートビート間隔 (秒)' },
  '多端长连接保活心跳频率，用于毫秒级感知设备在线状态': {
    en: 'Heartbeat interval to keep persistent connections active and track device status',
    'zh-TW': '多端長連線保持活躍活動訊號頻率，用於毫秒級感知裝置上線狀態',
    ko: '기기 온라인 상태를 밀리초 단위로 감지하기 위한 연결 유지 하트비트 주기',
    ja: 'デバイスのオンライン状態を検知するための接続維持ハートビート頻度'
  },
  '全局同步忽略黑名单 (Ignore Patterns)': { en: 'Global Ignore Patterns', 'zh-TW': '全域同步忽略黑名單 (Ignore Patterns)', ko: '전역 동기화 무시 패턴 (Ignore Patterns)', ja: 'グローバル同期除外パターン (Ignore Patterns)' },
  '支持通配符 glob，每行一条规则。匹配的文件将不会被同步到服务器': {
    en: 'Supports glob wildcards, one rule per line. Matching files will not sync to the server',
    'zh-TW': '支援萬用字元 glob，每行一條規則。符合的檔案將不會被同步到伺服器',
    ko: 'glob 와일드카드 지원, 한 줄에 하나의 규칙. 일치하는 파일은 동기화되지 않습니다',
    ja: 'glob ワイルドカード対応、1行に1ルール。一致するファイルは同期されません'
  },
  '同步 .obsidian 隐藏配置与插件': { en: 'Sync .obsidian hidden configs & plugins', 'zh-TW': '同步 .obsidian 隱藏設定與外掛', ko: '.obsidian 숨김 설정 및 플러그인 동기화', ja: '.obsidian 隠し設定とプラグインを同期' },
  '是否将 Obsidian 的工作区、外观主题、第三方插件配置纳入多端同步': {
    en: 'Whether to sync Obsidian workspaces, visual themes, and community plugin configs across devices',
    'zh-TW': '是否將 Obsidian 的工作區、外觀佈景主題、第三方外掛設定納入多端同步',
    ko: 'Obsidian 워크스페이스, 테마, 서드파티 플러그인 설정을 동기화에 포함할지 여부',
    ja: 'Obsidian のワークスペース、テーマ、プラグイン設定をマルチデバイス同期に含めるか'
  },
  '同步图片、音频与二进制附件': { en: 'Sync images, audio & binary attachments', 'zh-TW': '同步圖片、音訊與二進位附件', ko: '이미지, 오디오 및 바이너리 첨부파일 동기화', ja: '画像、音声、バイナリ添付ファイルを同期' },
  '是否同步除了 Markdown 纯文本以外的资源文件': {
    en: 'Whether to sync non-markdown asset files such as images, PDFs, and audio',
    'zh-TW': '是否同步除了 Markdown 純文字以外的資源檔案',
    ko: 'Markdown 텍스트 외의 이미지, PDF 등 리소스 파일 동기화 여부',
    ja: 'Markdown 以外の画像や PDF などのリソースファイルを同期するか'
  },
  '💾 保存同步策略配置': { en: '💾 Save Sync Settings', 'zh-TW': '💾 儲存同步策略設定', ko: '💾 동기화 설정 저장', ja: '💾 同期設定を保存' },

  // Sub-tab 3: Database & Storage Engine
  '数据库与存储引擎设置': { en: 'Database & Storage Engine Settings', 'zh-TW': '資料庫與儲存引擎設定', ko: '데이터베이스 및 스토리지 엔진 설정', ja: 'データベースとストレージエンジン設定' },
  '查看当前数据库类型、数据表行数与存储引擎迁移': {
    en: 'View current database engine, record counts, and perform storage migration',
    'zh-TW': '檢視目前資料庫類型、資料表行數與儲存引擎遷移',
    ko: '현재 데이터베이스 유형, 레코드 수 확인 및 스토리지 엔진 마이그레이션',
    ja: '稼働中データベース種類、総レコード数の確認およびストレージ移行'
  },
  '存储引擎类型': { en: 'Storage Engine Type', 'zh-TW': '儲存引擎類型', ko: '스토리지 엔진 유형', ja: 'ストレージエンジン種別' },
  '连接状态': { en: 'Connection Status', 'zh-TW': '連線狀態', ko: '연결 상태', ja: '接続状態' },
  '正常连接': { en: 'Connected & Healthy', 'zh-TW': '正常連線', ko: '정상 연결됨', ja: '正常接続中' },
  '数据库总大小': { en: 'Total Database Size', 'zh-TW': '資料庫總大小', ko: '데이터베이스 총 용량', ja: 'データベース総容量' },
  '数据表总数': { en: 'Total Tables', 'zh-TW': '資料表總數', ko: '총 테이블 수', ja: '総テーブル数' },
  '全表数据行数': { en: 'Total Rows', 'zh-TW': '全表資料行數', ko: '총 데이터 행 수', ja: '全テーブル総行数' },
  '迁移至新存储引擎 (PostgreSQL / MySQL / SQLite)': {
    en: 'Migrate to New Storage Engine (PostgreSQL / MySQL / SQLite)',
    'zh-TW': '遷移至新儲存引擎 (PostgreSQL / MySQL / SQLite)',
    ko: '새 스토리지 엔진으로 마이그레이션 (PostgreSQL / MySQL / SQLite)',
    ja: '新規ストレージエンジンへ移行 (PostgreSQL / MySQL / SQLite)'
  },
  '目标数据库引擎': { en: 'Target Database Engine', 'zh-TW': '目標資料庫引擎', ko: '대상 데이터베이스 엔진', ja: '対象データベースエンジン' },
  '连接字符串 (Connection String / URI)': { en: 'Connection String (URI)', 'zh-TW': '連線字串 (Connection String / URI)', ko: '연결 문자열 (URI)', ja: '接続文字列 (URI)' },
  '例如：postgresql://user:pass@localhost:5432/nimbus': {
    en: 'e.g. postgresql://user:pass@localhost:5432/nimbus',
    'zh-TW': '例如：postgresql://user:pass@localhost:5432/nimbus',
    ko: '예: postgresql://user:pass@localhost:5432/nimbus',
    ja: '例: postgresql://user:pass@localhost:5432/nimbus'
  },
  '用于企业级多实例高并发扩展或分布式部署': {
    en: 'For enterprise multi-instance scalability and distributed deployments',
    'zh-TW': '用於企業級多實例高並行擴充或分散式部署',
    ko: '엔터프라이즈 다중 인스턴스 확장 및 분산 배포용',
    ja: 'エンタープライズ向けマルチインスタンス拡張や分散配置用'
  },
  '🧪 测试目标连接': { en: '🧪 Test Target Connection', 'zh-TW': '🧪 測試目標連線', ko: '🧪 대상 연결 테스트', ja: '🧪 接続テスト' },
  '🚀 开始数据平滑迁移并切换': { en: '🚀 Migrate & Switch Engine', 'zh-TW': '🚀 開始資料平滑遷移並切換', ko: '🚀 데이터 마이그레이션 및 전환 시작', ja: '🚀 データ移行とエンジン切り替えを開始' },
  '📦 备份当前 SQLite 数据库文件': { en: '📦 Backup Current SQLite Database', 'zh-TW': '📦 備份目前 SQLite 資料庫檔案', ko: '📦 현재 SQLite 데이터베이스 백업', ja: '📦 現在の SQLite データベースをバックアップ' },
  '🧹 执行数据库 VACUUM 碎片整理与紧缩': { en: '🧹 Run Database VACUUM & Optimize', 'zh-TW': '🧹 執行資料庫 VACUUM 磁碟重組與緊縮', ko: '🧹 데이터베이스 VACUUM 최적화 실행', ja: '🧹 データベース VACUUM 最適化を実行' },

  // Sub-tab 4: Snapshots & Trash
  '版本历史快照与回收站生命周期': {
    en: 'Version Snapshots & Trash Lifecycle',
    'zh-TW': '版本歷史快照與資源回收筒生命週期',
    ko: '버전 히스토리 스냅샷 및 휴지통 수명 주기',
    ja: '履歴スナップショットとごみ箱ライフサイクル'
  },
  '管理笔记修改历史快照的版本上限、保存周期与回收站清理策略': {
    en: 'Manage maximum versions, retention periods, and automated trash purge rules',
    'zh-TW': '管理筆記修改歷史快照的版本上限、儲存週期與資源回收筒清理策略',
    ko: '노트 수정 히스토리 버전 한도, 보존 기간 및 휴지통 정리 정책 관리',
    ja: 'ノート編集履歴の保持件数、保存期間およびごみ箱自動クリーンアップ設定'
  },
  '单个文件最大历史版本数 (Max Versions)': { en: 'Max Historical Versions per File', 'zh-TW': '單一檔案最大歷史版本數 (Max Versions)', ko: '파일당 최대 히스토리 버전 수', ja: 'ファイルごとの最大履歴保持数' },
  '单个文件历史版本数超过设定值时，最早的旧快照将自动轮替清除': {
    en: 'When versions exceed this limit, oldest snapshots are automatically rotated and purged',
    'zh-TW': '單一檔案歷史版本數超過設定值時，最早的舊快照將自動輪替清除',
    ko: '버전 수가 초과되면 가장 오래된 스냅샷이 자동으로 정리됩니다',
    ja: '上限を超えると最も古いスナップショットが自動的にローテーション削除されます'
  },
  '历史版本最长保留天数 (Retention Days)': { en: 'Snapshot Retention Days', 'zh-TW': '歷史版本最長保留天數 (Retention Days)', ko: '히스토리 스냅샷 보존 일수', ja: '履歴スナップショット保持日数' },
  '超过此天数的历史快照将自动淘汰': {
    en: 'Historical snapshots older than this duration will be automatically expired',
    'zh-TW': '超過此天數的歷史快照將自動淘汰',
    ko: '이 기간이 지난 이전 스냅샷은 자동으로 정리됩니다',
    ja: 'この日数を超えた古い履歴は自動的に破棄されます'
  },
  '回收站保留天数 (Trash Retention)': { en: 'Trash Retention Days', 'zh-TW': '資源回收筒保留天數 (Trash Retention)', ko: '휴지통 보존 일수 (Trash Retention)', ja: 'ごみ箱保持日数 (Trash Retention)' },
  '删除的文件在回收站中暂存的天数，超期后彻底粉碎': {
    en: 'Days deleted files stay in trash before permanent deletion',
    'zh-TW': '刪除的檔案在資源回收筒中暫存的天數，超期後徹底粉碎',
    ko: '삭제된 파일이 휴지통에 보관되는 기간이며 만료 후 영구 삭제됩니다',
    ja: '削除されたファイルがごみ箱に保持される日数 (期限後に完全削除)'
  },
  '启用定时自动清空超期回收站': { en: 'Enable automated purge of expired trash', 'zh-TW': '啟用定時自動清空超期資源回收筒', ko: '만료된 휴지통 자동 비우기 활성화', ja: '期限切れごみ箱の自動消去を有効化' },
  '每天后台自动清理超过保留天数的已删除笔记文件': {
    en: 'Automatically cleans up expired trash files daily in the background',
    'zh-TW': '每天後台自動清理超過保留天數的已刪除筆記檔案',
    ko: '보존 기간이 지난 삭제된 노트를 매일 백그라운드에서 자동 청소합니다',
    ja: '保持期間を過ぎ過した削除済みノートを毎日バックグラウンドで自動消去します'
  },
  '💾 保存生命周期策略': { en: '💾 Save Lifecycle Policy', 'zh-TW': '💾 儲存生命週期策略', ko: '💾 수명 주기 정책 저장', ja: '💾 ライフサイクル設定を保存' },
  '🧹 立即执行一次回收站过期清理': { en: '🧹 Run Trash Purge Now', 'zh-TW': '🧹 立即執行一次資源回收筒過期清理', ko: '🧹 지금 만료된 휴지통 정리 실행', ja: '🧹 今すぐ期限切れごみ箱をクリーンアップ' },

  // Sub-tab 5: Tokens
  '设备专属令牌管理 (Device Access Tokens)': {
    en: 'Dedicated Device Access Tokens',
    'zh-TW': '裝置專屬權杖管理 (Device Access Tokens)',
    ko: '전용 기기 액세스 토큰 관리',
    ja: 'デバイス専用アクセストークン管理'
  },
  '为您的每台电脑、手机或平板生成独立的授权令牌，即使单端遗失也可一键注销，不影响其他设备': {
    en: 'Generate independent tokens per device. If a device is lost, revoke it with one click without affecting other clients',
    'zh-TW': '為您的每台電腦、手機或平板產生獨立的授權權杖，即使單端遺失也可一鍵註銷，不影響其他裝置',
    ko: '기기별 독립 토큰을 발급하여 한 기기를 분실해도 다른 기기에 영향 없이 단독 취소할 수 있습니다',
    ja: '端末ごとに独立したトークンを発行。紛失時も他の端末に影響を与えず即座に単独失効可能です'
  },
  '➕ 创建专属设备令牌': { en: '➕ Create Dedicated Token', 'zh-TW': '➕ 建立專屬裝置權杖', ko: '➕ 새 전용 토큰 생성', ja: '➕ 専用デバイストークンを作成' },
  '设备名称 / 标识 (如 iPhone 16 Pro / M3 Mac)': {
    en: 'Device Name (e.g. iPhone 16 Pro / M3 Mac)',
    'zh-TW': '裝置名稱 / 識別碼 (如 iPhone 16 Pro / M3 Mac)',
    ko: '기기 이름 (예: iPhone 16 Pro / M3 Mac)',
    ja: 'デバイス名 (例: iPhone 16 Pro / M3 Mac)'
  },
  '选择绑定的默认 Vault (选填)': { en: 'Default Vault (Optional)', 'zh-TW': '選擇綁定的預設 Vault (選填)', ko: '기본 Vault 선택 (선택사항)', ja: 'デフォルトの Vault (任意)' },
  '全部权限 (读写)': { en: 'Full Access (Read & Write)', 'zh-TW': '全部權限 (讀寫)', ko: '모든 권한 (읽기 및 쓰기)', ja: '全権限 (読み書き可能)' },
  '只读权限 (仅拉取)': { en: 'Read Only (Pull Only)', 'zh-TW': '唯讀權限 (僅拉取)', ko: '읽기 전용 (풀 전용)', ja: '読み取り専用 (取得のみ)' },
  '生成并激活令牌': { en: 'Generate & Activate Token', 'zh-TW': '產生並啟用權杖', ko: '토큰 생성 및 활성화', ja: 'トークンを生成して有効化' },
  '当前已授权的专属设备列表': { en: 'Authorized Devices List', 'zh-TW': '目前已授權的專屬裝置清單', ko: '인증된 전용 기기 목록', ja: '認証済み専用デバイス一覧' },
  '专属 Token 预览': { en: 'Token Preview', 'zh-TW': '專屬 Token 預覽', ko: '토큰 미리보기', ja: 'トークンプレビュー' },
  '创建时间': { en: 'Created Time', 'zh-TW': '建立時間', ko: '생성 일시', ja: '作成日時' },
  '注销令牌': { en: 'Revoke Token', 'zh-TW': '註銷權杖', ko: '토큰 취소', ja: 'トークンを失効' },

  // Sub-tab 6: Account & Security & Theme
  '账户安全与密码修改': { en: 'Account Security & Password', 'zh-TW': '帳戶安全與密碼修改', ko: '계정 보안 및 비밀번호 변경', ja: 'アカウントセキュリティとパスワード変更' },
  '修改当前登录账户的登录密码，保障笔记云端数据安全': {
    en: 'Change your account password to protect your cloud vault data',
    'zh-TW': '修改目前登入帳戶的登入密碼，保障筆記雲端資料安全',
    ko: '클라우드 노트 데이터를 보호하기 위해 비밀번호를 변경합니다',
    ja: 'クラウドアカウントのパスワードを変更してノートを保護します'
  },
  '当前登录用户名': { en: 'Logged in Username', 'zh-TW': '目前登入使用者名稱', ko: '현재 로그인 계정', ja: '現在のログインユーザー名' },
  '当前账户角色': { en: 'Account Role', 'zh-TW': '目前帳戶角色', ko: '계정 역할', ja: 'アカウントの役割' },
  '原密码 (当前正在使用的密码)': { en: 'Current Password', 'zh-TW': '原密碼 (目前正在使用的密碼)', ko: '현재 비밀번호', ja: '現在のパスワード' },
  '新密码 (至少 6 位字符)': { en: 'New Password (min 6 characters)', 'zh-TW': '新密碼 (至少 6 位字元)', ko: '새 비밀번호 (최소 6자 이상)', ja: '新しいパスワード (6文字以上)' },
  '确认新密码 (再次输入新密码)': { en: 'Confirm New Password', 'zh-TW': '確認新密碼 (再次輸入新密碼)', ko: '새 비밀번호 확인', ja: '新しいパスワード (確認)' },
  '🔒 提交修改密码': { en: '🔒 Update Password', 'zh-TW': '🔒 提交修改密碼', ko: '🔒 비밀번호 변경 제출', ja: '🔒 パスワードを更新' },
  '界面外观主题风格 (UI Theme)': { en: 'Interface Theme & Style', 'zh-TW': '介面外觀佈景主題風格 (UI Theme)', ko: '인터페이스 테마 스타일 (UI Theme)', ja: 'UI テーマと外観 (UI Theme)' },
  '选择您喜爱的色彩基调，支持深色沉浸、极简白昼与高对比度模式': {
    en: 'Choose your preferred color theme supporting dark, light, and high-contrast modes',
    'zh-TW': '選擇您喜愛的色彩基調，支援深色沉浸、極簡白晝與高對比度模式',
    ko: '다크 모드, 라이트 모드 등 선호하는 테마를 선택하세요',
    ja: 'ダークモードやライトモードなどお好みのテーマを選択できます'
  },

  // Vault Detail Views & Modals
  '当前 Vault 笔记概览': { en: 'Vault Overview', 'zh-TW': '目前 Vault 筆記概覽', ko: '현재 Vault 개요', ja: '現在の Vault 概要' },
  '笔记文件总数': { en: 'Total Note Files', 'zh-TW': '筆記檔案總數', ko: '총 노트 파일 수', ja: '総ノートファイル数' },
  '附件与资源数': { en: 'Total Attachments', 'zh-TW': '附件與資源數', ko: '총 첨부파일 수', ja: '総添付ファイル数' },
  '版本历史总数': { en: 'Total Snapshots', 'zh-TW': '版本歷史總數', ko: '총 스냅샷 수', ja: '総履歴スナップショット数' },
  '回收站文件数': { en: 'Files in Trash', 'zh-TW': '資源回收筒檔案數', ko: '휴지통 파일 수', ja: 'ごみ箱内ファイル数' },
  '外链分享总数': { en: 'Active Shares', 'zh-TW': '外鏈分享總數', ko: '공개 공유 수', ja: '有効な共有リンク数' },
  '在线协作成员': { en: 'Collaborators', 'zh-TW': '線上協作成員', ko: '협업 멤버', ja: 'コラボレーター' },
  '创建新笔记': { en: 'Create New Note', 'zh-TW': '建立新筆記', ko: '새 노트 생성', ja: '新規ノートを作成' },
  '创建新文件夹': { en: 'Create New Folder', 'zh-TW': '建立新資料夾', ko: '새 폴더 생성', ja: '新規フォルダを作成' },
  '上传本地文件': { en: 'Upload Local File', 'zh-TW': '上傳本機檔案', ko: '로컬 파일 업로드', ja: 'ローカルファイルをアップロード' },
  '全库下载 ZIP': { en: 'Download Vault ZIP', 'zh-TW': '全庫下載 ZIP', ko: '전체 Vault ZIP 다운로드', ja: 'Vault 全体を ZIP ダウンロード' },
  '重命名笔记': { en: 'Rename Note', 'zh-TW': '重新命名筆記', ko: '노트 이름 변경', ja: 'ノートの名前を変更' },
  '移动笔记': { en: 'Move Note', 'zh-TW': '移動筆記', ko: '노트 이동', ja: 'ノートを移動' },
  '删除笔记': { en: 'Delete Note', 'zh-TW': '刪除筆記', ko: '노트 삭제', ja: 'ノートを削除' },
  '彻底粉碎': { en: 'Purge Permanently', 'zh-TW': '徹底粉碎', ko: '영구 삭제', ja: '完全に消去' },
  '还原此文件': { en: 'Restore File', 'zh-TW': '還原此檔案', ko: '파일 복원', ja: 'ファイルを復元' },
  '清空回收站': { en: 'Empty Trash', 'zh-TW': '清空資源回收筒', ko: '휴지통 비우기', ja: 'ごみ箱を空にする' },
  '回滚到此版本': { en: 'Rollback to Version', 'zh-TW': '復原到此版本', ko: '이 버전으로 롤백', ja: 'このバージョンにロールバック' },
  '对比当前版本': { en: 'Diff with Current', 'zh-TW': '對比目前版本', ko: '현재 버전과 비교', ja: '現行バージョンと比較' }
};

const phraseMapStart = currentCode.indexOf('const PHRASE_MAP = {');
if (phraseMapStart !== -1) {
  const insertPos = currentCode.indexOf('{', phraseMapStart) + 1;
  let serializedPhrases = '';
  for (const [key, translations] of Object.entries(ALL_FEATURE_DETAIL_PHRASES)) {
    serializedPhrases += `\n    ${JSON.stringify(key)}: ${JSON.stringify(translations)},`;
  }
  currentCode = currentCode.slice(0, insertPos) + serializedPhrases + currentCode.slice(insertPos);
  fs.writeFileSync(i18nPath, currentCode, 'utf8');
  console.log('Successfully injected comprehensive dictionary for all functional detail pages into i18n.js');
} else {
  console.error('Could not locate PHRASE_MAP in i18n.js');
}
