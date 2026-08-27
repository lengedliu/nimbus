const https = require('https');
const http = require('http');
const url = require('url');
const crypto = require('crypto');
const settings = require('./settings');

/**
 * Webhook event types:
 *  - 'conflict.detected'
 *  - 'conflict.resolved'
 *  - 'backup.created'
 *  - 'device.connected'
 *  - 'file.deleted'
 *  - 'trash.emptied'
 */

function getWebhookConfig() {
  return settings.get('webhook_config') || {
    enabled: false,
    platform: 'custom', // 'custom' | 'feishu' | 'dingtalk' | 'wecom' | 'discord' | 'telegram'
    url: '',
    secret: '',
    events: ['conflict.detected', 'conflict.resolved', 'backup.created'],
  };
}

function saveWebhookConfig(config) {
  const current = getWebhookConfig();
  const updated = {
    ...current,
    ...config,
    enabled: Boolean(config.enabled),
    platform: config.platform || 'custom',
    url: (config.url || '').trim(),
    secret: (config.secret || '').trim(),
    events: Array.isArray(config.events) ? config.events : current.events,
  };
  settings.set('webhook_config', updated);
  return updated;
}

function formatPayload(platform, event, data, secret) {
  const nowStr = new Date().toLocaleString();
  let title = '☁️ Nimbus 同步通知';
  let text = '';

  switch (event) {
    case 'conflict.detected':
      title = '⚠️ 发现笔记并发同步冲突';
      text = `笔记库 [${data.vaultName || data.vaultId}] 发现冲突副本:\n• 文件: ${data.path}\n• 冲突副本: ${data.conflictPath}\n• 时间: ${nowStr}`;
      break;
    case 'conflict.resolved':
      title = '✅ 笔记同步冲突已解决';
      text = `笔记库 [${data.vaultName || data.vaultId}] 冲突已处理:\n• 原文件: ${data.basePath}\n• 策略: ${data.resolution}\n• 时间: ${nowStr}`;
      break;
    case 'backup.created':
      title = '💾 笔记库快照备份已生成';
      text = `笔记库 [${data.vaultName || data.vaultId}] 成功创建全库备份:\n• 备份文件: ${data.filename}\n• 大小: ${Math.round((data.size || 0) / 1024)} KB\n• 时间: ${nowStr}`;
      break;
    case 'device.connected':
      title = '📱 新设备接入同步';
      text = `用户 [${data.username}] 的设备已连接:\n• 设备名: ${data.deviceName}\n• IP: ${data.clientIp || 'Unknown'}\n• 时间: ${nowStr}`;
      break;
    case 'file.deleted':
      title = '🗑️ 文件已移入回收站';
      text = `笔记库 [${data.vaultName || data.vaultId}]:\n• 路径: ${data.path}\n• 操作者: ${data.username || 'System'}\n• 时间: ${nowStr}`;
      break;
    case 'test':
      title = '🧪 Nimbus Webhook 测试通知';
      text = `恭喜！您的 Nimbus Sync Server 告警与通知集成配置成功。\n• 触发时间: ${nowStr}\n• 运行模式: 实时 Webhook`;
      break;
    default:
      text = `Nimbus 事件 [${event}]: ${JSON.stringify(data)}`;
  }

  if (platform === 'feishu') {
    return {
      msg_type: 'interactive',
      card: {
        header: {
          title: { tag: 'plain_text', content: title },
          template: event.includes('conflict.detected') ? 'orange' : event.includes('resolved') || event.includes('backup') ? 'green' : 'blue',
        },
        elements: [
          {
            tag: 'div',
            text: { tag: 'lark_md', content: text.replace(/\n/g, '\n\n') },
          },
          {
            tag: 'note',
            elements: [{ tag: 'plain_text', content: '来自 Nimbus Sync Server 实时通知服务' }],
          },
        ],
      },
    };
  }

  if (platform === 'dingtalk') {
    let reqUrl = '';
    return {
      msgtype: 'markdown',
      markdown: {
        title: title,
        text: `### ${title}\n\n${text.replace(/\n/g, '\n\n')}\n\n> *来自 Nimbus Sync Server*`,
      },
    };
  }

  if (platform === 'wecom') {
    return {
      msgtype: 'markdown',
      markdown: {
        content: `### ${title}\n${text}\n> <font color="comment">来自 Nimbus Sync Server</font>`,
      },
    };
  }

  if (platform === 'discord') {
    return {
      embeds: [
        {
          title: title,
          description: text,
          color: event.includes('conflict.detected') ? 0xf59e0b : 0x10b981,
          footer: { text: 'Nimbus Sync Server' },
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  // Custom generic JSON POST
  return {
    event,
    title,
    message: text,
    data,
    timestamp: Date.now(),
  };
}

function sendHttpRequest(targetUrl, payload) {
  return new Promise((resolve, reject) => {
    if (!targetUrl || !targetUrl.startsWith('http')) {
      return reject(new Error('无效的 Webhook URL 地址'));
    }

    const parsed = url.parse(targetUrl);
    const postData = JSON.stringify(payload);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Nimbus-Sync-Server/1.1',
      },
      timeout: 6000,
    };

    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ ok: true, statusCode: res.statusCode, body });
        } else {
          resolve({ ok: false, statusCode: res.statusCode, body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Webhook 请求超时 (6s)'));
    });

    req.write(postData);
    req.end();
  });
}

async function trigger(event, data = {}) {
  const config = getWebhookConfig();
  if (!config.enabled || !config.url) return;
  if (config.events && !config.events.includes(event) && event !== 'test') return;

  try {
    const payload = formatPayload(config.platform, event, data, config.secret);
    let targetUrl = config.url;

    // Handle DingTalk signature if secret provided
    if (config.platform === 'dingtalk' && config.secret) {
      const timestamp = Date.now();
      const stringToSign = `${timestamp}\n${config.secret}`;
      const sign = encodeURIComponent(
        crypto.createHmac('sha256', config.secret).update(stringToSign).digest('base64')
      );
      targetUrl += (targetUrl.includes('?') ? '&' : '?') + `timestamp=${timestamp}&sign=${sign}`;
    }

    await sendHttpRequest(targetUrl, payload);
  } catch (err) {
    console.error(`[Webhook] Failed to send webhook for event "${event}":`, err.message);
  }
}

async function testWebhook(configOverride = null) {
  const config = configOverride || getWebhookConfig();
  if (!config.url) throw new Error('请先填写 Webhook 接收 URL 地址');

  const payload = formatPayload(config.platform, 'test', { test: true }, config.secret);
  let targetUrl = config.url;

  if (config.platform === 'dingtalk' && config.secret) {
    const timestamp = Date.now();
    const stringToSign = `${timestamp}\n${config.secret}`;
    const sign = encodeURIComponent(
      crypto.createHmac('sha256', config.secret).update(stringToSign).digest('base64')
    );
    targetUrl += (targetUrl.includes('?') ? '&' : '?') + `timestamp=${timestamp}&sign=${sign}`;
  }

  const result = await sendHttpRequest(targetUrl, payload);
  if (!result.ok) {
    throw new Error(`目标服务器返回状态码 ${result.statusCode}: ${result.body || '无响应内容'}`);
  }
  return { ok: true, message: `Webhook 测试通知发送成功 (HTTP ${result.statusCode})` };
}

module.exports = {
  getWebhookConfig,
  saveWebhookConfig,
  trigger,
  testWebhook,
};
