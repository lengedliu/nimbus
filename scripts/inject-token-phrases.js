const fs = require('fs');
const path = require('path');

const i18nPath = path.join(__dirname, '..', 'public', 'i18n.js');
let currentCode = fs.readFileSync(i18nPath, 'utf8');

const TOKEN_PHRASES = {
  "设备专属令牌": {
    en: "Dedicated Device Tokens",
    "zh-TW": "裝置專屬權杖",
    ko: "기기 전용 토큰",
    ja: "デバイス専用トークン"
  },
  "🔑 设备专属令牌": {
    en: "🔑 Dedicated Device Tokens",
    "zh-TW": "🔑 裝置專屬權杖",
    ko: "🔑 기기 전용 토큰",
    ja: "🔑 デバイス専用トークン"
  },
  "多端专属设备令牌 (Device Access Tokens)": {
    en: "Multi-Device Access Tokens (Device Access Tokens)",
    "zh-TW": "多端專屬裝置權杖 (Device Access Tokens)",
    ko: "멀티 디바이스 전용 기기 토큰 (Device Access Tokens)",
    ja: "マルチデバイス専用トークン (Device Access Tokens)"
  },
  "🔑 多端专属设备令牌 (Device Access Tokens)": {
    en: "🔑 Multi-Device Access Tokens (Device Access Tokens)",
    "zh-TW": "🔑 多端專屬裝置權杖 (Device Access Tokens)",
    ko: "🔑 멀티 디바이스 전용 기기 토큰 (Device Access Tokens)",
    ja: "🔑 マルチデバイス専用トークン (Device Access Tokens)"
  },
  "为每台设备（如 MacBook、iPhone、Windows 办公电脑）签发独立 Token，支持随时查看、复制、到期延期、重新生成与注销，各端独立鉴权便于安全管理": {
    en: "Issue independent tokens for each device (e.g. MacBook, iPhone, Windows PC), with support for viewing, copying, extending expiry, renewing, and revoking for secure multi-device management.",
    "zh-TW": "為每台裝置（如 MacBook、iPhone、Windows 辦公電腦）簽發獨立權杖，支援隨時檢視、複製、到期延期、重新產生與註銷，各端獨立鑑權便於安全管理。",
    ko: "각 기기(MacBook, iPhone, Windows PC 등)별 독립 토큰을 발급하여 조회, 복사, 만료 연장, 재발급 및 취소를 지원하며, 안전한 기기별 인증 관리가 가능합니다.",
    ja: "各デバイス（MacBook、iPhone、Windows PC など）に独立したトークンを発行し、確認・コピー・有効期限延長・再生成・失効をいつでも行えます。"
  },
  "设备名称 / 备注": {
    en: "Device Name / Note",
    "zh-TW": "裝置名稱 / 備註",
    ko: "기기 이름 / 메모",
    ja: "デバイス名 / 備考"
  },
  "访问令牌 (Token)": {
    en: "Access Token",
    "zh-TW": "存取權杖 (Token)",
    ko: "액세스 토큰 (Token)",
    ja: "アクセストークン (Token)"
  },
  "令牌期限": {
    en: "Token Validity",
    "zh-TW": "權杖期限",
    ko: "토큰 유효기간",
    ja: "トークン有効期限"
  },
  "令牌有效期 (Token Expiration)": {
    en: "Token Expiration",
    "zh-TW": "權杖有效期限 (Token Expiration)",
    ko: "토큰 유효기간 (Token Expiration)",
    ja: "トークン有効期限 (Token Expiration)"
  },
  "新建专属设备 Token": {
    en: "Create New Device Token",
    "zh-TW": "新建專屬裝置 Token",
    ko: "새 기기 전용 토큰 생성",
    ja: "新規デバイス専用 Token を作成"
  },
  "➕ 新建专属设备 Token": {
    en: "➕ Create New Device Token",
    "zh-TW": "➕ 新建專屬裝置 Token",
    ko: "➕ 새 기기 전용 토큰 생성",
    ja: "➕ 新規デバイス専用 Token を作成"
  },
  "创建后系统将自动保存并支持随时查看或复制，可直接用于 Obsidian 同步插件鉴权": {
    en: "Once created, the token is saved for quick viewing or copying, and can be used directly for Obsidian sync plugin authentication.",
    "zh-TW": "建立後系統將自動儲存並支援隨時檢視或複製，可直接用於 Obsidian 同步外掛鑑權。",
    ko: "생성 후 시스템에 자동 저장되어 언제든지 확인 및 복사가 가능하며, Obsidian 동기화 플러그인 인증에 직접 사용할 수 있습니다.",
    ja: "作成後はいつでも確認・コピー可能で、Obsidian 同期プラグインの認証に直接利用できます。"
  },
  "设备名称 / 备注 (如: iMac 27-inch, iPhone 16)": {
    en: "Device Name / Note (e.g. iMac 27-inch, iPhone 16)",
    "zh-TW": "裝置名稱 / 備註 (如: iMac 27-inch, iPhone 16)",
    ko: "기기 이름 / 메모 (예: iMac 27-inch, iPhone 16)",
    ja: "デバイス名 / 備考 (例: iMac 27-inch, iPhone 16)"
  },
  "＋ 生成设备 Token": {
    en: "＋ Generate Device Token",
    "zh-TW": "＋ 產生裝置 Token",
    ko: "＋ 기기 Token 생성",
    ja: "＋ デバイス Token を生成"
  },
  "暂无专属设备令牌，您可点击下方创建": {
    en: "No device tokens found. You can create one below.",
    "zh-TW": "暫無專屬裝置權杖，您可點擊下方建立",
    ko: "등록된 기기 토큰이 없습니다. 아래에서 새로 생성할 수 있습니다.",
    ja: "デバイス専用トークンはありません。下部から作成できます。"
  },
  "从未使用": {
    en: "Never used",
    "zh-TW": "從未使用",
    ko: "사용한 적 없음",
    ja: "未使用"
  },
  "⚡ 配置": {
    en: "⚡ Config",
    "zh-TW": "⚡ 設定",
    ko: "⚡ 설정",
    ja: "⚡ 設定"
  },
  "⏳ 延期": {
    en: "⏳ Extend",
    "zh-TW": "⏳ 延期",
    ko: "⏳ 연장",
    ja: "⏳ 延長"
  },
  "🔄 重签": {
    en: "🔄 Renew",
    "zh-TW": "🔄 重簽",
    ko: "🔄 재발급",
    ja: "🔄 再生成"
  },
  "注销": {
    en: "Revoke",
    "zh-TW": "註銷",
    ko: "취소",
    ja: "失効"
  },
  "👁️ 查看": {
    en: "👁️ View",
    "zh-TW": "👁️ 檢視",
    ko: "👁️ 보기",
    ja: "👁️ 表示"
  },
  "🙈 隐藏": {
    en: "🙈 Hide",
    "zh-TW": "🙈 隱藏",
    ko: "🙈 숨기기",
    ja: "🙈 非表示"
  },
  "30 天": {
    en: "30 Days",
    "zh-TW": "30 天",
    ko: "30일",
    ja: "30日"
  },
  "90 天": {
    en: "90 Days",
    "zh-TW": "90 天",
    ko: "90일",
    ja: "90日"
  },
  "1 年 (365 天)": {
    en: "1 Year (365 Days)",
    "zh-TW": "1 年 (365 天)",
    ko: "1년 (365일)",
    ja: "1年 (365日)"
  },
  "永久有效 (10 年)": {
    en: "Never Expires (10 Years)",
    "zh-TW": "永久有效 (10 年)",
    ko: "무기한 (10년)",
    ja: "無期限 (10年)"
  },
  "+ 30 天 (1 个月)": {
    en: "+ 30 Days (1 Month)",
    "zh-TW": "+ 30 天 (1 個月)",
    ko: "+ 30일 (1개월)",
    ja: "+ 30日 (1ヶ月)"
  },
  "+ 90 天 (3 个月)": {
    en: "+ 90 Days (3 Months)",
    "zh-TW": "+ 90 天 (3 個月)",
    ko: "+ 90일 (3개월)",
    ja: "+ 90日 (3ヶ月)"
  },
  "+ 1 年 (365 天)": {
    en: "+ 1 Year (365 Days)",
    "zh-TW": "+ 1 年 (365 天)",
    ko: "+ 1년 (365일)",
    ja: "+ 1年 (365日)"
  },
  "+ 永久有效 (10 年)": {
    en: "+ Never Expires (10 Years)",
    "zh-TW": "+ 永久有效 (10 年)",
    ko: "+ 무기한 (10년)",
    ja: "+ 無期限 (10年)"
  },
  "⏳ 延长设备令牌有效期": {
    en: "⏳ Extend Device Token Expiration",
    "zh-TW": "⏳ 延長裝置權杖有效期限",
    ko: "⏳ 기기 토큰 유효기간 연장",
    ja: "⏳ デバイストークン有効期限を延長"
  },
  "选择延长时长 (Extend Duration)": {
    en: "Select Extension Duration",
    "zh-TW": "選擇延長時長 (Extend Duration)",
    ko: "연장 기간 선택 (Extend Duration)",
    ja: "延長期間を選択 (Extend Duration)"
  },
  "平滑延期说明": {
    en: "Seamless Extension Details",
    "zh-TW": "平滑延期說明",
    ko: "연장 안내",
    ja: "スムーズ延長について"
  },
  "⏳ 确认延长有效期": {
    en: "⏳ Confirm Extension",
    "zh-TW": "⏳ 確認延長有效期限",
    ko: "⏳ 유효기간 연장 확인",
    ja: "⏳ 延長を確認"
  },
  "🔄 重新生成设备访问令牌": {
    en: "🔄 Regenerate Device Access Token",
    "zh-TW": "🔄 重新產生裝置存取權杖",
    ko: "🔄 기기 액세스 토큰 재발급",
    ja: "🔄 デバイスアクセストークンを再生成"
  },
  "安全重置提醒": {
    en: "Security Reset Notice",
    "zh-TW": "安全重設提醒",
    ko: "보안 재설정 안내",
    ja: "セキュリティ再設定に関する注意"
  },
  "⚠️ 安全重置提醒": {
    en: "⚠️ Security Reset Notice",
    "zh-TW": "⚠️ 安全重設提醒",
    ko: "⚠️ 보안 재설정 안내",
    ja: "⚠️ セキュリティ再設定に関する注意"
  },
  "新令牌有效期 (Token Expiration)": {
    en: "New Token Expiration",
    "zh-TW": "新權杖有效期限 (Token Expiration)",
    ko: "새 토큰 유효기간 (Token Expiration)",
    ja: "新規トークン有効期限 (Token Expiration)"
  },
  "🔄 确认重新生成": {
    en: "🔄 Confirm Regeneration",
    "zh-TW": "🔄 確認重新產生",
    ko: "🔄 재발급 확인",
    ja: "🔄 再生成を確認"
  },
  "🎉 新令牌生成成功": {
    en: "🎉 New Token Generated Successfully",
    "zh-TW": "🎉 新權杖產生成功",
    ko: "🎉 새 토큰 생성 완료",
    ja: "🎉 新規トークンの生成に成功しました"
  },
  "注销设备专属令牌": {
    en: "Revoke Device Token",
    "zh-TW": "註銷裝置專屬權杖",
    ko: "기기 전용 토큰 취소",
    ja: "デバイス専用トークンを失効"
  },
  "确认注销": {
    en: "Confirm Revocation",
    "zh-TW": "確認註銷",
    ko: "취소 확인",
    ja: "失効を確認"
  },
  "推荐在「设备专属令牌」标签页为每个端创建独立 Token": {
    en: "Recommended to create independent tokens for each device under the \"Dedicated Device Tokens\" tab",
    "zh-TW": "推薦在「裝置專屬權杖」標籤頁為每個端建立獨立 Token",
    ko: "「기기 전용 토큰」 탭에서 기기별로 독립된 Token을 생성하는 것을 권장합니다",
    ja: "「デバイス専用トークン」タブで端末ごとに個別の Token を作成することをお勧めします"
  },
  "📋 复制 data.json 配置": {
    en: "📋 Copy data.json Config",
    "zh-TW": "📋 複製 data.json 設定",
    ko: "📋 data.json 설정 복사",
    ja: "📋 data.json 設定をコピー"
  }
};

const phraseMapStart = currentCode.indexOf('const PHRASE_MAP = {');
if (phraseMapStart !== -1) {
  const insertPos = currentCode.indexOf('{', phraseMapStart) + 1;
  let serializedPhrases = '';
  for (const [key, translations] of Object.entries(TOKEN_PHRASES)) {
    serializedPhrases += `\n    ${JSON.stringify(key)}: ${JSON.stringify(translations)},`;
  }
  currentCode = currentCode.slice(0, insertPos) + serializedPhrases + currentCode.slice(insertPos);
  fs.writeFileSync(i18nPath, currentCode, 'utf8');
  console.log('Successfully injected TOKEN_PHRASES into PHRASE_MAP.');
} else {
  console.error('Could not locate PHRASE_MAP in i18n.js');
}
