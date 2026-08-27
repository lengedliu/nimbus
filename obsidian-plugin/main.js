const { Plugin, PluginSettingTab, Setting, Notice, TFile, TFolder, arrayBufferToBase64, base64ToArrayBuffer } = require('obsidian');

const DEFAULT_SETTINGS = {
  serverUrl: 'http://192.168.50.154:8787',
  username: '',
  password: '',
  token: '',
  vaultId: '',
  vaultName: '',
  deviceId: 'Obsidian Device',
  autoSync: true,
  syncIntervalSeconds: 30
};

module.exports = class NimbusSyncPlugin extends Plugin {
  async onload() {
    await this.loadSettings();

    // Default device ID if empty
    if (!this.settings.deviceId) {
      this.settings.deviceId = 'Obsidian-' + Math.random().toString(36).substring(2, 7);
      await this.saveSettings();
    }

    this.localChangeQueue = new Map();
    this.isApplyingRemoteChange = false;
    this.fileHashes = new Map();
    this.reconnectTimer = null;
    this.pingTimer = null;

    // Ribbon icon for quick sync
    this.addRibbonIcon('refresh-cw', 'Nimbus 同步', () => {
      this.manualSync();
    });

    // Status bar indicator
    this.statusBarItem = this.addStatusBarItem();
    this.updateStatusBar('idle', '☁️ Nimbus: 就绪');

    // Setting Tab
    this.addSettingTab(new NimbusSettingTab(this.app, this));

    // Vault Event Listeners
    this.registerEvent(this.app.vault.on('modify', (file) => this.onLocalFileChange('modify', file)));
    this.registerEvent(this.app.vault.on('create', (file) => this.onLocalFileChange('create', file)));
    this.registerEvent(this.app.vault.on('delete', (file) => this.onLocalFileDelete(file)));
    this.registerEvent(this.app.vault.on('rename', (file, oldPath) => this.onLocalFileRename(file, oldPath)));

    // Auto connect on startup
    if (this.settings.autoSync && this.settings.token && this.settings.vaultId) {
      this.connectWebSocket();
    }
  }

  onunload() {
    this.disconnectWebSocket();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingTimer) clearInterval(this.pingTimer);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  updateStatusBar(status, customText) {
    if (!this.statusBarItem) return;
    switch (status) {
      case 'syncing':
        this.statusBarItem.setText('☁️ Nimbus: 正在同步...');
        break;
      case 'connected':
        this.statusBarItem.setText('☁️ Nimbus: 实时连接中');
        break;
      case 'error':
        this.statusBarItem.setText('☁️ Nimbus: 同步中断');
        break;
      case 'idle':
      default:
        this.statusBarItem.setText(customText || '☁️ Nimbus: 就绪');
        break;
    }
  }

  getCleanServerUrl() {
    return (this.settings.serverUrl || '').trim().replace(/\/+$/, '');
  }

  // --- API Authentication & Vaults ---
  async login() {
    const baseUrl = this.getCleanServerUrl();
    if (!baseUrl) {
      new Notice('❌ 请先填写服务器地址');
      return false;
    }

    try {
      const resp = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: this.settings.username,
          password: this.settings.password
        })
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      this.settings.token = data.token;
      await this.saveSettings();

      // Fetch user's vaults
      await this.fetchVaults();

      new Notice('✅ 成功登录到 Nimbus 服务器！');
      return true;
    } catch (e) {
      new Notice(`❌ 登录失败: ${e.message}`);
      return false;
    }
  }

  async fetchVaults() {
    const baseUrl = this.getCleanServerUrl();
    if (!this.settings.token) return [];

    try {
      const resp = await fetch(`${baseUrl}/api/vaults`, {
        headers: { 'Authorization': `Bearer ${this.settings.token}` }
      });
      if (!resp.ok) return [];
      const data = await resp.json();
      this.availableVaults = data.vaults || [];
      
      // Auto select first vault if none selected
      if (this.availableVaults.length > 0 && (!this.settings.vaultId || !this.availableVaults.some(v => v.id === this.settings.vaultId))) {
        this.settings.vaultId = this.availableVaults[0].id;
        this.settings.vaultName = this.availableVaults[0].name;
        await this.saveSettings();
      }
      return this.availableVaults;
    } catch (err) {
      console.error('[Nimbus] 获取 Vault 列表失败:', err);
      return [];
    }
  }

  async createVault(name) {
    const baseUrl = this.getCleanServerUrl();
    if (!this.settings.token) return null;

    try {
      const resp = await fetch(`${baseUrl}/api/vaults`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.settings.token}`
        },
        body: JSON.stringify({ name })
      });
      if (!resp.ok) throw new Error('创建失败');
      const data = await resp.json();
      await this.fetchVaults();
      return data.vault;
    } catch (err) {
      new Notice(`❌ 创建 Vault 失败: ${err.message}`);
      return null;
    }
  }

  // --- WebSocket Connection ---
  connectWebSocket() {
    this.disconnectWebSocket();

    if (!this.settings.token || !this.settings.vaultId) {
      this.updateStatusBar('idle', '☁️ Nimbus: 未配置');
      return;
    }

    const baseUrl = this.getCleanServerUrl();
    const wsProto = baseUrl.startsWith('https:') ? 'wss:' : 'ws:';
    const host = baseUrl.replace(/^https?:\/\//i, '');
    const wsUrl = `${wsProto}//${host}/ws?token=${encodeURIComponent(this.settings.token)}&vaultId=${encodeURIComponent(this.settings.vaultId)}&deviceId=${encodeURIComponent(this.settings.deviceId)}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.updateStatusBar('connected');
        new Notice('☁️ Nimbus 实时双向同步已连接');

        // Start ping heartbeat
        if (this.pingTimer) clearInterval(this.pingTimer);
        this.pingTimer = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      this.ws.onmessage = async (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          await this.handleServerMessage(msg);
        } catch (err) {
          console.error('[Nimbus] 解析服务器消息异常:', err);
        }
      };

      this.ws.onclose = (e) => {
        this.updateStatusBar('idle', '☁️ Nimbus: 连接已断开');
        if (this.pingTimer) clearInterval(this.pingTimer);
        // Auto reconnect
        if (this.settings.autoSync) {
          if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => this.connectWebSocket(), 5000);
        }
      };

      this.ws.onerror = (err) => {
        console.error('[Nimbus] WebSocket 错误:', err);
        this.updateStatusBar('error');
      };
    } catch (err) {
      console.error('[Nimbus] 连接初始化失败:', err);
      this.updateStatusBar('error');
    }
  }

  disconnectWebSocket() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // --- Server Message Handling ---
  async handleServerMessage(msg) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'init':
        // Initial sync manifest check
        await this.syncManifest(msg.manifest || {});
        break;

      case 'change':
        // A file was created/updated remotely
        await this.applyRemoteChange(msg.path, msg.content, msg.mtime, msg.hash);
        break;

      case 'deleted':
        // A file was deleted remotely
        await this.applyRemoteDelete(msg.path);
        break;

      case 'conflict':
        new Notice(`⚠️ 检测到并发冲突！已自动创建冲突副本: ${msg.conflictPath}`);
        break;

      case 'file':
        // Response to pull
        await this.applyRemoteChange(msg.path, msg.content, msg.mtime, msg.hash);
        break;

      case 'ack':
        if (msg.hash) {
          this.fileHashes.set(msg.path, msg.hash);
        }
        break;

      case 'pong':
        break;

      case 'error':
        console.warn('[Nimbus] 服务器返回错误:', msg.message);
        break;
    }
  }

  async syncManifest(remoteManifest) {
    const files = this.app.vault.getFiles();
    const localFileMap = new Map();
    for (const f of files) {
      localFileMap.set(f.path, f);
    }

    // Pull missing or newer files from server
    for (const [remotePath, meta] of Object.entries(remoteManifest)) {
      const localFile = localFileMap.get(remotePath);
      if (!localFile) {
        // Request download
        this.sendWsMessage({ type: 'pull', path: remotePath });
      }
    }

    // Push local files not in remote manifest
    for (const f of files) {
      if (!remoteManifest[f.path]) {
        await this.pushLocalFile(f);
      }
    }
  }

  async applyRemoteChange(filePath, base64Content, mtime, hash) {
    if (!filePath || !base64Content) return;
    this.isApplyingRemoteChange = true;

    try {
      const buffer = base64ToArrayBuffer(base64Content);
      const existing = this.app.vault.getAbstractFileByPath(filePath);

      if (existing instanceof TFile) {
        await this.app.vault.modifyBinary(existing, buffer);
      } else {
        // Ensure parent directories exist
        const parts = filePath.split('/');
        if (parts.length > 1) {
          let currentPath = '';
          for (let i = 0; i < parts.length - 1; i++) {
            currentPath += (currentPath ? '/' : '') + parts[i];
            if (!this.app.vault.getAbstractFileByPath(currentPath)) {
              await this.app.vault.createFolder(currentPath);
            }
          }
        }
        await this.app.vault.createBinary(filePath, buffer);
      }

      if (hash) {
        this.fileHashes.set(filePath, hash);
      }
    } catch (err) {
      console.error('[Nimbus] 写入远程文件失败:', filePath, err);
    } finally {
      this.isApplyingRemoteChange = false;
    }
  }

  async applyRemoteDelete(filePath) {
    if (!filePath) return;
    this.isApplyingRemoteChange = true;
    try {
      const existing = this.app.vault.getAbstractFileByPath(filePath);
      if (existing instanceof TFile) {
        await this.app.vault.delete(existing);
      }
      this.fileHashes.delete(filePath);
    } catch (err) {
      console.error('[Nimbus] 删除本地文件失败:', filePath, err);
    } finally {
      this.isApplyingRemoteChange = false;
    }
  }

  // --- Local File Changes ---
  async onLocalFileChange(type, file) {
    if (this.isApplyingRemoteChange || !(file instanceof TFile)) return;
    await this.pushLocalFile(file);
  }

  async onLocalFileDelete(file) {
    if (this.isApplyingRemoteChange || !(file instanceof TFile)) return;
    this.sendWsMessage({
      type: 'delete',
      path: file.path
    });
    this.fileHashes.delete(file.path);
  }

  async onLocalFileRename(file, oldPath) {
    if (this.isApplyingRemoteChange || !(file instanceof TFile)) return;
    // Delete old path on server and push new path
    this.sendWsMessage({ type: 'delete', path: oldPath });
    this.fileHashes.delete(oldPath);
    await this.pushLocalFile(file);
  }

  async pushLocalFile(file) {
    try {
      const buffer = await this.app.vault.readBinary(file);
      const base64 = arrayBufferToBase64(buffer);
      const baseHash = this.fileHashes.get(file.path);

      this.sendWsMessage({
        type: 'push',
        path: file.path,
        content: base64,
        mtime: file.stat ? file.stat.mtime : Date.now(),
        baseHash: baseHash || undefined
      });
    } catch (err) {
      console.error('[Nimbus] 读取本地文件准备上传失败:', file.path, err);
    }
  }

  sendWsMessage(payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  async manualSync() {
    this.updateStatusBar('syncing');
    if (!this.settings.token) {
      const ok = await this.login();
      if (!ok) return;
    }
    this.connectWebSocket();
    new Notice('☁️ 正在触发 Nimbus 同步...');
  }
};

