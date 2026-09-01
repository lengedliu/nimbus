const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
const i18nPath = path.join(__dirname, '..', 'public', 'i18n.js');
let currentCode = fs.readFileSync(i18nPath, 'utf8');

// Extract all Chinese strings in public/app.js
const regexes = [
  />([^<>{}\n]+)</g,
  /placeholder="([^"]+)"/g,
  /title="([^"]+)"/g,
  /toast\(([\x27\x22`])([^\x27\x22`]+)\1\)/g,
];

const allPhrases = new Set();
for (const r of regexes) {
  let m;
  while ((m = r.exec(appJs)) !== null) {
    const text = (m[2] || m[1]).trim();
    if (text && /[\u4e00-\u9fa5]/.test(text) && text.length < 120 && !text.includes('${')) {
      allPhrases.add(text);
    }
  }
}

// Handcrafted dictionary for comprehensive coverage
const COMPREHENSIVE_DICT = {
  // Diff & Conflict Modal
  '加载差异比对中…': { en: 'Loading diff comparison…', 'zh-TW': '載入差異比對中…', ko: '차이점 비교 불러오는 중…', ja: '差分比較を読み込み中…' },
  '该文件为二进制媒体或附件文件，无法进行纯文本差异比对。': {
    en: 'This file is a binary media or attachment file and cannot be compared as plain text.',
    'zh-TW': '該檔案為二進位媒體或附件檔案，無法進行純文字差異比對。',
    ko: '이 파일은 바이너리 미디어 또는 첨부파일이므로 텍스트 차이점 비교가 불가능합니다.',
    ja: 'このファイルはバイナリまたは添付ファイルのためプレーンテキスト差分比較はできません。'
  },
  '🖥️ 服务端当前版本 (Server Current)': { en: '🖥️ Server Version (Server Current)', 'zh-TW': '🖥️ 伺服端目前版本 (Server Current)', ko: '🖥️ 서버 현재 버전 (Server Current)', ja: '🖥️ サーバー現行版 (Server Current)' },
  '📱 客户端上传冲突版本 (Client Conflict)': { en: '📱 Client Conflict Version (Client Conflict)', 'zh-TW': '📱 用戶端上傳衝突版本 (Client Conflict)', ko: '📱 클라이언트 충돌 버전 (Client Conflict)', ja: '📱 クライアント競合版 (Client Conflict)' },
  '⚡ 快速解决策略:': { en: '⚡ Quick Resolution Strategy:', 'zh-TW': '⚡ 快速解決策略:', ko: '⚡ 빠른 해결 전략:', ja: '⚡ クイック解決戦略:' },
  '🛡️ 保留当前版本': { en: '🛡️ Keep Server Version', 'zh-TW': '🛡️ 保留目前版本', ko: '🛡️ 서버 버전 유지', ja: '🛡️ サーバー版を保持' },
  '⚡ 采纳冲突版本': { en: '⚡ Accept Client Conflict', 'zh-TW': '⚡ 採納衝突版本', ko: '⚡ 클라이언트 버전 채택', ja: '⚡ クライアント版を採用' },
  '🔀 智能合并两者 (带标记)': { en: '🔀 Smart Merge Both (With Markers)', 'zh-TW': '🔀 智慧合併兩者 (帶標記)', ko: '🔀 스마트 병합 (마커 포함)', ja: '🔀 スマート統合 (マーカー付き)' },
  '自定义最终合并内容:': { en: 'Custom Merged Content:', 'zh-TW': '自訂最終合併內容:', ko: '사용자 정의 최종 병합 내용:', ja: '統合内容を手動編集:' },
  '💾 保存并解决冲突': { en: '💾 Save & Resolve Conflict', 'zh-TW': '💾 儲存並解決衝突', ko: '💾 저장 및 충돌 해결', ja: '💾 保存して競合を解決' },

  // Snapshots & Backups
  '加载快照与备份中…': { en: 'Loading snapshots & backups…', 'zh-TW': '載入快照與備份中…', ko: '스냅샷 및 백업 불러오는 중…', ja: 'スナップショットとバックアップを読み込み中…' },
  '📦 实时导出 ZIP': { en: '📦 Export Vault ZIP', 'zh-TW': '📦 即時匯出 ZIP', ko: '📦 Vault ZIP 내보내기', ja: '📦 ZIP エクスポート' },
  '暂无历史快照备份': { en: 'No historical snapshots yet', 'zh-TW': '暫無歷史快照備份', ko: '히스토리 스냅샷이 없습니다', ja: '履歴スナップショットはありません' },
  '点击右上角「立即创建全库快照」即可一键将当前 Vault 打包存档': {
    en: 'Click "Create Snapshot Now" in the top right to archive the current vault with one click',
    'zh-TW': '點擊右上角「立即建立全庫快照」即可一鍵將目前 Vault 打包存檔',
    ko: '오른쪽 상단의 \'지금 전체 스냅샷 생성\'을 클릭하여 현재 Vault를 보관하세요',
    ja: '右上の「今すぐスナップショットを作成」をクリックして現在の Vault をアーカイブできます'
  },
  '快照文件名': { en: 'Snapshot Name', 'zh-TW': '快照檔名', ko: '스냅샷 파일 이름', ja: 'スナップショット名' },
  '备注说明': { en: 'Notes & Remarks', 'zh-TW': '備註說明', ko: '메모 및 설명', ja: '備考' },
  '⬇️ 下载 ZIP': { en: '⬇️ Download ZIP', 'zh-TW': '⬇️ 下載 ZIP', ko: '⬇️ ZIP 다운로드', ja: '⬇️ ZIP ダウンロード' },

  // Git Version Control
  '正在读取 Git 版本控制与远端同步状态…': { en: 'Reading Git repository and remote sync status…', 'zh-TW': '正在讀取 Git 版本控制與遠端同步狀態…', ko: 'Git 저장소 및 원격 동기화 상태 읽는 중…', ja: 'Git リポジトリとリモート同期状態を確認中…' },
  '🔗 远端仓库：': { en: '🔗 Remote Repo: ', 'zh-TW': '🔗 遠端倉庫：', ko: '🔗 원격 저장소: ', ja: '🔗 リモートリポジトリ: ' },
  '🔗 暂未配置远端 Git 仓库地址': { en: '🔗 Remote Git repository URL not configured yet', 'zh-TW': '🔗 暫未設定遠端 Git 倉庫位址', ko: '🔗 원격 Git 저장소 주소가 설정되지 않았습니다', ja: '🔗 リモート Git リポジトリ URL が未設定です' },
  '未提交变更': { en: 'Uncommitted Changes', 'zh-TW': '未提交變更', ko: '커밋되지 않은 변경사항', ja: '未コミットの変更' },
  '待推送提交': { en: 'Pending Commits to Push', 'zh-TW': '待推送提交', ko: '푸시 대기 커밋', ja: '未プッシュのコミット' },
  '最近一次提交': { en: 'Latest Commit', 'zh-TW': '最近一次提交', ko: '최근 커밋', ja: '最新コミット' },
  '无提交记录': { en: 'No commit records', 'zh-TW': '無提交記錄', ko: '커밋 기록 없음', ja: 'コミット履歴なし' },
  '上次远端推送': { en: 'Last Remote Push', 'zh-TW': '上次遠端推送', ko: '최근 원격 푸시', ja: '最終リモートプッシュ' },
  '❌ 失败': { en: '❌ Failed', 'zh-TW': '❌ 失敗', ko: '❌ 실패', ja: '❌ 失敗' },
  '暂无推送记录': { en: 'No push records yet', 'zh-TW': '暫無推送記錄', ko: '푸시 기록 없음', ja: 'プッシュ履歴なし' },
  '🚀 立即提交并推送': { en: '🚀 Commit & Push Now', 'zh-TW': '🚀 立即提交並推送', ko: '🚀 지금 커밋 및 푸시', ja: '🚀 今すぐコミット＆プッシュ' },
  '📥 拉取远端更新': { en: '📥 Pull Remote Updates', 'zh-TW': '📥 拉取遠端更新', ko: '📥 원격 업데이트 가져오기', ja: '📥 リモート更新を取得' },
  '🔍 测试连通性': { en: '🔍 Test Connectivity', 'zh-TW': '🔍 測試連通性', ko: '🔍 연결 테스트', ja: '🔍 接続テスト' },
  '⚡ 初始化本地 Git 仓库': { en: '⚡ Initialize Local Git Repo', 'zh-TW': '⚡ 初始化本機 Git 倉庫', ko: '⚡ 로컬 Git 저장소 초기화', ja: '⚡ ローカル Git リポジトリ初期化' },
  '📝 本地工作区变更': { en: '📝 Working Tree Changes', 'zh-TW': '📝 本機工作區變更', ko: '📝 로컬 작업 영역 변경사항', ja: '📝 ワークツリーの変更' },
  '工作区干净': { en: 'Working tree clean', 'zh-TW': '工作區乾淨', ko: '작업 영역 깨끗함', ja: 'ワークツリーはクリーンです' },
  '当前笔记库所有文件均已保存并纳入 Git 版本控制': {
    en: 'All vault files are saved and tracked under Git version control',
    'zh-TW': '目前筆記庫所有檔案均已儲存並納入 Git 版本控制',
    ko: '현재 Vault의 모든 파일이 저장되어 Git 버전 관리에 포함되어 있습니다',
    ja: 'ノートのすべてのファイルが保存され、Git で追跡されています'
  },
  '📜 Git 提交历史 (最近 20 条)': { en: '📜 Git Commit History (Recent 20)', 'zh-TW': '📜 Git 提交歷史 (最近 20 條)', ko: '📜 Git 커밋 히스토리 (최근 20개)', ja: '📜 Git コミット履歴 (最新20件)' },
  '暂无 Git 提交历史，点击上方「立即提交并推送」创建首个提交快照': {
    en: 'No Git commit history yet. Click "Commit & Push Now" above to create your first commit snapshot',
    'zh-TW': '暫無 Git 提交歷史，點擊上方「立即提交並推送」建立首個提交快照',
    ko: 'Git 커밋 히스토리가 없습니다. 위의 \'지금 커밋 및 푸시\'를 클릭하여 첫 번째 커밋을 생성하세요',
    ja: 'Git コミット履歴がありません。上の「今すぐコミット＆プッシュ」で最初のコミットを作成してください'
  },
  '⚙️ Git 仓库与自动推送设置': { en: '⚙️ Git Repository & Auto Push Settings', 'zh-TW': '⚙️ Git 倉庫與自動推送設定', ko: '⚙️ Git 저장소 및 자동 푸시 설정', ja: '⚙️ Git リポジトリと自動プッシュ設定' },
  '启用 Git 备份': { en: 'Enable Git Backup', 'zh-TW': '啟用 Git 備份', ko: 'Git 백업 활성화', ja: 'Git バックアップを有効化' },
  '远端 Git 仓库地址 (Remote URL)': { en: 'Remote Git URL (Remote URL)', 'zh-TW': '遠端 Git 倉庫位址 (Remote URL)', ko: '원격 Git 저장소 주소 (Remote URL)', ja: 'リモート Git リポジトリ URL' },
  '支持 GitHub、Gitee、GitLab、Coding 或私有 Git 仓库': {
    en: 'Supports GitHub, Gitee, GitLab, Coding, or self-hosted Git repositories',
    'zh-TW': '支援 GitHub、Gitee、GitLab、Coding 或私有 Git 倉庫',
    ko: 'GitHub, Gitee, GitLab 또는 자체 호스팅 Git 저장소를 지원합니다',
    ja: 'GitHub、Gitee、GitLab またはセルフホスト Git リポジトリに対応'
  },
  '目标分支 (Branch)': { en: 'Target Branch (Branch)', 'zh-TW': '目標分支 (Branch)', ko: '대상 브랜치 (Branch)', ja: '対象ブランチ (Branch)' },
  '认证用户名 (Username)': { en: 'Auth Username (Username)', 'zh-TW': '認證使用者名稱 (Username)', ko: '인증 사용자 이름 (Username)', ja: '認証ユーザー名 (Username)' },
  'Committer 姓名': { en: 'Committer Name', 'zh-TW': 'Committer 姓名', ko: 'Committer 이름', ja: 'Committer 氏名' },
  'Committer 邮箱': { en: 'Committer Email', 'zh-TW': 'Committer 電子郵件', ko: 'Committer 이메일', ja: 'Committer メールアドレス' },
  '提交说明模板 (Commit Template)': { en: 'Commit Message Template', 'zh-TW': '提交說明範本 (Commit Template)', ko: '커밋 메시지 템플릿', ja: 'コミットメッセージテンプレート' },
  '可用变量：': { en: 'Variables: ', 'zh-TW': '可用變數：', ko: '사용 가능 변수: ', ja: '利用可能な変数: ' },
  '笔记修改后自动提交并推送 (实时防抖)': { en: 'Auto commit & push on note change (debounced)', 'zh-TW': '筆記修改後自動提交並推送 (即時防抖)', ko: '노트 변경 시 자동 커밋 및 푸시 (디바운스)', ja: 'ノート編集時に自動コミット＆プッシュ (デバウンス)' },
  '防抖延迟：': { en: 'Debounce Delay: ', 'zh-TW': '防抖延遲：', ko: '디바운스 지연: ', ja: 'デバウンス遅延: ' },
  '推送前自动执行': { en: 'Auto pull before push: ', 'zh-TW': '推送前自動執行 ', ko: '푸시 전 자동 실행: ', ja: 'プッシュ前自動実行: ' },
  '合并远端': { en: 'merge remote', 'zh-TW': '合併遠端', ko: '원격 병합', ja: 'リモートをマージ' },
  '💾 保存 Git 设置': { en: '💾 Save Git Settings', 'zh-TW': '💾 儲存 Git 設定', ko: '💾 Git 설정 저장', ja: '💾 Git 設定を保存' },
  '🔍 测试连接': { en: '🔍 Test Connection', 'zh-TW': '🔍 測試連線', ko: '🔍 연결 테스트', ja: '🔍 接続テスト' },

  // Sync Logs Filter & Table
  '加载同步日志中…': { en: 'Loading sync logs…', 'zh-TW': '載入同步日誌中…', ko: '동기화 로그 불러오는 중…', ja: '同期ログを読み込み中…' },
  '📋 笔记同步日志 (Sync Logs)': { en: '📋 Vault Sync Logs', 'zh-TW': '📋 筆記同步日誌 (Sync Logs)', ko: '📋 Vault 동기화 로그', ja: '📋 ノート同期ログ (Sync Logs)' },
  '🗑️ 清空此库日志': { en: '🗑️ Clear Vault Logs', 'zh-TW': '🗑️ 清空此庫日誌', ko: '🗑️ 이 Vault 로그 지우기', ja: '🗑️ この Vault のログをクリア' },
  '全部同步动作 (All Actions)': { en: 'All Actions', 'zh-TW': '全部同步動作 (All Actions)', ko: '모든 동기화 동작', ja: 'すべてのアクション' },
  '📝 更新 / 推送 (Push/Update)': { en: '📝 Push / Update', 'zh-TW': '📝 更新 / 推送 (Push/Update)', ko: '📝 푸시 / 업데이트', ja: '📝 プッシュ / 更新' },
  '📥 读取 / 拉取 (Pull)': { en: '📥 Pull / Read', 'zh-TW': '📥 讀取 / 拉取 (Pull)', ko: '📥 풀 / 읽기', ja: '📥 プル / 取得' },
  '⚠️ 冲突副本 (Conflict)': { en: '⚠️ Conflict Copy', 'zh-TW': '⚠️ 衝突副本 (Conflict)', ko: '⚠️ 충돌 복사본', ja: '⚠️ 競合コピー' },
  '🗑️ 删除文件 (Delete)': { en: '🗑️ Delete File', 'zh-TW': '🗑️ 刪除檔案 (Delete)', ko: '🗑️ 파일 삭제', ja: '🗑️ ファイル削除' },
  '🚫 规则忽略 (Ignored)': { en: '🚫 Rule Ignored', 'zh-TW': '🚫 規則忽略 (Ignored)', ko: '🚫 규칙에 의해 무시됨', ja: '🚫 ルール除外' },
  '❌ 异常错误 (Error)': { en: '❌ Error', 'zh-TW': '❌ 異常錯誤 (Error)', ko: '❌ 오류 발생', ja: '❌ エラー' },
  '全部状态 (All Status)': { en: 'All Statuses', 'zh-TW': '全部狀態 (All Status)', ko: '모든 상태', ja: 'すべてのステータス' },
  '✓ 成功 (Success)': { en: '✓ Success', 'zh-TW': '✓ 成功 (Success)', ko: '✓ 성공', ja: '✓ 成功' },
  '⚠️ 冲突 (Conflict)': { en: '⚠️ Conflict', 'zh-TW': '⚠️ 衝突 (Conflict)', ko: '⚠️ 충돌', ja: '⚠️ 競合' },
  '✕ 错误 (Error)': { en: '✕ Error', 'zh-TW': '✕ 錯誤 (Error)', ko: '✕ 오류', ja: '✕ エラー' },
  '- 忽略 (Ignored)': { en: '- Ignored', 'zh-TW': '- 忽略 (Ignored)', ko: '- 무시됨', ja: '- 除外' },
  '🔍 筛选': { en: '🔍 Filter', 'zh-TW': '🔍 篩選', ko: '🔍 필터', ja: '🔍 絞り込み' },
  '时间戳': { en: 'Timestamp', 'zh-TW': '時間戳記', ko: '타임스탬프', ja: 'タイムスタンプ' },
  '动作': { en: 'Action', 'zh-TW': '動作', ko: '동작', ja: 'アクション' },
  '笔记 / 文件路径': { en: 'File Path', 'zh-TW': '筆記 / 檔案路徑', ko: '파일 경로', ja: 'ファイルパス' },
  '客户端设备 / IP': { en: 'Device / IP', 'zh-TW': '用戶端裝置 / IP', ko: '기기 / IP', ja: 'デバイス / IP' },
  '详细说明': { en: 'Details', 'zh-TW': '詳細說明', ko: '상세 정보', ja: '詳細' },
  '加载全局同步日志中…': { en: 'Loading global sync logs…', 'zh-TW': '載入全域同步日誌中…', ko: '전체 동기화 로그 불러오는 중…', ja: 'グローバル同期ログを読み込み中…' },
  '用户 / 设备': { en: 'User / Device', 'zh-TW': '使用者 / 裝置', ko: '사용자 / 기기', ja: 'ユーザー / デバイス' },

  // User Management & Modal
  '加载用户列表中…': { en: 'Loading user list…', 'zh-TW': '載入使用者清單中…', ko: '사용자 목록 불러오는 중…', ja: 'ユーザー一覧を読み込み中…' },
  '👥 用户管理与 Vault 授权': { en: '👥 User Management & Vault Permissions', 'zh-TW': '👥 使用者管理與 Vault 授權', ko: '👥 사용자 관리 및 Vault 권한 부여', ja: '👥 ユーザー管理と Vault 権限' },
  '管理员权限（允许管理系统数据库、全局用户及所有 Vault 配置）': {
    en: 'Administrator Privileges (Full access to database, users, and all vaults)',
    'zh-TW': '管理員權限（允許管理系統資料庫、全域使用者及所有 Vault 設定）',
    ko: '관리자 권한 (데이터베이스, 전체 사용자 및 모든 Vault 설정 관리 허용)',
    ja: '管理者権限 (データベース、全ユーザー、全 Vault 設定の管理を許可)'
  },
  '全选': { en: 'Select All', 'zh-TW': '全選', ko: '전체 선택', ja: 'すべて選択' },
  '＋ 创建用户并分配权限': { en: '＋ Create User & Assign Permissions', 'zh-TW': '＋ 建立使用者並分配權限', ko: '＋ 사용자 생성 및 권한 할당', ja: '＋ ユーザーを作成して権限を割り当て' },
  '授权笔记库 (Vaults)': { en: 'Authorized Vaults', 'zh-TW': '授權筆記庫 (Vaults)', ko: '인가된 Vault 목록', ja: '許可された Vault' },
  '暂无关联 Vault': { en: 'No associated vaults', 'zh-TW': '暫無關聯 Vault', ko: '연결된 Vault 없음', ja: '関連付けられた Vault はありません' },
  '✏️ 编辑用户': { en: '✏️ Edit User', 'zh-TW': '✏️ 編輯使用者', ko: '✏️ 사용자 수정', ja: '✏️ ユーザーを編集' },
  '编辑用户:': { en: 'Edit User: ', 'zh-TW': '編輯使用者：', ko: '사용자 수정: ', ja: 'ユーザー編集: ' },
  '🔒 已创建用户禁止修改用户名': { en: '🔒 Username cannot be changed after creation', 'zh-TW': '🔒 已建立使用者禁止修改使用者名稱', ko: '🔒 생성된 사용자의 사용자 이름은 변경할 수 없습니다', ja: '🔒 作成済みユーザーのユーザー名は変更できません' },
  '重置密码 (留空保持原密码不变)': { en: 'Reset Password (Leave blank to keep unchanged)', 'zh-TW': '重設密碼 (留空保持原密碼不變)', ko: '비밀번호 재설정 (비워두면 기존 비밀번호 유지)', ja: 'パスワード再設定 (空欄の場合は変更なし)' },
  '用户角色权限': { en: 'User Role & Permissions', 'zh-TW': '使用者角色權限', ko: '사용자 역할 및 권한', ja: 'ユーザーの役割と権限' },
  '系统管理员 (Admin)': { en: 'System Admin (Admin)', 'zh-TW': '系統管理員 (Admin)', ko: '시스템 관리자 (Admin)', ja: 'システム管理者 (Admin)' },
  '💡 正在编辑自身账号，无法降级管理员权限': {
    en: '💡 Editing current account; admin privileges cannot be downgraded',
    'zh-TW': '💡 正在編輯自身帳號，無法降級管理員權限',
    ko: '💡 본인 계정 수정 중에는 관리자 권한을 강등할 수 없습니다',
    ja: '💡 自身のアカウントを編集中です。管理者権限の降格はできません'
  },
  '加载 Vault 列表中…': { en: 'Loading vaults list…', 'zh-TW': '載入 Vault 清單中…', ko: 'Vault 목록 불러오는 중…', ja: 'Vault 一覧を読み込み中…' },
  '修改将即时生效': { en: 'Changes take effect immediately', 'zh-TW': '修改將即時生效', ko: '변경사항이 즉시 적용됩니다', ja: '変更は即座に有効になります' },
  '保存修改': { en: 'Save Changes', 'zh-TW': '儲存修改', ko: '변경사항 저장', ja: '変更を保存' }
};

// Add to PHRASE_MAP
const phraseMapStart = currentCode.indexOf('const PHRASE_MAP = {');
if (phraseMapStart !== -1) {
  const insertPos = currentCode.indexOf('{', phraseMapStart) + 1;
  let serializedPhrases = '';
  for (const [key, translations] of Object.entries(COMPREHENSIVE_DICT)) {
    serializedPhrases += `\n    ${JSON.stringify(key)}: ${JSON.stringify(translations)},`;
  }
  currentCode = currentCode.slice(0, insertPos) + serializedPhrases + currentCode.slice(insertPos);
  fs.writeFileSync(i18nPath, currentCode, 'utf8');
  console.log('Successfully injected comprehensive UI dictionary into i18n.js');
}
