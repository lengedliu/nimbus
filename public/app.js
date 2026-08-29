(function () {
  'use strict';

  function normalizeServerUrl(raw) {
    if (!raw || !raw.trim()) return window.location.origin;
    let url = raw.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = window.location.protocol + '//' + url;
    }
    try {
      const parsed = new URL(url);
      // If user typed the current hostname but forgot to add the port (e.g. typed 192.168.50.154 while browsing on 192.168.50.154:8787)
      if (parsed.hostname === window.location.hostname && !parsed.port && window.location.port) {
        parsed.port = window.location.port;
      }
      return parsed.origin;
    } catch {
      return window.location.origin;
    }
  }

  const state = {
    serverBase: normalizeServerUrl(localStorage.getItem('nimbus_server') || window.location.origin),
    token: localStorage.getItem('nimbus_token') || '',
    user: JSON.parse(localStorage.getItem('nimbus_user') || 'null'),
    vaults: [],
    activeVaultId: null,
    activeSubtab: 'files', // 'files' | 'stats' | 'shares' | 'rules' | 'trash'
    manifest: {},
    activeTab: null, // 'vault' | 'users' | 'all-vaults'
    fileFilter: 'all', // 'all' | 'md' | 'media' | 'config'
    fileViewMode: localStorage.getItem('nimbus_file_view_mode') || 'tree', // 'tree' | 'flat'
    treeSortOrder: localStorage.getItem('nimbus_tree_sort_order') || 'ctime-desc', // 'ctime-desc' | 'ctime-asc' | 'mtime-desc' | 'name-asc'
    expandedFolders: new Set(),
    treeFoldersInitialized: false,
    searchQuery: '',
  };

  const $ = (sel) => document.querySelector(sel);
  const loginView = $('#login-view');
  const appView = $('#app-view');
  const mainPanel = $('#main-panel');
  const modalBackdrop = $('#modal-backdrop');
  const modalContainer = $('#modal-container');

  const THEME_LABELS = {
    default: '经典科技蓝',
    obsidian: 'Obsidian 紫魅夜',
    emerald: '翡翠极光绿',
    azure: '深海蔚蓝',
    rose: '琥珀丝绒红',
    mono: 'OLED 纯黑极简',
    light: '明亮白昼',
  };

  const THEME_DOT_COLORS = {
    default: '#58a6ff',
    obsidian: '#9d7cd8',
    emerald: '#10b981',
    azure: '#0284c7',
    rose: '#e11d48',
    mono: '#ffffff',
    light: '#2563eb',
  };

  function applyTheme(themeKey) {
    const key = themeKey || localStorage.getItem('nimbus_theme') || 'default';
    if (key === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', key);
    }
    localStorage.setItem('nimbus_theme', key);
    updateThemeUI(key);
  }

  function updateThemeUI(themeKey) {
    const key = themeKey || localStorage.getItem('nimbus_theme') || 'default';
    const label = $('#theme-label-name');
    const dot = $('#theme-color-dot');
    if (label) label.textContent = THEME_LABELS[key] || '经典科技蓝';
    if (dot) {
      dot.style.backgroundColor = THEME_DOT_COLORS[key] || '#58a6ff';
      dot.style.boxShadow = `0 0 6px ${THEME_DOT_COLORS[key] || '#58a6ff'}`;
    }
    document.querySelectorAll('.theme-opt-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.themeVal === key);
    });
  }

  function initThemeSwitcher() {
    const menuBtn = $('#theme-menu-btn');
    const menu = $('#theme-dropdown-menu');
    if (!menuBtn || !menu) return;

    menuBtn.onclick = (e) => {
      e.stopPropagation();
      menu.classList.toggle('hidden');
    };

    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && e.target !== menuBtn) {
        menu.classList.add('hidden');
      }
    });

    document.querySelectorAll('.theme-opt-item').forEach((item) => {
      item.onclick = (e) => {
        e.stopPropagation();
        const val = item.dataset.themeVal;
        applyTheme(val);
        menu.classList.add('hidden');
        toast(`已切换至「${THEME_LABELS[val]}」风格`);
      };
    });

    applyTheme(localStorage.getItem('nimbus_theme') || 'default');
  }

  // --------------------------- API helper -----------------------------------

  async function api(path, opts = {}) {
    const res = await fetch(state.serverBase.replace(/\/$/, '') + path, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      },
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const body = await res.clone().json();
        if (body.error) msg = body.error;
      } catch {}
      throw new Error(msg);
    }
    return res;
  }

  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  function showModal(contentHtml, onMount) {
    modalContainer.innerHTML = contentHtml;
    modalBackdrop.classList.remove('hidden');

    // Attach click listeners to all close buttons (.modal-close)
    modalContainer.querySelectorAll('.modal-close').forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        closeModal();
      };
    });

    modalBackdrop.onclick = (e) => {
      if (e.target === modalBackdrop) closeModal();
    };

    if (onMount) onMount(modalContainer);
  }

  function closeModal() {
    modalBackdrop.classList.add('hidden');
    modalContainer.innerHTML = '';
  }

  // Global listeners for modal backdrop and keyboard ESC
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  modalContainer.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('.modal-close');
    if (closeBtn) {
      e.preventDefault();
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modalBackdrop.classList.contains('hidden')) {
      closeModal();
    }
  });

  // ----------------------------- Auth ----------------------------------------

  let isBootstrap = false;

  async function checkAuthStatus() {
    try {
      const res = await fetch(state.serverBase.replace(/\/$/, '') + '/api/auth/status');
      if (res.ok) {
        const body = await res.json();
        isBootstrap = !body.hasUsers;
        const sub = $('#login-form .subtitle');
        const btn = $('#login-form button[type="submit"]');
        if (isBootstrap) {
          if (sub) sub.textContent = '首次启动 · 创建管理员账号';
          if (btn) btn.textContent = '创建管理员并登录';
        } else {
          if (sub) sub.textContent = 'Obsidian 高速实时同步服务 · 管理后台';
          if (btn) btn.textContent = '登录';
        }
      }
    } catch (err) {
      console.warn('Failed to check auth status on serverBase:', state.serverBase, err);
      // Fallback to local origin if custom server address fails
      if (state.serverBase !== window.location.origin) {
        state.serverBase = window.location.origin;
        checkAuthStatus();
      }
    }
  }

  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const serverInput = $('#login-server').value.trim();
    state.serverBase = normalizeServerUrl(serverInput);
    const username = $('#login-username').value.trim();
    const password = $('#login-password').value;
    const errorEl = $('#login-error');
    errorEl.textContent = '';
    errorEl.style.display = 'none';

    const submitBtn = $('#login-form button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.textContent : '登录';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '正在连接...';
    }

    const endpoint = isBootstrap ? '/api/auth/register' : '/api/auth/login';
    try {
      const res = await fetch(state.serverBase.replace(/\/$/, '') + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || (isBootstrap ? '注册失败' : '账号或密码不正确'));
      state.token = body.token;
      state.user = body.user;
      localStorage.setItem('nimbus_server', state.serverBase);
      localStorage.setItem('nimbus_token', state.token);
      localStorage.setItem('nimbus_user', JSON.stringify(state.user));
      enterApp();
    } catch (err) {
      errorEl.textContent = err.message || '网络连接失败，请检查服务器地址';
      errorEl.style.display = 'block';
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    }
  });

  $('#logout-btn').addEventListener('click', () => {
    localStorage.removeItem('nimbus_token');
    localStorage.removeItem('nimbus_user');
    state.token = '';
    state.user = null;
    location.reload();
  });

  async function enterApp() {
    loginView.classList.add('hidden');
    appView.classList.remove('hidden');
    initThemeSwitcher();
    $('#who-username').textContent = state.user.username;
    $('#who-role').textContent = state.user.role;
    if (state.user.role === 'admin') $('#admin-nav').classList.remove('hidden');

    document.querySelectorAll('.tab-btn').forEach((btn) =>
      btn.addEventListener('click', () => showTab(btn.dataset.tab))
    );

    const settingsBtn = $('#global-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        showTab('settings');
      });
    }

    $('#global-connect-btn').addEventListener('click', () => {
      const currentVault = state.vaults.find((v) => v.id === state.activeVaultId) || state.vaults[0];
      showObsidianConnectModal(currentVault);
    });

    $('#global-mcp-btn').addEventListener('click', () => {
      const currentVault = state.vaults.find((v) => v.id === state.activeVaultId) || state.vaults[0];
      showMcpModal(currentVault ? currentVault.name : 'Default');
    });

    const docsBtn = $('#global-docs-btn');
    if (docsBtn) {
      docsBtn.addEventListener('click', () => {
        showDocsModal();
      });
    }

    setupGlobalSearch();

    await loadVaults();
  }

  // --------------------------- Vault List ------------------------------------

  async function loadVaults() {
    const res = await api('/api/vaults');
    const body = await res.json();
    state.vaults = body.vaults;
    renderVaultList();
    if (!state.activeVaultId && state.vaults.length > 0) {
      openVault(state.vaults[0].id);
    }
  }

  function renderVaultList() {
    const ul = $('#vault-list');
    ul.innerHTML = '';
    const isAdmin = state.user?.role === 'admin';

    for (const v of state.vaults) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'vault-item' + (state.activeVaultId === v.id ? ' active' : '');
      const tag = v.isOwner ? '' : v.myPermission === 'read-only' ? ' <span style="font-size:10px;opacity:0.75;padding:1px 4px;border-radius:3px;background:rgba(230,126,34,0.2);color:#e67e22;">只读</span>' : ' <span style="font-size:10px;opacity:0.75;padding:1px 4px;border-radius:3px;background:rgba(46,204,113,0.2);color:#2ecc71;">协作</span>';
      btn.innerHTML = `<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">📓 ${escapeHtml(v.name)}${tag}</span>`;
      btn.addEventListener('click', () => openVault(v.id));

      if (v.isOwner || isAdmin) {
        const del = document.createElement('button');
        del.className = 'del';
        del.textContent = '✕';
        del.title = '删除 vault';
        del.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!confirm(`确定删除 vault "${v.name}"？服务器上的笔记数据不会自动清除，只是取消关联。`)) return;
          await api(`/api/vaults/${v.id}`, { method: 'DELETE' });
          if (state.activeVaultId === v.id) {
            state.activeVaultId = null;
            mainPanel.innerHTML = '<div class="empty-state">从左侧选择一个 vault</div>';
          }
          loadVaults();
        });
        btn.appendChild(del);
      }
      li.appendChild(btn);
      ul.appendChild(li);
    }
  }

  $('#new-vault-btn').addEventListener('click', async () => {
    const name = prompt('新 Vault 名称（例如 MyNotes / WorkVault）：');
    if (!name || !name.trim()) return;
    const res = await api('/api/vaults', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    const body = await res.json();
    await loadVaults();
    if (body.vault) openVault(body.vault.id);
  });

  function showTab(tab) {
    state.activeVaultId = null;
    state.activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    const globalSettingsBtn = $('#global-settings-btn');
    if (globalSettingsBtn) {
      globalSettingsBtn.classList.toggle('active', tab === 'settings');
    }
    renderVaultList();
    if (tab === 'settings') renderSettingsPanel();
    if (tab === 'database') renderDatabasePanel();
    if (tab === 'webhooks') renderWebhooksPanel();
    if (tab === 'devices') renderDevicesPanel();
    if (tab === 'synclogs') renderAdminSyncLogsPanel();
    if (tab === 'users') renderUsersPanel();
    if (tab === 'all-vaults') renderAllVaultsPanel();
  }

  // ------------------------- Obsidian Connect Modal ---------------------------

  async function showObsidianConnectModal(vault, initialToken, initialDeviceName) {
    const serverUrl = state.serverBase.replace(/\/$/, '');
    const wsUrl = serverUrl.replace(/^http/, 'ws') + '/ws';
    const vaultId = vault ? vault.id : (state.vaults[0]?.id || 'YOUR_VAULT_ID');
    const vaultName = vault ? vault.name : 'Vault';

    // Fetch device tokens for the user
    let userTokens = [];
    try {
      const res = await api('/api/devices');
      if (res.ok) {
        const body = await res.json();
        userTokens = (body.devices || []).map((d) => ({
          id: d.id,
          label: d.deviceName || d.name || 'Obsidian Client',
          token: d.token,
          maskedToken: d.tokenPreview || (d.token ? `${d.token.slice(0, 10)}...${d.token.slice(-6)}` : ''),
        }));
      }
    } catch {}

    if (userTokens.length === 0) {
      try {
        const res2 = await api('/api/settings/tokens');
        if (res2.ok) {
          const body2 = await res2.json();
          userTokens = body2.tokens || [];
        }
      } catch {}
    }

    let currentToken = initialToken || state.token;
    let currentDevice = initialDeviceName || (state.user?.username ? `${state.user.username}-Obsidian` : 'Client-Obsidian');

    const tokenOptions = [
      `<option value="${state.token}" ${currentToken === state.token ? 'selected' : ''}>🔑 当前主登录令牌 (${state.user?.username || 'Main User'})</option>`,
      ...userTokens.map((t) => `<option value="${escapeHtml(t.token || state.token)}" ${currentToken === t.token ? 'selected' : ''}>📱 [专属设备] ${escapeHtml(t.label)} (${escapeHtml(t.maskedToken || '')})</option>`),
    ].join('');

    function buildConfig(selectedToken, deviceName) {
      return {
        serverUrl,
        wsUrl: `${wsUrl}?vaultId=${vaultId}&token=${selectedToken}&deviceId=${encodeURIComponent(deviceName)}`,
        vaultId,
        vaultName,
        authToken: selectedToken,
        deviceName,
        autoSyncOnStartup: true,
      };
    }

    let pluginConfig = buildConfig(currentToken, currentDevice);

    const html = `
      <div class="modal-header">
        <h3>⚡ 连接 Obsidian Nimbus 同步插件</h3>
        <button class="modal-close ghost">✕</button>
      </div>
      <div class="modal-body">
        <p style="color:var(--text-secondary);margin-bottom:14px">
          在 Obsidian 中安装 <code>nimbus</code> (或兼容的 <code>fast-note-sync</code>) 插件后，将以下配置导入或填入插件设置，即可开启多端毫秒级实时双向同步：
        </p>

        <div style="background:var(--panel-2);border:1px solid var(--border);border-radius:var(--radius);padding:12px 16px;margin-bottom:16px;">
          <div style="display:grid;grid-template-columns:110px 1fr;gap:10px 12px;font-size:13px;align-items:center;">
            <span style="color:var(--muted)">目标笔记库:</span>
            <b>📓 ${escapeHtml(vaultName)} <code style="font-size:11px;font-weight:normal;color:var(--muted)">(${vaultId})</code></b>

            <span style="color:var(--muted)">选择授权令牌:</span>
            <select id="modal-token-select" style="margin:0;padding:5px 8px;font-size:12.5px;">
              ${tokenOptions}
            </select>

            <span style="color:var(--muted)">客户端设备标识:</span>
            <input type="text" id="modal-device-input" value="${escapeHtml(currentDevice)}" style="margin:0;padding:5px 8px;font-size:12.5px;" />

            <span style="color:var(--muted)">当前完整 Token:</span>
            <div style="display:flex;gap:6px;align-items:center;">
              <input type="password" id="modal-token-preview" readonly value="${escapeHtml(currentToken)}" style="margin:0;padding:5px 8px;font-size:11.5px;font-family:ui-monospace,monospace;flex:1;" />
              <button id="modal-token-toggle-btn" class="token-act-btn" style="padding:4px 8px;">👁️ 查看</button>
              <button id="modal-token-copy-btn" class="token-act-btn primary" style="padding:4px 8px;">📋 复制 Token</button>
            </div>
          </div>
        </div>

        <div class="nav-section-title" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span>一键插件配置文件 (<code>data.json</code>)</span>
          <span style="font-size:11.5px;color:var(--muted);font-weight:normal;">保存在 .obsidian/plugins/nimbus/ 目录</span>
        </div>
        <pre id="modal-json-snippet" class="code-snippet" style="max-height:190px;">${escapeHtml(JSON.stringify(pluginConfig, null, 2))}</pre>

        <p style="color:var(--muted);font-size:12px;margin-top:10px">
          💡 提示：支持全平台（macOS, Windows, iOS, Android, Linux）Obsidian 客户端，各端可独立设置设备标识与专属令牌。
        </p>
      </div>
      <div class="modal-footer">
        <button id="copy-connect-btn" class="btn-primary">📋 一键复制 data.json 完整配置</button>
        <button class="modal-close secondary">关闭</button>
      </div>
    `;

    showModal(html, (dialog) => {
      const tokenSelect = dialog.querySelector('#modal-token-select');
      const deviceInput = dialog.querySelector('#modal-device-input');
      const tokenPreview = dialog.querySelector('#modal-token-preview');
      const tokenToggleBtn = dialog.querySelector('#modal-token-toggle-btn');
      const tokenCopyBtn = dialog.querySelector('#modal-token-copy-btn');
      const jsonSnippet = dialog.querySelector('#modal-json-snippet');

      function updateModalState() {
        currentToken = tokenSelect.value || state.token;
        currentDevice = deviceInput.value.trim() || 'Obsidian-Device';
        tokenPreview.value = currentToken;
        pluginConfig = buildConfig(currentToken, currentDevice);
        jsonSnippet.textContent = JSON.stringify(pluginConfig, null, 2);
      }

      tokenSelect.onchange = updateModalState;
      deviceInput.oninput = updateModalState;

      tokenToggleBtn.onclick = () => {
        if (tokenPreview.type === 'password') {
          tokenPreview.type = 'text';
          tokenToggleBtn.textContent = '🙈 隐藏';
        } else {
          tokenPreview.type = 'password';
          tokenToggleBtn.textContent = '👁️ 查看';
        }
      };

      tokenCopyBtn.onclick = () => {
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(currentToken).then(() => toast('Token 已复制到剪贴板'));
        } else {
          prompt('复制 Token：', currentToken);
        }
      };

      dialog.querySelector('#copy-connect-btn').onclick = () => {
        const text = JSON.stringify(pluginConfig, null, 2);
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text).then(() => toast('data.json 连接配置已复制到剪贴板！'));
        } else {
          prompt('复制以下配置：', text);
        }
      };
    });
  }

  async function showMcpModal(defaultVaultName) {
    const selectedVaultName = defaultVaultName || (state.vaults && state.vaults[0] ? state.vaults[0].name : '');
    
    let toolsData = [];
    try {
      const res = await api('/api/mcp/tools');
      if (res.ok) {
        const body = await res.json();
        toolsData = body.tools || [];
      }
    } catch {
      toolsData = [];
    }

    function generateConfig(vaultName) {
      return {
        mcpServers: {
          'nimbus-fast-note-sync': {
            url: state.serverBase.replace(/\/$/, '') + '/api/mcp',
            type: 'http',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${state.token}`,
              'X-Default-Vault-Name': vaultName,
            },
          },
        },
      };
    }

    const initialConfig = JSON.stringify(generateConfig(selectedVaultName), null, 2);

    const html = `
      <div class="modal-header">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:18px">🤖</span>
          <div>
            <h3 style="margin:0;font-size:16px">Model Context Protocol (MCP) 服务与工具接口</h3>
            <div style="font-size:11.5px;color:var(--muted)">支持 Cursor、Cherry Studio、Claude Desktop、Cline 等 AI 客户端实时读写 Obsidian 笔记</div>
          </div>
        </div>
        <button class="modal-close ghost">✕</button>
      </div>
      <div class="mcp-nav-tabs">
        <button class="mcp-nav-tab active" id="mcp-tab-config-btn">⚙️ 客户端连接配置</button>
        <button class="mcp-nav-tab" id="mcp-tab-tools-btn">🛠️ 18 个 MCP 工具清单 (${toolsData.length || 18})</button>
      </div>
      <div class="modal-body" style="max-height:65vh;overflow-y:auto;padding:16px 20px;">
        <div id="mcp-tab-config-view">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
            <div style="font-size:13px;color:var(--text-secondary)">
              选择绑定的默认笔记库：
            </div>
            <select id="mcp-vault-select" style="padding:4px 10px;font-size:12.5px;border-radius:4px;border:1px solid var(--border);background:var(--bg);color:var(--text);">
              ${(state.vaults || []).map((v) => `<option value="${escapeHtml(v.name)}" ${v.name === selectedVaultName ? 'selected' : ''}>${escapeHtml(v.name)}</option>`).join('')}
            </select>
          </div>

          <p style="color:var(--text-secondary);font-size:12.5px;margin-bottom:8px">
            将以下配置填入 AI 编辑器或客户端（如 Cursor <code>Settings > MCP</code>、Cherry Studio、Claude <code>mcp.json</code>）：
          </p>
          <pre class="code-snippet" id="mcp-config-code" style="max-height:220px">${escapeHtml(initialConfig)}</pre>

          <div style="margin-top:16px;background:var(--panel-2);border:1px solid var(--border);border-radius:var(--radius);padding:12px 14px;font-size:12px;color:var(--text-secondary);">
            <div style="font-weight:600;color:var(--text);margin-bottom:6px">⚡ 实时同步与高并发特性：</div>
            <ul style="margin:0;padding-left:18px;line-height:1.6">
              <li><strong>双向即时生效</strong>：AI 写入、追加或重命名笔记后，自动通过 WebSocket 实时推送到所有手机、电脑的 Obsidian 客户端。</li>
              <li><strong>防冲突保护 (Conflict-Safe)</strong>：当多人或多端同时修改时，自动保存冲突快照，避免内容被意外覆盖。</li>
              <li><strong>历史快照备份</strong>：每次 AI 修改均在服务器自动归档版本历史，可随时溯源与回滚。</li>
            </ul>
          </div>
        </div>

        <div id="mcp-tab-tools-view" style="display:none">
          <div style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
            <input type="text" id="mcp-tools-search" placeholder="🔍 搜索 MCP 工具名称、分类或描述..." style="flex:1;min-width:200px;padding:6px 12px;font-size:12.5px;border-radius:4px;border:1px solid var(--border);background:var(--bg);color:var(--text);" />
            <span style="font-size:11.5px;color:var(--muted)">共 ${toolsData.length || 18} 个标准工具</span>
          </div>

          <div id="mcp-tools-list-container">
            ${toolsData.map((t) => `
              <div class="mcp-tool-card" data-name="${escapeHtml(t.name.toLowerCase())}" data-desc="${escapeHtml(t.description.toLowerCase())}" data-cat="${escapeHtml((t.category || '').toLowerCase())}">
                <div class="mcp-tool-header">
                  <span class="mcp-tool-name">${escapeHtml(t.name)}</span>
                  <span class="mcp-tool-category">${escapeHtml(t.category || '核心工具')}</span>
                </div>
                <div class="mcp-tool-desc">${escapeHtml(t.description)}</div>
                ${t.parameters && Object.keys(t.parameters).length > 0 ? `
                  <div class="mcp-tool-params">
                    <strong>参数：</strong> ${Object.entries(t.parameters).map(([k, v]) => `<code>${escapeHtml(k)}</code>: ${escapeHtml(v)}`).join(' · ')}
                  </div>
                ` : '<div class="mcp-tool-params" style="color:var(--muted)">无必填参数</div>'}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button id="copy-mcp-btn" class="btn-primary">📋 复制当前 MCP 配置</button>
        <button class="modal-close secondary">关闭</button>
      </div>
    `;

    showModal(html, (dialog) => {
      let currentVaultName = selectedVaultName;

      const tabConfigBtn = dialog.querySelector('#mcp-tab-config-btn');
      const tabToolsBtn = dialog.querySelector('#mcp-tab-tools-btn');
      const tabConfigView = dialog.querySelector('#mcp-tab-config-view');
      const tabToolsView = dialog.querySelector('#mcp-tab-tools-view');
      const copyBtn = dialog.querySelector('#copy-mcp-btn');
      const vaultSelect = dialog.querySelector('#mcp-vault-select');
      const codeSnippet = dialog.querySelector('#mcp-config-code');
      const searchInput = dialog.querySelector('#mcp-tools-search');

      function updateSnippet() {
        const conf = generateConfig(currentVaultName);
        const text = JSON.stringify(conf, null, 2);
        if (codeSnippet) codeSnippet.textContent = text;
        return text;
      }

      if (vaultSelect) {
        vaultSelect.onchange = (e) => {
          currentVaultName = e.target.value;
          updateSnippet();
        };
      }

      tabConfigBtn.onclick = () => {
        tabConfigBtn.classList.add('active');
        tabToolsBtn.classList.remove('active');
        tabConfigView.style.display = 'block';
        tabToolsView.style.display = 'none';
        copyBtn.style.display = 'inline-flex';
      };

      tabToolsBtn.onclick = () => {
        tabToolsBtn.classList.add('active');
        tabConfigBtn.classList.remove('active');
        tabToolsView.style.display = 'block';
        tabConfigView.style.display = 'none';
      };

      if (searchInput) {
        searchInput.oninput = (e) => {
          const q = e.target.value.toLowerCase().trim();
          dialog.querySelectorAll('.mcp-tool-card').forEach((card) => {
            const name = card.getAttribute('data-name') || '';
            const desc = card.getAttribute('data-desc') || '';
            const cat = card.getAttribute('data-cat') || '';
            const match = !q || name.includes(q) || desc.includes(q) || cat.includes(q);
            card.style.display = match ? 'block' : 'none';
          });
        };
      }

      copyBtn.onclick = () => {
        const text = updateSnippet();
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text).then(() => toast('MCP JSON 配置已复制到剪贴板'));
        } else {
          prompt('复制 MCP 配置：', text);
        }
      };
    });
  }

  async function showDocsModal() {
    let spec = null;
    try {
      const res = await api('/api/docs/spec');
      if (res.ok) {
        spec = await res.json();
      }
    } catch {
      spec = null;
    }

    const categories = spec?.categories || [];
    const baseUrl = (state.serverBase || window.location.origin).replace(/\/$/, '');
    const currentToken = state.token || '<YOUR_JWT_TOKEN>';
    const sampleVaultId = state.activeVaultId || (state.vaults && state.vaults[0] ? state.vaults[0].id : 'vlt_sample');

    function buildCurl(ep) {
      const fullUrl = baseUrl + ep.path.replace(':vaultId', sampleVaultId).replace('*', 'Daily/2026-08-29.md').replace(':versionId', 'ver_01').replace(':trashId', 'tsh_01').replace(':shareId', 'shr_01');
      let lines = [`curl -X ${ep.method} "${fullUrl}"`];
      
      if (ep.auth && ep.auth.includes('Bearer')) {
        lines.push(`  -H "Authorization: Bearer ${currentToken}"`);
      }
      if (ep.headers) {
        for (const [k, v] of Object.entries(ep.headers)) {
          if (k.toLowerCase() !== 'authorization') {
            lines.push(`  -H "${k}: ${v}"`);
          }
        }
      }
      if (ep.body && (ep.method === 'POST' || ep.method === 'PUT')) {
        if (typeof ep.body === 'object') {
          lines.push(`  -d '${JSON.stringify(ep.body)}'`);
        } else {
          lines.push(`  -d '${ep.body}'`);
        }
      }
      return lines.join(' \\\n');
    }

    let totalEndpoints = 0;
    categories.forEach((c) => {
      totalEndpoints += (c.endpoints || []).length;
    });

    const html = `
      <div class="modal-header">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:18px">📖</span>
          <div>
            <h3 style="margin:0;font-size:16px">REST API 开发者与接口说明文档</h3>
            <div style="font-size:11.5px;color:var(--muted)">涵盖认证、笔记库、文件增量读写、历史快照、回收站、冲突管理、外链分享及 MCP 接口</div>
          </div>
        </div>
        <button class="modal-close ghost">✕</button>
      </div>

      <div style="padding:12px 20px 0;background:var(--panel-2);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:260px;margin-bottom:12px;">
          <input type="text" id="api-docs-search" placeholder="🔍 快速搜索 API 路径、方法 (如 GET /api/vaults)、描述..." style="flex:1;padding:6px 12px;font-size:12.5px;border-radius:4px;border:1px solid var(--border);background:var(--bg);color:var(--text);" />
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;font-size:12px;color:var(--muted)">
          <span>共 <strong>${totalEndpoints}</strong> 个标准端点</span>
          <a href="/api/docs/spec" target="_blank" class="btn-sm secondary" style="text-decoration:none;padding:4px 8px;font-size:11.5px;display:inline-flex;align-items:center;gap:4px;">📄 查看 JSON 规范</a>
        </div>
      </div>

      <div class="modal-body" style="max-height:68vh;overflow-y:auto;padding:16px 20px;">
        <div style="background:rgba(88,166,255,0.06);border:1px solid rgba(88,166,255,0.2);border-radius:var(--radius);padding:10px 14px;font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
          💡 <strong>调用指引</strong>：所有接口请求基础地址为 <code>${escapeHtml(baseUrl)}</code>。需要认证的接口请在 Header 中添加 <code>Authorization: Bearer &lt;Token&gt;</code>。下方 cURL 示例已自动填充您的当前登录 Token 与默认 Vault ID。
        </div>

        <div id="api-docs-list">
          ${categories.map((cat) => `
            <div class="api-category-block" data-cat="${escapeHtml(cat.category)}">
              <div class="api-category-header">📁 ${escapeHtml(cat.category)}</div>
              ${(cat.endpoints || []).map((ep) => {
                const methodLower = (ep.method || 'get').toLowerCase();
                const curlText = buildCurl(ep);
                return `
                  <div class="api-endpoint-card" data-method="${methodLower}" data-path="${escapeHtml(ep.path.toLowerCase())}" data-summary="${escapeHtml((ep.summary || '').toLowerCase())}" data-desc="${escapeHtml((ep.desc || '').toLowerCase())}">
                    <div class="api-endpoint-header">
                      <span class="badge-method ${methodLower}">${escapeHtml(ep.method)}</span>
                      <span class="api-endpoint-path">${escapeHtml(ep.path)}</span>
                      <span class="api-endpoint-auth">${escapeHtml(ep.auth || '公开')}</span>
                    </div>
                    <div class="api-endpoint-summary">${escapeHtml(ep.summary || '')}</div>
                    <div class="api-endpoint-desc">${escapeHtml(ep.desc || '')}</div>

                    ${ep.params && Object.keys(ep.params).length > 0 ? `
                      <div style="font-size:11.5px;color:var(--muted);margin-bottom:6px">
                        <strong>URL 参数：</strong> ${Object.entries(ep.params).map(([k, v]) => `<code>${escapeHtml(k)}</code>: ${escapeHtml(v)}`).join(' · ')}
                      </div>
                    ` : ''}

                    ${ep.body ? `
                      <div style="font-size:11.5px;color:var(--muted);margin-bottom:6px">
                        <strong>请求体 (Body)：</strong> <pre style="display:inline;background:none;border:none;padding:0;font-size:11px;color:var(--text)">${escapeHtml(typeof ep.body === 'object' ? JSON.stringify(ep.body) : ep.body)}</pre>
                      </div>
                    ` : ''}

                    <div class="api-curl-box">
                      <button class="api-copy-curl-btn" data-curl="${escapeHtml(curlText)}">📋 复制 cURL</button>
                      <pre style="margin:0;background:none;border:none;padding:0;color:var(--text);font-size:11px;">${escapeHtml(curlText)}</pre>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `).join('')}
        </div>
      </div>
      <div class="modal-footer">
        <button class="modal-close secondary">关闭文档</button>
      </div>
    `;

    showModal(html, (dialog) => {
      const searchInput = dialog.querySelector('#api-docs-search');
      if (searchInput) {
        searchInput.oninput = (e) => {
          const q = e.target.value.toLowerCase().trim();
          dialog.querySelectorAll('.api-category-block').forEach((catBlock) => {
            let catHasMatch = false;
            catBlock.querySelectorAll('.api-endpoint-card').forEach((card) => {
              const method = card.getAttribute('data-method') || '';
              const path = card.getAttribute('data-path') || '';
              const summary = card.getAttribute('data-summary') || '';
              const desc = card.getAttribute('data-desc') || '';
              const match = !q || method.includes(q) || path.includes(q) || summary.includes(q) || desc.includes(q);
              card.style.display = match ? 'block' : 'none';
              if (match) catHasMatch = true;
            });
            catBlock.style.display = catHasMatch ? 'block' : 'none';
          });
        };
      }

      dialog.querySelectorAll('.api-copy-curl-btn').forEach((btn) => {
        btn.onclick = () => {
          const curl = btn.getAttribute('data-curl');
          if (curl && navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(curl).then(() => toast('cURL 命令已复制'));
          } else if (curl) {
            prompt('复制 cURL 命令：', curl);
          }
        };
      });
    });
  }

  // --------------------------- Vault Main Views -------------------------------

  async function openVault(vaultId, subtab = 'files') {
    if (state.activeVaultId !== vaultId) {
      state.treeFoldersInitialized = false;
    }
    state.activeVaultId = vaultId;
    state.activeSubtab = subtab;
    state.activeTab = null;
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    renderVaultList();

    const res = await api(`/api/vaults/${vaultId}/manifest`);
    const body = await res.json();
    state.manifest = body.manifest;

    renderVaultContainer(vaultId);
  }

  function renderVaultContainer(vaultId) {
    const vault = state.vaults.find((v) => v.id === vaultId) || { name: 'Vault', id: vaultId };
    mainPanel.innerHTML = '';

    const isReadOnly = vault.myPermission === 'read-only';
    const permBadgeText = vault.isOwner ? '所有者' : vault.myPermission === 'read-only' ? '只读' : '读写';
    const permBadgeClass = vault.isOwner ? 'primary' : vault.myPermission === 'read-only' ? 'warning' : 'success';

    // Header
    const header = document.createElement('div');
    header.className = 'vault-header';
    header.innerHTML = `
      <div class="vault-title">
        <h2>📓 ${escapeHtml(vault.name)}</h2>
        <span class="badge" style="font-size:11px">${Object.keys(state.manifest).length} 个文件</span>
        <span class="badge ${permBadgeClass}" style="font-size:11px">权限: ${permBadgeText}</span>
      </div>
      <div class="vault-actions">
        ${!isReadOnly ? '<button class="btn-primary" id="v-new-note-btn">+ 新建笔记</button>' : ''}
        ${!isReadOnly ? '<button class="secondary" id="v-upload-btn">⬆️ 上传文件</button>' : ''}
        <button class="secondary" id="v-export-btn">📦 导出 ZIP</button>
        <button class="secondary" id="v-connect-btn">⚡ Obsidian 连接</button>
      </div>
    `;
    mainPanel.appendChild(header);

    // Subtabs bar
    const subtabsBar = document.createElement('div');
    subtabsBar.className = 'subtabs-bar';
    subtabsBar.innerHTML = `
      <button class="subtab-btn ${state.activeSubtab === 'files' ? 'active' : ''}" data-sub="files">📄 笔记与文件</button>
      <button class="subtab-btn ${state.activeSubtab === 'conflicts' ? 'active' : ''}" data-sub="conflicts" id="subtab-conflicts-btn">⚔️ 冲突解决中心</button>
      <button class="subtab-btn ${state.activeSubtab === 'backups' ? 'active' : ''}" data-sub="backups">💾 快照与备份</button>
      <button class="subtab-btn ${state.activeSubtab === 'permissions' ? 'active' : ''}" data-sub="permissions">👥 成员与权限</button>
      <button class="subtab-btn ${state.activeSubtab === 'stats' ? 'active' : ''}" data-sub="stats">📊 统计与监控</button>
      <button class="subtab-btn ${state.activeSubtab === 'synclogs' ? 'active' : ''}" data-sub="synclogs">📋 同步日志</button>
      <button class="subtab-btn ${state.activeSubtab === 'shares' ? 'active' : ''}" data-sub="shares">🔗 公开分享</button>
      <button class="subtab-btn ${state.activeSubtab === 'rules' ? 'active' : ''}" data-sub="rules">⚙️ 同步规则</button>
      <button class="subtab-btn ${state.activeSubtab === 'trash' ? 'active' : ''}" data-sub="trash">🗑️ 回收站</button>
    `;
    mainPanel.appendChild(subtabsBar);

    // Asynchronously check for active conflicts to show badge
    api(`/api/vaults/${vaultId}/conflicts`).then((res) => res.json()).then((data) => {
      const count = (data.conflicts || []).length;
      const btn = subtabsBar.querySelector('#subtab-conflicts-btn');
      if (btn && count > 0) {
        btn.innerHTML = `⚔️ 冲突解决中心 <span class="conflict-badge">${count}</span>`;
      }
    }).catch(() => {});

    subtabsBar.querySelectorAll('.subtab-btn').forEach((btn) => {
      btn.onclick = () => {
        state.activeSubtab = btn.dataset.sub;
        renderVaultContainer(vaultId);
      };
    });

    // Content container
    const contentBox = document.createElement('div');
    contentBox.id = 'vault-subtab-content';
    mainPanel.appendChild(contentBox);

    // Top action handlers
    if (!isReadOnly) {
      $('#v-new-note-btn').onclick = () => createNewNotePrompt(vaultId);
      $('#v-upload-btn').onclick = () => triggerFileUpload(vaultId);
    }
    $('#v-export-btn').onclick = () => {
      window.open(`${state.serverBase.replace(/\/$/, '')}/api/vaults/${vaultId}/export?token=${state.token}`, '_blank');
    };
    $('#v-connect-btn').onclick = () => showObsidianConnectModal(vault);

    // Render active subtab
    if (state.activeSubtab === 'files') renderFilesSubtab(vaultId, contentBox);
    else if (state.activeSubtab === 'conflicts') renderConflictsSubtab(vaultId, contentBox);
    else if (state.activeSubtab === 'backups') renderBackupsSubtab(vaultId, contentBox);
    else if (state.activeSubtab === 'permissions') renderPermissionsSubtab(vaultId, contentBox);
    else if (state.activeSubtab === 'stats') renderStatsSubtab(vaultId, contentBox);
    else if (state.activeSubtab === 'synclogs') renderVaultSyncLogsSubtab(vaultId, contentBox);
    else if (state.activeSubtab === 'shares') renderSharesSubtab(vaultId, contentBox);
    else if (state.activeSubtab === 'rules') renderRulesSubtab(vaultId, contentBox);
    else if (state.activeSubtab === 'trash') renderTrashSubtab(vaultId, contentBox);
  }

  // --------------------------- Subtab: Files ---------------------------------

  function renderFilesSubtab(vaultId, container) {
    const paths = Object.keys(state.manifest).sort();

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'vault-toolbar';
    toolbar.innerHTML = `
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" id="file-search-input" placeholder="搜索文件名或全文内容..." value="${escapeHtml(state.searchQuery)}" />
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <div class="filter-pills">
          <span class="filter-pill ${state.fileFilter === 'all' ? 'active' : ''}" data-filter="all">全部 (${paths.length})</span>
          <span class="filter-pill ${state.fileFilter === 'md' ? 'active' : ''}" data-filter="md">Markdown</span>
          <span class="filter-pill ${state.fileFilter === 'html' ? 'active' : ''}" data-filter="html">HTML 网页</span>
          <span class="filter-pill ${state.fileFilter === 'media' ? 'active' : ''}" data-filter="media">媒体/附件</span>
          <span class="filter-pill ${state.fileFilter === 'config' ? 'active' : ''}" data-filter="config">配置 (.obsidian)</span>
        </div>
        <div class="view-mode-group">
          <button class="view-mode-btn ${state.fileViewMode === 'tree' ? 'active' : ''}" data-mode="tree" title="按库的原始树状目录结构层级显示">
            <span>🌲</span> 树状目录
          </button>
          <button class="view-mode-btn ${state.fileViewMode === 'flat' ? 'active' : ''}" data-mode="flat" title="平铺文件路径列表显示">
            <span>📋</span> 平铺列表
          </button>
        </div>
      </div>
    `;
    container.appendChild(toolbar);

    // Filter pill clicks
    toolbar.querySelectorAll('.filter-pill').forEach((pill) => {
      pill.onclick = () => {
        state.fileFilter = pill.dataset.filter;
        renderVaultContainer(vaultId);
      };
    });

    // View mode switch
    toolbar.querySelectorAll('.view-mode-btn').forEach((btn) => {
      btn.onclick = () => {
        state.fileViewMode = btn.dataset.mode;
        localStorage.setItem('nimbus_file_view_mode', state.fileViewMode);
        toolbar.querySelectorAll('.view-mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === state.fileViewMode));
        renderFileList(vaultId, container);
      };
    });

    // Search input handler
    let debounceTimer;
    const searchInput = toolbar.querySelector('#file-search-input');
    searchInput.oninput = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.searchQuery = searchInput.value;
        renderFileList(vaultId, container);
      }, 250);
    };

    // Drag-and-drop zone
    const dropZone = document.createElement('div');
    dropZone.className = 'drop-zone';
    dropZone.innerHTML = `<span>📥 拖拽文件到此处，或点击右上角「上传文件」快速存入 Vault</span>`;
    setupDragDrop(dropZone, vaultId);
    container.appendChild(dropZone);

    const listContainer = document.createElement('div');
    listContainer.id = 'files-list-wrapper';
    container.appendChild(listContainer);

    renderFileList(vaultId, listContainer);
  }

  function buildFileTree(paths, manifest) {
    const root = { name: '', path: '', type: 'folder', children: {}, fileCount: 0, totalSize: 0 };
    const allFolderPaths = [];

    for (const p of paths) {
      const parts = p.split('/');
      let current = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;
        const subPath = parts.slice(0, i + 1).join('/');

        if (isFile) {
          const meta = manifest[p] || { size: 0, mtime: Date.now(), ctime: Date.now() };
          current.children[part] = {
            name: part,
            path: subPath,
            type: 'file',
            meta,
          };
        } else {
          if (!current.children[part]) {
            allFolderPaths.push(subPath);
            current.children[part] = {
              name: part,
              path: subPath,
              type: 'folder',
              children: {},
              fileCount: 0,
              totalSize: 0,
            };
          }
          current = current.children[part];
        }
      }
    }

    function computeStats(node) {
      if (node.type === 'file') {
        return { count: 1, size: node.meta?.size || 0 };
      }
      let count = 0;
      let size = 0;
      for (const key of Object.keys(node.children)) {
        const res = computeStats(node.children[key]);
        count += res.count;
        size += res.size;
      }
      node.fileCount = count;
      node.totalSize = size;
      return { count, size };
    }
    computeStats(root);

    return { root, allFolderPaths };
  }

  async function renderFileList(vaultId, container) {
    const listWrapper = container.id === 'files-list-wrapper' ? container : container.querySelector('#files-list-wrapper');
    if (!listWrapper) return;
    listWrapper.innerHTML = '';

    let paths = Object.keys(state.manifest).sort();

    // Filter by type
    if (state.fileFilter === 'md') {
      paths = paths.filter((p) => p.toLowerCase().endsWith('.md'));
    } else if (state.fileFilter === 'html') {
      paths = paths.filter((p) => /\.(html|htm)$/i.test(p));
    } else if (state.fileFilter === 'media') {
      paths = paths.filter((p) => /\.(png|jpg|jpeg|gif|webp|svg|pdf|mp3|mp4|mov|wav|zip)$/i.test(p));
    } else if (state.fileFilter === 'config') {
      paths = paths.filter((p) => p.startsWith('.obsidian/'));
    }

    // Search filter
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.trim().toLowerCase();
      // If query is present, do server search for full-text match snippets
      try {
        const res = await api(`/api/vaults/${vaultId}/search?q=${encodeURIComponent(q)}`);
        const body = await res.json();
        const searchResults = body.results || [];
        renderSearchResultsTable(vaultId, listWrapper, searchResults);
        return;
      } catch {
        paths = paths.filter((p) => p.toLowerCase().includes(q));
      }
    }

    if (paths.length === 0) {
      listWrapper.innerHTML = '<div class="empty-state">没有符合条件的文件</div>';
      return;
    }

    if (state.fileViewMode === 'tree') {
      renderTreeFileList(vaultId, listWrapper, paths, state.manifest);
    } else {
      renderFlatFileList(vaultId, listWrapper, paths, state.manifest);
    }
  }

  function renderTreeFileList(vaultId, listWrapper, paths, manifest) {
    const { root, allFolderPaths } = buildFileTree(paths, manifest);

    // If first load for this vault, default all folders to expanded
    if (!state.treeFoldersInitialized) {
      state.treeFoldersInitialized = true;
      state.expandedFolders.clear();
      allFolderPaths.forEach((fp) => state.expandedFolders.add(fp));
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'tree-view-wrapper';

    // Tree toolbar bar
    const bar = document.createElement('div');
    bar.className = 'tree-toolbar-bar';
    bar.innerHTML = `
      <div>
        <span>📁 <strong>原始目录结构</strong> · 共 ${allFolderPaths.length} 个文件夹 · ${paths.length} 个文件</span>
      </div>
      <div class="tree-toolbar-controls">
        <label class="tree-sort-label">
          <span style="white-space:nowrap;flex-shrink:0;">排序:</span>
          <select class="tree-sort-select" id="tree-sort-select" title="选择目录内笔记文件的排序规则">
            <option value="ctime-desc" ${state.treeSortOrder === 'ctime-desc' ? 'selected' : ''}>⏳ 创建时间 (最新优先)</option>
            <option value="ctime-asc" ${state.treeSortOrder === 'ctime-asc' ? 'selected' : ''}>⌛ 创建时间 (最旧优先)</option>
            <option value="mtime-desc" ${state.treeSortOrder === 'mtime-desc' ? 'selected' : ''}>📝 修改时间 (最新优先)</option>
            <option value="name-asc" ${state.treeSortOrder === 'name-asc' ? 'selected' : ''}>🔤 文件名称 (A-Z)</option>
          </select>
        </label>
        <button class="tree-ctrl-btn" id="tree-expand-all-btn">➕ 全部展开</button>
        <button class="tree-ctrl-btn" id="tree-collapse-all-btn">➖ 全部折叠</button>
      </div>
    `;
    wrapper.appendChild(bar);

    const sortSelect = bar.querySelector('#tree-sort-select');
    if (sortSelect) {
      sortSelect.onchange = () => {
        state.treeSortOrder = sortSelect.value;
        localStorage.setItem('nimbus_tree_sort_order', state.treeSortOrder);
        renderFileList(vaultId, listWrapper);
      };
    }

    bar.querySelector('#tree-expand-all-btn').onclick = () => {
      allFolderPaths.forEach((fp) => state.expandedFolders.add(fp));
      renderFileList(vaultId, listWrapper);
    };
    bar.querySelector('#tree-collapse-all-btn').onclick = () => {
      state.expandedFolders.clear();
      renderFileList(vaultId, listWrapper);
    };

    // Header row
    const header = document.createElement('div');
    header.className = 'tree-header-row';
    header.innerHTML = `
      <div>名称 / 目录层级</div>
      <div>大小</div>
      <div>创建时间</div>
      <div>修改时间</div>
      <div style="text-align:right">操作</div>
    `;
    wrapper.appendChild(header);

    const body = document.createElement('div');
    body.className = 'tree-body';

    function renderBranch(node, depth) {
      const keys = Object.keys(node.children).sort((a, b) => {
        const itemA = node.children[a];
        const itemB = node.children[b];
        // Folders always come first
        if (itemA.type !== itemB.type) {
          return itemA.type === 'folder' ? -1 : 1;
        }
        // If both are folders, sort alphabetically by folder name
        if (itemA.type === 'folder') {
          return itemA.name.localeCompare(itemB.name, 'zh-CN', { numeric: true, sensitivity: 'base' });
        }
        // For files within directory: sort by creation time (or user selected order)
        const sortOrder = state.treeSortOrder || 'ctime-desc';
        const ctimeA = itemA.meta?.ctime || itemA.meta?.mtime || 0;
        const ctimeB = itemB.meta?.ctime || itemB.meta?.mtime || 0;
        const mtimeA = itemA.meta?.mtime || 0;
        const mtimeB = itemB.meta?.mtime || 0;

        if (sortOrder === 'ctime-desc') {
          if (ctimeB !== ctimeA) return ctimeB - ctimeA;
          return itemA.name.localeCompare(itemB.name, 'zh-CN', { numeric: true, sensitivity: 'base' });
        } else if (sortOrder === 'ctime-asc') {
          if (ctimeA !== ctimeB) return ctimeA - ctimeB;
          return itemA.name.localeCompare(itemB.name, 'zh-CN', { numeric: true, sensitivity: 'base' });
        } else if (sortOrder === 'mtime-desc') {
          if (mtimeB !== mtimeA) return mtimeB - mtimeA;
          return itemA.name.localeCompare(itemB.name, 'zh-CN', { numeric: true, sensitivity: 'base' });
        } else {
          return itemA.name.localeCompare(itemB.name, 'zh-CN', { numeric: true, sensitivity: 'base' });
        }
      });

      for (const key of keys) {
        const item = node.children[key];
        if (item.type === 'folder') {
          const isExpanded = state.expandedFolders.has(item.path);
          const row = document.createElement('div');
          row.className = 'tree-node-row folder-row';

          let indentHtml = '';
          for (let d = 0; d < depth; d++) {
            indentHtml += '<span class="tree-indent-spacer"></span>';
          }

          row.innerHTML = `
            <div class="tree-name-col">
              ${indentHtml}
              <span class="tree-toggle-arrow ${isExpanded ? 'open' : ''}">▶</span>
              <span class="tree-icon">${isExpanded ? '📂' : '📁'}</span>
              <span class="tree-name-text">${escapeHtml(item.name)}</span>
              <span class="tree-badge">${item.fileCount} 项</span>
            </div>
            <div class="tree-meta-col">${formatBytes(item.totalSize)}</div>
            <div class="tree-meta-col" style="color:var(--text-muted);font-size:12px;">-</div>
            <div class="tree-meta-col" style="color:var(--text-muted);font-size:12px;">-</div>
            <div class="tree-actions-col"></div>
          `;

          row.onclick = () => {
            if (state.expandedFolders.has(item.path)) {
              state.expandedFolders.delete(item.path);
            } else {
              state.expandedFolders.add(item.path);
            }
            renderFileList(vaultId, listWrapper);
          };

          body.appendChild(row);

          if (isExpanded) {
            renderBranch(item, depth + 1);
          }
        } else {
          // File row
          const p = item.path;
          const meta = item.meta || {};
          const isMd = p.toLowerCase().endsWith('.md');
          const isHtml = /\.(html|htm)$/i.test(p);
          const isImg = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(p);
          const isPdf = /\.pdf$/i.test(p);
          const icon = isMd ? '📄' : isHtml ? '🌐' : isImg ? '🖼️' : isPdf ? '📕' : p.startsWith('.obsidian/') ? '⚙️' : '📎';

          const ctimeVal = meta.ctime || meta.mtime || Date.now();
          const mtimeVal = meta.mtime || Date.now();
          const ctimeStr = new Date(ctimeVal).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });
          const mtimeStr = new Date(mtimeVal).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });

          const row = document.createElement('div');
          row.className = 'tree-node-row file-row';

          let indentHtml = '';
          for (let d = 0; d < depth; d++) {
            indentHtml += '<span class="tree-indent-spacer"></span>';
          }

          row.innerHTML = `
            <div class="tree-name-col">
              ${indentHtml}
              <span class="tree-indent-spacer" style="width:18px;"></span>
              <span class="tree-icon">${icon}</span>
              <span class="tree-name-text" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
            </div>
            <div class="tree-meta-col">${formatBytes(meta.size)}</div>
            <div class="tree-meta-col" title="创建时间: ${ctimeStr}">${ctimeStr}</div>
            <div class="tree-meta-col" title="修改时间: ${mtimeStr}">${mtimeStr}</div>
            <div class="tree-actions-col"></div>
          `;

          row.onclick = (e) => {
            if (e.target.closest('button')) return;
            openFile(vaultId, p);
          };

          const actionsCol = row.querySelector('.tree-actions-col');

          if (isMd || isHtml) {
            const shareBtn = document.createElement('button');
            shareBtn.className = 'secondary';
            shareBtn.textContent = '🔗 分享';
            shareBtn.onclick = (e) => {
              e.stopPropagation();
              showCreateShareModal(vaultId, p);
            };
            actionsCol.appendChild(shareBtn);
          }

          const histBtn = document.createElement('button');
          histBtn.className = 'secondary';
          histBtn.textContent = '⏱️ 历史';
          histBtn.onclick = (e) => {
            e.stopPropagation();
            showHistoryModal(vaultId, p);
          };
          actionsCol.appendChild(histBtn);

          const delBtn = document.createElement('button');
          delBtn.className = 'danger';
          delBtn.textContent = '🗑️';
          delBtn.title = '移至回收站';
          delBtn.onclick = async (e) => {
            e.stopPropagation();
            if (!confirm(`将 "${p}" 移入回收站？可在回收站随时恢复。`)) return;
            await api(`/api/vaults/${vaultId}/files/${encodeURIComponentPath(p)}`, { method: 'DELETE' });
            toast('已移至回收站');
            openVault(vaultId, 'files');
          };
          actionsCol.appendChild(delBtn);

          body.appendChild(row);
        }
      }
    }

    renderBranch(root, 0);
    wrapper.appendChild(body);
    listWrapper.appendChild(wrapper);
  }

  function renderFlatFileList(vaultId, listWrapper, paths, manifest) {
    const sortedPaths = [...paths].sort((a, b) => {
      const metaA = manifest[a] || {};
      const metaB = manifest[b] || {};
      const sortOrder = state.treeSortOrder || 'ctime-desc';
      const ctimeA = metaA.ctime || metaA.mtime || 0;
      const ctimeB = metaB.ctime || metaB.mtime || 0;
      const mtimeA = metaA.mtime || 0;
      const mtimeB = metaB.mtime || 0;

      if (sortOrder === 'ctime-desc') {
        if (ctimeB !== ctimeA) return ctimeB - ctimeA;
        return a.localeCompare(b, 'zh-CN', { numeric: true });
      } else if (sortOrder === 'ctime-asc') {
        if (ctimeA !== ctimeB) return ctimeA - ctimeB;
        return a.localeCompare(b, 'zh-CN', { numeric: true });
      } else if (sortOrder === 'mtime-desc') {
        if (mtimeB !== mtimeA) return mtimeB - mtimeA;
        return a.localeCompare(b, 'zh-CN', { numeric: true });
      } else {
        return a.localeCompare(b, 'zh-CN', { numeric: true });
      }
    });

    const table = document.createElement('table');
    table.className = 'file-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>文件路径</th>
          <th style="width:100px">大小</th>
          <th style="width:160px">创建时间</th>
          <th style="width:160px">修改时间</th>
          <th style="width:200px;text-align:right">操作</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    for (const p of sortedPaths) {
      const meta = manifest[p] || { size: 0, mtime: Date.now(), ctime: Date.now() };
      const isMd = p.toLowerCase().endsWith('.md');
      const isHtml = /\.(html|htm)$/i.test(p);
      const isImg = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(p);
      const isPdf = /\.pdf$/i.test(p);
      const icon = isMd ? '📄' : isHtml ? '🌐' : isImg ? '🖼️' : isPdf ? '📕' : p.startsWith('.obsidian/') ? '⚙️' : '📎';

      const ctimeVal = meta.ctime || meta.mtime || Date.now();
      const mtimeVal = meta.mtime || Date.now();
      const ctimeStr = new Date(ctimeVal).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
      const mtimeStr = new Date(mtimeVal).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><div class="file-name"><span>${icon}</span> <span>${escapeHtml(p)}</span></div></td>
        <td class="meta">${formatBytes(meta.size)}</td>
        <td class="meta">${ctimeStr}</td>
        <td class="meta">${mtimeStr}</td>
        <td class="actions"></td>
      `;

      tr.onclick = (e) => {
        if (e.target.closest('button')) return;
        openFile(vaultId, p);
      };

      const actionsCell = tr.querySelector('.actions');

      if (isMd || isHtml) {
        const shareBtn = document.createElement('button');
        shareBtn.className = 'secondary';
        shareBtn.textContent = '🔗 分享';
        shareBtn.onclick = (e) => {
          e.stopPropagation();
          showCreateShareModal(vaultId, p);
        };
        actionsCell.appendChild(shareBtn);
      }

      const histBtn = document.createElement('button');
      histBtn.className = 'secondary';
      histBtn.textContent = '⏱️ 历史';
      histBtn.onclick = (e) => {
        e.stopPropagation();
        showHistoryModal(vaultId, p);
      };
      actionsCell.appendChild(histBtn);

      const delBtn = document.createElement('button');
      delBtn.className = 'danger';
      delBtn.textContent = '🗑️';
      delBtn.title = '移至回收站';
      delBtn.onclick = async (e) => {
        e.stopPropagation();
        if (!confirm(`将 "${p}" 移入回收站？可在回收站随时恢复。`)) return;
        await api(`/api/vaults/${vaultId}/files/${encodeURIComponentPath(p)}`, { method: 'DELETE' });
        toast('已移至回收站');
        openVault(vaultId, 'files');
      };
      actionsCell.appendChild(delBtn);

      tbody.appendChild(tr);
    }

    listWrapper.appendChild(table);
  }

  function renderSearchResultsTable(vaultId, container, results) {
    if (results.length === 0) {
      container.innerHTML = '<div class="empty-state">未找到包含此关键词的笔记</div>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'file-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>匹配文件与内容片段</th>
          <th style="width:120px">大小</th>
          <th style="width:180px">修改时间</th>
          <th style="width:140px;text-align:right">操作</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    for (const r of results) {
      const tr = document.createElement('tr');
      const snippetHtml = r.snippet
        ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:4px;background:var(--bg);padding:4px 8px;border-radius:4px;">${escapeHtml(r.snippet)}</div>`
        : '';

      tr.innerHTML = `
        <td>
          <div class="file-name"><span>📄</span> <b>${escapeHtml(r.path)}</b></div>
          ${snippetHtml}
        </td>
        <td class="meta">${formatBytes(r.size)}</td>
        <td class="meta">${new Date(r.mtime).toLocaleString()}</td>
        <td class="actions">
          <button class="btn-primary" onclick="window.nimbusOpenFile('${vaultId}', '${encodeURIComponent(r.path)}')">打开</button>
        </td>
      `;
      tbody.appendChild(tr);
    }
    container.appendChild(table);
  }

  window.nimbusOpenFile = (vaultId, encPath) => {
    openFile(vaultId, decodeURIComponent(encPath));
  };

  // --------------------------- Subtab: Stats & Monitor -----------------------

  async function renderStatsSubtab(vaultId, container) {
    container.innerHTML = '<div class="empty-state">统计数据加载中…</div>';
    const res = await api(`/api/vaults/${vaultId}/stats`);
    const { stats, connectedDevices, activity } = await res.json();

    const devices = connectedDevices || [];

    let devicesHtml = '';
    if (devices.length === 0) {
      devicesHtml = `
        <div class="empty-state" style="padding:24px;background:var(--panel);border:1px dashed var(--border);border-radius:var(--radius);">
          <div style="font-size:28px;margin-bottom:6px;">📡</div>
          <div style="font-weight:600;color:var(--text);">当前暂无在线连接的客户端设备</div>
          <div style="font-size:12.5px;color:var(--muted);margin-top:4px;">
            在 Obsidian 中打开并配置 <strong>Nimbus Sync</strong> 插件后，连接成功的设备将实时显示在此处。
          </div>
        </div>
      `;
    } else {
      devicesHtml = `
        <div class="device-grid">
          ${devices.map((d) => `
            <div class="device-card">
              <div class="device-card-header">
                <div class="device-icon">💻</div>
                <div class="device-info">
                  <div class="device-name">${escapeHtml(d.deviceName || 'Obsidian Client')}</div>
                  <div class="device-user">用户: ${escapeHtml(d.username || '当前用户')}</div>
                </div>
                <span class="device-status-badge online"><span class="pulse-dot"></span> 在线</span>
              </div>
              <div class="device-meta">
                <span>⏱️ 已连接: ${new Date(d.connectedAt).toLocaleTimeString()}</span>
                <span>⚡ 实时 WebSocket 双向同步</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">总文件数</div>
          <div class="stat-value">${stats.totalFiles}</div>
          <div class="stat-desc">Markdown: ${stats.notesCount} 篇 · 附件: ${stats.attachmentsCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">存储空间</div>
          <div class="stat-value">${formatBytes(stats.totalBytes)}</div>
          <div class="stat-desc">配置占用: ${stats.configsCount} 项</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">在线同步设备</div>
          <div class="stat-value" style="color:var(--success)">${stats.activeClients} <span style="font-size:14px">台</span></div>
          <div class="stat-desc">实时 WebSocket 同步中</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">版本与回收站</div>
          <div class="stat-value">${stats.historyCount} <span style="font-size:14px">版本</span></div>
          <div class="stat-desc">回收站 ${stats.trashCount} 个待清理</div>
        </div>
      </div>

      <div class="panel-header" style="margin-top:20px;margin-bottom:12px;">
        <div>
          <h3 style="margin:0;font-size:16px;">📱 当前在线同步设备 (${devices.length})</h3>
          <div style="font-size:12px;color:var(--muted);margin-top:2px;">实时追踪已接入此 Vault 的 Obsidian 客户端与编辑节点</div>
        </div>
        <button class="secondary" id="refresh-devices-btn">🔄 刷新设备与状态</button>
      </div>

      ${devicesHtml}

      <div class="panel-header" style="margin-top:28px">
        <h3 style="margin:0;font-size:16px;">⚡ 实时同步活动流</h3>
      </div>

      <ul class="activity-list" id="stats-activity-list"></ul>
    `;

    container.querySelector('#refresh-devices-btn').onclick = () => renderStatsSubtab(vaultId, container);

    const listEl = container.querySelector('#stats-activity-list');
    if (!activity || activity.length === 0) {
      listEl.innerHTML = '<li style="color:var(--muted);text-align:center;padding:20px;">暂无近期同步活动</li>';
      return;
    }

    for (const act of activity) {
      const li = document.createElement('li');
      li.className = 'activity-item';
      const typeClass = act.type;
      const typeLabel = act.type === 'change' ? '更新/推送' : act.type === 'delete' ? '删除' : '产生冲突';
      li.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="activity-type ${typeClass}">${typeLabel}</span>
          <span style="font-weight:500;">${escapeHtml(act.path)}</span>
          ${act.conflictPath ? `<span style="font-size:12px;color:var(--warning)">→ ${escapeHtml(act.conflictPath)}</span>` : ''}
        </div>
        <span class="meta">${new Date(act.timestamp).toLocaleTimeString()}</span>
      `;
      listEl.appendChild(li);
    }
  }

  // --------------------------- Subtab: Public Shares -------------------------

  async function renderSharesSubtab(vaultId, container) {
    container.innerHTML = '<div class="empty-state">加载分享列表中…</div>';
    const res = await api(`/api/vaults/${vaultId}/shares`);
    const { shares } = await res.json();

    container.innerHTML = `
      <div class="panel-header">
        <h3 style="margin:0;font-size:16px;">🔗 已公开分享的笔记</h3>
      </div>
      <div id="shares-table-wrap"></div>
    `;

    const wrap = container.querySelector('#shares-table-wrap');
    if (shares.length === 0) {
      wrap.innerHTML = '<div class="empty-state">尚未创建任何公开分享链接。在笔记列表中点击「🔗 分享」即可生成。</div>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'data-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>标题 / 路径</th>
          <th>保护状态</th>
          <th>阅读次数</th>
          <th>创建时间</th>
          <th>有效期</th>
          <th style="text-align:right">操作</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    for (const s of shares) {
      const shareUrl = `${state.serverBase.replace(/\/$/, '')}/share/${s.id}`;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div style="font-weight:600">${escapeHtml(s.title)}</div>
          <div class="meta">${escapeHtml(s.filePath)}</div>
        </td>
        <td>${s.hasPassword ? '🔒 密码保护' : '🌐 公开可读'}</td>
        <td class="meta">${s.viewCount} 次</td>
        <td class="meta">${new Date(s.createdAt).toLocaleDateString()}</td>
        <td class="meta">${s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : '永久有效'}</td>
        <td class="actions">
          <button class="secondary" id="copy-share-url-${s.id}">复制链接</button>
          <a class="btn secondary" href="${shareUrl}" target="_blank" style="text-decoration:none">打开</a>
          <button class="danger" id="del-share-${s.id}">撤销</button>
        </td>
      `;

      tr.querySelector(`#copy-share-url-${s.id}`).onclick = () => {
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(shareUrl).then(() => toast('分享链接已复制'));
        } else {
          prompt('复制分享链接：', shareUrl);
        }
      };

      tr.querySelector(`#del-share-${s.id}`).onclick = async () => {
        if (!confirm(`确定撤销针对 "${s.title}" 的分享？链接将立即失效。`)) return;
        await api(`/api/vaults/${vaultId}/shares/${s.id}`, { method: 'DELETE' });
        toast('分享已撤销');
        renderSharesSubtab(vaultId, container);
      };

      tbody.appendChild(tr);
    }
    wrap.appendChild(table);
  }

  function showCreateShareModal(vaultId, filePath) {
    const filename = filePath.split('/').pop().replace(/\.md$/, '');
    const html = `
      <div class="modal-header">
        <h3>🔗 分享笔记 · ${escapeHtml(filePath)}</h3>
        <button class="modal-close ghost">✕</button>
      </div>
      <div class="modal-body">
        <label>分享标题
          <input id="share-title-input" type="text" value="${escapeHtml(filename)}" />
        </label>
        <label>访问密码 (选填，留空则免密访问)
          <input id="share-pwd-input" type="password" placeholder="设置访问密码" />
        </label>
        <label>有效期
          <select id="share-exp-select">
            <option value="0">永久有效</option>
            <option value="1">1 天后过期</option>
            <option value="7" selected>7 天后过期</option>
            <option value="30">30 天后过期</option>
          </select>
        </label>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:14px;">
          <input id="share-copy-checkbox" type="checkbox" checked style="width:auto;margin:0" />
          <span>允许访客一键复制全文正文</span>
        </label>
      </div>
      <div class="modal-footer">
        <button id="create-share-submit" class="btn-primary">生成分享链接</button>
        <button class="modal-close secondary">取消</button>
      </div>
    `;

    showModal(html, (dialog) => {
      dialog.querySelector('#create-share-submit').onclick = async () => {
        const title = dialog.querySelector('#share-title-input').value.trim() || filename;
        const password = dialog.querySelector('#share-pwd-input').value;
        const expiresDays = parseInt(dialog.querySelector('#share-exp-select').value, 10);
        const allowCopy = dialog.querySelector('#share-copy-checkbox').checked;

        try {
          const res = await api(`/api/vaults/${vaultId}/shares`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath, title, password, expiresDays, allowCopy }),
          });
          const { share } = await res.json();
          const shareUrl = `${state.serverBase.replace(/\/$/, '')}/share/${share.id}`;

          closeModal();
          showShareSuccessModal(shareUrl, title);
        } catch (e) {
          toast('生成失败: ' + e.message);
        }
      };
    });
  }

  function showShareSuccessModal(shareUrl, title) {
    const html = `
      <div class="modal-header">
        <h3>🎉 分享链接已生成</h3>
        <button class="modal-close ghost">✕</button>
      </div>
      <div class="modal-body">
        <p style="color:var(--text-secondary);margin-bottom:10px">
          笔记 <b>${escapeHtml(title)}</b> 的公开访问地址如下：
        </p>
        <input type="text" id="success-share-input" value="${escapeHtml(shareUrl)}" readonly style="background:var(--bg)" />
      </div>
      <div class="modal-footer">
        <button id="copy-success-share-btn" class="btn-primary">📋 复制链接</button>
        <a class="btn secondary" href="${shareUrl}" target="_blank" style="text-decoration:none">立即打开</a>
        <button class="modal-close secondary">完成</button>
      </div>
    `;
    showModal(html, (dialog) => {
      dialog.querySelector('#copy-success-share-btn').onclick = () => {
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(shareUrl).then(() => toast('链接已复制'));
        }
      };
    });
  }

  // --------------------------- Subtab: Permissions & Members ----------------
  async function renderPermissionsSubtab(vaultId, container) {
    container.innerHTML = '<div class="empty-state">加载成员与权限信息中…</div>';
    try {
      const res = await api(`/api/vaults/${vaultId}/permissions`);
      const data = await res.json();

      const { vault, myPermission, isOwner, isAdmin, members, allUsers } = data;
      const canManage = isOwner || isAdmin;

      // Filter users who can be added (not owner, not already added)
      const existingUserIds = new Set([vault.ownerId, ...members.map((m) => m.userId)]);
      const candidateUsers = (allUsers || []).filter((u) => !existingUserIds.has(u.id));

      container.innerHTML = `
        <div class="panel-header" style="margin-bottom:16px;">
          <div>
            <h3 style="margin:0;font-size:16px;display:flex;align-items:center;gap:8px;">
              <span>👥</span>
              <span>笔记库权限与成员管理</span>
            </h3>
            <div style="font-size:12.5px;color:var(--muted);margin-top:2px;">
              当前 Vault: <b>${escapeHtml(vault.name)}</b> · 创建者: <b>${escapeHtml(vault.ownerUsername)}</b>
              ${isOwner ? ' <span class="badge primary" style="font-size:11px">您是所有者</span>' : ''}
              ${!isOwner ? ` <span class="badge ${myPermission === 'read-only' ? 'warning' : 'success'}" style="font-size:11px">您的权限: ${myPermission === 'read-only' ? '只读' : '读写'}</span>` : ''}
            </div>
          </div>
        </div>

        ${canManage ? `
          <div style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:16px 20px;margin-bottom:24px;">
            <h4 style="margin:0 0 12px;font-size:14px;font-weight:600;display:flex;align-items:center;gap:6px;">
              <span>➕</span> 授权/添加协作成员
            </h4>
            <div style="display:grid;grid-template-columns:minmax(180px, 1fr) 180px auto;gap:12px;align-items:end;">
              <label style="margin:0;">
                <span style="font-size:12.5px;color:var(--text-secondary);display:block;margin-bottom:4px;">选择用户</span>
                ${candidateUsers.length > 0 ? `
                  <select id="perm-user-select" style="margin:0;">
                    <option value="">-- 请选择要授权的用户 --</option>
                    ${candidateUsers.map((u) => `<option value="${u.id}">${escapeHtml(u.username)} (${u.role === 'admin' ? '管理员' : '普通用户'})</option>`).join('')}
                  </select>
                ` : `
                  <input id="perm-username-input" placeholder="输入已存在的用户名" style="margin:0;" />
                `}
              </label>
              <label style="margin:0;">
                <span style="font-size:12.5px;color:var(--text-secondary);display:block;margin-bottom:4px;">赋予权限</span>
                <select id="perm-type-select" style="margin:0;">
                  <option value="read-write">读写 (Read & Write) - 允许同步修改</option>
                  <option value="read-only">只读 (Read Only) - 仅允许拉取与查看</option>
                </select>
              </label>
              <button id="add-member-btn" class="btn-primary" style="margin:0;height:38px;">＋ 确认授权</button>
            </div>
          </div>
        ` : `
          <div style="background:rgba(88,166,255,0.08);border:1px solid rgba(88,166,255,0.2);border-radius:var(--radius);padding:12px 16px;margin-bottom:20px;font-size:13px;color:var(--text-secondary);">
            ℹ️ 您当前作为协作成员访问此 Vault。只有该 Vault 的创建者 (<b>${escapeHtml(vault.ownerUsername)}</b>) 或系统管理员可以修改成员权限。
          </div>
        `}

        <div style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;">
          <div style="padding:14px 18px;border-bottom:1px solid var(--border);font-weight:600;font-size:13.5px;display:flex;align-items:center;justify-content:space-between;">
            <span>当前成员列表 (${members.length + 1} 人)</span>
            <span style="font-size:12px;color:var(--muted);font-weight:normal;">所有者享有最高管理与删除权限</span>
          </div>
          <table class="data-table" style="width:100%;margin:0;">
            <thead>
              <tr>
                <th>用户名</th>
                <th>系统角色</th>
                <th>Vault 权限级别</th>
                <th>授权时间</th>
                ${canManage ? '<th style="text-align:right">操作</th>' : ''}
              </tr>
            </thead>
            <tbody id="perm-members-tbody">
              <!-- Owner row -->
              <tr style="background:rgba(255,255,255,0.02);">
                <td>
                  <b style="display:inline-flex;align-items:center;gap:6px;">
                    <span>👑</span>
                    <span>${escapeHtml(vault.ownerUsername)}</span>
                  </b>
                  <span class="badge primary" style="font-size:10px;margin-left:6px;">所有者 (Owner)</span>
                </td>
                <td><span class="badge">所有者</span></td>
                <td>
                  <span class="badge primary" style="font-size:11px;">全部权限 (所有者)</span>
                </td>
                <td class="meta">${new Date(vault.createdAt).toLocaleString()}</td>
                ${canManage ? '<td style="text-align:right;color:var(--muted);font-size:12px;">创建者 (不可撤销)</td>' : ''}
              </tr>
            </tbody>
          </table>
        </div>
      `;

      const tbody = container.querySelector('#perm-members-tbody');

      for (const m of members) {
        const tr = document.createElement('tr');
        const isRw = m.permission === 'read-write';
        const permBadge = isRw
          ? '<span class="badge success" style="font-size:11px;">✏️ 读写 (Read-Write)</span>'
          : '<span class="badge warning" style="font-size:11px;">👁️ 只读 (Read-Only)</span>';

        tr.innerHTML = `
          <td>
            <b>👤 ${escapeHtml(m.username)}</b>
          </td>
          <td><span class="badge">${m.role}</span></td>
          <td>
            ${canManage ? `
              <select class="member-perm-change-select" data-user-id="${m.userId}" style="padding:3px 8px;font-size:12px;border-radius:4px;margin:0;width:auto;">
                <option value="read-write" ${isRw ? 'selected' : ''}>✏️ 读写 (可同步修改)</option>
                <option value="read-only" ${!isRw ? 'selected' : ''}>👁️ 只读 (仅查看拉取)</option>
              </select>
            ` : permBadge}
          </td>
          <td class="meta">${new Date(m.createdAt).toLocaleString()}</td>
          ${canManage ? `
            <td class="actions" style="text-align:right">
              <button class="danger revoke-member-btn" data-user-id="${m.userId}" data-username="${escapeHtml(m.username)}" style="font-size:12px;padding:4px 10px;">移除权限</button>
            </td>
          ` : ''}
        `;
        tbody.appendChild(tr);
      }

      if (canManage) {
        // Add member button handler
        const addBtn = container.querySelector('#add-member-btn');
        if (addBtn) {
          addBtn.onclick = async () => {
            const userSelect = container.querySelector('#perm-user-select');
            const usernameInput = container.querySelector('#perm-username-input');
            const permSelect = container.querySelector('#perm-type-select');

            const userId = userSelect ? userSelect.value : undefined;
            const username = usernameInput ? usernameInput.value.trim() : undefined;
            const permission = permSelect.value;

            if (!userId && !username) {
              toast('请选择或输入要授权的用户');
              return;
            }

            try {
              await api(`/api/vaults/${vaultId}/permissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, username, permission }),
              });
              toast('成员权限授权成功');
              renderPermissionsSubtab(vaultId, container);
            } catch (e) {
              toast('授权失败: ' + e.message);
            }
          };
        }

        // Change permission selects
        container.querySelectorAll('.member-perm-change-select').forEach((sel) => {
          sel.onchange = async () => {
            const targetUserId = sel.dataset.userId;
            const newPerm = sel.value;
            try {
              await api(`/api/vaults/${vaultId}/permissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: targetUserId, permission: newPerm }),
              });
              toast('已更新成员权限');
            } catch (e) {
              toast('更新失败: ' + e.message);
              renderPermissionsSubtab(vaultId, container);
            }
          };
        });

        // Revoke buttons
        container.querySelectorAll('.revoke-member-btn').forEach((btn) => {
          btn.onclick = async () => {
            const targetUserId = btn.dataset.userId;
            const targetUsername = btn.dataset.username;
            if (!confirm(`确定撤销用户 "${targetUsername}" 对该笔记库的访问权限？`)) return;
            try {
              await api(`/api/vaults/${vaultId}/permissions/${targetUserId}`, {
                method: 'DELETE',
              });
              toast(`已撤销 "${targetUsername}" 的权限`);
              renderPermissionsSubtab(vaultId, container);
            } catch (e) {
              toast('撤销失败: ' + e.message);
            }
          };
        });
      }
    } catch (err) {
      container.innerHTML = `<div class="empty-state">加载权限配置失败: ${escapeHtml(err.message)}</div>`;
    }
  }

  // --------------------------- Subtab: Sync Rules ---------------------------

  async function renderRulesSubtab(vaultId, container) {
    container.innerHTML = '<div class="empty-state">加载同步规则中…</div>';
    const res = await api(`/api/vaults/${vaultId}/rules`);
    const { rules } = await res.json();

    container.innerHTML = `
      <div class="panel-header">
        <h3 style="margin:0;font-size:16px;">⚙️ 忽略规则与同步策略</h3>
        <button class="btn-primary" id="save-rules-btn">💾 保存规则</button>
      </div>
      <div style="max-width:680px">
        <p style="color:var(--text-secondary);font-size:13px;margin-bottom:14px">
          匹配以下通配符的文件将不会上传到服务器或下发到客户端，避免同步无意义的临时文件：
        </p>
        <label>忽略路径规则 (每行一条匹配表达式，支持 * 与 **):
          <textarea id="ignore-patterns-textarea" rows="8" style="font-family:monospace;font-size:13px;">${(rules.ignorePatterns || []).join('\n')}</textarea>
        </label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;">
          <label>单文件最大同步限制 (MB)
            <input type="number" id="max-file-size-input" value="${rules.maxFileSizeMb || 100}" />
          </label>
        </div>
      </div>
    `;

    container.querySelector('#save-rules-btn').onclick = async () => {
      const rawText = container.querySelector('#ignore-patterns-textarea').value;
      const patterns = rawText.split('\n').map((s) => s.trim()).filter(Boolean);
      const maxMb = parseInt(container.querySelector('#max-file-size-input').value, 10) || 100;

      try {
        await api(`/api/vaults/${vaultId}/rules`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ignorePatterns: patterns, maxFileSizeMb: maxMb }),
        });
        toast('同步规则已更新');
      } catch (e) {
        toast('保存失败: ' + e.message);
      }
    };
  }

  // --------------------------- Subtab: Trash ---------------------------------

  async function renderTrashSubtab(vaultId, container) {
    container.innerHTML = '<div class="empty-state">加载回收站中…</div>';
    const res = await api(`/api/vaults/${vaultId}/trash`);
    const { trash } = await res.json();

    container.innerHTML = `
      <div class="panel-header">
        <h3 style="margin:0;font-size:16px;">🗑️ 回收站</h3>
        ${trash.length > 0 ? `<button class="danger" id="purge-all-trash-btn">清空回收站 (${trash.length})</button>` : ''}
      </div>
      <div id="trash-table-wrap"></div>
    `;

    if (trash.length > 0) {
      container.querySelector('#purge-all-trash-btn').onclick = async () => {
        if (!confirm('确定彻底清空回收站中的所有文件？此操作无法撤销。')) return;
        await api(`/api/vaults/${vaultId}/trash/purge-all`, { method: 'POST' });
        toast('回收站已清空');
        renderTrashSubtab(vaultId, container);
      };
    }

    const wrap = container.querySelector('#trash-table-wrap');
    if (trash.length === 0) {
      wrap.innerHTML = '<div class="empty-state">回收站是空的</div>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'data-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>原始路径</th>
          <th>删除时间</th>
          <th>大小</th>
          <th style="text-align:right">操作</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    for (const t of trash) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><b>${escapeHtml(t.path)}</b></td>
        <td class="meta">${new Date(t.deletedAt).toLocaleString()}</td>
        <td class="meta">${formatBytes(t.size)}</td>
        <td class="actions">
          <button class="secondary" id="preview-trash-${t.id}">预览</button>
          <button class="btn-primary" id="restore-trash-${t.id}">恢复</button>
          <button class="danger" id="purge-trash-${t.id}">彻底删除</button>
        </td>
      `;

      tr.querySelector(`#preview-trash-${t.id}`).onclick = async () => {
        try {
          const r = await api(`/api/vaults/${vaultId}/trash/${t.id}`);
          const text = await r.text();
          showFilePreviewModal(t.path, text);
        } catch {
          toast('该文件无法作为纯文本预览');
        }
      };

      tr.querySelector(`#restore-trash-${t.id}`).onclick = async () => {
        await api(`/api/vaults/${vaultId}/trash/${t.id}/restore`, { method: 'POST' });
        toast(`已恢复 "${t.path}"`);
        openVault(vaultId, 'trash');
      };

      tr.querySelector(`#purge-trash-${t.id}`).onclick = async () => {
        if (!confirm(`彻底删除 "${t.path}"？`)) return;
        await api(`/api/vaults/${vaultId}/trash/${t.id}`, { method: 'DELETE' });
        renderTrashSubtab(vaultId, container);
      };

      tbody.appendChild(tr);
    }
    wrap.appendChild(table);
  }

  // --------------------------- Subtab: Conflicts Resolution Center -----------

  async function renderConflictsSubtab(vaultId, container) {
    container.innerHTML = '<div class="empty-state">检测冲突文件中…</div>';
    try {
      const res = await api(`/api/vaults/${vaultId}/conflicts`);
      const { conflicts } = await res.json();

      container.innerHTML = `
        <div class="panel-header" style="margin-bottom:14px;">
          <div>
            <h3 style="margin:0;font-size:16px;display:flex;align-items:center;gap:6px;">
              <span>⚔️</span>
              <span>多设备并发冲突解决中心</span>
              ${conflicts.length > 0 ? `<span class="conflict-badge">${conflicts.length} 个未解决冲突</span>` : ''}
            </h3>
            <div style="font-size:12.5px;color:var(--muted);margin-top:2px;">
              当多台 Obsidian 客户端离线编辑同一笔记后同时连网推送时，服务端会自动创建分支冲突副本并保留两端数据，在此可一键比对差异与智能合并
            </div>
          </div>
          <div>
            <button class="secondary" id="conflicts-refresh-btn">🔄 重新检测</button>
          </div>
        </div>
        <div id="conflicts-main-wrap"></div>
      `;

      container.querySelector('#conflicts-refresh-btn').onclick = () => renderConflictsSubtab(vaultId, container);

      const wrap = container.querySelector('#conflicts-main-wrap');
      if (conflicts.length === 0) {
        wrap.innerHTML = `
          <div class="empty-state" style="padding:48px 16px;">
            <div style="font-size:40px;margin-bottom:10px;">✨</div>
            <div style="font-weight:600;font-size:15px;color:var(--text);margin-bottom:4px;">笔记库暂无文件冲突</div>
            <div style="font-size:13px;color:var(--muted)">所有多端同步数据均已正常统一</div>
          </div>
        `;
        return;
      }

      for (const item of conflicts) {
        const card = document.createElement('div');
        card.className = 'conflict-card has-conflict';
        card.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
            <div>
              <div style="font-weight:600;font-size:14px;color:var(--text);display:flex;align-items:center;gap:6px;">
                <span>⚠️ 冲突源文件:</span>
                <code>${escapeHtml(item.basePath || '未知文件')}</code>
              </div>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">
                <span>冲突副本: <code>${escapeHtml(item.conflictPath)}</code></span>
                <span style="margin-left:12px;color:var(--muted)">冲突时间: ${new Date(item.conflictMtime).toLocaleString()}</span>
              </div>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn-primary open-diff-btn" style="font-size:12.5px;padding:5px 12px;">🔍 查看差异与合并</button>
              <button class="danger delete-conflict-btn" style="font-size:12.5px;padding:5px 10px;">🗑️ 放弃此冲突副本</button>
            </div>
          </div>
          <div class="conflict-diff-area hidden" style="margin-top:14px;border-top:1px solid var(--border);padding-top:12px;"></div>
        `;

        card.querySelector('.delete-conflict-btn').onclick = async () => {
          if (!confirm(`确定直接丢弃冲突副本 "${item.conflictPath}"？`)) return;
          try {
            await api(`/api/vaults/${vaultId}/conflicts/resolve`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ conflictPath: item.conflictPath, resolution: 'keep-current' }),
            });
            toast('已丢弃冲突副本');
            renderConflictsSubtab(vaultId, container);
          } catch (e) {
            toast('操作失败: ' + e.message);
          }
        };

        const diffArea = card.querySelector('.conflict-diff-area');
        const openDiffBtn = card.querySelector('.open-diff-btn');

        openDiffBtn.onclick = async () => {
          if (!diffArea.classList.contains('hidden')) {
            diffArea.classList.add('hidden');
            openDiffBtn.textContent = '🔍 查看差异与合并';
            return;
          }

          diffArea.classList.remove('hidden');
          diffArea.innerHTML = '<div class="empty-state" style="padding:16px;">加载差异比对中…</div>';
          openDiffBtn.textContent = '收起差异面板 ▲';

          try {
            const diffRes = await api(`/api/vaults/${vaultId}/conflicts/diff?conflictPath=${encodeURIComponent(item.conflictPath)}`);
            const diffData = await diffRes.json();

            if (!diffData.isText) {
              diffArea.innerHTML = `
                <div style="padding:12px;background:var(--panel-2);border-radius:6px;font-size:13px;">
                  <p>该文件为二进制媒体或附件文件，无法进行纯文本差异比对。</p>
                  <div style="display:flex;gap:8px;margin-top:10px;">
                    <button class="secondary act-keep-current">🛡️ 保留服务端当前版本</button>
                    <button class="btn-primary act-keep-conflict">⚡ 采用客户端冲突副本覆盖</button>
                  </div>
                </div>
              `;
              diffArea.querySelector('.act-keep-current').onclick = async () => {
                await api(`/api/vaults/${vaultId}/conflicts/resolve`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ conflictPath: item.conflictPath, resolution: 'keep-current' }),
                });
                toast('已保留服务端当前版本');
                renderConflictsSubtab(vaultId, container);
              };
              diffArea.querySelector('.act-keep-conflict').onclick = async () => {
                await api(`/api/vaults/${vaultId}/conflicts/resolve`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ conflictPath: item.conflictPath, resolution: 'keep-conflict' }),
                });
                toast('已采用冲突版本覆盖');
                renderConflictsSubtab(vaultId, container);
              };
              return;
            }

            diffArea.innerHTML = `
              <div class="conflict-diff-container">
                <div class="diff-pane">
                  <div class="diff-pane-header server">
                    <span>🖥️ 服务端当前版本 (Server Current)</span>
                    <span style="font-weight:normal;font-size:11px;opacity:0.8">${formatBytes(diffData.baseSize)}</span>
                  </div>
                  <div class="diff-pane-content">${escapeHtml(diffData.baseContent || '(空文件或未创建)')}</div>
                </div>
                <div class="diff-pane">
                  <div class="diff-pane-header client">
                    <span>📱 客户端上传冲突版本 (Client Conflict)</span>
                    <span style="font-weight:normal;font-size:11px;opacity:0.8">${formatBytes(diffData.conflictSize)}</span>
                  </div>
                  <div class="diff-pane-content">${escapeHtml(diffData.conflictContent)}</div>
                </div>
              </div>

              <div class="conflict-actions-bar">
                <span style="font-size:12.5px;font-weight:600;color:var(--text);margin-right:4px;">⚡ 快速解决策略:</span>
                <button class="secondary act-keep-current" title="丢弃冲突副本，维持服务端现有文件">🛡️ 保留当前版本</button>
                <button class="secondary act-keep-conflict" title="使用客户端冲突副本覆盖现有文件">⚡ 采纳冲突版本</button>
                <button class="btn-primary act-merge-both" title="将两份笔记内容按标记合并至同一文件中">🔀 智能合并两者 (带标记)</button>
                <button class="secondary act-custom-edit" title="在网页上直接编辑最终合并内容">✍️ 手动编辑合并</button>
              </div>

              <div class="custom-edit-box hidden" style="margin-top:12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                  <span style="font-size:13px;font-weight:600;">自定义最终合并内容:</span>
                  <button class="btn-primary act-save-custom" style="padding:4px 12px;font-size:12px;">💾 保存并解决冲突</button>
                </div>
                <textarea class="custom-merge-textarea" rows="12" style="width:100%;font-family:ui-monospace,monospace;font-size:12.5px;background:var(--panel-2);">${escapeHtml(diffData.mergedPreview)}</textarea>
              </div>
            `;

            diffArea.querySelector('.act-keep-current').onclick = async () => {
              await api(`/api/vaults/${vaultId}/conflicts/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conflictPath: item.conflictPath, resolution: 'keep-current' }),
              });
              toast('已解决：保留当前版本');
              renderConflictsSubtab(vaultId, container);
            };

            diffArea.querySelector('.act-keep-conflict').onclick = async () => {
              await api(`/api/vaults/${vaultId}/conflicts/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conflictPath: item.conflictPath, resolution: 'keep-conflict' }),
              });
              toast('已解决：采用冲突版本覆盖');
              renderConflictsSubtab(vaultId, container);
            };

            diffArea.querySelector('.act-merge-both').onclick = async () => {
              await api(`/api/vaults/${vaultId}/conflicts/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conflictPath: item.conflictPath, resolution: 'merge-both' }),
              });
              toast('已解决：已将两份笔记内容合并保存');
              renderConflictsSubtab(vaultId, container);
            };

            const customEditBox = diffArea.querySelector('.custom-edit-box');
            diffArea.querySelector('.act-custom-edit').onclick = () => {
              customEditBox.classList.toggle('hidden');
            };

            diffArea.querySelector('.act-save-custom').onclick = async () => {
              const text = customEditBox.querySelector('.custom-merge-textarea').value;
              await api(`/api/vaults/${vaultId}/conflicts/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  conflictPath: item.conflictPath,
                  resolution: 'custom',
                  customContent: text,
                }),
              });
              toast('已解决：已保存自定义合并内容');
              renderConflictsSubtab(vaultId, container);
            };
          } catch (err) {
            diffArea.innerHTML = `<div class="empty-state" style="color:#e74c3c;">获取差异比对失败: ${escapeHtml(err.message)}</div>`;
          }
        };

        wrap.appendChild(card);
      }
    } catch (err) {
      container.innerHTML = `<div class="empty-state" style="color:#e74c3c;">加载冲突解决中心失败: ${escapeHtml(err.message)}</div>`;
    }
  }

  // --------------------------- Subtab: Backups & Snapshots -------------------

  async function renderBackupsSubtab(vaultId, container) {
    container.innerHTML = '<div class="empty-state">加载快照与备份中…</div>';
    try {
      const res = await api(`/api/vaults/${vaultId}/backups`);
      const { backups } = await res.json();

      container.innerHTML = `
        <div class="panel-header" style="margin-bottom:14px;">
          <div>
            <h3 style="margin:0;font-size:16px;display:flex;align-items:center;gap:6px;">
              <span>💾</span>
              <span>全库快照与归档备份</span>
            </h3>
            <div style="font-size:12.5px;color:var(--muted);margin-top:2px;">
              创建当前 Vault 的全量 ZIP 打包快照，支持按需一键下载或历史版本归档恢复
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn-primary" id="create-snapshot-btn">📸 立即创建全库快照</button>
            <button class="secondary" id="export-live-zip-btn">📦 实时导出 ZIP</button>
          </div>
        </div>
        <div id="backups-list-wrap"></div>
      `;

      container.querySelector('#create-snapshot-btn').onclick = async () => {
        const label = prompt('请输入快照备注名称 (例如：版本发布前备份、每月归档):', '手动快照');
        if (label === null) return;
        try {
          toast('正在生成全库 ZIP 快照，请稍候…');
          const r = await api(`/api/vaults/${vaultId}/backups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label: label.trim() || '手动快照' }),
          });
          const body = await r.json();
          if (body.ok) {
            toast('全库快照创建成功！');
            renderBackupsSubtab(vaultId, container);
          }
        } catch (e) {
          toast('快照创建失败: ' + e.message);
        }
      };

      container.querySelector('#export-live-zip-btn').onclick = () => {
        window.open(`${state.serverBase.replace(/\/$/, '')}/api/vaults/${vaultId}/export?token=${state.token}`, '_blank');
      };

      const wrap = container.querySelector('#backups-list-wrap');
      if (backups.length === 0) {
        wrap.innerHTML = `
          <div class="empty-state" style="padding:48px 16px;">
            <div style="font-size:40px;margin-bottom:10px;">📦</div>
            <div style="font-weight:600;font-size:15px;color:var(--text);margin-bottom:4px;">暂无历史快照备份</div>
            <div style="font-size:13px;color:var(--muted);margin-bottom:16px;">点击右上角「立即创建全库快照」即可一键将当前 Vault 打包存档</div>
          </div>
        `;
        return;
      }

      const table = document.createElement('table');
      table.className = 'data-table';
      table.innerHTML = `
        <thead>
          <tr>
            <th>快照文件名</th>
            <th>备注说明</th>
            <th>大小</th>
            <th>创建时间</th>
            <th style="text-align:right">操作</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;
      const tbody = table.querySelector('tbody');

      for (const b of backups) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <div style="font-weight:600;font-size:13px;color:var(--text);display:flex;align-items:center;gap:6px;">
              <span>📦</span>
              <code>${escapeHtml(b.filename)}</code>
            </div>
          </td>
          <td><span class="badge primary" style="font-size:11px;">${escapeHtml(b.label || '全库快照')}</span></td>
          <td class="meta">${formatBytes(b.size)}</td>
          <td class="meta">${new Date(b.createdAt).toLocaleString()}</td>
          <td class="actions" style="text-align:right">
            <button class="secondary dl-backup-btn" data-id="${b.id}" style="font-size:12px;padding:3px 10px;">⬇️ 下载 ZIP</button>
            <button class="danger del-backup-btn" data-id="${b.id}" style="font-size:12px;padding:3px 8px;margin-left:4px;">🗑️ 删除</button>
          </td>
        `;

        tr.querySelector('.dl-backup-btn').onclick = () => {
          window.open(`${state.serverBase.replace(/\/$/, '')}/api/vaults/${vaultId}/backups/${b.id}/download?token=${state.token}`, '_blank');
        };

        tr.querySelector('.del-backup-btn').onclick = async () => {
          if (!confirm(`确定删除快照备份 "${b.filename}"？`)) return;
          try {
            await api(`/api/vaults/${vaultId}/backups/${b.id}`, { method: 'DELETE' });
            toast('快照备份已删除');
            renderBackupsSubtab(vaultId, container);
          } catch (e) {
            toast('删除失败: ' + e.message);
          }
        };

        tbody.appendChild(tr);
      }

      wrap.appendChild(table);
    } catch (err) {
      container.innerHTML = `<div class="empty-state" style="color:#e74c3c;">加载快照列表失败: ${escapeHtml(err.message)}</div>`;
    }
  }

  async function renderVaultSyncLogsSubtab(vaultId, container) {
    container.innerHTML = '<div class="empty-state">加载同步日志中…</div>';

    let currentAction = '';
    let currentStatus = '';
    let currentSearch = '';

    async function loadLogs() {
      const q = new URLSearchParams();
      if (currentAction) q.set('action', currentAction);
      if (currentStatus) q.set('status', currentStatus);
      if (currentSearch) q.set('search', currentSearch);
      q.set('limit', '80');

      const res = await api(`/api/vaults/${vaultId}/sync-logs?${q.toString()}`);
      const data = await res.json();
      renderUI(data);
    }

    function renderUI(data) {
      const logs = data.logs || [];
      container.innerHTML = `
        <div class="panel-header" style="margin-bottom:12px;">
          <div>
            <h3 style="margin:0;font-size:16px;">📋 笔记同步日志 (Sync Logs)</h3>
            <div style="font-size:12.5px;color:var(--muted);margin-top:2px;">实时追踪与审计所有设备客户端的推送、拉取、冲突、删除等同步记录 (共 ${data.total || 0} 条)</div>
          </div>
          <div class="sync-logs-actions">
            <button class="secondary" id="sync-logs-refresh-btn">🔄 刷新</button>
            ${logs.length > 0 ? `<button class="danger" id="sync-logs-clear-btn">🗑️ 清空此库日志</button>` : ''}
          </div>
        </div>

        <div class="sync-logs-controls">
          <div class="sync-logs-filters">
            <select id="log-filter-action">
              <option value="">全部同步动作 (All Actions)</option>
              <option value="update" ${currentAction === 'update' ? 'selected' : ''}>📝 更新 / 推送 (Push/Update)</option>
              <option value="pull" ${currentAction === 'pull' ? 'selected' : ''}>📥 读取 / 拉取 (Pull)</option>
              <option value="conflict" ${currentAction === 'conflict' ? 'selected' : ''}>⚠️ 冲突副本 (Conflict)</option>
              <option value="delete" ${currentAction === 'delete' ? 'selected' : ''}>🗑️ 删除文件 (Delete)</option>
              <option value="ignore" ${currentAction === 'ignore' ? 'selected' : ''}>🚫 规则忽略 (Ignored)</option>
              <option value="error" ${currentAction === 'error' ? 'selected' : ''}>❌ 异常错误 (Error)</option>
            </select>

            <select id="log-filter-status">
              <option value="">全部状态 (All Status)</option>
              <option value="success" ${currentStatus === 'success' ? 'selected' : ''}>✓ 成功 (Success)</option>
              <option value="conflict" ${currentStatus === 'conflict' ? 'selected' : ''}>⚠️ 冲突 (Conflict)</option>
              <option value="error" ${currentStatus === 'error' ? 'selected' : ''}>✕ 错误 (Error)</option>
              <option value="ignored" ${currentStatus === 'ignored' ? 'selected' : ''}>- 忽略 (Ignored)</option>
            </select>

            <input type="text" id="log-filter-search" placeholder="搜索文件名、路径或设备名…" value="${escapeHtml(currentSearch)}" style="width:200px;" />
            <button class="secondary" id="log-search-btn">🔍 筛选</button>
          </div>
        </div>

        <div class="sync-logs-table-wrap">
          <table class="data-table" style="width:100%;">
            <thead>
              <tr>
                <th style="width:140px;">时间戳</th>
                <th style="width:90px;">动作</th>
                <th>笔记 / 文件路径</th>
                <th style="width:80px;">大小</th>
                <th style="width:130px;">客户端设备 / IP</th>
                <th style="width:80px;">状态</th>
                <th>详细说明</th>
              </tr>
            </thead>
            <tbody id="sync-logs-tbody"></tbody>
          </table>
        </div>
      `;

      // Event bindings
      container.querySelector('#sync-logs-refresh-btn').onclick = () => loadLogs();
      container.querySelector('#log-search-btn').onclick = () => {
        currentAction = container.querySelector('#log-filter-action').value;
        currentStatus = container.querySelector('#log-filter-status').value;
        currentSearch = container.querySelector('#log-filter-search').value.trim();
        loadLogs();
      };
      container.querySelector('#log-filter-action').onchange = () => {
        currentAction = container.querySelector('#log-filter-action').value;
        loadLogs();
      };
      container.querySelector('#log-filter-status').onchange = () => {
        currentStatus = container.querySelector('#log-filter-status').value;
        loadLogs();
      };
      container.querySelector('#log-filter-search').onkeydown = (e) => {
        if (e.key === 'Enter') {
          currentSearch = container.querySelector('#log-filter-search').value.trim();
          loadLogs();
        }
      };

      const clearBtn = container.querySelector('#sync-logs-clear-btn');
      if (clearBtn) {
        clearBtn.onclick = async () => {
          if (!confirm('确定清空当前 Vault 的所有同步日志记录？此操作不会影响任何笔记内容。')) return;
          await api(`/api/vaults/${vaultId}/sync-logs`, { method: 'DELETE' });
          toast('同步日志已清空');
          loadLogs();
        };
      }

      const tbody = container.querySelector('#sync-logs-tbody');
      if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:32px;">暂无符合条件的同步日志</td></tr>`;
        return;
      }

      for (const item of logs) {
        const tr = document.createElement('tr');
        const actionMap = {
          update: { label: '更新', cls: 'update' },
          pull: { label: '拉取', cls: 'pull' },
          delete: { label: '删除', cls: 'delete' },
          conflict: { label: '冲突', cls: 'conflict' },
          ignore: { label: '忽略', cls: 'ignore' },
          error: { label: '错误', cls: 'error' },
        };
        const actInfo = actionMap[item.action] || { label: item.action, cls: 'pull' };

        const statusIcon = item.status === 'success' ? '✓ 成功' : item.status === 'conflict' ? '⚠️ 冲突' : item.status === 'error' ? '✕ 失败' : '- 忽略';
        const statusClass = item.status || 'success';

        tr.innerHTML = `
          <td class="meta" style="font-size:12px;">${new Date(item.timestamp).toLocaleString()}</td>
          <td><span class="sync-log-badge ${actInfo.cls}">${actInfo.label}</span></td>
          <td><b style="font-family:ui-monospace,monospace;font-size:12.5px;">${escapeHtml(item.path)}</b></td>
          <td class="meta" style="font-size:12px;">${item.size ? formatBytes(item.size) : '-'}</td>
          <td class="meta" style="font-size:12px;" title="${escapeHtml(item.clientIp || '')}">
            <span>💻 ${escapeHtml(item.deviceName || 'Web/REST')}</span>
          </td>
          <td><span class="sync-log-status ${statusClass}">${statusIcon}</span></td>
          <td style="font-size:12px;color:var(--text-secondary);">${escapeHtml(item.detail || '')}</td>
        `;
        tbody.appendChild(tr);
      }
    }

    await loadLogs();
  }

  // --------------------------- Admin Sync Logs Panel ------------------------

  async function renderAdminSyncLogsPanel() {
    mainPanel.innerHTML = '<div class="empty-state">加载全局同步日志中…</div>';

    let currentAction = '';
    let currentStatus = '';
    let currentSearch = '';
    let currentVaultFilter = '';

    async function loadLogs() {
      const q = new URLSearchParams();
      if (currentAction) q.set('action', currentAction);
      if (currentStatus) q.set('status', currentStatus);
      if (currentSearch) q.set('search', currentSearch);
      if (currentVaultFilter) q.set('vaultId', currentVaultFilter);
      q.set('limit', '100');

      const res = await api(`/api/admin/sync-logs?${q.toString()}`);
      const data = await res.json();
      renderUI(data);
    }

    function renderUI(data) {
      const logs = data.logs || [];
      const vaultOptions = state.vaults.map((v) => `<option value="${v.id}" ${v.id === currentVaultFilter ? 'selected' : ''}>${escapeHtml(v.name)}</option>`).join('');

      mainPanel.innerHTML = `
        <div class="panel-header" style="margin-bottom:12px;">
          <div>
            <h2 style="margin:0 0 4px;font-size:20px;display:flex;align-items:center;gap:10px;">
              <span>📋</span>
              <span>全局笔记同步日志 (Global Sync Logs)</span>
            </h2>
            <div style="font-size:13px;color:var(--muted)">监控审计所有客户端在所有 Vault 上的实时同步活动记录 (共 ${data.total || 0} 条)</div>
          </div>
          <div class="sync-logs-actions">
            <button class="secondary" id="admin-logs-refresh-btn">🔄 刷新数据</button>
          </div>
        </div>

        <div class="sync-logs-controls">
          <div class="sync-logs-filters">
            <select id="admin-log-filter-vault">
              <option value="">全部 Vault (All Vaults)</option>
              ${vaultOptions}
            </select>

            <select id="admin-log-filter-action">
              <option value="">全部同步动作 (All Actions)</option>
              <option value="update" ${currentAction === 'update' ? 'selected' : ''}>📝 更新 / 推送 (Push/Update)</option>
              <option value="pull" ${currentAction === 'pull' ? 'selected' : ''}>📥 读取 / 拉取 (Pull)</option>
              <option value="conflict" ${currentAction === 'conflict' ? 'selected' : ''}>⚠️ 冲突副本 (Conflict)</option>
              <option value="delete" ${currentAction === 'delete' ? 'selected' : ''}>🗑️ 删除文件 (Delete)</option>
              <option value="ignore" ${currentAction === 'ignore' ? 'selected' : ''}>🚫 规则忽略 (Ignored)</option>
              <option value="error" ${currentAction === 'error' ? 'selected' : ''}>❌ 异常错误 (Error)</option>
            </select>

            <select id="admin-log-filter-status">
              <option value="">全部状态 (All Status)</option>
              <option value="success" ${currentStatus === 'success' ? 'selected' : ''}>✓ 成功 (Success)</option>
              <option value="conflict" ${currentStatus === 'conflict' ? 'selected' : ''}>⚠️ 冲突 (Conflict)</option>
              <option value="error" ${currentStatus === 'error' ? 'selected' : ''}>✕ 错误 (Error)</option>
              <option value="ignored" ${currentStatus === 'ignored' ? 'selected' : ''}>- 忽略 (Ignored)</option>
            </select>

            <input type="text" id="admin-log-filter-search" placeholder="搜索文件名、路径或设备…" value="${escapeHtml(currentSearch)}" style="width:200px;" />
            <button class="secondary" id="admin-log-search-btn">🔍 筛选</button>
          </div>
        </div>

        <div class="sync-logs-table-wrap">
          <table class="data-table" style="width:100%;">
            <thead>
              <tr>
                <th style="width:140px;">时间</th>
                <th style="width:85px;">动作</th>
                <th>文件路径</th>
                <th style="width:80px;">大小</th>
                <th style="width:120px;">用户 / 设备</th>
                <th style="width:80px;">状态</th>
                <th>详细说明</th>
              </tr>
            </thead>
            <tbody id="admin-logs-tbody"></tbody>
          </table>
        </div>
      `;

      // Event bindings
      mainPanel.querySelector('#admin-logs-refresh-btn').onclick = () => loadLogs();
      mainPanel.querySelector('#admin-log-search-btn').onclick = () => {
        currentVaultFilter = mainPanel.querySelector('#admin-log-filter-vault').value;
        currentAction = mainPanel.querySelector('#admin-log-filter-action').value;
        currentStatus = mainPanel.querySelector('#admin-log-filter-status').value;
        currentSearch = mainPanel.querySelector('#admin-log-filter-search').value.trim();
        loadLogs();
      };
      mainPanel.querySelector('#admin-log-filter-vault').onchange = () => {
        currentVaultFilter = mainPanel.querySelector('#admin-log-filter-vault').value;
        loadLogs();
      };
      mainPanel.querySelector('#admin-log-filter-action').onchange = () => {
        currentAction = mainPanel.querySelector('#admin-log-filter-action').value;
        loadLogs();
      };
      mainPanel.querySelector('#admin-log-filter-status').onchange = () => {
        currentStatus = mainPanel.querySelector('#admin-log-filter-status').value;
        loadLogs();
      };
      mainPanel.querySelector('#admin-log-filter-search').onkeydown = (e) => {
        if (e.key === 'Enter') {
          currentSearch = mainPanel.querySelector('#admin-log-filter-search').value.trim();
          loadLogs();
        }
      };

      const tbody = mainPanel.querySelector('#admin-logs-tbody');
      if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:32px;">暂无符合条件的全局同步日志</td></tr>`;
        return;
      }

      for (const item of logs) {
        const tr = document.createElement('tr');
        const actionMap = {
          update: { label: '更新', cls: 'update' },
          pull: { label: '拉取', cls: 'pull' },
          delete: { label: '删除', cls: 'delete' },
          conflict: { label: '冲突', cls: 'conflict' },
          ignore: { label: '忽略', cls: 'ignore' },
          error: { label: '错误', cls: 'error' },
        };
        const actInfo = actionMap[item.action] || { label: item.action, cls: 'pull' };

        const statusIcon = item.status === 'success' ? '✓ 成功' : item.status === 'conflict' ? '⚠️ 冲突' : item.status === 'error' ? '✕ 失败' : '- 忽略';
        const statusClass = item.status || 'success';

        tr.innerHTML = `
          <td class="meta" style="font-size:12px;">${new Date(item.timestamp).toLocaleString()}</td>
          <td><span class="sync-log-badge ${actInfo.cls}">${actInfo.label}</span></td>
          <td><b style="font-family:ui-monospace,monospace;font-size:12.5px;">${escapeHtml(item.path)}</b></td>
          <td class="meta" style="font-size:12px;">${item.size ? formatBytes(item.size) : '-'}</td>
          <td class="meta" style="font-size:12px;">
            <div><b>👤 ${escapeHtml(item.username || 'user')}</b></div>
            <div style="color:var(--muted)">💻 ${escapeHtml(item.deviceName || 'Client')}</div>
          </td>
          <td><span class="sync-log-status ${statusClass}">${statusIcon}</span></td>
          <td style="font-size:12px;color:var(--text-secondary);">${escapeHtml(item.detail || '')}</td>
        `;
        tbody.appendChild(tr);
      }
    }

    await loadLogs();
  }

  // --------------------------- File Editor & Previewer -----------------------

  async function openFile(vaultId, path) {
    const isImage = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(path);
    const isHtml = /\.(html|htm)$/i.test(path);
    const fileUrl = `${state.serverBase.replace(/\/$/, '')}/api/vaults/${vaultId}/files/${encodeURIComponentPath(path)}`;

    if (isImage) {
      renderMediaViewer(vaultId, path, fileUrl);
      return;
    }

    try {
      const res = await api(`/api/vaults/${vaultId}/files/${encodeURIComponentPath(path)}`);
      const text = await res.text();
      const baseHash = (state.manifest && state.manifest[path]) ? state.manifest[path].hash : undefined;

      mainPanel.innerHTML = '';
      const layout = document.createElement('div');
      layout.className = 'editor-layout';

      if (isHtml) {
        // Dedicated HTML viewer and editor
        const header = document.createElement('div');
        header.className = 'editor-header';
        header.innerHTML = `
          <div class="editor-title">
            <button class="secondary" id="ed-back-btn">← 返回</button>
            <span>🌐 ${escapeHtml(path)}</span>
            <span class="badge primary" style="font-size:11px;">HTML 网页</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <div class="editor-mode-btn-group">
              <button class="editor-mode-btn active" id="html-mode-page" title="完整渲染网页视图">🌐 网页视图</button>
              <button class="editor-mode-btn" id="html-mode-split" title="左侧源码、右侧实时渲染">👁️ 实时双栏</button>
              <button class="editor-mode-btn" id="html-mode-code" title="仅查看与编辑 HTML 源代码">📝 源码编辑</button>
            </div>
            <button class="secondary" id="ed-open-tab-btn" title="在新标签页全屏独立打开此网页">🚀 新窗口打开</button>
            <button class="secondary" id="ed-share-btn">🔗 分享</button>
            <button class="secondary" id="ed-history-btn">⏱️ 历史版本</button>
            <button class="btn-primary" id="ed-save-btn">💾 保存</button>
          </div>
        `;
        layout.appendChild(header);

        const body = document.createElement('div');
        body.className = 'editor-body';

        const editorPane = document.createElement('div');
        editorPane.className = 'editor-pane';
        editorPane.style.display = 'none'; // Hidden in default "page" mode

        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.spellcheck = false;
        editorPane.appendChild(textarea);

        const previewPane = document.createElement('div');
        previewPane.className = 'html-preview-pane full-page';

        const iframe = document.createElement('iframe');
        iframe.className = 'html-preview-iframe';
        iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-modals');
        previewPane.appendChild(iframe);

        body.appendChild(editorPane);
        body.appendChild(previewPane);
        layout.appendChild(body);
        mainPanel.appendChild(layout);

        // Populate iframe content
        function renderHtmlInIframe(htmlContent) {
          iframe.srcdoc = htmlContent;
        }
        renderHtmlInIframe(text);

        // Mode switcher handler
        let currentMode = 'page'; // 'page' | 'split' | 'code'
        function setHtmlViewMode(mode) {
          currentMode = mode;
          header.querySelector('#html-mode-page').classList.toggle('active', mode === 'page');
          header.querySelector('#html-mode-split').classList.toggle('active', mode === 'split');
          header.querySelector('#html-mode-code').classList.toggle('active', mode === 'code');

          if (mode === 'page') {
            editorPane.style.display = 'none';
            previewPane.style.display = 'flex';
            previewPane.classList.add('full-page');
          } else if (mode === 'split') {
            editorPane.style.display = 'flex';
            previewPane.style.display = 'flex';
            previewPane.classList.remove('full-page');
            renderHtmlInIframe(textarea.value);
          } else if (mode === 'code') {
            editorPane.style.display = 'flex';
            previewPane.style.display = 'none';
          }
        }

        header.querySelector('#html-mode-page').onclick = () => setHtmlViewMode('page');
        header.querySelector('#html-mode-split').onclick = () => setHtmlViewMode('split');
        header.querySelector('#html-mode-code').onclick = () => setHtmlViewMode('code');

        // Real-time live update while typing
        let liveUpdateTimer;
        textarea.oninput = () => {
          if (currentMode === 'split' || currentMode === 'page') {
            clearTimeout(liveUpdateTimer);
            liveUpdateTimer = setTimeout(() => {
              renderHtmlInIframe(textarea.value);
            }, 200);
          }
        };

        // Open in new tab
        header.querySelector('#ed-open-tab-btn').onclick = () => {
          const blob = new Blob([textarea.value], { type: 'text/html;charset=utf-8' });
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
        };

        header.querySelector('#ed-back-btn').onclick = () => openVault(vaultId, 'files');
        header.querySelector('#ed-share-btn').onclick = () => showCreateShareModal(vaultId, path);
        header.querySelector('#ed-history-btn').onclick = () => showHistoryModal(vaultId, path);

        header.querySelector('#ed-save-btn').onclick = async () => {
          try {
            await saveFile(vaultId, path, textarea.value, baseHash);
            toast('HTML 笔记已保存并已广播同步');
            openVault(vaultId, 'files');
          } catch (e) {
            toast('保存失败: ' + e.message);
          }
        };
        return;
      }

      // Markdown & General Text file editor
      const header = document.createElement('div');
      header.className = 'editor-header';
      header.innerHTML = `
        <div class="editor-title">
          <button class="secondary" id="ed-back-btn">← 返回</button>
          <span>📄 ${escapeHtml(path)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <button class="secondary" id="ed-toggle-preview-btn">👁️ 切换双栏预览</button>
          <button class="secondary" id="ed-share-btn">🔗 分享</button>
          <button class="secondary" id="ed-history-btn">⏱️ 历史版本</button>
          <button class="btn-primary" id="ed-save-btn">💾 保存</button>
        </div>
      `;
      layout.appendChild(header);

      const body = document.createElement('div');
      body.className = 'editor-body';

      const editorPane = document.createElement('div');
      editorPane.className = 'editor-pane';
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.spellcheck = false;
      editorPane.appendChild(textarea);

      const previewPane = document.createElement('div');
      previewPane.className = 'preview-pane';
      const parsedHtml = (typeof marked !== 'undefined' && marked && typeof marked.parse === 'function')
        ? marked.parse(text)
        : `<pre style="white-space:pre-wrap;">${escapeHtml(text)}</pre>`;
      previewPane.innerHTML = parsedHtml;

      body.appendChild(editorPane);
      body.appendChild(previewPane);
      layout.appendChild(body);
      mainPanel.appendChild(layout);

      // Event handlers
      let showPreview = true;
      header.querySelector('#ed-toggle-preview-btn').onclick = () => {
        showPreview = !showPreview;
        previewPane.classList.toggle('hidden', !showPreview);
      };

      textarea.oninput = () => {
        if (showPreview) {
          if (typeof marked !== 'undefined' && marked && typeof marked.parse === 'function') {
            previewPane.innerHTML = marked.parse(textarea.value);
          } else {
            previewPane.innerHTML = `<pre style="white-space:pre-wrap;">${escapeHtml(textarea.value)}</pre>`;
          }
        }
      };

      header.querySelector('#ed-back-btn').onclick = () => openVault(vaultId, 'files');
      header.querySelector('#ed-share-btn').onclick = () => showCreateShareModal(vaultId, path);
      header.querySelector('#ed-history-btn').onclick = () => showHistoryModal(vaultId, path);

      header.querySelector('#ed-save-btn').onclick = async () => {
        try {
          await saveFile(vaultId, path, textarea.value, baseHash);
          toast('保存成功并已广播同步');
          openVault(vaultId, 'files');
        } catch (e) {
          toast('保存失败: ' + e.message);
        }
      };
    } catch (e) {
      toast('无法打开笔记内容: ' + e.message);
      console.error('[Nimbus] Failed to open file:', path, e);
    }
  }

  function renderMediaViewer(vaultId, path, fileUrl) {
    mainPanel.innerHTML = '';
    const layout = document.createElement('div');
    layout.className = 'editor-layout';

    layout.innerHTML = `
      <div class="editor-header">
        <div class="editor-title">
          <button class="secondary" id="media-back-btn">← 返回</button>
          <span>🖼️ ${escapeHtml(path)}</span>
        </div>
        <div>
          <a class="btn secondary" href="${fileUrl}" download="${path.split('/').pop()}" style="text-decoration:none">⬇️ 下载原图</a>
        </div>
      </div>
      <div class="media-preview-container">
        <img src="${fileUrl}" alt="${escapeHtml(path)}" />
      </div>
    `;

    layout.querySelector('#media-back-btn').onclick = () => openVault(vaultId, 'files');
    mainPanel.appendChild(layout);
  }

  async function saveFile(vaultId, path, content, baseHash) {
    const headers = { 'Content-Type': 'text/plain', 'X-Mtime': String(Date.now()) };
    if (baseHash) headers['X-Base-Hash'] = baseHash;
    await api(`/api/vaults/${vaultId}/files/${encodeURIComponentPath(path)}`, {
      method: 'PUT',
      headers,
      body: content,
    });
  }

  // --------------------------- History & Diff Modal --------------------------

  async function showHistoryModal(vaultId, filePath) {
    const res = await api(`/api/vaults/${vaultId}/history?path=${encodeURIComponent(filePath)}`);
    const { history } = await res.json();

    const html = `
      <div class="modal-header">
        <h3>⏱️ 版本历史与差异对比 · ${escapeHtml(filePath)}</h3>
        <button class="modal-close ghost">✕</button>
      </div>
      <div class="modal-body" id="history-modal-body">
        ${
          history.length === 0
            ? '<div class="empty-state">当前笔记尚未产生覆盖修改记录（文件被覆盖更新后会自动留痕）。</div>'
            : `
          <div style="display:flex;flex-direction:column;gap:12px;">
            <p style="color:var(--text-secondary);font-size:13px;">选择一个历史快照进行对比或一键回滚：</p>
            <div id="history-version-items"></div>
            <div id="diff-viewer-wrap" style="display:none;margin-top:16px;">
              <div class="panel-header">
                <h4 style="margin:0;font-size:14px;">📝 差异对比 (绿色为当前新增，红色为历史删除)</h4>
              </div>
              <div id="diff-box" class="diff-container"></div>
            </div>
          </div>
        `
        }
      </div>
      <div class="modal-footer">
        <button class="modal-close secondary">关闭</button>
      </div>
    `;

    showModal(html, (dialog) => {
      const itemsWrap = dialog.querySelector('#history-version-items');
      if (!itemsWrap || history.length === 0) return;

      for (const ver of history) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;background:var(--panel-2);padding:8px 12px;border-radius:6px;border:1px solid var(--border);';
        row.innerHTML = `
          <div>
            <div style="font-weight:600;font-size:13px">${new Date(ver.savedAt).toLocaleString()}</div>
            <div class="meta">${formatBytes(ver.size)}</div>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="secondary" id="compare-ver-${ver.id}">🔍 对比差异</button>
            <button class="btn-primary" id="restore-ver-${ver.id}">回滚至此版本</button>
          </div>
        `;

        row.querySelector(`#compare-ver-${ver.id}`).onclick = async () => {
          const histRes = await api(`/api/vaults/${vaultId}/history/${ver.id}`);
          const oldText = await histRes.text();
          let currentText = '';
          try {
            const curRes = await api(`/api/vaults/${vaultId}/files/${encodeURIComponentPath(filePath)}`);
            currentText = await curRes.text();
          } catch {}

          renderDiff(dialog.querySelector('#diff-box'), oldText, currentText);
          dialog.querySelector('#diff-viewer-wrap').style.display = 'block';
        };

        row.querySelector(`#restore-ver-${ver.id}`).onclick = async () => {
          if (!confirm(`确定将 "${filePath}" 回滚到 ${new Date(ver.savedAt).toLocaleString()} 的版本？当前版本会自动存入历史。`)) return;
          await api(`/api/vaults/${vaultId}/history/${ver.id}/restore`, { method: 'POST' });
          toast('已回滚至历史版本');
          closeModal();
          openVault(vaultId, 'files');
        };

        itemsWrap.appendChild(row);
      }
    });
  }

  function renderDiff(diffContainer, oldStr, newStr) {
    const oldLines = oldStr.split('\n');
    const newLines = newStr.split('\n');
    diffContainer.innerHTML = '';

    const max = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < max; i++) {
      const o = oldLines[i];
      const n = newLines[i];
      if (o === n) {
        const div = document.createElement('div');
        div.className = 'diff-line same';
        div.innerHTML = `<span class="diff-gutter">${i + 1}</span> <span>  ${escapeHtml(o || '')}</span>`;
        diffContainer.appendChild(div);
      } else {
        if (o !== undefined) {
          const del = document.createElement('div');
          del.className = 'diff-line del';
          del.innerHTML = `<span class="diff-gutter">-</span> <span>- ${escapeHtml(o)}</span>`;
          diffContainer.appendChild(del);
        }
        if (n !== undefined) {
          const add = document.createElement('div');
          add.className = 'diff-line add';
          add.innerHTML = `<span class="diff-gutter">+</span> <span>+ ${escapeHtml(n)}</span>`;
          diffContainer.appendChild(add);
        }
      }
    }
  }

  function showFilePreviewModal(path, text) {
    const html = `
      <div class="modal-header">
        <h3>📄 预览文件 · ${escapeHtml(path)}</h3>
        <button class="modal-close ghost">✕</button>
      </div>
      <div class="modal-body">
        <pre class="code-snippet" style="max-height:400px;overflow-y:auto;">${escapeHtml(text)}</pre>
      </div>
      <div class="modal-footer">
        <button class="modal-close secondary">关闭</button>
      </div>
    `;
    showModal(html);
  }

  // --------------------------- File Upload & New -----------------------------

  function createNewNotePrompt(vaultId) {
    const p = prompt('请输入新文件相对路径（例如：Notes/Daily.md 或 Work/Project.md）：');
    if (!p || !p.trim()) return;
    const cleanPath = p.trim().replace(/^\/+/, '');
    saveFile(vaultId, cleanPath, '# ' + cleanPath.split('/').pop().replace(/\.md$/, '') + '\n\n', undefined).then(() => {
      toast('已创建文件');
      openVault(vaultId, 'files');
    });
  }

  function triggerFileUpload(vaultId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async () => {
      if (!input.files || input.files.length === 0) return;
      for (const file of input.files) {
        const buffer = await file.arrayBuffer();
        await api(`/api/vaults/${vaultId}/files/${encodeURIComponentPath(file.name)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: buffer,
        });
      }
      toast(`已上传 ${input.files.length} 个文件`);
      openVault(vaultId, 'files');
    };
    input.click();
  }

  function setupDragDrop(zone, vaultId) {
    zone.ondragover = (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    };
    zone.ondragleave = () => zone.classList.remove('dragover');
    zone.ondrop = async (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;

      for (const file of files) {
        const buffer = await file.arrayBuffer();
        await api(`/api/vaults/${vaultId}/files/${encodeURIComponentPath(file.name)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: buffer,
        });
      }
      toast(`已上传 ${files.length} 个文件`);
      openVault(vaultId, 'files');
    };
  }

  // --------------------------- Admin Panels ----------------------------------

  async function renderUsersPanel() {
    mainPanel.innerHTML = '<div class="empty-state">加载用户列表中…</div>';
    const [usersRes, vaultsRes] = await Promise.all([
      api('/api/admin/users'),
      api('/api/admin/vaults'),
    ]);
    const usersBody = await usersRes.json();
    const vaultsBody = await vaultsRes.json();
    const allVaults = vaultsBody.vaults || [];
    const usersList = usersBody.users || [];

    mainPanel.innerHTML = `
      <div class="panel-header">
        <h2>👥 用户管理与 Vault 授权</h2>
      </div>
      <div style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-bottom:24px;">
        <h4 style="margin:0 0 16px;font-size:14px;font-weight:600;display:flex;align-items:center;gap:6px;">
          <span>➕</span> 添加新用户并分配权限
        </h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:14px;">
          <label style="margin:0;">
            <span style="font-size:12.5px;color:var(--text-secondary);display:block;margin-bottom:4px;">用户名</span>
            <input id="nu-username" placeholder="请输入用户名" style="margin:0;" />
          </label>
          <label style="margin:0;">
            <span style="font-size:12.5px;color:var(--text-secondary);display:block;margin-bottom:4px;">初始密码</span>
            <input id="nu-password" type="password" placeholder="请输入密码" style="margin:0;" />
          </label>
        </div>

        <div class="form-checkbox-group" style="margin-top:14px;">
          <label class="form-checkbox-label">
            <input id="nu-admin" type="checkbox" />
            <span>管理员权限（允许管理系统数据库、全局用户及所有 Vault 配置）</span>
          </label>
        </div>

        <div style="margin-top:16px;border-top:1px solid var(--border);padding-top:14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <span style="font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;">
              <span>📂</span> 关联并授权 Vaults 笔记库 (可选)
            </span>
            ${allVaults.length > 0 ? `
              <div style="font-size:12px;display:flex;gap:8px;">
                <button type="button" id="nu-select-all-vaults" class="secondary" style="padding:2px 8px;font-size:11px;">全选</button>
                <button type="button" id="nu-clear-vaults" class="secondary" style="padding:2px 8px;font-size:11px;">清空</button>
              </div>
            ` : ''}
          </div>

          ${allVaults.length === 0 ? `
            <div style="font-size:12.5px;color:var(--muted);padding:10px 0;">
              系统内暂无其他 Vault，创建用户后可随时在 Vault 页面中添加授权。
            </div>
          ` : `
            <div id="nu-vaults-list" style="display:flex;flex-direction:column;gap:8px;max-height:220px;overflow-y:auto;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 14px;">
              ${allVaults.map((v) => `
                <div class="nu-vault-item" style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03);">
                  <label style="display:flex;align-items:center;gap:8px;margin:0;cursor:pointer;flex:1;overflow:hidden;">
                    <input type="checkbox" class="nu-vault-check" data-vault-id="${v.id}" />
                    <span style="font-weight:500;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">📓 ${escapeHtml(v.name)}</span>
                    <span style="font-size:11px;color:var(--muted);">(所有者: ${escapeHtml(v.ownerUsername)})</span>
                  </label>
                  <select class="nu-vault-perm" data-vault-id="${v.id}" style="padding:2px 8px;font-size:12px;border-radius:4px;margin:0;width:auto;">
                    <option value="read-write">✏️ 读写 (Read-Write)</option>
                    <option value="read-only">👁️ 只读 (Read-Only)</option>
                  </select>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div style="margin-top:16px;">
          <button id="nu-submit" class="btn-primary">＋ 创建用户并分配权限</button>
        </div>
      </div>
      <div id="users-table-wrap"></div>
    `;

    $('#nu-select-all-vaults')?.addEventListener('click', () => {
      document.querySelectorAll('.nu-vault-check').forEach((chk) => { chk.checked = true; });
    });
    $('#nu-clear-vaults')?.addEventListener('click', () => {
      document.querySelectorAll('.nu-vault-check').forEach((chk) => { chk.checked = false; });
    });

    $('#nu-submit').onclick = async () => {
      const username = $('#nu-username').value.trim();
      const password = $('#nu-password').value;
      const role = $('#nu-admin').checked ? 'admin' : 'user';
      if (!username || !password) {
        toast('请填写用户名与密码');
        return;
      }

      const vaultAssignments = [];
      document.querySelectorAll('.nu-vault-check:checked').forEach((chk) => {
        const vaultId = chk.dataset.vaultId;
        const permSelect = document.querySelector(`.nu-vault-perm[data-vault-id="${vaultId}"]`);
        const permission = permSelect ? permSelect.value : 'read-write';
        vaultAssignments.push({ vaultId, permission });
      });

      try {
        await api('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, role, vaultAssignments }),
        });
        toast(vaultAssignments.length > 0 ? `用户创建成功，已分配 ${vaultAssignments.length} 个 Vault 权限` : '用户创建成功');
        renderUsersPanel();
      } catch (e) {
        toast('创建失败: ' + e.message);
      }
    };

    const wrap = $('#users-table-wrap');
    const table = document.createElement('table');
    table.className = 'data-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>用户名</th>
          <th>角色</th>
          <th>授权笔记库 (Vaults)</th>
          <th>创建时间</th>
          <th style="text-align:right">操作</th>
        </tr>
      </thead>
      <tbody id="admin-users-tbody"></tbody>
    `;
    const tbody = table.querySelector('#admin-users-tbody');

    for (const u of usersList) {
      const tr = document.createElement('tr');
      const memberships = u.memberships || [];
      const owned = u.ownedVaults || [];

      let vaultsBadgeHtml = '';
      if (owned.length > 0) {
        vaultsBadgeHtml += owned.map((v) => `<span class="badge primary" style="font-size:10.5px;margin:2px;" title="所有者">👑 ${escapeHtml(v.vaultName)}</span>`).join(' ');
      }
      if (memberships.length > 0) {
        vaultsBadgeHtml += (vaultsBadgeHtml ? ' ' : '') + memberships.map((m) => {
          const isRw = m.permission === 'read-write';
          return `<span class="badge ${isRw ? 'success' : 'warning'}" style="font-size:10.5px;margin:2px;" title="${isRw ? '读写' : '只读'}">${isRw ? '✏️' : '👁️'} ${escapeHtml(m.vaultName)}</span>`;
        }).join(' ');
      }
      if (!vaultsBadgeHtml) {
        vaultsBadgeHtml = '<span style="font-size:12px;color:var(--muted)">暂无关联 Vault</span>';
      }

      tr.innerHTML = `
        <td><b>👤 ${escapeHtml(u.username)}</b></td>
        <td><span class="badge ${u.role === 'admin' ? 'primary' : ''}">${u.role === 'admin' ? '管理员' : '普通用户'}</span></td>
        <td style="max-width:320px;">${vaultsBadgeHtml}</td>
        <td class="meta">${new Date(u.createdAt).toLocaleString()}</td>
        <td class="actions" style="text-align:right">
          <button class="secondary edit-user-btn" data-user-id="${u.id}" style="font-size:12px;padding:4px 10px;">✏️ 编辑用户</button>
        </td>
      `;

      tr.querySelector('.edit-user-btn').onclick = () => openEditUserModal(u);

      if (u.id !== state.user.id) {
        const del = document.createElement('button');
        del.textContent = '删除';
        del.className = 'danger';
        del.style.cssText = 'font-size:12px;padding:4px 10px;margin-left:6px;';
        del.onclick = async () => {
          if (!confirm(`确定删除用户 "${u.username}"？`)) return;
          await api(`/api/admin/users/${u.id}`, { method: 'DELETE' });
          renderUsersPanel();
        };
        tr.querySelector('.actions').appendChild(del);
      }
      tbody.appendChild(tr);
    }
    wrap.appendChild(table);
  }

  // --------------------------- Modal: Edit User & Vault Permissions ----------

  async function openEditUserModal(targetUser) {
    let modal = $('#edit-user-modal');
    if (modal) modal.remove();

    const isSelf = targetUser.id === state.user.id;

    modal = document.createElement('div');
    modal.id = 'edit-user-modal';
    modal.className = 'modal-backdrop';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;z-index:9999;backdrop-filter:blur(3px);padding:16px;';
    modal.innerHTML = `
      <div style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);width:100%;max-width:580px;padding:24px;box-shadow:0 12px 36px rgba(0,0,0,0.4);max-height:88vh;display:flex;flex-direction:column;">
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);padding-bottom:12px;margin-bottom:16px;">
          <h3 style="margin:0;font-size:16px;display:flex;align-items:center;gap:6px;">
            <span>✏️</span>
            <span>编辑用户: <b>${escapeHtml(targetUser.username)}</b></span>
          </h3>
          <button id="modal-close-btn" class="secondary" style="padding:4px 8px;font-size:12px;">✕</button>
        </div>

        <div style="flex:1;overflow-y:auto;padding-right:4px;display:flex;flex-direction:column;gap:18px;">
          <!-- 1. Basic Info Section -->
          <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px 16px;">
            <div style="font-size:13px;font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
              <span>👤</span> 基础账号信息
            </div>
            <div style="grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:12px;display:grid;">
              <label style="margin:0;">
                <span style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                  <span>用户名</span>
                  <span style="font-size:11px;color:var(--muted);">🔒 已创建用户禁止修改用户名</span>
                </span>
                <input id="eu-username" value="${escapeHtml(targetUser.username)}" readonly disabled style="margin:0;background:var(--panel-2);color:var(--text-secondary);cursor:not-allowed;border-color:var(--border);" />
              </label>
              <label style="margin:0;">
                <span style="font-size:12px;color:var(--text-secondary);display:block;margin-bottom:4px;">重置密码 (留空保持原密码不变)</span>
                <input id="eu-password" type="password" placeholder="若无需重置请留空" style="margin:0;" />
              </label>
            </div>

            <div style="margin-top:12px;">
              <label style="font-size:12px;color:var(--text-secondary);display:block;margin-bottom:4px;">用户角色权限</label>
              <select id="eu-role" style="margin:0;max-width:240px;" ${isSelf ? 'disabled' : ''}>
                <option value="user" ${targetUser.role !== 'admin' ? 'selected' : ''}>普通用户 (User)</option>
                <option value="admin" ${targetUser.role === 'admin' ? 'selected' : ''}>系统管理员 (Admin)</option>
              </select>
              ${isSelf ? '<div style="font-size:11px;color:var(--muted);margin-top:4px;">💡 正在编辑自身账号，无法降级管理员权限</div>' : ''}
            </div>
          </div>

          <!-- 2. Vault Permissions Section -->
          <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px 16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <span style="font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;">
                <span>📂</span> Vault 笔记库权限授权
              </span>
              <div style="font-size:12px;display:flex;gap:6px;">
                <button type="button" id="eu-select-all-vaults" class="secondary" style="padding:2px 8px;font-size:11px;">全选</button>
                <button type="button" id="eu-clear-vaults" class="secondary" style="padding:2px 8px;font-size:11px;">清空</button>
              </div>
            </div>

            <div id="modal-vaults-content" style="display:flex;flex-direction:column;gap:8px;">
              <div class="empty-state" style="padding:16px;">加载 Vault 列表中…</div>
            </div>
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;border-top:1px solid var(--border);padding-top:14px;">
          <span style="font-size:12px;color:var(--muted);">修改将即时生效</span>
          <div style="display:flex;gap:8px;">
            <button id="modal-cancel-btn" class="secondary">取消</button>
            <button id="modal-save-btn" class="btn-primary">保存修改</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector('#modal-close-btn').onclick = close;
    modal.querySelector('#modal-cancel-btn').onclick = close;
    modal.onclick = (e) => { if (e.target === modal) close(); };

    modal.querySelector('#eu-select-all-vaults')?.addEventListener('click', () => {
      modal.querySelectorAll('.m-vault-chk:not(:disabled)').forEach((chk) => { chk.checked = true; });
    });
    modal.querySelector('#eu-clear-vaults')?.addEventListener('click', () => {
      modal.querySelectorAll('.m-vault-chk:not(:disabled)').forEach((chk) => { chk.checked = false; });
    });

    try {
      const res = await api(`/api/admin/users/${targetUser.id}/vaults`);
      const { vaults } = await res.json();
      const content = modal.querySelector('#modal-vaults-content');

      if (!vaults || vaults.length === 0) {
        content.innerHTML = '<div style="font-size:12px;color:var(--muted);padding:8px 0;">系统内暂无 Vault</div>';
      } else {
        content.innerHTML = vaults.map((v) => {
          const isOwner = v.isOwner;
          const isAssigned = v.assigned;
          const isRw = v.permission === 'read-write';

          return `
            <div class="modal-vault-row" style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 12px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
              <label style="display:flex;align-items:center;gap:8px;margin:0;cursor:${isOwner ? 'default' : 'pointer'};flex:1;overflow:hidden;">
                <input type="checkbox" class="m-vault-chk" data-vault-id="${v.id}" ${isAssigned ? 'checked' : ''} ${isOwner ? 'disabled' : ''} />
                <div style="overflow:hidden;">
                  <div style="font-weight:500;font-size:13px;display:flex;align-items:center;gap:6px;">
                    <span>📓 ${escapeHtml(v.name)}</span>
                    ${isOwner ? '<span class="badge primary" style="font-size:10px;">所有者</span>' : ''}
                  </div>
                  <div style="font-size:10.5px;color:var(--muted);margin-top:1px;">ID: ${v.id}</div>
                </div>
              </label>
              <div>
                ${isOwner ? `
                  <span class="badge primary" style="font-size:11px;">全部权限</span>
                ` : `
                  <select class="m-vault-perm" data-vault-id="${v.id}" style="padding:2px 6px;font-size:12px;border-radius:4px;margin:0;width:auto;">
                    <option value="read-write" ${isRw ? 'selected' : ''}>✏️ 读写 (Read-Write)</option>
                    <option value="read-only" ${!isRw ? 'selected' : ''}>👁️ 只读 (Read-Only)</option>
                  </select>
                `}
              </div>
            </div>
          `;
        }).join('');
      }

      modal.querySelector('#modal-save-btn').onclick = async () => {
        const password = modal.querySelector('#eu-password').value;
        const role = modal.querySelector('#eu-role').value;

        const vaultAssignments = [];
        modal.querySelectorAll('.m-vault-chk:checked').forEach((chk) => {
          if (chk.disabled) return; // Skip owner
          const vaultId = chk.dataset.vaultId;
          const permSelect = modal.querySelector(`.m-vault-perm[data-vault-id="${vaultId}"]`);
          const permission = permSelect ? permSelect.value : 'read-write';
          vaultAssignments.push({ vaultId, permission });
        });

        try {
          const updateRes = await api(`/api/admin/users/${targetUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              password: password || undefined,
              role,
              vaultAssignments,
            }),
          });
          const updateBody = await updateRes.json();
          if (!updateRes.ok || updateBody.error) {
            throw new Error(updateBody.error || '更新失败');
          }

          toast(`已成功更新用户 "${targetUser.username}" 的信息与权限`);
          close();
          renderUsersPanel();
        } catch (e) {
          toast('保存失败: ' + e.message);
        }
      };
    } catch (e) {
      modal.querySelector('#modal-vaults-content').innerHTML = `<div class="empty-state">加载失败: ${escapeHtml(e.message)}</div>`;
    }
  }

  async function renderAllVaultsPanel() {
    mainPanel.innerHTML = '<div class="empty-state">加载 Vault 列表中…</div>';
    const res = await api('/api/admin/vaults');
    const body = await res.json();

    mainPanel.innerHTML = `
      <div class="panel-header">
        <h2>📚 全局 Vault 状态与管理</h2>
      </div>
      <div id="all-vaults-wrap"></div>
    `;

    const wrap = $('#all-vaults-wrap');
    const table = document.createElement('table');
    table.className = 'data-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Vault 名称</th>
          <th>所有者</th>
          <th>Vault ID</th>
          <th>创建时间</th>
          <th style="text-align:right">操作</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    for (const v of body.vaults) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><b>📓 ${escapeHtml(v.name)}</b></td>
        <td><span class="badge">👤 ${escapeHtml(v.ownerUsername)}</span></td>
        <td class="meta"><code>${v.id}</code></td>
        <td class="meta">${new Date(v.createdAt).toLocaleString()}</td>
        <td class="actions" style="text-align:right">
          <button class="secondary open-vault-btn" data-vault-id="${v.id}">打开浏览</button>
          <button class="btn-primary manage-perm-btn" data-vault-id="${v.id}">👥 权限设置</button>
        </td>
      `;
      tr.querySelector('.open-vault-btn').onclick = () => openVault(v.id, 'files');
      tr.querySelector('.manage-perm-btn').onclick = () => openVault(v.id, 'permissions');
      tbody.appendChild(tr);
    }
    wrap.appendChild(table);
  }

  // --------------------------- Database Management --------------------------

  async function renderDatabasePanel() {
    mainPanel.innerHTML = '<div class="empty-state">加载数据库配置中…</div>';
    try {
      const res = await api('/api/admin/database/status');
      const data = await res.json();
      const activeType = data.type || 'json';

      mainPanel.innerHTML = `
        <div class="panel-header">
          <h2>🗄️ 多数据库配置与管理</h2>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px;margin-bottom:24px;">
          <div style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:18px;">
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px;">当前激活引擎</div>
            <div style="font-size:20px;font-weight:700;display:flex;align-items:center;gap:8px;">
              <span>${getEngineIcon(activeType)}</span>
              <span>${data.activeEngine || activeType.toUpperCase()}</span>
              <span class="badge" style="background:rgba(46,204,113,0.15);color:#2ecc71;border-color:rgba(46,204,113,0.3)">运行中</span>
            </div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:8px;">
              支持热切换至 SQLite / PostgreSQL / MySQL，数据可一键迁移。
            </div>
          </div>

          <div style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:18px;">
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px;">已持久化实体统计</div>
            <div style="display:flex;gap:16px;margin-top:10px;">
              <div><span style="font-size:18px;font-weight:700;">${data.stats?.usersCount || 0}</span> <span style="font-size:12px;color:var(--text-secondary)">用户</span></div>
              <div><span style="font-size:18px;font-weight:700;">${data.stats?.vaultsCount || 0}</span> <span style="font-size:12px;color:var(--text-secondary)">Vaults</span></div>
              <div><span style="font-size:18px;font-weight:700;">${data.stats?.sharesCount || 0}</span> <span style="font-size:12px;color:var(--text-secondary)">分享链接</span></div>
            </div>
          </div>
        </div>

        <!-- Database Engine Switcher -->
        <div style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:24px;margin-bottom:24px;">
          <h3 style="margin:0 0 16px;font-size:16px;">切换或配置数据库引擎</h3>
          
          <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
            <button class="db-type-btn ${activeType === 'sqlite' ? 'active' : ''}" data-type="sqlite" style="padding:10px 16px;border-radius:var(--radius);border:1px solid var(--border);background:var(--bg);color:var(--text);cursor:pointer;display:flex;align-items:center;gap:8px;">
              <span>💾</span> <b>SQLite</b> (单文件极简推荐)
            </button>
            <button class="db-type-btn ${activeType === 'postgres' ? 'active' : ''}" data-type="postgres" style="padding:10px 16px;border-radius:var(--radius);border:1px solid var(--border);background:var(--bg);color:var(--text);cursor:pointer;display:flex;align-items:center;gap:8px;">
              <span>🐘</span> <b>PostgreSQL</b> (企业级关系数据库)
            </button>
            <button class="db-type-btn ${activeType === 'mysql' ? 'active' : ''}" data-type="mysql" style="padding:10px 16px;border-radius:var(--radius);border:1px solid var(--border);background:var(--bg);color:var(--text);cursor:pointer;display:flex;align-items:center;gap:8px;">
              <span>🐬</span> <b>MySQL</b> (标准生产数据库)
            </button>
            <button class="db-type-btn ${activeType === 'json' ? 'active' : ''}" data-type="json" style="padding:10px 16px;border-radius:var(--radius);border:1px solid var(--border);background:var(--bg);color:var(--text);cursor:pointer;display:flex;align-items:center;gap:8px;">
              <span>📄</span> <b>JSON 文件</b> (基础轻量)
            </button>
          </div>

          <!-- Dynamic Config Forms -->
          <div id="db-form-container"></div>
        </div>

        <!-- System Architecture Documentation -->
        <div style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">
          <h4 style="margin:0 0 10px;font-size:14px;">📖 数据库支持说明</h4>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin:0 0 10px;">
            Nimbus 现已内置对 <b>SQLite</b>、<b>PostgreSQL</b>、<b>MySQL</b> 三种主流数据库及本地 JSON 存储引擎的完整抽象支持：
          </p>
          <ul style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin:0;padding-left:20px;">
            <li><b>用户数据 (Users)</b>：账号、权限、密码哈希与创建时间均完整保存在选定数据库中。</li>
            <li><b>配置数据 (Sync Rules & Metadata)</b>：黑名单规则、同步策略、分片配置自动持久化到数据库。</li>
            <li><b>Vault 与外链元数据 (Vaults & Shares)</b>：Vault 归属权、公开分享链接与访问密码完整同步。</li>
            <li><b>环境变量支持</b>：也可直接在 <code>.env</code> 中配置 <code>DB_TYPE=sqlite|postgres|mysql</code> 启动自动连接。</li>
          </ul>
        </div>
      `;

      setupDbForm(activeType, data.config);
    } catch (err) {
      mainPanel.innerHTML = `<div class="error-msg">加载数据库信息失败: ${escapeHtml(err.message)}</div>`;
    }
  }

  function getEngineIcon(type) {
    if (type === 'sqlite') return '💾';
    if (type === 'postgres') return '🐘';
    if (type === 'mysql') return '🐬';
    return '📄';
  }

  function setupDbForm(selectedType, currentConfig = {}) {
    const container = $('#db-form-container');
    if (!container) return;

    // Button states
    document.querySelectorAll('.db-type-btn').forEach((btn) => {
      if (btn.dataset.type === selectedType) {
        btn.style.borderColor = 'var(--primary)';
        btn.style.background = 'rgba(74, 144, 226, 0.1)';
      } else {
        btn.style.borderColor = 'var(--border)';
        btn.style.background = 'var(--bg)';
      }
      btn.onclick = () => setupDbForm(btn.dataset.type, currentConfig);
    });

    if (selectedType === 'sqlite') {
      container.innerHTML = `
        <div style="border-top:1px solid var(--border);padding-top:16px;">
          <h4 style="margin:0 0 12px;font-size:14px;">SQLite 文件配置</h4>
          <label style="display:block;margin-bottom:12px;">
            <span style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px;">SQLite 数据库文件存储路径</span>
            <input id="db-sqlite-path" type="text" value="${escapeHtml(currentConfig.sqlitePath || './data/nimbus.sqlite')}" style="width:100%;max-width:500px;" />
          </label>
          <div style="display:flex;gap:12px;align-items:center;margin-top:16px;flex-wrap:wrap;">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-secondary);cursor:pointer;margin:0;">
              <input id="db-migrate-check" type="checkbox" checked style="width:auto;margin:0" />
              同时将现有用户与配置数据迁移到新数据库
            </label>
          </div>
          <div style="display:flex;gap:12px;margin-top:16px;">
            <button id="db-test-btn" class="btn-secondary">测试连接</button>
            <button id="db-save-btn" class="btn-primary">保存并应用 SQLite 引擎</button>
          </div>
          <div id="db-action-result" style="margin-top:12px;"></div>
        </div>
      `;
    } else if (selectedType === 'postgres') {
      container.innerHTML = `
        <div style="border-top:1px solid var(--border);padding-top:16px;">
          <h4 style="margin:0 0 12px;font-size:14px;">PostgreSQL 连接配置</h4>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:12px;max-width:700px;margin-bottom:12px;">
            <label>
              <span style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px;">Host 主机</span>
              <input id="db-pg-host" type="text" value="${escapeHtml(currentConfig.host || 'localhost')}" />
            </label>
            <label>
              <span style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px;">Port 端口</span>
              <input id="db-pg-port" type="number" value="${currentConfig.port || 5432}" />
            </label>
            <label>
              <span style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px;">Database 数据库名</span>
              <input id="db-pg-database" type="text" value="${escapeHtml(currentConfig.database || 'nimbus')}" />
            </label>
            <label>
              <span style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px;">User 用户名</span>
              <input id="db-pg-user" type="text" value="${escapeHtml(currentConfig.user || 'postgres')}" />
            </label>
            <label style="grid-column:1 / -1">
              <span style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px;">Password 密码</span>
              <input id="db-pg-password" type="password" placeholder="留空则无密码或沿用现有密码" />
            </label>
          </div>
          <div style="display:flex;gap:12px;align-items:center;margin-top:16px;flex-wrap:wrap;">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-secondary);cursor:pointer;margin:0;">
              <input id="db-migrate-check" type="checkbox" checked style="width:auto;margin:0" />
              同时将现有用户与配置数据迁移到新数据库
            </label>
          </div>
          <div style="display:flex;gap:12px;margin-top:16px;">
            <button id="db-test-btn" class="btn-secondary">测试连接</button>
            <button id="db-save-btn" class="btn-primary">保存并应用 PostgreSQL 引擎</button>
          </div>
          <div id="db-action-result" style="margin-top:12px;"></div>
        </div>
      `;
    } else if (selectedType === 'mysql') {
      container.innerHTML = `
        <div style="border-top:1px solid var(--border);padding-top:16px;">
          <h4 style="margin:0 0 12px;font-size:14px;">MySQL 连接配置</h4>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:12px;max-width:700px;margin-bottom:12px;">
            <label>
              <span style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px;">Host 主机</span>
              <input id="db-mysql-host" type="text" value="${escapeHtml(currentConfig.host || 'localhost')}" />
            </label>
            <label>
              <span style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px;">Port 端口</span>
              <input id="db-mysql-port" type="number" value="${currentConfig.port || 3306}" />
            </label>
            <label>
              <span style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px;">Database 数据库名</span>
              <input id="db-mysql-database" type="text" value="${escapeHtml(currentConfig.database || 'nimbus')}" />
            </label>
            <label>
              <span style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px;">User 用户名</span>
              <input id="db-mysql-user" type="text" value="${escapeHtml(currentConfig.user || 'root')}" />
            </label>
            <label style="grid-column:1 / -1">
              <span style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px;">Password 密码</span>
              <input id="db-mysql-password" type="password" placeholder="留空则无密码或沿用现有密码" />
            </label>
          </div>
          <div style="display:flex;gap:12px;align-items:center;margin-top:16px;flex-wrap:wrap;">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-secondary);cursor:pointer;margin:0;">
              <input id="db-migrate-check" type="checkbox" checked style="width:auto;margin:0" />
              同时将现有用户与配置数据迁移到新数据库
            </label>
          </div>
          <div style="display:flex;gap:12px;margin-top:16px;">
            <button id="db-test-btn" class="btn-secondary">测试连接</button>
            <button id="db-save-btn" class="btn-primary">保存并应用 MySQL 引擎</button>
          </div>
          <div id="db-action-result" style="margin-top:12px;"></div>
        </div>
      `;
    } else {
      // JSON mode
      container.innerHTML = `
        <div style="border-top:1px solid var(--border);padding-top:16px;">
          <h4 style="margin:0 0 12px;font-size:14px;">JSON 本地文件存储</h4>
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">
            使用 <code>data/users.json</code> 和 <code>data/vaults.json</code> 保存用户与配置。无需独立数据库，适合轻量单机运行。
          </p>
          <div style="display:flex;gap:12px;margin-top:16px;">
            <button id="db-save-btn" class="btn-primary">应用 JSON 文件模式</button>
          </div>
          <div id="db-action-result" style="margin-top:12px;"></div>
        </div>
      `;
    }

    function collectFormConfig() {
      if (selectedType === 'sqlite') {
        return {
          type: 'sqlite',
          sqlitePath: $('#db-sqlite-path').value.trim() || './data/nimbus.sqlite',
        };
      }
      if (selectedType === 'postgres') {
        return {
          type: 'postgres',
          host: $('#db-pg-host').value.trim() || 'localhost',
          port: parseInt($('#db-pg-port').value, 10) || 5432,
          database: $('#db-pg-database').value.trim() || 'nimbus',
          user: $('#db-pg-user').value.trim() || 'postgres',
          password: $('#db-pg-password').value || '',
        };
      }
      if (selectedType === 'mysql') {
        return {
          type: 'mysql',
          host: $('#db-mysql-host').value.trim() || 'localhost',
          port: parseInt($('#db-mysql-port').value, 10) || 3306,
          database: $('#db-mysql-database').value.trim() || 'nimbus',
          user: $('#db-mysql-user').value.trim() || 'root',
          password: $('#db-mysql-password').value || '',
        };
      }
      return { type: 'json' };
    }

    const testBtn = $('#db-test-btn');
    if (testBtn) {
      testBtn.onclick = async () => {
        const config = collectFormConfig();
        const resDiv = $('#db-action-result');
        resDiv.innerHTML = '<span style="color:var(--text-secondary);font-size:13px;">正在测试连接…</span>';
        try {
          const res = await api('/api/admin/database/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
          });
          const body = await res.json();
          if (body.ok) {
            resDiv.innerHTML = `<span style="color:#2ecc71;font-size:13px;">✓ ${escapeHtml(body.message || '连接测试成功')}</span>`;
          } else {
            resDiv.innerHTML = `<span style="color:#e74c3c;font-size:13px;">✕ 连接失败: ${escapeHtml(body.error || '未知错误')}</span>`;
          }
        } catch (e) {
          resDiv.innerHTML = `<span style="color:#e74c3c;font-size:13px;">✕ 连接失败: ${escapeHtml(e.message)}</span>`;
        }
      };
    }

    const saveBtn = $('#db-save-btn');
    if (saveBtn) {
      saveBtn.onclick = async () => {
        const config = collectFormConfig();
        const migrateCheck = $('#db-migrate-check');
        const migrateExisting = migrateCheck ? migrateCheck.checked : false;
        const resDiv = $('#db-action-result');
        resDiv.innerHTML = '<span style="color:var(--text-secondary);font-size:13px;">正在应用数据库设置并初始化表结构…</span>';
        try {
          const res = await api('/api/admin/database/switch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...config, migrateExisting }),
          });
          const body = await res.json();
          if (body.ok) {
            toast(body.message || '数据库切换成功');
            renderDatabasePanel();
          } else {
            resDiv.innerHTML = `<span style="color:#e74c3c;font-size:13px;">✕ 失败: ${escapeHtml(body.error)}</span>`;
          }
        } catch (e) {
          resDiv.innerHTML = `<span style="color:#e74c3c;font-size:13px;">✕ 保存失败: ${escapeHtml(e.message)}</span>`;
        }
      };
    }
  }

  // --------------------------- Devices Management Panel ---------------------

  async function renderDevicesPanel() {
    mainPanel.innerHTML = '<div class="empty-state">加载接入设备列表中…</div>';
    try {
      const res = await api('/api/devices');
      const data = await res.json();
      const devices = data.devices || [];
      const isAdmin = state.user?.role === 'admin';
      const onlineCount = devices.filter((d) => d.isOnline).length;

      mainPanel.innerHTML = `
        <div class="panel-header" style="margin-bottom:16px;">
          <div>
            <h2 style="margin:0 0 4px;font-size:20px;display:flex;align-items:center;gap:10px;">
              <span>📱</span>
              <span>接入设备与多端令牌管理</span>
              <span class="badge ${onlineCount > 0 ? 'success' : 'primary'}" style="font-size:11.5px;font-weight:600;">
                ${onlineCount} 台在线 / 共 ${devices.length} 台设备
              </span>
            </h2>
            <div style="font-size:13px;color:var(--muted)">
              监控与管理连接至 Obsidian Nimbus 同步服务的客户端设备、在线状态、专用授权 Token 及最后活动记录
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn-primary" id="add-device-btn">➕ 生成新设备令牌</button>
            <button class="secondary" id="refresh-devices-btn">🔄 刷新列表</button>
          </div>
        </div>

        <div id="devices-list-grid" class="devices-grid"></div>
      `;

      mainPanel.querySelector('#refresh-devices-btn').onclick = () => renderDevicesPanel();
      mainPanel.querySelector('#add-device-btn').onclick = () => openCreateDeviceModal();

      const grid = mainPanel.querySelector('#devices-list-grid');
      if (devices.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1; padding: 48px 16px;">
            <div style="font-size:40px;margin-bottom:10px;">📱</div>
            <div style="font-weight:600;font-size:15px;color:var(--text);margin-bottom:4px;">暂无登记的客户端设备</div>
            <div style="font-size:13px;color:var(--muted);margin-bottom:16px;">点击下方按钮为您的终端快速生成连接令牌与同步配置</div>
            <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
              <button class="secondary quick-seed-btn" data-name="MacBook Pro" data-plat="macos">🍏 添加 Mac 设备</button>
              <button class="secondary quick-seed-btn" data-name="Windows 台式机" data-plat="windows">🪟 添加 Windows 设备</button>
              <button class="secondary quick-seed-btn" data-name="iPhone" data-plat="ios">🍎 添加 iPhone 设备</button>
              <button class="secondary quick-seed-btn" data-name="Android 手机" data-plat="android">🤖 添加 Android 设备</button>
            </div>
          </div>
        `;

        grid.querySelectorAll('.quick-seed-btn').forEach((b) => {
          b.onclick = async () => {
            try {
              const res = await api('/api/devices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: b.dataset.name, platform: b.dataset.plat }),
              });
              const body = await res.json();
              toast(`已快速添加 ${b.dataset.name}`);
              renderDevicesPanel();
              if (body.device) {
                showDeviceTokenCreatedModal(body.device);
              }
            } catch (e) {
              toast('添加失败: ' + e.message);
            }
          };
        });
        return;
      }

      for (const dev of devices) {
        const card = document.createElement('div');
        card.className = `device-card ${dev.isOnline ? 'online' : ''}`;
        
        const platform = (dev.platform || '').toLowerCase();
        const platformIcon = platform.includes('ios') ? '🍎' : platform.includes('android') ? '🤖' : platform.includes('win') ? '🪟' : platform.includes('mac') ? '🍏' : platform.includes('linux') ? '🐧' : '💻';
        const lastActiveText = dev.lastActiveAt ? new Date(dev.lastActiveAt).toLocaleString() : '刚刚活跃';
        const devName = dev.name || dev.deviceName || dev.deviceId || 'Obsidian Client';

        card.innerHTML = `
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:26px;">${platformIcon}</span>
              <div>
                <div style="font-weight:600;font-size:15px;color:var(--text);display:flex;align-items:center;gap:6px;">
                  <span>${escapeHtml(devName)}</span>
                  ${dev.isOnline ? '<span class="badge success" style="font-size:10px;">🟢 在线活跃</span>' : '<span class="badge" style="font-size:10px;color:var(--muted)">⚪ 离线就绪</span>'}
                </div>
                <div style="font-size:11.5px;color:var(--muted);margin-top:2px;">
                  设备 ID: <code>${escapeHtml(dev.id || dev.deviceId)}</code>
                </div>
              </div>
            </div>
            ${isAdmin && dev.username ? `<span class="badge primary" style="font-size:10.5px;">👤 ${escapeHtml(dev.username)}</span>` : ''}
          </div>

          <div style="background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:10px 12px;font-size:12.5px;margin-bottom:14px;display:flex;flex-direction:column;gap:6px;">
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--muted)">最后同步活跃:</span>
              <span>${lastActiveText}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--muted)">客户端 IP:</span>
              <code>${escapeHtml(dev.lastIp || dev.clientIp || '127.0.0.1')}</code>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="color:var(--muted)">专属 Token:</span>
              <div style="display:flex;align-items:center;gap:4px;">
                <code style="font-size:11px;">${escapeHtml(dev.tokenPreview || (dev.token ? dev.token.slice(0, 10) + '...' : '••••••••••••'))}</code>
                <button class="secondary copy-token-btn" style="padding:1px 6px;font-size:11px;">📋 复制 Token</button>
              </div>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <button class="secondary get-config-btn" style="font-size:12px;padding:4px 10px;flex:1;">⚡ 查看连接配置</button>
            <button class="danger revoke-dev-btn" data-id="${dev.id || dev.deviceId}" style="font-size:12px;padding:4px 10px;">🚫 撤销令牌</button>
          </div>
        `;

        card.querySelector('.copy-token-btn')?.addEventListener('click', () => {
          const t = dev.token || state.token;
          if (t) {
            if (navigator.clipboard?.writeText) {
              navigator.clipboard.writeText(t).then(() => toast('✓ 设备专属 Token 已复制到剪贴板！'));
            } else {
              prompt('复制设备 Token：', t);
            }
          } else {
            toast('当前设备未记录原始明文');
          }
        });

        card.querySelector('.get-config-btn')?.addEventListener('click', () => {
          const currentVault = state.vaults.find((v) => v.id === state.activeVaultId) || state.vaults[0];
          showObsidianConnectModal(currentVault, dev.token, devName);
        });

        card.querySelector('.revoke-dev-btn')?.addEventListener('click', async () => {
          if (!confirm(`确定撤销设备 "${devName}" 的访问授权？该设备将被立即踢下线并停止同步。`)) return;
          try {
            await api(`/api/devices/${dev.id || dev.deviceId}`, { method: 'DELETE' });
            toast('设备授权已撤销');
            renderDevicesPanel();
          } catch (e) {
            toast('操作失败: ' + e.message);
          }
        });

        grid.appendChild(card);
      }
    } catch (err) {
      mainPanel.innerHTML = `<div class="empty-state" style="color:#e74c3c;">加载设备管理失败: ${escapeHtml(err.message)}</div>`;
    }
  }

  function showDeviceTokenCreatedModal(device, vault) {
    const currentVault = vault || state.vaults.find((v) => v.id === state.activeVaultId) || state.vaults[0];
    const serverUrl = state.serverBase.replace(/\/$/, '');
    const wsUrl = serverUrl.replace(/^http/, 'ws') + '/ws';
    const vaultId = currentVault ? currentVault.id : 'YOUR_VAULT_ID';
    const vaultName = currentVault ? currentVault.name : 'Vault';
    const deviceName = device.deviceName || device.name || 'Obsidian Device';
    const token = device.token || state.token;

    const pluginConfig = {
      serverUrl,
      wsUrl: `${wsUrl}?vaultId=${vaultId}&token=${token}&deviceId=${encodeURIComponent(deviceName)}`,
      vaultId,
      vaultName,
      authToken: token,
      deviceName,
      autoSyncOnStartup: true,
    };

    const platform = (device.platform || '').toLowerCase();
    const platformIcon = platform.includes('ios') ? '🍎' : platform.includes('android') ? '🤖' : platform.includes('win') ? '🪟' : platform.includes('mac') ? '🍏' : platform.includes('linux') ? '🐧' : '💻';

    const html = `
      <div class="modal-header">
        <h3 style="display:flex;align-items:center;gap:8px;">
          <span>🎉</span>
          <span>设备「${escapeHtml(deviceName)}」令牌生成成功</span>
        </h3>
        <button class="modal-close ghost">✕</button>
      </div>
      <div class="modal-body">
        <div style="background:rgba(63,185,80,0.1);border:1px solid rgba(63,185,80,0.3);border-radius:var(--radius);padding:12px 14px;margin-bottom:16px;display:flex;align-items:center;gap:10px;">
          <span style="font-size:24px;">${platformIcon}</span>
          <div>
            <div style="font-weight:600;font-size:14px;color:var(--text)">
              已成功为 <b>${escapeHtml(deviceName)}</b> 签发专属独立访问令牌！
            </div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px;">
              设备 ID: <code>${escapeHtml(device.id || device.deviceId)}</code> · 平台: <b>${escapeHtml(device.platform || '通用')}</b>
            </div>
          </div>
        </div>

        <div style="background:var(--panel-2);border:1px solid var(--border);border-radius:var(--radius);padding:12px 16px;margin-bottom:16px;">
          <div style="font-size:12.5px;font-weight:600;margin-bottom:8px;color:var(--text);">🔑 专属访问令牌 (Auth Token)</div>
          <div style="display:flex;gap:6px;align-items:center;">
            <input type="password" id="dev-modal-token-input" readonly value="${escapeHtml(token)}" style="margin:0;padding:6px 10px;font-size:12px;font-family:ui-monospace,monospace;flex:1;background:var(--bg);" />
            <button id="dev-modal-token-toggle-btn" class="token-act-btn secondary" style="padding:6px 10px;font-size:12px;">👁️ 查看</button>
            <button id="dev-modal-token-copy-btn" class="btn-primary" style="padding:6px 12px;font-size:12px;">📋 复制 Token</button>
          </div>
        </div>

        <div class="nav-section-title" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span>⚡ Obsidian 插件一键配置文件 (<code>data.json</code>)</span>
          <span style="font-size:11.5px;color:var(--muted)">直接复制覆盖至 <code>.obsidian/plugins/nimbus/data.json</code></span>
        </div>
        <pre id="dev-modal-json-snippet" class="code-snippet" style="max-height:180px;font-size:12px;">${escapeHtml(JSON.stringify(pluginConfig, null, 2))}</pre>

        <div style="background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:10px 12px;margin-top:14px;font-size:12px;color:var(--muted);line-height:1.6;">
          <b>📱 移动端与客户端配置提示：</b><br/>
          • <b>桌面端</b>：复制上方 JSON 配置文件，保存至对应笔记库的 <code>.obsidian/plugins/nimbus/data.json</code> 文件中重启插件即可。<br/>
          • <b>手机/平板 (iOS / Android)</b>：在 Obsidian 设置中的 Nimbus 插件界面填入 <b>Server URL</b> (<code>${escapeHtml(serverUrl)}</code>)、<b>Vault ID</b> (<code>${escapeHtml(vaultId)}</code>) 与上方 <b>Token</b>。
        </div>
      </div>
      <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid var(--border);">
        <button id="dev-modal-copy-all-btn" class="btn-primary">📋 一键复制完整 data.json 配置</button>
        <button class="modal-close secondary">完成</button>
      </div>
    `;

    showModal(html, (dialog) => {
      const tokenInput = dialog.querySelector('#dev-modal-token-input');
      const toggleBtn = dialog.querySelector('#dev-modal-token-toggle-btn');
      const copyTokenBtn = dialog.querySelector('#dev-modal-token-copy-btn');
      const copyAllBtn = dialog.querySelector('#dev-modal-copy-all-btn');

      toggleBtn.onclick = () => {
        if (tokenInput.type === 'password') {
          tokenInput.type = 'text';
          toggleBtn.textContent = '🙈 隐藏';
        } else {
          tokenInput.type = 'password';
          toggleBtn.textContent = '👁️ 查看';
        }
      };

      copyTokenBtn.onclick = () => {
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(token).then(() => toast('✓ 专属 Token 已复制到剪贴板！'));
        } else {
          prompt('复制 Token：', token);
        }
      };

      copyAllBtn.onclick = () => {
        const text = JSON.stringify(pluginConfig, null, 2);
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text).then(() => toast('✓ data.json 连接配置已复制到剪贴板！'));
        } else {
          prompt('复制以下配置：', text);
        }
      };
    });
  }

  function openCreateDeviceModal() {
    const modalHtml = `
      <div class="modal-header">
        <h3>➕ 生成新设备独立授权令牌</h3>
        <button class="modal-close ghost">✕</button>
      </div>
      <div class="modal-body">
        <p style="color:var(--text-secondary);font-size:13px;margin-bottom:14px;">
          为每个终端（例如办公室电脑、个人笔记本、手机）分配独立的连接令牌，可随时单独撤销或审计活动状态。
        </p>

        <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;">
          <span style="font-size:12px;color:var(--muted);align-self:center;margin-right:2px;">快捷预设:</span>
          <button class="secondary preset-btn" data-name="MacBook Pro" data-plat="macos" style="padding:2px 8px;font-size:11.5px;">🍏 MacBook</button>
          <button class="secondary preset-btn" data-name="Windows 台式机" data-plat="windows" style="padding:2px 8px;font-size:11.5px;">🪟 Windows PC</button>
          <button class="secondary preset-btn" data-name="iPhone 15" data-plat="ios" style="padding:2px 8px;font-size:11.5px;">🍎 iPhone</button>
          <button class="secondary preset-btn" data-name="Android 手机" data-plat="android" style="padding:2px 8px;font-size:11.5px;">🤖 Android</button>
          <button class="secondary preset-btn" data-name="Linux 工作站" data-plat="linux" style="padding:2px 8px;font-size:11.5px;">🐧 Linux</button>
        </div>

        <div style="display:flex;flex-direction:column;gap:12px;">
          <label>设备名称 / 备注 (例如: MacBook Pro M3, 办公台式机, iPhone 15)
            <input type="text" id="nd-name" placeholder="请输入设备名称" />
          </label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <label>终端平台类型
              <select id="nd-platform">
                <option value="macos">🍏 macOS</option>
                <option value="windows">🪟 Windows</option>
                <option value="linux">🐧 Linux</option>
                <option value="ios">🍎 iOS (iPhone / iPad)</option>
                <option value="android">🤖 Android</option>
              </select>
            </label>
            <label>令牌有效期
              <select id="nd-expiry">
                <option value="365" selected>1 年 (推荐)</option>
                <option value="3650">永久有效 (10 年)</option>
                <option value="90">90 天</option>
                <option value="30">30 天</option>
              </select>
            </label>
          </div>
        </div>
      </div>
      <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid var(--border);">
        <button class="secondary modal-close">取消</button>
        <button class="btn-primary" id="nd-submit-btn">立即生成令牌</button>
      </div>
    `;

    showModal(modalHtml, (container) => {
      container.querySelectorAll('.preset-btn').forEach((btn) => {
        btn.onclick = () => {
          container.querySelector('#nd-name').value = btn.dataset.name;
          container.querySelector('#nd-platform').value = btn.dataset.plat;
        };
      });

      container.querySelector('#nd-submit-btn').onclick = async () => {
        const name = container.querySelector('#nd-name').value.trim();
        const platform = container.querySelector('#nd-platform').value;
        const expiresInDays = container.querySelector('#nd-expiry')?.value || '365';
        if (!name) {
          toast('请输入设备名称');
          return;
        }

        try {
          const res = await api('/api/devices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, deviceName: name, platform, expiresInDays }),
          });
          const body = await res.json();
          closeModal();
          toast(`设备 "${name}" 令牌生成成功！`);
          renderDevicesPanel();
          if (body.device) {
            showDeviceTokenCreatedModal(body.device);
          }
        } catch (e) {
          toast('生成失败: ' + e.message);
        }
      };
    });
  }

  // --------------------------- Webhooks Management Panel --------------------

  async function renderWebhooksPanel() {
    mainPanel.innerHTML = '<div class="empty-state">加载 Webhook 配置中…</div>';
    try {
      const res = await api('/api/settings/webhooks');
      const data = await res.json();
      const config = data.config || data.webhooks || {
        enabled: false,
        platform: 'custom',
        url: '',
        secret: '',
        events: ['conflict.detected', 'conflict.resolved', 'backup.created'],
      };

      mainPanel.innerHTML = `
        <div class="panel-header" style="margin-bottom:16px;">
          <div>
            <h2 style="margin:0 0 4px;font-size:20px;display:flex;align-items:center;gap:10px;">
              <span>🔔</span>
              <span>Webhook 告警与实时第三方推送</span>
            </h2>
            <div style="font-size:13px;color:var(--muted)">
              当多端发生并发冲突、全库快照备份完成、新设备上线或文件变动时，实时推送告警消息至飞书、钉钉、企业微信、Discord 或自定义 HTTP 终端
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="secondary" id="wh-test-btn">🧪 发送测试通知</button>
            <button class="btn-primary" id="wh-save-btn">💾 保存 Webhook 配置</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:20px;">
          <div style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">
            <h3 style="margin:0 0 16px;font-size:15px;display:flex;align-items:center;gap:8px;">
              <span>⚙️</span> Webhook 推送端点配置
            </h3>

            <div style="display:flex;flex-direction:column;gap:14px;">
              <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin:0;">
                <input type="checkbox" id="wh-enabled" ${config.enabled ? 'checked' : ''} style="width:auto;margin:0;" />
                <span style="font-weight:600;font-size:13.5px;">启用 Webhook 告警通知功能</span>
              </label>

              <label>
                <span style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px;">推送目标平台</span>
                <select id="wh-platform" style="margin:0;">
                  <option value="feishu" ${config.platform === 'feishu' ? 'selected' : ''}>🕊️ 飞书群机器人 (Feishu Webhook)</option>
                  <option value="dingtalk" ${config.platform === 'dingtalk' ? 'selected' : ''}>🎯 钉钉自定义机器人 (DingTalk Webhook)</option>
                  <option value="wecom" ${config.platform === 'wecom' ? 'selected' : ''}>💬 企业微信群机器人 (WeCom Webhook)</option>
                  <option value="discord" ${config.platform === 'discord' ? 'selected' : ''}>🎮 Discord Webhook</option>
                  <option value="custom" ${config.platform === 'custom' ? 'selected' : ''}>🌐 自定义 HTTP POST JSON 终端</option>
                </select>
              </label>

              <label>
                <span style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px;">Webhook 回调 URL 地址</span>
                <input type="text" id="wh-url" value="${escapeHtml(config.url || '')}" placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/xxx" style="margin:0;" />
                <div style="font-size:11.5px;color:var(--muted);margin-top:4px;">接收 Nimbus 发送 POST 请求的完整 Webhook 链接</div>
              </label>

              <label>
                <span style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px;">签名校验密钥 (Secret / 签名密钥, 可选)</span>
                <input type="password" id="wh-secret" value="${escapeHtml(config.secret || '')}" placeholder="若机器人启用了安全加签校验请输入" style="margin:0;" />
              </label>
            </div>
          </div>

          <div style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">
            <h3 style="margin:0 0 16px;font-size:15px;display:flex;align-items:center;gap:8px;">
              <span>📡</span> 订阅触发事件 (Event Subscriptions)
            </h3>

            <div style="display:flex;flex-direction:column;gap:12px;" id="wh-events-container">
              <label class="form-checkbox-label" style="display:flex;align-items:flex-start;gap:10px;margin:0;cursor:pointer;">
                <input type="checkbox" class="wh-event-chk" value="conflict.detected" ${config.events?.includes('conflict.detected') ? 'checked' : ''} />
                <div>
                  <div style="font-weight:500;font-size:13px;">⚔️ conflict.detected (检测到多设备并发冲突)</div>
                  <div style="font-size:11.5px;color:var(--muted)">当两台设备同时编辑同一笔记并在同步中产生冲突副本时触发</div>
                </div>
              </label>

              <label class="form-checkbox-label" style="display:flex;align-items:flex-start;gap:10px;margin:0;cursor:pointer;">
                <input type="checkbox" class="wh-event-chk" value="conflict.resolved" ${config.events?.includes('conflict.resolved') ? 'checked' : ''} />
                <div>
                  <div style="font-weight:500;font-size:13px;">✓ conflict.resolved (冲突已成功解决)</div>
                  <div style="font-size:11.5px;color:var(--muted)">当管理员或用户在控制台手动合并或采纳冲突版本后触发</div>
                </div>
              </label>

              <label class="form-checkbox-label" style="display:flex;align-items:flex-start;gap:10px;margin:0;cursor:pointer;">
                <input type="checkbox" class="wh-event-chk" value="backup.created" ${config.events?.includes('backup.created') ? 'checked' : ''} />
                <div>
                  <div style="font-weight:500;font-size:13px;">💾 backup.created (全库快照备份完成)</div>
                  <div style="font-size:11.5px;color:var(--muted)">当系统或用户完成全库 ZIP 归档快照创建时触发</div>
                </div>
              </label>

              <label class="form-checkbox-label" style="display:flex;align-items:flex-start;gap:10px;margin:0;cursor:pointer;">
                <input type="checkbox" class="wh-event-chk" value="device.connected" ${config.events?.includes('device.connected') ? 'checked' : ''} />
                <div>
                  <div style="font-weight:500;font-size:13px;">📱 device.connected (新设备接入与上线)</div>
                  <div style="font-size:11.5px;color:var(--muted)">当有新客户端设备首次接入或发起全量同步时触发</div>
                </div>
              </label>

              <label class="form-checkbox-label" style="display:flex;align-items:flex-start;gap:10px;margin:0;cursor:pointer;">
                <input type="checkbox" class="wh-event-chk" value="file.deleted" ${config.events?.includes('file.deleted') ? 'checked' : ''} />
                <div>
                  <div style="font-weight:500;font-size:13px;">🗑️ file.deleted (文件移入回收站)</div>
                  <div style="font-size:11.5px;color:var(--muted)">当客户端同步删除文件或用户从控制台删除笔记时触发</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div id="wh-test-result" style="margin-top:16px;"></div>
      `;

      mainPanel.querySelector('#wh-test-btn').onclick = async () => {
        const url = mainPanel.querySelector('#wh-url').value.trim();
        const platform = mainPanel.querySelector('#wh-platform').value;
        const secret = mainPanel.querySelector('#wh-secret').value.trim();
        const resDiv = mainPanel.querySelector('#wh-test-result');

        if (!url) {
          toast('请先填写 Webhook 回调 URL 地址');
          return;
        }

        resDiv.innerHTML = '<span style="color:var(--muted);font-size:13px;">正在发送测试通知消息…</span>';
        try {
          const r = await api('/api/settings/webhooks/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, platform, secret }),
          });
          const b = await r.json();
          if (b.ok) {
            resDiv.innerHTML = `<div style="padding:10px 14px;background:rgba(46,204,113,0.15);border:1px solid rgba(46,204,113,0.3);border-radius:6px;color:#2ecc71;font-size:13px;">✓ 测试通知发送成功！响应状态: ${b.status}</div>`;
            toast('测试通知发送成功');
          } else {
            resDiv.innerHTML = `<div style="padding:10px 14px;background:rgba(231,76,60,0.15);border:1px solid rgba(231,76,60,0.3);border-radius:6px;color:#e74c3c;font-size:13px;">✕ 推送失败: ${escapeHtml(b.error || '无法投递')}</div>`;
          }
        } catch (e) {
          resDiv.innerHTML = `<div style="padding:10px 14px;background:rgba(231,76,60,0.15);border:1px solid rgba(231,76,60,0.3);border-radius:6px;color:#e74c3c;font-size:13px;">✕ 请求错误: ${escapeHtml(e.message)}</div>`;
        }
      };

      mainPanel.querySelector('#wh-save-btn').onclick = async () => {
        const enabled = mainPanel.querySelector('#wh-enabled').checked;
        const platform = mainPanel.querySelector('#wh-platform').value;
        const url = mainPanel.querySelector('#wh-url').value.trim();
        const secret = mainPanel.querySelector('#wh-secret').value.trim();
        const events = [];
        mainPanel.querySelectorAll('.wh-event-chk:checked').forEach((c) => events.push(c.value));

        try {
          await api('/api/settings/webhooks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled, platform, url, secret, events }),
          });
          toast('Webhook 配置已保存');
          renderWebhooksPanel();
        } catch (e) {
          toast('保存失败: ' + e.message);
        }
      };
    } catch (err) {
      mainPanel.innerHTML = `<div class="empty-state" style="color:#e74c3c;">加载 Webhook 配置失败: ${escapeHtml(err.message)}</div>`;
    }
  }

  // --------------------------- Global Search Modal (Ctrl+K) ------------------

  function setupGlobalSearch() {
    const searchBtn = $('#topbar-search-btn');
    if (searchBtn) {
      searchBtn.onclick = () => openGlobalSearchModal();
    }

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openGlobalSearchModal();
      }
    });
  }

  function openGlobalSearchModal() {
    const modalHtml = `
      <div class="global-search-modal" style="display:flex;flex-direction:column;max-height:85vh;">
        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid var(--border);">
          <span style="font-size:20px;">🔍</span>
          <input type="text" id="gs-input" placeholder="输入关键词检索笔记标题、路径或正文内容… (支持实时多库检索)" autofocus style="flex:1;border:none;background:transparent;font-size:15px;outline:none;margin:0;color:var(--text);" />
          <span class="modal-close" style="font-size:11px;color:var(--muted);background:var(--panel-2);padding:3px 8px;border-radius:4px;border:1px solid var(--border);cursor:pointer;">ESC 退出</span>
        </div>
        <div id="gs-results" style="flex:1;overflow-y:auto;max-height:520px;padding:12px 16px;display:flex;flex-direction:column;gap:8px;">
          <div style="font-size:13px;color:var(--muted);text-align:center;padding:36px 0;">
            <div style="font-size:32px;margin-bottom:8px;">🔎</div>
            <div>输入关键词开始在所有 Vault 中检索标题及笔记内容…</div>
          </div>
        </div>
      </div>
    `;

    showModal(modalHtml, (container) => {
      const input = container.querySelector('#gs-input');
      const resultsContainer = container.querySelector('#gs-results');
      input.focus();

      let debounceTimer = null;
      input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          const query = input.value.trim();
          if (!query) {
            resultsContainer.innerHTML = `
              <div style="font-size:13px;color:var(--muted);text-align:center;padding:36px 0;">
                <div style="font-size:32px;margin-bottom:8px;">🔎</div>
                <div>输入关键词开始在所有 Vault 中检索标题及笔记内容…</div>
              </div>
            `;
            return;
          }

          resultsContainer.innerHTML = '<div style="font-size:13px;color:var(--muted);text-align:center;padding:24px 0;">正在检索全库笔记与正文…</div>';

          try {
            const res = await api(`/api/vaults/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            const matches = data.results || [];

            if (matches.length === 0) {
              resultsContainer.innerHTML = `<div style="font-size:13px;color:var(--muted);text-align:center;padding:36px 0;">未找到包含 "${escapeHtml(query)}" 的笔记或正文内容</div>`;
              return;
            }

            resultsContainer.innerHTML = '';
            const safeQuery = query.toLowerCase();

            for (const m of matches) {
              const item = document.createElement('div');
              item.className = 'global-search-item';
              item.style.cssText = 'padding:12px 14px;background:var(--bg);border:1px solid var(--border);border-radius:8px;cursor:pointer;display:flex;flex-direction:column;gap:6px;transition:all 0.15s;';
              
              const highlightedPath = escapeHtml(m.path).replace(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark style="background:rgba(255,200,0,0.35);color:inherit;padding:0 2px;border-radius:2px;">$1</mark>');

              let snippetHtml = '';
              if (m.snippet) {
                const highlightedSnippet = escapeHtml(m.snippet).replace(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark style="background:rgba(255,200,0,0.35);color:inherit;padding:0 2px;border-radius:2px;">$1</mark>');
                snippetHtml = `<div style="font-size:12px;color:var(--text-secondary);background:var(--panel-2);padding:6px 8px;border-radius:4px;font-family:var(--font-mono);line-height:1.4;word-break:break-all;">${highlightedSnippet}</div>`;
              }

              item.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
                  <div style="font-weight:600;font-size:14px;color:var(--text);display:flex;align-items:center;gap:6px;overflow:hidden;">
                    <span>📄</span>
                    <span style="text-overflow:ellipsis;white-space:nowrap;overflow:hidden;">${highlightedPath}</span>
                    ${m.matchesCount > 0 ? `<span class="badge primary" style="font-size:10.5px;padding:1px 5px;">${m.matchesCount} 处正文匹配</span>` : ''}
                  </div>
                  <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                    <span class="badge" style="font-size:11px;">${escapeHtml(m.vaultName)}</span>
                    <button class="secondary" style="font-size:11px;padding:3px 8px;">打开 →</button>
                  </div>
                </div>
                ${snippetHtml}
                <div style="font-size:11px;color:var(--muted);display:flex;gap:12px;">
                  <span>大小: ${formatBytes(m.size)}</span>
                  <span>修改时间: ${new Date(m.mtime).toLocaleString()}</span>
                </div>
              `;

              item.onclick = async () => {
                closeModal();
                await openVault(m.vaultId, 'files');
                await openFile(m.vaultId, m.path);
              };

              item.onmouseenter = () => { item.style.borderColor = 'var(--primary)'; item.style.background = 'var(--panel)'; };
              item.onmouseleave = () => { item.style.borderColor = 'var(--border)'; item.style.background = 'var(--bg)'; };

              resultsContainer.appendChild(item);
            }
          } catch (e) {
            resultsContainer.innerHTML = `<div style="color:#e74c3c;font-size:12.5px;text-align:center;padding:16px 0;">检索失败: ${escapeHtml(e.message)}</div>`;
          }
        }, 180);
      });
    });
  }

  // --------------------------- Settings Panel (Fast Note Sync) -----------------------------

  let currentSettingsSubTab = 'plugin';

  async function renderSettingsPanel(subTab = null) {
    if (subTab) currentSettingsSubTab = subTab;
    mainPanel.innerHTML = '<div class="empty-state">正在加载设置…</div>';

    let settingsData = null;
    let tokensList = [];
    try {
      const [resSettings, resTokens] = await Promise.all([
        api('/api/settings'),
        api('/api/settings/tokens'),
      ]);
      if (resSettings.ok) {
        const body = await resSettings.json();
        settingsData = body.settings;
      }
      if (resTokens.ok) {
        const body = await resTokens.json();
        tokensList = body.tokens || [];
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }

    const settings = settingsData || {
      serverName: 'Nimbus Vault Sync',
      publicUrl: '',
      wsHeartbeatInterval: 30,
      conflictStrategy: 'conflict_copy',
      maxFileSizeMb: 100,
      chunkSizeMb: 5,
      versionRetentionCount: 30,
      versionRetentionDays: 30,
      trashRetentionDays: 30,
      syncHiddenConfig: true,
      syncAttachments: true,
      autoPurgeTrash: false,
      defaultIgnorePatterns: ['.obsidian/workspace.json', '.obsidian/workspace-mobile.json', '**/*.tmp', '**/.DS_Store', '**/Thumbs.db', '**/.git/**'],
    };

    const isAdmin = state.user?.role === 'admin';
    const serverOrigin = window.location.origin;
    const currentVault = state.vaults.find((v) => v.id === state.activeVaultId) || state.vaults[0] || { id: 'default', name: 'Default Vault' };

    mainPanel.innerHTML = `
      <div class="settings-container">
        <div class="settings-header">
          <div>
            <h2 style="margin:0 0 4px;font-size:20px;display:flex;align-items:center;gap:10px;">
              <span>⚙️</span>
              <span>设置 (Nimbus Vault Sync)</span>
            </h2>
            <p style="margin:0;font-size:13px;color:var(--muted)">
              配置 Obsidian 客户端同步参数、实时冲突裁决机制、多端专属令牌与数据保留策略
            </p>
          </div>
          <div style="display:flex;gap:8px;">
            <span class="badge" style="background:var(--accent-bg);color:var(--accent)">
              ${isAdmin ? '👑 系统管理员' : '👤 普通用户'}
            </span>
          </div>
        </div>

        <div class="settings-subnav">
          <button class="settings-subnav-btn ${currentSettingsSubTab === 'plugin' ? 'active' : ''}" data-subtab="plugin">
            ⚡ Obsidian 插件配置
          </button>
          <button class="settings-subnav-btn ${currentSettingsSubTab === 'sync' ? 'active' : ''}" data-subtab="sync">
            🔄 同步策略与冲突处理
          </button>
          <button class="settings-subnav-btn ${currentSettingsSubTab === 'database' ? 'active' : ''}" data-subtab="database">
            🗄️ 数据库与存储引擎
          </button>
          <button class="settings-subnav-btn ${currentSettingsSubTab === 'history' ? 'active' : ''}" data-subtab="history">
            🕒 版本快照与回收站
          </button>
          <button class="settings-subnav-btn ${currentSettingsSubTab === 'tokens' ? 'active' : ''}" data-subtab="tokens">
            🔑 设备专属令牌 (${tokensList.length})
          </button>
          <button class="settings-subnav-btn ${currentSettingsSubTab === 'account' ? 'active' : ''}" data-subtab="account">
            👤 账户安全与修改密码
          </button>
        </div>

        <div id="settings-tab-content"></div>
      </div>
    `;

    // Bind subnav tabs
    mainPanel.querySelectorAll('.settings-subnav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentSettingsSubTab = btn.dataset.subtab;
        mainPanel.querySelectorAll('.settings-subnav-btn').forEach((b) => b.classList.toggle('active', b.dataset.subtab === currentSettingsSubTab));
        renderSettingsSubTabContent(currentSettingsSubTab, settings, tokensList, currentVault, isAdmin, serverOrigin);
      });
    });

    renderSettingsSubTabContent(currentSettingsSubTab, settings, tokensList, currentVault, isAdmin, serverOrigin);
  }

  function renderSettingsSubTabContent(subTab, settings, tokensList, currentVault, isAdmin, serverOrigin) {
    const container = $('#settings-tab-content');
    if (!container) return;

    if (subTab === 'plugin') {
      // 1. Nimbus Plugin configuration tab
      const vaultOptions = state.vaults.map((v) => `<option value="${v.id}" ${v.id === currentVault.id ? 'selected' : ''}>${escapeHtml(v.name)} (${v.id})</option>`).join('');
      const tokenOptions = [
        `<option value="${state.token}">🔑 当前登录主令牌 (${state.user?.username || 'Main'})</option>`,
        ...tokensList.map((t) => `<option value="${escapeHtml(t.token || '')}">📱 [专属设备] ${escapeHtml(t.label)} (${escapeHtml(t.maskedToken || '')})</option>`),
      ].join('');

      container.innerHTML = `
        <div class="settings-card">
          <div class="settings-card-header">
            <h3><span>⚡</span> Obsidian Nimbus 插件对接配置</h3>
            <p>为您的 Obsidian 笔记库快速生成同步插件所需的一键配置</p>
          </div>

          <div class="settings-form-grid" style="margin-bottom:16px;">
            <label>
              <span>选择要同步的 Vault 库</span>
              <select id="plugin-vault-select">
                ${vaultOptions || '<option value="">暂无 Vault，请先在左侧新建</option>'}
              </select>
              <div class="settings-help">Obsidian 客户端将与选定的 Vault 库建立双向实时同步</div>
            </label>

            <label>
              <span>服务器连接地址 (Server URL)</span>
              <input type="text" id="plugin-server-url" value="${escapeHtml(serverOrigin)}" placeholder="https://your-domain.com" />
              <div class="settings-help">局域网或公网访问地址，需确保 Obsidian 客户端可连通</div>
            </label>

            <label>
              <span>客户端设备标识 (Device Name)</span>
              <input type="text" id="plugin-device-name" value="${escapeHtml(state.user?.username || 'Client')}-MacBook" placeholder="例如: Office-PC, iPad-Pro" />
              <div class="settings-help">用于在冲突备份与协同日志中标识设备来源</div>
            </label>

            <label>
              <span>授权访问令牌 (Auth Token)</span>
              <select id="plugin-token-select">
                ${tokenOptions}
              </select>
              <div class="settings-help">推荐在「设备专属令牌」标签页为每个端创建独立 Token</div>
            </label>
          </div>

          <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
            <button id="plugin-generate-btn" class="btn-primary">⚡ 重新生成插件配置</button>
            <button id="plugin-test-btn" class="btn-secondary">🧪 测试服务端连通性</button>
            <button id="plugin-copy-json-btn" class="btn-secondary">📋 复制 data.json 配置代码</button>
          </div>
          <div id="plugin-test-result" style="margin-bottom:12px;"></div>

          <div class="settings-card-header" style="margin-top:20px;">
            <h3><span>📄</span> 插件配置文件 <code>data.json</code></h3>
            <p>可直接在 Obsidian 笔记库的插件目录（如 <code>.obsidian/plugins/nimbus/data.json</code> 或 <code>fast-note-sync</code>）中粘贴以下内容：</p>
          </div>

          <pre id="plugin-json-output" class="code-snippet" style="max-height:260px;"></pre>

          <div class="settings-card-header" style="margin-top:20px;">
            <h3><span>🚀</span> 客户端安装与使用步骤</h3>
          </div>
          <ol style="color:var(--text-secondary);font-size:13.5px;line-height:1.8;padding-left:20px;margin:0;">
            <li>在 Obsidian 中安装并启用同步插件（支持 <code>Nimbus</code> 及兼容的 <code>Fast Note Sync</code> 插件）。</li>
            <li>打开 Obsidian 插件设置，将上方生成的 <b>Server URL</b>、<b>Vault ID</b> 与 <b>Auth Token</b> 填入插件配置界面。</li>
            <li>或者直接将上方 <code>data.json</code> 复制保存到对应插件目录，即可免输所有参数。</li>
            <li>Obsidian 启动后即可享受多端毫秒级实时 WebSocket 增量双向同步。</li>
          </ol>
        </div>
      `;

      function updatePluginJson() {
        const selectedVaultId = $('#plugin-vault-select').value;
        const serverUrl = ($('#plugin-server-url').value.trim() || serverOrigin).replace(/\/+$/, '');
        const deviceName = $('#plugin-device-name').value.trim() || 'Obsidian-Client';
        const rawToken = $('#plugin-token-select').value || state.token;
        const wsUrl = serverUrl.replace(/^http:\/\//i, 'ws://').replace(/^https:\/\//i, 'wss://') + '/ws';

        const configObj = {
          serverUrl,
          wsUrl: `${wsUrl}?vaultId=${selectedVaultId}&token=${rawToken}&deviceId=${encodeURIComponent(deviceName)}`,
          vaultId: selectedVaultId,
          authToken: rawToken,
          deviceName,
          autoSyncOnStartup: true,
          syncIntervalSeconds: settings.wsHeartbeatInterval || 30,
          conflictStrategy: settings.conflictStrategy || 'conflict_copy',
          chunkSizeMb: settings.chunkSizeMb || 5,
          maxFileSizeMb: settings.maxFileSizeMb || 100,
          syncHiddenFiles: Boolean(settings.syncHiddenConfig),
          syncAttachments: Boolean(settings.syncAttachments),
          ignoredPatterns: settings.defaultIgnorePatterns || [],
        };

        const jsonPre = $('#plugin-json-output');
        if (jsonPre) jsonPre.textContent = JSON.stringify(configObj, null, 2);
      }

      updatePluginJson();

      $('#plugin-vault-select')?.addEventListener('change', updatePluginJson);
      $('#plugin-server-url')?.addEventListener('input', updatePluginJson);
      $('#plugin-device-name')?.addEventListener('input', updatePluginJson);
      $('#plugin-token-select')?.addEventListener('change', updatePluginJson);
      $('#plugin-generate-btn')?.addEventListener('click', () => {
        updatePluginJson();
        toast('配置已重新生成');
      });

      $('#plugin-copy-json-btn')?.addEventListener('click', () => {
        const content = $('#plugin-json-output')?.textContent || '';
        navigator.clipboard.writeText(content).then(() => {
          toast('data.json 配置已复制到剪贴板！');
        }).catch(() => {
          toast('复制失败，请手动选中文本复制');
        });
      });

      $('#plugin-test-btn')?.addEventListener('click', async () => {
        const testRes = $('#plugin-test-result');
        testRes.innerHTML = '<span style="color:var(--muted);font-size:13px;">正在测试与服务器握手…</span>';
        const start = Date.now();
        try {
          const res = await fetch(`${serverOrigin}/api/health`);
          const dur = Date.now() - start;
          if (res.ok) {
            testRes.innerHTML = `<span style="color:#2ecc71;font-size:13px;">✓ 服务端通信正常！HTTP 延迟: ${dur}ms, WebSocket 同步服务已就绪。</span>`;
          } else {
            testRes.innerHTML = `<span style="color:#e74c3c;font-size:13px;">✕ 服务端响应异常 (HTTP ${res.status})</span>`;
          }
        } catch (e) {
          testRes.innerHTML = `<span style="color:#e74c3c;font-size:13px;">✕ 连接测试失败: ${escapeHtml(e.message)}</span>`;
        }
      });
    } else if (subTab === 'sync') {
      // 2. Sync and conflict strategy tab
      const ignoreText = (settings.defaultIgnorePatterns || []).join('\n');

      container.innerHTML = `
        <div class="settings-card">
          <div class="settings-card-header">
            <h3><span>🔄</span> 同步策略与冲突处理 (Nimbus Sync Engine)</h3>
            <p>控制文件冲突时的自动裁决机制、传输限制与全局忽略黑名单</p>
          </div>

          <div class="settings-form-grid" style="margin-bottom:16px;">
            <label>
              <span>冲突解决策略 (Conflict Resolution)</span>
              <select id="setting-conflict-strategy" ${!isAdmin ? 'disabled' : ''}>
                <option value="conflict_copy" ${settings.conflictStrategy === 'conflict_copy' ? 'selected' : ''}>
                  自动生成冲突副本 (conflict_copy - 默认推荐，安全不丢数据)
                </option>
                <option value="overwrite_latest" ${settings.conflictStrategy === 'overwrite_latest' ? 'selected' : ''}>
                  按修改时间覆盖 (overwrite_latest - 最新修改胜出)
                </option>
                <option value="server_win" ${settings.conflictStrategy === 'server_win' ? 'selected' : ''}>
                  以服务器为准 (server_win - 服务端版本强制覆盖客户端)
                </option>
              </select>
              <div class="settings-help">当多台设备同时离线编辑同一篇笔记并上线合并时采取的策略</div>
            </label>

            <label>
              <span>WebSocket 心跳保活检测间隔 (秒)</span>
              <input type="number" id="setting-heartbeat" value="${settings.wsHeartbeatInterval || 30}" min="5" max="300" ${!isAdmin ? 'disabled' : ''} />
              <div class="settings-help">客户端与服务端的保活 Ping 频率，防止网络代理断开长连接</div>
            </label>

            <label>
              <span>单文件传输体积上限 (Max File Size, MB)</span>
              <input type="number" id="setting-max-filesize" value="${settings.maxFileSizeMb || 100}" min="1" max="2048" ${!isAdmin ? 'disabled' : ''} />
              <div class="settings-help">超过此大小的文件将跳过同步或发出超限警告</div>
            </label>

            <label>
              <span>大文件切片分片大小 (Chunk Size, MB)</span>
              <input type="number" id="setting-chunk-size" value="${settings.chunkSizeMb || 5}" min="1" max="50" ${!isAdmin ? 'disabled' : ''} />
              <div class="settings-help">对音视频或大文件进行流式切片传输的大小</div>
            </label>
          </div>

          <div class="settings-card-header" style="margin-top:20px;">
            <h3><span>📂</span> 同步范围与开关</h3>
          </div>

          <div class="settings-toggle-row">
            <div class="settings-toggle-info">
              <h4>同步 .obsidian 配置与插件外观目录</h4>
              <p>开启后将同步 Obsidian 的插件设置、快捷键与主题外观（.obsidian/ 目录）</p>
            </div>
            <label class="settings-switch">
              <input type="checkbox" id="setting-sync-config" ${settings.syncHiddenConfig ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''}>
              <span class="settings-slider"></span>
            </label>
          </div>

          <div class="settings-toggle-row">
            <div class="settings-toggle-info">
              <h4>同步附件与媒体文件 (Sync Attachments)</h4>
              <p>同步图片（PNG/JPG/SVG）、音频、视频、PDF 及常用附件文件</p>
            </div>
            <label class="settings-switch">
              <input type="checkbox" id="setting-sync-attachments" ${settings.syncAttachments ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''}>
              <span class="settings-slider"></span>
            </label>
          </div>

          <div class="settings-card-header" style="margin-top:20px;">
            <h3><span>🚫</span> 全局忽略规则黑名单 (Global Ignore Patterns)</h3>
            <p>匹配以下 Glob 通配符规则的文件或文件夹将自动被同步引擎忽略（每行一个规则）：</p>
          </div>

          <label>
            <textarea id="setting-ignore-patterns" rows="6" style="font-family:ui-monospace,monospace;font-size:12.5px;" ${!isAdmin ? 'disabled' : ''}>${escapeHtml(ignoreText)}</textarea>
            <div class="settings-help">支持标准 Glob 通配符，如 <code>.obsidian/workspace*.json</code>、<code>**/.git/**</code>、<code>**/*.tmp</code> 等</div>
          </label>

          <div style="display:flex;gap:12px;margin-top:20px;align-items:center;">
            ${isAdmin
              ? `<button id="sync-settings-save-btn" class="btn-primary">💾 保存同步策略设置</button>`
              : `<span style="color:var(--muted);font-size:13px;">🔒 全局同步策略仅管理员可修改，普通用户可查看。</span>`
            }
            <div id="sync-settings-result"></div>
          </div>
        </div>
      `;

      $('#sync-settings-save-btn')?.addEventListener('click', async () => {
        const patterns = ($('#setting-ignore-patterns').value || '')
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);

        const updates = {
          conflictStrategy: $('#setting-conflict-strategy').value,
          wsHeartbeatInterval: parseInt($('#setting-heartbeat').value, 10) || 30,
          maxFileSizeMb: parseInt($('#setting-max-filesize').value, 10) || 100,
          chunkSizeMb: parseInt($('#setting-chunk-size').value, 10) || 5,
          syncHiddenConfig: $('#setting-sync-config').checked,
          syncAttachments: $('#setting-sync-attachments').checked,
          defaultIgnorePatterns: patterns,
        };

        const resDiv = $('#sync-settings-result');
        resDiv.innerHTML = '<span style="color:var(--muted);font-size:13px;">正在保存设置…</span>';

        try {
          const res = await api('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          const body = await res.json();
          if (body.ok) {
            resDiv.innerHTML = `<span style="color:#2ecc71;font-size:13px;">✓ ${escapeHtml(body.message || '设置已保存并持久化到数据库')}</span>`;
            toast('同步策略已更新');
          } else {
            resDiv.innerHTML = `<span style="color:#e74c3c;font-size:13px;">✕ 保存失败: ${escapeHtml(body.error)}</span>`;
          }
        } catch (e) {
          resDiv.innerHTML = `<span style="color:#e74c3c;font-size:13px;">✕ 保存失败: ${escapeHtml(e.message)}</span>`;
        }
      });
    } else if (subTab === 'database') {
      // 3. Database Multi-Engine Management & Migration Tab
      container.innerHTML = '<div class="empty-state">正在加载数据库引擎与存储状态…</div>';

      (async () => {
        let dbInfo = null;
        try {
          const res = await api('/api/settings/database');
          if (res.ok) {
            dbInfo = await res.json();
          }
        } catch (e) {
          console.error('Fetch database info error:', e);
        }

        if (!dbInfo) {
          container.innerHTML = '<div class="empty-state" style="color:var(--danger)">获取数据库信息失败，请检查网络或后端状态</div>';
          return;
        }

        const activeEngine = (dbInfo.status?.type || 'json').toLowerCase();
        const cfg = dbInfo.status?.config || {};
        const stats = dbInfo.stats || { usersCount: 0, vaultsCount: 0, sharesCount: 0, tokensCount: 0, rulesCount: 0 };

        const engineNames = {
          json: 'JSON 本地文件存储 (Local JSON Storage)',
          sqlite: 'SQLite 嵌入式单文件关系数据库 (Embedded SQLite3)',
          postgres: 'PostgreSQL 企业级关系数据库 (PostgreSQL 14+)',
          mysql: 'MySQL / MariaDB 关系数据库 (MySQL 8.0+)',
        };

        container.innerHTML = `
          <!-- Active Engine Hero Card -->
          <div class="db-hero-card">
            <div class="db-hero-header">
              <div>
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
                  <h3 style="margin:0;font-size:16px;font-weight:700;">🗄️ 当前活动存储后端: ${escapeHtml(engineNames[activeEngine] || activeEngine.toUpperCase())}</h3>
                  <span class="db-status-badge">
                    <span class="db-status-dot"></span>
                    <span>运行正常</span>
                  </span>
                </div>
                <p style="margin:0;font-size:13px;color:var(--muted)">
                  ${activeEngine === 'json' ? '数据持久化保存于服务端 <code>/data/*.json</code> 文件中' : ''}
                  ${activeEngine === 'sqlite' ? `数据库文件路径: <code>${escapeHtml(cfg.sqlitePath || 'data/nimbus.sqlite')}</code> (已启用 WAL 高并发日志模式)` : ''}
                  ${activeEngine === 'postgres' ? `数据库连接主机: <code>${escapeHtml(cfg.host || 'PostgreSQL Server')}</code>, 数据库名: <code>${escapeHtml(cfg.database || 'nimbus')}</code>` : ''}
                  ${activeEngine === 'mysql' ? `数据库连接主机: <code>${escapeHtml(cfg.host || 'MySQL Server')}</code>, 数据库名: <code>${escapeHtml(cfg.database || 'nimbus')}</code>` : ''}
                </p>
              </div>
            </div>

            <!-- Stats Grid -->
            <div class="db-stats-grid">
              <div class="db-stat-item">
                <div class="db-stat-val">${stats.usersCount}</div>
                <div class="db-stat-lbl">👥 注册用户</div>
              </div>
              <div class="db-stat-item">
                <div class="db-stat-val">${stats.vaultsCount}</div>
                <div class="db-stat-lbl">📚 笔记库 (Vaults)</div>
              </div>
              <div class="db-stat-item">
                <div class="db-stat-val">${stats.sharesCount}</div>
                <div class="db-stat-lbl">🔗 公开分享链接</div>
              </div>
              <div class="db-stat-item">
                <div class="db-stat-val">${stats.tokensCount}</div>
                <div class="db-stat-lbl">🔑 设备专属令牌</div>
              </div>
              <div class="db-stat-item">
                <div class="db-stat-val">${stats.rulesCount}</div>
                <div class="db-stat-lbl">🛡️ 规则与过滤配置</div>
              </div>
            </div>
          </div>

          <!-- Switch & Configure Engine Card -->
          <div class="settings-card">
            <div class="settings-card-header">
              <h3><span>🔄</span> 切换并更新数据库引擎 (Database Switch & Migration)</h3>
              <p>Nimbus 支持在 <b>JSON 文件</b>、<b>SQLite</b>、<b>PostgreSQL</b>、<b>MySQL</b> 间任意无缝切换，并支持一键数据平滑迁移</p>
            </div>

            <div style="margin-bottom:16px;">
              <span style="display:block;font-size:13px;font-weight:600;margin-bottom:10px;color:var(--text-secondary);">
                选择目标数据库存储引擎：
              </span>
              <div class="db-engine-grid">
                <div class="db-engine-opt ${activeEngine === 'json' ? 'selected' : ''}" data-type="json">
                  <div class="db-engine-title">
                    <span>📄 JSON 文件存储</span>
                    ${activeEngine === 'json' ? '<span class="badge" style="background:var(--accent-bg);color:var(--accent);font-size:11px;">当前使用</span>' : ''}
                  </div>
                  <div class="db-engine-desc">零配置、无外部依赖，数据直接保存在 JSON 文件，适合个人单机快速运行。</div>
                </div>

                <div class="db-engine-opt ${activeEngine === 'sqlite' ? 'selected' : ''}" data-type="sqlite">
                  <div class="db-engine-title">
                    <span>🗃️ SQLite 单文件数据库</span>
                    ${activeEngine === 'sqlite' ? '<span class="badge" style="background:var(--accent-bg);color:var(--accent);font-size:11px;">当前使用</span>' : ''}
                  </div>
                  <div class="db-engine-desc">嵌入式关系数据库，具备完整 ACID 事务与 WAL 读写并发，零网络延迟。</div>
                </div>

                <div class="db-engine-opt ${activeEngine === 'postgres' ? 'selected' : ''}" data-type="postgres">
                  <div class="db-engine-title">
                    <span>🐘 PostgreSQL 企业级关系库</span>
                    ${activeEngine === 'postgres' ? '<span class="badge" style="background:var(--accent-bg);color:var(--accent);font-size:11px;">当前使用</span>' : ''}
                  </div>
                  <div class="db-engine-desc">支持云数据库（Supabase、Neon、RDS、Cloud SQL），高并发强一致性。</div>
                </div>

                <div class="db-engine-opt ${activeEngine === 'mysql' ? 'selected' : ''}" data-type="mysql">
                  <div class="db-engine-title">
                    <span>🐬 MySQL / MariaDB</span>
                    ${activeEngine === 'mysql' ? '<span class="badge" style="background:var(--accent-bg);color:var(--accent);font-size:11px;">当前使用</span>' : ''}
                  </div>
                  <div class="db-engine-desc">经典开源关系型数据库，适合分布式集群、主从架构及企业级运维环境。</div>
                </div>
              </div>
            </div>

            <!-- Dynamic Params Configuration Container -->
            <div id="db-config-fields-wrap" style="background:var(--panel-2);border:1px solid var(--border);border-radius:var(--radius);padding:18px;margin-bottom:18px;">
              <!-- Dynamic rendered by JS -->
            </div>

            <!-- Migration Toggle -->
            <div class="form-checkbox-group" style="margin-bottom:20px;">
              <label class="form-checkbox-label">
                <input type="checkbox" id="db-migrate-data-checkbox" checked />
                <span><b>自动平滑迁移现有数据</b>（将当前数据库中的全部用户、Vaults、分享链接、系统设置等完整复制导入到新数据库中）</span>
              </label>
            </div>

            <!-- Action Buttons -->
            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
              <button id="db-test-conn-btn" class="btn-secondary">
                🔍 测试目标数据库连接
              </button>
              ${isAdmin ? `<button id="db-switch-save-btn" class="btn-primary">🚀 保存并切换数据库引擎</button>` : '<span style="font-size:13px;color:var(--muted)">只有管理员有权限切换数据库配置</span>'}
            </div>

            <div id="db-action-feedback" style="margin-top:14px;"></div>
          </div>
        `;

        let selectedTargetType = activeEngine;

        function renderFieldsForEngine(type) {
          const wrap = $('#db-config-fields-wrap');
          if (!wrap) return;

          if (type === 'json') {
            wrap.innerHTML = `
              <div style="display:flex;align-items:center;gap:10px;font-size:13.5px;color:var(--text-secondary);">
                <span>ℹ️</span>
                <span><b>JSON 文件存储模式无需额外配置参数</b>。系统将把数据自动持久化保存于服务端的 <code>data/</code> 目录。</span>
              </div>
            `;
          } else if (type === 'sqlite') {
            wrap.innerHTML = `
              <h4 style="margin:0 0 12px;font-size:14px;">⚙️ SQLite 数据库配置参数</h4>
              <div class="settings-form-grid">
                <label style="margin:0;">
                  <span>SQLite 数据库文件存储路径 (Path)</span>
                  <input id="db-input-sqlite-path" value="${escapeHtml(cfg.sqlitePath || 'data/nimbus.sqlite')}" placeholder="data/nimbus.sqlite" />
                  <div class="settings-help">支持相对路径或绝对路径，如果目标目录不存在将自动创建</div>
                </label>
              </div>
            `;
          } else if (type === 'postgres') {
            wrap.innerHTML = `
              <h4 style="margin:0 0 12px;font-size:14px;">🐘 PostgreSQL 数据库连接参数</h4>
              <div style="margin-bottom:14px;">
                <label style="margin:0;">
                  <span>PostgreSQL 连接 URI (DATABASE_URL) <span style="font-weight:400;color:var(--muted);font-size:12px;">（优先使用，留空则使用下方分项配置）</span></span>
                  <input id="db-input-pg-url" placeholder="postgresql://user:password@localhost:5432/nimbus?sslmode=disable" />
                  <div class="settings-help">例如 Supabase / Neon / RDS 提供的连接 URI</div>
                </label>
              </div>

              <div class="settings-form-grid">
                <label style="margin:0;">
                  <span>主机地址 (Host)</span>
                  <input id="db-input-pg-host" value="${escapeHtml(cfg.host || 'localhost')}" placeholder="localhost" />
                </label>
                <label style="margin:0;">
                  <span>端口 (Port)</span>
                  <input id="db-input-pg-port" type="number" value="${cfg.port || 5432}" placeholder="5432" />
                </label>
                <label style="margin:0;">
                  <span>数据库名 (Database)</span>
                  <input id="db-input-pg-db" value="${escapeHtml(cfg.database || 'nimbus')}" placeholder="nimbus" />
                </label>
                <label style="margin:0;">
                  <span>用户名 (User)</span>
                  <input id="db-input-pg-user" value="${escapeHtml(cfg.user || 'postgres')}" placeholder="postgres" />
                </label>
                <label style="margin:0;">
                  <span>密码 (Password)</span>
                  <input id="db-input-pg-pass" type="password" placeholder="请输入数据库访问密码" />
                </label>
                <label style="margin:0;display:flex;flex-direction:column;justify-content:center;">
                  <span style="margin-bottom:8px;">SSL 安全加密连接</span>
                  <label class="form-checkbox-label" style="margin:0;">
                    <input type="checkbox" id="db-input-pg-ssl" ${cfg.ssl ? 'checked' : ''} />
                    <span>启用 SSL 加密 (云数据库必须开启)</span>
                  </label>
                </label>
              </div>
            `;
          } else if (type === 'mysql') {
            wrap.innerHTML = `
              <h4 style="margin:0 0 12px;font-size:14px;">🐬 MySQL / MariaDB 数据库连接参数</h4>
              <div class="settings-form-grid">
                <label style="margin:0;">
                  <span>主机地址 (Host)</span>
                  <input id="db-input-mysql-host" value="${escapeHtml(cfg.host || 'localhost')}" placeholder="localhost" />
                </label>
                <label style="margin:0;">
                  <span>端口 (Port)</span>
                  <input id="db-input-mysql-port" type="number" value="${cfg.port || 3306}" placeholder="3306" />
                </label>
                <label style="margin:0;">
                  <span>数据库名 (Database)</span>
                  <input id="db-input-mysql-db" value="${escapeHtml(cfg.database || 'nimbus')}" placeholder="nimbus" />
                </label>
                <label style="margin:0;">
                  <span>用户名 (User)</span>
                  <input id="db-input-mysql-user" value="${escapeHtml(cfg.user || 'root')}" placeholder="root" />
                </label>
                <label style="margin:0;">
                  <span>密码 (Password)</span>
                  <input id="db-input-mysql-pass" type="password" placeholder="请输入数据库访问密码" />
                </label>
              </div>
            `;
          }
        }

        renderFieldsForEngine(selectedTargetType);

        // Bind engine option clicks
        container.querySelectorAll('.db-engine-opt').forEach((opt) => {
          opt.addEventListener('click', () => {
            container.querySelectorAll('.db-engine-opt').forEach((o) => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedTargetType = opt.dataset.type;
            renderFieldsForEngine(selectedTargetType);
          });
        });

        function collectConfigFromUI() {
          const type = selectedTargetType;
          if (type === 'json') return { type: 'json' };
          if (type === 'sqlite') {
            return {
              type: 'sqlite',
              sqlitePath: $('#db-input-sqlite-path')?.value.trim() || 'data/nimbus.sqlite',
            };
          }
          if (type === 'postgres') {
            const pgUrl = $('#db-input-pg-url')?.value.trim();
            if (pgUrl) {
              return {
                type: 'postgres',
                connectionString: pgUrl,
                ssl: $('#db-input-pg-ssl')?.checked,
              };
            }
            return {
              type: 'postgres',
              host: $('#db-input-pg-host')?.value.trim() || 'localhost',
              port: parseInt($('#db-input-pg-port')?.value, 10) || 5432,
              database: $('#db-input-pg-db')?.value.trim() || 'nimbus',
              user: $('#db-input-pg-user')?.value.trim() || 'postgres',
              password: $('#db-input-pg-pass')?.value || '',
              ssl: $('#db-input-pg-ssl')?.checked,
            };
          }
          if (type === 'mysql') {
            return {
              type: 'mysql',
              host: $('#db-input-mysql-host')?.value.trim() || 'localhost',
              port: parseInt($('#db-input-mysql-port')?.value, 10) || 3306,
              database: $('#db-input-mysql-db')?.value.trim() || 'nimbus',
              user: $('#db-input-mysql-user')?.value.trim() || 'root',
              password: $('#db-input-mysql-pass')?.value || '',
            };
          }
          return { type: 'json' };
        }

        // Test connection
        $('#db-test-conn-btn')?.addEventListener('click', async () => {
          const targetCfg = collectConfigFromUI();
          const fb = $('#db-action-feedback');
          fb.innerHTML = '<span style="color:var(--muted);font-size:13px;">正在测试数据库连接…</span>';

          try {
            const res = await api('/api/settings/database/test', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(targetCfg),
            });
            const body = await res.json();
            if (body.ok) {
              fb.innerHTML = `<div style="padding:10px 14px;background:rgba(46,204,113,0.1);border:1px solid rgba(46,204,113,0.3);border-radius:6px;color:#2ecc71;font-size:13px;">✓ 连接测试成功: ${escapeHtml(body.message)}</div>`;
            } else {
              fb.innerHTML = `<div style="padding:10px 14px;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:6px;color:#e74c3c;font-size:13px;">✕ 连接失败: ${escapeHtml(body.error)}</div>`;
            }
          } catch (e) {
            fb.innerHTML = `<div style="padding:10px 14px;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:6px;color:#e74c3c;font-size:13px;">✕ 请求错误: ${escapeHtml(e.message)}</div>`;
          }
        });

        // Switch and migrate database
        $('#db-switch-save-btn')?.addEventListener('click', async () => {
          const targetCfg = collectConfigFromUI();
          const doMigrate = $('#db-migrate-data-checkbox')?.checked;

          const engineDisplayName = engineNames[targetCfg.type] || targetCfg.type.toUpperCase();
          if (!confirm(`确定要将数据库存储引擎切换为「${engineDisplayName}」吗？\n\n${doMigrate ? '✓ 已开启全量数据自动迁移，系统将平滑搬移现有用户与笔记配置。' : '⚠️ 未开启数据迁移，新数据库将从空白状态启动。'}`)) {
            return;
          }

          const fb = $('#db-action-feedback');
          fb.innerHTML = '<span style="color:var(--accent);font-size:13px;">正在执行数据库切换与数据平滑迁移，请稍候…</span>';

          try {
            const res = await api('/api/settings/database/switch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ targetConfig: targetCfg, migrate: doMigrate }),
            });
            const body = await res.json();
            if (body.ok) {
              const counts = body.result?.counts || {};
              toast('数据库引擎切换成功！');
              fb.innerHTML = `
                <div style="padding:12px 16px;background:rgba(46,204,113,0.15);border:1px solid rgba(46,204,113,0.4);border-radius:6px;color:#2ecc71;font-size:13.5px;">
                  <b>✓ 数据库切换成功！当前活跃引擎: ${escapeHtml(body.result?.activeEngine || targetCfg.type.toUpperCase())}</b>
                  ${doMigrate ? `<div style="font-size:12.5px;color:var(--text);margin-top:6px;">已成功平滑迁移: ${counts.users || 0} 个用户、${counts.vaults || 0} 个 Vault、${counts.shares || 0} 条分享、${counts.apiTokens || 0} 个专属令牌。</div>` : ''}
                </div>
              `;
              setTimeout(() => renderSettingsPanel('database'), 1500);
            } else {
              fb.innerHTML = `<div style="padding:10px 14px;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:6px;color:#e74c3c;font-size:13px;">✕ 切换失败: ${escapeHtml(body.error)}</div>`;
            }
          } catch (e) {
            fb.innerHTML = `<div style="padding:10px 14px;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:6px;color:#e74c3c;font-size:13px;">✕ 执行失败: ${escapeHtml(e.message)}</div>`;
          }
        });
      })();
    } else if (subTab === 'history') {
      // 3. History and trash retention lifecycle tab
      container.innerHTML = `
        <div class="settings-card">
          <div class="settings-card-header">
            <h3><span>🕒</span> 版本历史快照与回收站生命周期</h3>
            <p>管理笔记修改历史快照的版本上限、保存周期与回收站清理策略</p>
          </div>

          <div class="settings-form-grid" style="margin-bottom:16px;">
            <label>
              <span>单个文件最大历史版本数 (Max Versions)</span>
              <input type="number" id="setting-retention-count" value="${settings.versionRetentionCount || 30}" min="5" max="200" ${!isAdmin ? 'disabled' : ''} />
              <div class="settings-help">单个文件历史版本数超过设定值时，最早的旧快照将自动轮替清除</div>
            </label>

            <label>
              <span>历史版本最长保留天数 (Retention Days)</span>
              <input type="number" id="setting-retention-days" value="${settings.versionRetentionDays || 30}" min="1" max="365" ${!isAdmin ? 'disabled' : ''} />
              <div class="settings-help">超过此天数的历史快照将自动淘汰</div>
            </label>

            <label>
              <span>回收站软删除保留天数 (Trash Retention)</span>
              <input type="number" id="setting-trash-days" value="${settings.trashRetentionDays || 30}" min="1" max="365" ${!isAdmin ? 'disabled' : ''} />
              <div class="settings-help">在 Obsidian 中删除的文件将先放入服务端回收站，防止误删</div>
            </label>
          </div>

          <div class="settings-toggle-row">
            <div class="settings-toggle-info">
              <h4>自动定时垃圾回收清理 (Auto Purge)</h4>
              <p>服务器每日凌晨自动扫描并物理清除超出保留天数的过期垃圾文件</p>
            </div>
            <label class="settings-switch">
              <input type="checkbox" id="setting-auto-purge" ${settings.autoPurgeTrash ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''}>
              <span class="settings-slider"></span>
            </label>
          </div>

          <div style="display:flex;gap:12px;margin-top:20px;align-items:center;flex-wrap:wrap;">
            ${isAdmin ? `<button id="history-settings-save-btn" class="btn-primary">💾 保存版本生命周期设置</button>` : ''}
            <button id="purge-all-trash-btn" class="btn-secondary" style="color:var(--danger);border-color:rgba(248,81,73,0.3);">
              🧹 清空当前 Vault 回收站
            </button>
            <div id="history-settings-result"></div>
          </div>
        </div>
      `;

      $('#history-settings-save-btn')?.addEventListener('click', async () => {
        const updates = {
          versionRetentionCount: parseInt($('#setting-retention-count').value, 10) || 30,
          versionRetentionDays: parseInt($('#setting-retention-days').value, 10) || 30,
          trashRetentionDays: parseInt($('#setting-trash-days').value, 10) || 30,
          autoPurgeTrash: $('#setting-auto-purge').checked,
        };

        const resDiv = $('#history-settings-result');
        resDiv.innerHTML = '<span style="color:var(--muted);font-size:13px;">正在保存设置…</span>';

        try {
          const res = await api('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          const body = await res.json();
          if (body.ok) {
            resDiv.innerHTML = `<span style="color:#2ecc71;font-size:13px;">✓ ${escapeHtml(body.message || '设置已保存')}</span>`;
            toast('版本保留设置已更新');
          } else {
            resDiv.innerHTML = `<span style="color:#e74c3c;font-size:13px;">✕ 保存失败: ${escapeHtml(body.error)}</span>`;
          }
        } catch (e) {
          resDiv.innerHTML = `<span style="color:#e74c3c;font-size:13px;">✕ 保存失败: ${escapeHtml(e.message)}</span>`;
        }
      });

      $('#purge-all-trash-btn')?.addEventListener('click', async () => {
        if (!confirm(`确定要清空 Vault "${currentVault.name}" 的所有回收站文件吗？此操作无法撤回。`)) return;
        try {
          const res = await api(`/api/vaults/${currentVault.id}/trash/purge-all`, { method: 'POST' });
          const body = await res.json();
          toast(`已彻底清理 ${body.purgedCount || 0} 个回收站文件`);
        } catch (e) {
          toast(`清理失败: ${e.message}`);
        }
      });
    } else if (subTab === 'tokens') {
      // 4. Device Tokens management tab
      function renderTokenTableBody() {
        if (!tokensList || tokensList.length === 0) {
          return `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px;">暂无专属设备令牌，您可点击下方创建</td></tr>`;
        }
        return tokensList.map((t) => {
          const displayMasked = t.maskedToken || (t.token ? `${t.token.slice(0, 10)}...${t.token.slice(-6)}` : '******');
          return `
            <tr id="token-row-${t.id}">
              <td><b>${escapeHtml(t.label || '设备')}</b></td>
              <td>
                <div class="token-val-box">
                  <code id="token-display-${t.id}">${escapeHtml(displayMasked)}</code>
                  <button class="token-act-btn token-toggle-btn" data-tokenid="${t.id}" data-state="masked" title="查看 / 隐藏完整令牌">👁️ 查看</button>
                  <button class="token-act-btn primary token-copy-btn" data-token="${escapeHtml(t.token || '')}" title="复制完整令牌">📋 复制</button>
                </div>
              </td>
              <td style="color:var(--muted);font-size:12px;">${new Date(t.createdAt).toLocaleString()}</td>
              <td style="color:var(--muted);font-size:12px;">${t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleString() : '<span style="color:var(--muted)">从未使用</span>'}</td>
              <td>
                <div style="display:flex;gap:6px;align-items:center;">
                  <button class="btn-sm secondary token-cfg-btn" data-tokenid="${t.id}" title="查看并复制对应 Obsidian 插件配置">⚡ 配置</button>
                  <button class="btn-sm ghost token-del-btn" data-tokenid="${t.id}" title="注销设备令牌" style="color:var(--danger)">注销</button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }

      container.innerHTML = `
        <div class="settings-card">
          <div class="settings-card-header">
            <h3><span>🔑</span> 多端专属设备令牌 (Device Access Tokens)</h3>
            <p>为每台设备（如 MacBook、iPhone、Windows 办公电脑）签发独立 Token，支持随时查看、复制与注销，各端独立鉴权便于安全管理</p>
          </div>

          <div class="token-table-wrap" style="margin-bottom:20px;">
            <table class="token-table">
              <thead>
                <tr>
                  <th style="width:160px;">设备名称 / 备注</th>
                  <th>访问令牌 (Token)</th>
                  <th style="width:160px;">创建时间</th>
                  <th style="width:160px;">最近活跃</th>
                  <th style="width:130px;">操作</th>
                </tr>
              </thead>
              <tbody id="tokens-table-tbody">
                ${renderTokenTableBody()}
              </tbody>
            </table>
          </div>

          <div id="new-token-display-box" style="margin-bottom:20px;"></div>

          <div class="settings-card-header" style="margin-top:24px;">
            <h3><span>➕</span> 新建专属设备 Token</h3>
            <p>创建后系统将自动保存并支持随时查看或复制，可直接用于 Obsidian 同步插件鉴权</p>
          </div>

          <div class="settings-form-grid" style="align-items:flex-end;">
            <label>
              <span>设备名称 / 备注 (如: iMac 27-inch, iPhone 16)</span>
              <input type="text" id="new-token-label" placeholder="例如: MacBook-Pro-Work" required />
            </label>

            <label>
              <span>令牌有效期 (Token Expiration)</span>
              <select id="new-token-expiry">
                <option value="30">30 天</option>
                <option value="90">90 天</option>
                <option value="365" selected>1 年 (365 天)</option>
                <option value="3650">永久有效 (10 年)</option>
              </select>
            </label>

            <div style="padding-bottom:14px;">
              <button id="create-token-btn" class="btn-primary">＋ 生成设备 Token</button>
            </div>
          </div>
        </div>
      `;

      function bindTokenRowEvents() {
        // 1. Toggle reveal / hide token
        container.querySelectorAll('.token-toggle-btn').forEach((btn) => {
          btn.onclick = () => {
            const tid = btn.dataset.tokenid;
            const targetToken = tokensList.find((t) => t.id === tid);
            const codeEl = container.querySelector(`#token-display-${tid}`);
            if (!targetToken || !codeEl) return;

            const isMasked = btn.dataset.state === 'masked';
            if (isMasked) {
              codeEl.textContent = targetToken.token || targetToken.maskedToken;
              codeEl.style.color = '#3fb950';
              btn.dataset.state = 'revealed';
              btn.textContent = '🙈 隐藏';
            } else {
              codeEl.textContent = targetToken.maskedToken || `${(targetToken.token || '').slice(0, 10)}...${(targetToken.token || '').slice(-6)}`;
              codeEl.style.color = 'var(--accent)';
              btn.dataset.state = 'masked';
              btn.textContent = '👁️ 查看';
            }
          };
        });

        // 2. Copy token
        container.querySelectorAll('.token-copy-btn').forEach((btn) => {
          btn.onclick = () => {
            const token = btn.dataset.token;
            if (!token) {
              toast('Token 内容为空');
              return;
            }
            if (navigator.clipboard?.writeText) {
              navigator.clipboard.writeText(token).then(() => toast('✓ 设备 Token 已复制到剪贴板！'));
            } else {
              prompt('复制设备 Token：', token);
            }
          };
        });

        // 3. Quick Obsidian config export
        container.querySelectorAll('.token-cfg-btn').forEach((btn) => {
          btn.onclick = () => {
            const tid = btn.dataset.tokenid;
            const targetToken = tokensList.find((t) => t.id === tid);
            if (!targetToken) return;

            const serverUrl = serverOrigin.replace(/\/+$/, '');
            const wsUrl = serverUrl.replace(/^http:\/\//i, 'ws://').replace(/^https:\/\//i, 'wss://') + '/ws';
            const devName = targetToken.label || 'Obsidian-Device';
            const cfg = {
              serverUrl,
              wsUrl: `${wsUrl}?vaultId=${currentVault.id}&token=${targetToken.token || ''}&deviceId=${encodeURIComponent(devName)}`,
              vaultId: currentVault.id,
              authToken: targetToken.token || '',
              deviceName: devName,
              autoSyncOnStartup: true,
            };

            const modalHtml = `
              <div class="modal-header">
                <h3>📱 设备「${escapeHtml(targetToken.label)}」Obsidian 配置</h3>
                <button class="modal-close ghost">✕</button>
              </div>
              <div class="modal-body">
                <p style="color:var(--text-secondary);margin-bottom:12px;">
                  以下是为设备 <b>${escapeHtml(targetToken.label)}</b> 生成的独立专属同步配置：
                </p>
                <div class="nav-section-title">配置文件 <code>data.json</code></div>
                <pre class="code-snippet" style="max-height:220px;">${escapeHtml(JSON.stringify(cfg, null, 2))}</pre>
                <p style="color:var(--muted);font-size:12px;margin-top:10px;">
                  💡 复制后可直接保存至该设备 Obsidian 库目录 <code>.obsidian/plugins/nimbus/data.json</code>。
                </p>
              </div>
              <div class="modal-footer">
                <button id="modal-copy-device-cfg-btn" class="btn-primary">📋 复制 data.json 配置</button>
                <button class="modal-close secondary">关闭</button>
              </div>
            `;
            showModal(modalHtml, (diag) => {
              diag.querySelector('#modal-copy-device-cfg-btn').onclick = () => {
                const text = JSON.stringify(cfg, null, 2);
                if (navigator.clipboard?.writeText) {
                  navigator.clipboard.writeText(text).then(() => toast('配置已复制到剪贴板！'));
                } else {
                  prompt('复制配置：', text);
                }
              };
            });
          };
        });

        // 4. Revoke token
        container.querySelectorAll('.token-del-btn').forEach((btn) => {
          btn.onclick = async () => {
            const tid = btn.dataset.tokenid;
            const targetToken = tokensList.find((t) => t.id === tid);
            const label = targetToken?.label || '该设备';
            if (!confirm(`确定要注销并废除「${label}」的专属令牌吗？注销后该设备将无法继续同步。`)) return;
            try {
              const res = await api(`/api/settings/tokens/${tid}`, { method: 'DELETE' });
              const body = await res.json();
              if (body.ok) {
                toast(`设备令牌「${label}」已注销`);
                tokensList = tokensList.filter((t) => t.id !== tid);
                const tbody = container.querySelector('#tokens-table-tbody');
                if (tbody) tbody.innerHTML = renderTokenTableBody();
                bindTokenRowEvents();
              } else {
                toast(`注销失败: ${body.error || '未知错误'}`);
              }
            } catch (e) {
              toast(`注销失败: ${e.message}`);
            }
          };
        });
      }

      bindTokenRowEvents();

      // Bind create token button
      $('#create-token-btn')?.addEventListener('click', async () => {
        const label = $('#new-token-label').value.trim();
        const expiry = $('#new-token-expiry').value;
        if (!label) {
          toast('请输入设备名称或备注');
          return;
        }

        try {
          const res = await api('/api/settings/tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label, expiresInDays: expiry }),
          });
          const body = await res.json();
          if (body.ok && body.token) {
            const newToken = body.token;
            // Prepend new token to the list
            tokensList = [newToken, ...tokensList.filter((t) => t.id !== newToken.id)];

            // Clear input
            $('#new-token-label').value = '';

            // Update table
            const tbody = container.querySelector('#tokens-table-tbody');
            if (tbody) tbody.innerHTML = renderTokenTableBody();
            bindTokenRowEvents();

            // Display persistent success banner
            const display = $('#new-token-display-box');
            display.innerHTML = `
              <div style="background:var(--panel-2);border:1px solid #2ecc71;border-radius:var(--radius);padding:16px;position:relative;">
                <button id="close-token-success-btn" style="position:absolute;top:10px;right:10px;background:none;border:none;color:var(--muted);font-size:14px;cursor:pointer;">✕</button>
                <div style="color:#2ecc71;font-weight:600;font-size:14px;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                  <span>✓</span> 设备专属令牌「${escapeHtml(newToken.label)}」创建成功！
                </div>
                <div style="font-size:12.5px;color:var(--text-secondary);margin-bottom:10px;">
                  该令牌已加入上方管理列表，支持随时查看与注销。您可以立即复制下方 Token 填入 Obsidian 插件：
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                  <input type="text" readonly value="${escapeHtml(newToken.token)}" id="created-token-value" style="font-family:ui-monospace,monospace;font-size:12px;background:var(--panel-3);border:1px solid var(--border);" />
                  <button id="copy-created-token-btn" class="btn-primary" style="flex-shrink:0;">📋 复制 Token</button>
                </div>
              </div>
            `;

            $('#close-token-success-btn')?.addEventListener('click', () => {
              display.innerHTML = '';
            });

            $('#copy-created-token-btn')?.addEventListener('click', () => {
              navigator.clipboard.writeText(newToken.token).then(() => {
                toast('Token 已复制到剪贴板！');
              });
            });

            toast(`✓ 设备令牌「${newToken.label}」创建成功`);
          } else {
            toast(`创建失败: ${body.error || '未知错误'}`);
          }
        } catch (e) {
          toast(`创建失败: ${e.message}`);
        }
      });
    } else if (subTab === 'account') {
      // 5. Account, appearance & password management tab
      const currentTheme = localStorage.getItem('nimbus_theme') || 'default';
      container.innerHTML = `
        <div class="settings-card">
          <div class="settings-card-header">
            <h3><span>🎨</span> 后台管理界面主题风格与配色</h3>
            <p>选择您喜欢的后台配色风格，支持实时切换并自动保存偏好</p>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));gap:12px;margin-bottom:28px;">
            <div class="theme-card-picker ${currentTheme === 'default' ? 'selected' : ''}" data-val="default" style="cursor:pointer;padding:12px;background:var(--panel-2);border:1px solid ${currentTheme === 'default' ? 'var(--accent)' : 'var(--border)'};border-radius:var(--radius);display:flex;align-items:center;gap:10px;">
              <span class="dot" style="width:14px;height:14px;border-radius:50%;background:#58a6ff;box-shadow:0 0 8px #58a6ff;flex-shrink:0;"></span>
              <div>
                <div style="font-weight:600;font-size:13px;">经典科技蓝</div>
                <div style="font-size:11px;color:var(--muted)">默认深色极客风</div>
              </div>
            </div>

            <div class="theme-card-picker ${currentTheme === 'obsidian' ? 'selected' : ''}" data-val="obsidian" style="cursor:pointer;padding:12px;background:var(--panel-2);border:1px solid ${currentTheme === 'obsidian' ? 'var(--accent)' : 'var(--border)'};border-radius:var(--radius);display:flex;align-items:center;gap:10px;">
              <span class="dot" style="width:14px;height:14px;border-radius:50%;background:#9d7cd8;box-shadow:0 0 8px #9d7cd8;flex-shrink:0;"></span>
              <div>
                <div style="font-weight:600;font-size:13px;">Obsidian 紫魅夜</div>
                <div style="font-size:11px;color:var(--muted)">Obsidian 官方经典紫</div>
              </div>
            </div>

            <div class="theme-card-picker ${currentTheme === 'emerald' ? 'selected' : ''}" data-val="emerald" style="cursor:pointer;padding:12px;background:var(--panel-2);border:1px solid ${currentTheme === 'emerald' ? 'var(--accent)' : 'var(--border)'};border-radius:var(--radius);display:flex;align-items:center;gap:10px;">
              <span class="dot" style="width:14px;height:14px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;flex-shrink:0;"></span>
              <div>
                <div style="font-weight:600;font-size:13px;">翡翠极光绿</div>
                <div style="font-size:11px;color:var(--muted)">深邃护眼森系绿</div>
              </div>
            </div>

            <div class="theme-card-picker ${currentTheme === 'azure' ? 'selected' : ''}" data-val="azure" style="cursor:pointer;padding:12px;background:var(--panel-2);border:1px solid ${currentTheme === 'azure' ? 'var(--accent)' : 'var(--border)'};border-radius:var(--radius);display:flex;align-items:center;gap:10px;">
              <span class="dot" style="width:14px;height:14px;border-radius:50%;background:#0284c7;box-shadow:0 0 8px #0284c7;flex-shrink:0;"></span>
              <div>
                <div style="font-weight:600;font-size:13px;">深海蔚蓝</div>
                <div style="font-size:11px;color:var(--muted)">清澈深蓝海洋风</div>
              </div>
            </div>

            <div class="theme-card-picker ${currentTheme === 'rose' ? 'selected' : ''}" data-val="rose" style="cursor:pointer;padding:12px;background:var(--panel-2);border:1px solid ${currentTheme === 'rose' ? 'var(--accent)' : 'var(--border)'};border-radius:var(--radius);display:flex;align-items:center;gap:10px;">
              <span class="dot" style="width:14px;height:14px;border-radius:50%;background:#e11d48;box-shadow:0 0 8px #e11d48;flex-shrink:0;"></span>
              <div>
                <div style="font-weight:600;font-size:13px;">琥珀丝绒红</div>
                <div style="font-size:11px;color:var(--muted)">暖意轻奢丝绒酒红</div>
              </div>
            </div>

            <div class="theme-card-picker ${currentTheme === 'mono' ? 'selected' : ''}" data-val="mono" style="cursor:pointer;padding:12px;background:var(--panel-2);border:1px solid ${currentTheme === 'mono' ? 'var(--accent)' : 'var(--border)'};border-radius:var(--radius);display:flex;align-items:center;gap:10px;">
              <span class="dot" style="width:14px;height:14px;border-radius:50%;background:#ffffff;box-shadow:0 0 8px #ffffff;flex-shrink:0;"></span>
              <div>
                <div style="font-weight:600;font-size:13px;">OLED 纯黑极简</div>
                <div style="font-size:11px;color:var(--muted)">纯黑超高对比度</div>
              </div>
            </div>

            <div class="theme-card-picker ${currentTheme === 'light' ? 'selected' : ''}" data-val="light" style="cursor:pointer;padding:12px;background:var(--panel-2);border:1px solid ${currentTheme === 'light' ? 'var(--accent)' : 'var(--border)'};border-radius:var(--radius);display:flex;align-items:center;gap:10px;">
              <span class="dot" style="width:14px;height:14px;border-radius:50%;background:#2563eb;flex-shrink:0;"></span>
              <div>
                <div style="font-weight:600;font-size:13px;">明亮白昼 (Light)</div>
                <div style="font-size:11px;color:var(--muted)">清新日间高清晰</div>
              </div>
            </div>
          </div>

          <div class="settings-card-header">
            <h3><span>👤</span> 个人账户信息</h3>
            <p>查看当前登录用户凭证</p>
          </div>

          <div style="display:grid;grid-template-columns:120px 1fr;gap:10px 14px;font-size:13.5px;margin-bottom:24px;background:var(--panel-2);padding:16px;border-radius:var(--radius);border:1px solid var(--border);">
            <span style="color:var(--muted)">当前登录用户:</span>
            <span><b>${escapeHtml(state.user?.username)}</b></span>
            <span style="color:var(--muted)">权限角色:</span>
            <span><span class="badge">${state.user?.role === 'admin' ? '系统管理员' : '标准用户'}</span></span>
            <span style="color:var(--muted)">用户 ID:</span>
            <code style="font-size:12px">${state.user?.id || 'N/A'}</code>
          </div>

          <div class="settings-card-header">
            <h3><span>🔒</span> 修改登录密码</h3>
            <p>定期更新密码以保证多端同步数据的安全性</p>
          </div>

          <form id="change-password-form" style="max-width:420px;">
            <label>
              <span>原密码 (Current Password)</span>
              <input type="password" id="old-password" required autocomplete="current-password" placeholder="输入当前使用的密码" />
            </label>
            <label>
              <span>新密码 (New Password)</span>
              <input type="password" id="new-password" required autocomplete="new-password" placeholder="至少4位字符" minlength="4" />
            </label>
            <label>
              <span>确认新密码 (Confirm New Password)</span>
              <input type="password" id="confirm-password" required autocomplete="new-password" placeholder="再次输入新密码" minlength="4" />
            </label>

            <div id="password-change-result" style="margin:10px 0;"></div>

            <button type="submit" class="btn-primary" style="margin-top:8px;">确认修改密码</button>
          </form>
        </div>
      `;

      // Bind Theme Cards in settings
      container.querySelectorAll('.theme-card-picker').forEach((card) => {
        card.addEventListener('click', () => {
          const val = card.dataset.val;
          applyTheme(val);
          toast(`已切换至「${THEME_LABELS[val]}」风格`);
          renderSettingsPanel('account');
        });
      });

      $('#change-password-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const oldPassword = $('#old-password').value;
        const newPassword = $('#new-password').value;
        const confirmPassword = $('#confirm-password').value;
        const resultDiv = $('#password-change-result');

        if (newPassword !== confirmPassword) {
          resultDiv.innerHTML = '<span style="color:#e74c3c;font-size:13px;">✕ 两次输入的新密码不一致</span>';
          return;
        }

        resultDiv.innerHTML = '<span style="color:var(--muted);font-size:13px;">正在提交修改…</span>';

        try {
          const res = await api('/api/settings/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldPassword, newPassword }),
          });
          const body = await res.json();
          if (body.ok) {
            resultDiv.innerHTML = `<span style="color:#2ecc71;font-size:13px;">✓ ${escapeHtml(body.message || '密码修改成功')}</span>`;
            $('#old-password').value = '';
            $('#new-password').value = '';
            $('#confirm-password').value = '';
            toast('密码修改成功，请牢记新密码');
          } else {
            resultDiv.innerHTML = `<span style="color:#e74c3c;font-size:13px;">✕ ${escapeHtml(body.error || '修改失败')}</span>`;
          }
        } catch (err) {
          resultDiv.innerHTML = `<span style="color:#e74c3c;font-size:13px;">✕ ${escapeHtml(err.message)}</span>`;
        }
      });
    }
  }

  // --------------------------- Utility Functions -----------------------------

  function encodeURIComponentPath(p) {
    return p.split('/').map(encodeURIComponent).join('/');
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function formatBytes(n) {
    if (!n || n < 1024) return `${n || 0} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  }

  // --------------------------- Boot ------------------------------------------

  applyTheme();

  if (state.token && state.user) {
    enterApp().catch(() => {
      localStorage.removeItem('nimbus_token');
      localStorage.removeItem('nimbus_user');
      location.reload();
    });
  } else {
    $('#login-server').value = state.serverBase === window.location.origin ? '' : state.serverBase;
    checkAuthStatus();
    $('#login-server').addEventListener('change', () => {
      const serverInput = $('#login-server').value.trim();
      state.serverBase = normalizeServerUrl(serverInput);
      checkAuthStatus();
    });
  }
})();