// --- Settings UI ---
class NimbusSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: '☁️ Nimbus 同步插件设置' });
    containerEl.createEl('p', { text: '连接您的私有 Nimbus 服务端，实现多设备极速双向无缝同步。', cls: 'setting-item-description' });

    // 1. Server URL
    new Setting(containerEl)
      .setName('服务器地址 (Server URL)')
      .setDesc('Nimbus 服务端完整访问地址 (例如 http://192.168.50.154:8787)')
      .addText(text => text
        .setPlaceholder('http://192.168.50.154:8787')
        .setValue(this.plugin.settings.serverUrl)
        .onChange(async (val) => {
          this.plugin.settings.serverUrl = val;
          await this.plugin.saveSettings();
        }));

    // 2. Username
    new Setting(containerEl)
      .setName('用户名 (Username)')
      .setDesc('Nimbus 管理后台账号')
      .addText(text => text
        .setValue(this.plugin.settings.username)
        .onChange(async (val) => {
          this.plugin.settings.username = val;
          await this.plugin.saveSettings();
        }));

    // 3. Password
    new Setting(containerEl)
      .setName('密码 (Password)')
      .setDesc('Nimbus 账号登录密码')
      .addText(text => {
        text.inputEl.type = 'password';
        text.setValue(this.plugin.settings.password)
          .onChange(async (val) => {
            this.plugin.settings.password = val;
            await this.plugin.saveSettings();
          });
      });

    // 4. Device ID
    new Setting(containerEl)
      .setName('设备标识 (Device Name)')
      .setDesc('在 Nimbus 控制台管理时显示的设备名称')
      .addText(text => text
        .setValue(this.plugin.settings.deviceId)
        .onChange(async (val) => {
          this.plugin.settings.deviceId = val;
          await this.plugin.saveSettings();
        }));

    // 5. Login Button
    new Setting(containerEl)
      .setName('身份验证')
      .setDesc(this.plugin.settings.token ? '✅ 已获取登录凭证' : '尚未登录')
      .addButton(btn => btn
        .setButtonText(this.plugin.settings.token ? '重新登录' : '登录验证')
        .setCta()
        .onClick(async () => {
          const success = await this.plugin.login();
          if (success) {
            await this.display();
          }
        }));

    // 6. Vault Selection
    if (this.plugin.settings.token) {
      const vaults = await this.plugin.fetchVaults();
      
      const vaultSetting = new Setting(containerEl)
        .setName('同步存储库 (Vault)')
        .setDesc('选择要绑定同步的云端知识库');

      if (vaults.length > 0) {
        vaultSetting.addDropdown(dd => {
          vaults.forEach(v => dd.addOption(v.id, v.name));
          dd.setValue(this.plugin.settings.vaultId || vaults[0].id);
          dd.onChange(async (val) => {
            this.plugin.settings.vaultId = val;
            const found = vaults.find(v => v.id === val);
            this.plugin.settings.vaultName = found ? found.name : '';
            await this.plugin.saveSettings();
            this.plugin.connectWebSocket();
          });
        });
      } else {
        vaultSetting.setDesc('当前账号下暂无 Vault，请在下方创建');
      }

      // Add Create Vault option
      new Setting(containerEl)
        .setName('新建云端 Vault')
        .setDesc('直接在服务器上创建一个新的笔记库')
        .addText(text => {
          text.setPlaceholder('Vault 命名 (如: MyNotes)');
          this.newVaultInput = text;
        })
        .addButton(btn => btn
          .setButtonText('创建并绑定')
          .onClick(async () => {
            const name = this.newVaultInput.getValue().trim();
            if (!name) return new Notice('请输入 Vault 名称');
            const created = await this.plugin.createVault(name);
            if (created) {
              this.plugin.settings.vaultId = created.id;
              this.plugin.settings.vaultName = created.name;
              await this.plugin.saveSettings();
              new Notice(`✅ 成功创建并绑定 Vault: ${created.name}`);
              await this.display();
              this.plugin.connectWebSocket();
            }
          }));
    }

    // 7. Auto sync toggle
    new Setting(containerEl)
      .setName('实时自动同步 (Real-time Auto Sync)')
      .setDesc('本地文件发生变动或服务端有新文件时自动同步')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoSync)
        .onChange(async (val) => {
          this.plugin.settings.autoSync = val;
          await this.plugin.saveSettings();
          if (val) {
            this.plugin.connectWebSocket();
          } else {
            this.plugin.disconnectWebSocket();
          }
        }));
  }
}
