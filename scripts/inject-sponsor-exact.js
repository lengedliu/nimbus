const fs = require('fs');
const path = require('path');

const i18nPath = path.join(__dirname, '..', 'public', 'i18n.js');
let currentCode = fs.readFileSync(i18nPath, 'utf8');

const newPhrases = {
  "如果这个项目帮助到您，并且想要它继续开发，请在以下方式支持我们，感谢您对开源软件的支持！": {
    en: "If this project has helped you and you'd like to support continued development, please consider supporting us below. Thank you for supporting open source!",
    "zh-TW": "如果這個專案幫助到您，並且想要它繼續開發，請在以下方式支持我們，感謝您對開源軟體的支持！",
    ko: "이 프로젝트가 도움이 되었고 지속적인 개발을 원하신다면 아래 방법으로 후원해 주세요. 오픈소스에 대한 성원에 감사드립니다!",
    ja: "このプロジェクトがお役に立ち、継続的な開発を応援していただける場合は、以下の方法でご支援をお願いいたします。オープンソースへのご支援に感謝します！"
  },
  "支持该项目": {
    en: "Support This Project",
    "zh-TW": "支持該專案",
    ko: "프로젝트 후원하기",
    ja: "プロジェクトを支援"
  }
};

const phraseMapStart = currentCode.indexOf('const PHRASE_MAP = {');
if (phraseMapStart !== -1) {
  const insertPos = currentCode.indexOf('{', phraseMapStart) + 1;
  let serializedPhrases = '';
  for (const [key, translations] of Object.entries(newPhrases)) {
    serializedPhrases += `\n    ${JSON.stringify(key)}: ${JSON.stringify(translations)},`;
  }
  currentCode = currentCode.slice(0, insertPos) + serializedPhrases + currentCode.slice(insertPos);
  fs.writeFileSync(i18nPath, currentCode, 'utf8');
  console.log('Successfully injected phrase into i18n.js');
}
