const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./config');

const SPONSORS_FILE = path.join(DATA_DIR, 'sponsors.json');

const INITIAL_SPONSORS = [
  {
    id: 'sp_01',
    date: '26/06/18',
    name: 'i_orange',
    color: '#ea580c',
    message: '感谢开发出这么好的插件，希望能越做越好！',
    amount: '90.00',
    currency: '¥',
    platform: 'wechat',
    timestamp: 1781740800000,
  },
  {
    id: 'sp_02',
    date: '26/06/08',
    name: 'southzen',
    color: '#e11d48',
    message: '再次支持！加油！！！',
    amount: '90.00',
    currency: '¥',
    platform: 'wechat',
    timestamp: 1780876800000,
  },
  {
    id: 'sp_03',
    date: '26/06/17',
    name: '火气',
    color: '#0d9488',
    message: '感谢你的作品，希望继续更新！谢谢',
    amount: '68.00',
    currency: '¥',
    platform: 'wechat',
    timestamp: 1781654400000,
  },
  {
    id: 'sp_04',
    date: '26/06/20',
    name: '旭平',
    color: '#16a34a',
    message: '兄弟，太强了，你治好了我的选择困难症，所有终端秒级同步，还能OSS、Git备份！',
    amount: '60.00',
    currency: '¥',
    platform: 'wechat',
    timestamp: 1781913600000,
  },
  {
    id: 'sp_05',
    date: '26/06/12',
    name: '陈威利',
    color: '#4f46e5',
    message: '🥤',
    amount: '60.00',
    currency: '¥',
    platform: 'wechat',
    timestamp: 1781222400000,
  },
  {
    id: 'sp_06',
    date: '26/06/05',
    name: '風車轉啊轉',
    color: '#9333ea',
    message: '希望持续更新，越做越好',
    amount: '60.00',
    currency: '¥',
    platform: 'wechat',
    timestamp: 1780617600000,
  },
  {
    id: 'sp_07',
    date: '26/06/08',
    name: 'snklvm',
    color: '#0284c7',
    message: '非常有用，支持一下',
    amount: '38.00',
    currency: '¥',
    platform: 'wechat',
    timestamp: 1780876800000,
  },
  {
    id: 'sp_08',
    date: '26/06/22',
    name: 'buptxxn',
    color: '#059669',
    message: '感谢大神 使用了一个多星期了 很流畅',
    amount: '30.00',
    currency: '¥',
    platform: 'wechat',
    timestamp: 1782086400000,
  },
  {
    id: 'sp_09',
    date: '26/06/21',
    name: 'liviter',
    color: '#0891b2',
    message: '插件非常棒，感谢开发，小小心意',
    amount: '30.00',
    currency: '¥',
    platform: 'wechat',
    timestamp: 1782000000000,
  },
  {
    id: 'sp_10',
    date: '26/06/20',
    name: 'JRS',
    color: '#06b6d4',
    message: '喝咖啡',
    amount: '30.00',
    currency: '¥',
    platform: 'kofi',
    timestamp: 1781913600000,
  },
  {
    id: 'sp_11',
    date: '26/06/17',
    name: '互动海洋',
    color: '#10b981',
    message: '谢谢，比 syncthing 好太多',
    amount: '30.00',
    currency: '¥',
    platform: 'wechat',
    timestamp: 1781654400000,
  },
  {
    id: 'sp_12',
    date: '26/06/16',
    name: 'Evan',
    color: '#a855f7',
    message: '好工具必须支持',
    amount: '30.00',
    currency: '¥',
    platform: 'wechat',
    timestamp: 1781568000000,
  },
  {
    id: 'sp_13',
    date: '26/06/09',
    name: 'Yunfei',
    color: '#22c55e',
    message: '加油，继续更新优化',
    amount: '30.00',
    currency: '¥',
    platform: 'wechat',
    timestamp: 1780963200000,
  },
  {
    id: 'sp_14',
    date: '26/06/07',
    name: '浮生若茶',
    color: '#6366f1',
    message: '真好用，继续努力',
    amount: '30.00',
    currency: '¥',
    platform: 'wechat',
    timestamp: 1780790400000,
  },
];

const DEFAULT_CONFIG = {
  kofiUrl: 'https://ko-fi.com/haierkeys',
  kofiLabel: '请作者喝杯咖啡',
  wechatQrUrl: '', // base64 or URL
  wechatLabel: '微信打赏支持',
  alipayQrUrl: '',
  descriptionText: '如果这个项目帮助到您，并且想要它继续开发，请在以下方式支持我们，感谢您对开源软件的支持！',
};

let data = {
  config: { ...DEFAULT_CONFIG },
  sponsors: [...INITIAL_SPONSORS],
};

function load() {
  if (fs.existsSync(SPONSORS_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(SPONSORS_FILE, 'utf8'));
      data.config = { ...DEFAULT_CONFIG, ...(parsed.config || {}) };
      data.sponsors = Array.isArray(parsed.sponsors) && parsed.sponsors.length > 0 ? parsed.sponsors : [...INITIAL_SPONSORS];
    } catch {
      data = { config: { ...DEFAULT_CONFIG }, sponsors: [...INITIAL_SPONSORS] };
    }
  } else {
    save();
  }
}

function save() {
  try {
    fs.writeFileSync(SPONSORS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Sponsors] Save error:', err);
  }
}

// Initial load
load();

function getAll() {
  return {
    config: data.config,
    sponsors: data.sponsors,
    totalAmount: data.sponsors.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toFixed(2),
    count: data.sponsors.length,
  };
}

function updateConfig(newConfig) {
  data.config = { ...data.config, ...newConfig };
  save();
  return data.config;
}

function addSponsor(entry) {
  const colors = ['#ea580c', '#e11d48', '#0d9488', '#16a34a', '#4f46e5', '#9333ea', '#0284c7', '#059669', '#a855f7'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const defaultDate = `${String(now.getFullYear()).slice(-2)}/${pad(now.getMonth() + 1)}/${pad(now.getDate())}`;

  const newEntry = {
    id: 'sp_' + Date.now().toString(36),
    date: entry.date || defaultDate,
    name: entry.name || '匿名支持者',
    color: entry.color || randomColor,
    message: entry.message || '支持开源！',
    amount: (parseFloat(entry.amount) || 10).toFixed(2),
    currency: entry.currency || '¥',
    platform: entry.platform || 'wechat',
    timestamp: Date.now(),
  };

  data.sponsors.unshift(newEntry);
  save();
  return newEntry;
}

function deleteSponsor(id) {
  const initialLen = data.sponsors.length;
  data.sponsors = data.sponsors.filter((s) => s.id !== id);
  if (data.sponsors.length !== initialLen) {
    save();
    return true;
  }
  return false;
}

module.exports = {
  load,
  getAll,
  updateConfig,
  addSponsor,
  deleteSponsor,
};
