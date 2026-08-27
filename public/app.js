(function () {
  'use strict';

  const state = {
    serverBase: localStorage.getItem('nimbus_server') || window.location.origin,
    token: localStorage.getItem('nimbus_token') || '',
    user: JSON.parse(localStorage.getItem('nimbus_user') || 'null'),
    vaults: [],
    activeVaultId: null,
    activeSubtab: 'files', // 'files' | 'stats' | 'shares' | 'rules' | 'trash'
    manifest: {},
    activeTab: null, // 'vault' | 'users' | 'all-vaults'
    fileFilter: 'all', // 'all' | 'md' | 'media' | 'config'
    searchQuery: '',
  };

  const $ = (sel) => document.querySelector(sel);
  const loginView = $('#login-view');
  const appView = $('#app-view');
  const mainPanel = $('#main-panel');
  const modalBackdrop = $('#modal-backdrop');
  const modalContainer = $('#modal-container');

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
    } catch {}
  }

  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const serverInput = $('#login-server').value.trim();
    if (serverInput) state.serverBase = serverInput;
    const username = $('#login-username').value.trim();
    const password = $('#login-password').value;
    $('#login-error').textContent = '';
    const endpoint = isBootstrap ? '/api/auth/register' : '/api/auth/login';
    try {
      const res = await fetch(state.serverBase.replace(/\/$/, '') + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || (isBootstrap ? '注册失败' : '登录失败'));
      state.token = body.token;
      state.user = body.user;
      localStorage.setItem('nimbus_server', state.serverBase);
      localStorage.setItem('nimbus_token', state.token);
      localStorage.setItem('nimbus_user', JSON.stringify(state.user));
      enterApp();
    } catch (err) {
      $('#login-error').textContent = err.message;
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
    for (const v of state.vaults) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'vault-item' + (state.activeVaultId === v.id ? ' active' : '');
      btn.innerHTML = `<span>📓 ${escapeHtml(v.name)}</span>`;
      btn.addEventListener('click', () => openVault(v.id));

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
    if (tab === 'synclogs') renderAdminSyncLogsPanel();
    if (tab === 'users') renderUsersPanel();
    if (tab === 'all-vaults') renderAllVaultsPanel();
  }

  // ------------------------- Obsidian Connect Modal ---------------------------

  function showObsidianConnectModal(vault) {
    const serverUrl = state.serverBase.replace(/\/$/, '');
    const wsUrl = serverUrl.replace(/^http/, 'ws') + '/ws';
    const vaultId = vault ? vault.id : (state.vaults[0]?.id || 'YOUR_VAULT_ID');
    const vaultName = vault ? vault.name : 'Vault';

    const pluginConfig = {
      serverUrl,
      wsUrl,
      vaultId,
      vaultName,
      authToken: state.token,
    };

    const html = `
      <div class="modal-header">
        <h3>⚡ 连接 Obsidian Nimbus 同步插件</h3>
        <button class="modal-close ghost">✕</button>
      </div>
      <div class="modal-body">
        <p style="color:var(--text-secondary);margin-bottom:12px">
          在 Obsidian 中安装 <code>nimbus</code> (或兼容的 <code>fast-note-sync</code>) 插件后，填写以下服务配置即可开启多端毫秒级实时同步：
        </p>

        <div style="display:grid;grid-template-columns:100px 1fr;gap:8px 12px;font-size:13px;align-items:center;margin-bottom:16px;">
          <span style="color:var(--muted)">服务器地址:</span>
          <code>${escapeHtml(serverUrl)}</code>
          <span style="color:var(--muted)">WebSocket:</span>
          <code>${escapeHtml(wsUrl)}</code>
          <span style="color:var(--muted)">当前 Vault:</span>
          <b>${escapeHtml(vaultName)} (${vaultId})</b>
          <span style="color:var(--muted)">认证 Token:</span>
          <code style="word-break:break-all;font-size:11px">${state.token.slice(0, 24)}…</code>
        </div>

        <div class="nav-section-title">一键配置 JSON (可直接导入或参考)</div>
        <pre class="code-snippet">${escapeHtml(JSON.stringify(pluginConfig, null, 2))}</pre>

        <p style="color:var(--muted);font-size:12px;margin-top:8px">
          💡 提示：该配置支持全平台（Windows, macOS, Linux, iOS, Android）Obsidian 客户端。
        </p>
      </div>
      <div class="modal-footer">
        <button id="copy-connect-btn" class="btn-primary">📋 复制完整连接参数</button>
        <button class="modal-close secondary">关闭</button>
      </div>
    `;

    showModal(html, (dialog) => {
      dialog.querySelector('#copy-connect-btn').onclick = () => {
        const text = JSON.stringify(pluginConfig, null, 2);
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text).then(() => toast('连接参数已复制'));
        } else {
          prompt('复制以下配置：', text);
        }
      };
    });
  }

  function showMcpModal(vaultName) {
    const config = {
      mcpServers: {
        nimbus: {
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

    const text = JSON.stringify(config, null, 2);
    const html = `
      <div class="modal-header">
        <h3>🤖 Model Context Protocol (MCP) AI 配置</h3>
        <button class="modal-close ghost">✕</button>
      </div>
      <div class="modal-body">
        <p style="color:var(--text-secondary);margin-bottom:12px">
          将此配置粘贴到 Cursor、Claude Desktop 或 Cherry Studio 的 <code>mcp.json</code> 中，AI 即可直接检索、阅读与编写您的 Obsidian 笔记：
        </p>
        <pre class="code-snippet">${escapeHtml(text)}</pre>
      </div>
      <div class="modal-footer">
        <button id="copy-mcp-btn" class="btn-primary">📋 复制 MCP 配置</button>
        <button class="modal-close secondary">关闭</button>
      </div>
    `;

    showModal(html, (dialog) => {
      dialog.querySelector('#copy-mcp-btn').onclick = () => {
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text).then(() => toast('MCP 配置已复制'));
        } else {
          prompt('复制 MCP 配置：', text);
        }
      };
    });
  }

  // --------------------------- Vault Main Views -------------------------------

  async function openVault(vaultId, subtab = 'files') {
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

    // Header
    const header = document.createElement('div');
    header.className = 'vault-header';
    header.innerHTML = `
      <div class="vault-title">
        <h2>📓 ${escapeHtml(vault.name)}</h2>
        <span class="badge" style="font-size:11px">${Object.keys(state.manifest).length} 个文件</span>
      </div>
      <div class="vault-actions">
        <button class="btn-primary" id="v-new-note-btn">+ 新建笔记</button>
        <button class="secondary" id="v-upload-btn">⬆️ 上传文件</button>
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
      <button class="subtab-btn ${state.activeSubtab === 'stats' ? 'active' : ''}" data-sub="stats">📊 统计与监控</button>
      <button class="subtab-btn ${state.activeSubtab === 'synclogs' ? 'active' : ''}" data-sub="synclogs">📋 同步日志</button>
      <button class="subtab-btn ${state.activeSubtab === 'shares' ? 'active' : ''}" data-sub="shares">🔗 公开分享</button>
      <button class="subtab-btn ${state.activeSubtab === 'rules' ? 'active' : ''}" data-sub="rules">⚙️ 同步规则</button>
      <button class="subtab-btn ${state.activeSubtab === 'trash' ? 'active' : ''}" data-sub="trash">🗑️ 回收站</button>
    `;
    mainPanel.appendChild(subtabsBar);

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
    $('#v-new-note-btn').onclick = () => createNewNotePrompt(vaultId);
    $('#v-export-btn').onclick = () => {
      window.open(`${state.serverBase.replace(/\/$/, '')}/api/vaults/${vaultId}/export?token=${state.token}`, '_blank');
    };
    $('#v-connect-btn').onclick = () => showObsidianConnectModal(vault);
    $('#v-upload-btn').onclick = () => triggerFileUpload(vaultId);

    // Render active subtab
    if (state.activeSubtab === 'files') renderFilesSubtab(vaultId, contentBox);
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
      <div class="filter-pills">
        <span class="filter-pill ${state.fileFilter === 'all' ? 'active' : ''}" data-filter="all">全部 (${paths.length})</span>
        <span class="filter-pill ${state.fileFilter === 'md' ? 'active' : ''}" data-filter="md">Markdown</span>
        <span class="filter-pill ${state.fileFilter === 'media' ? 'active' : ''}" data-filter="media">媒体/附件</span>
        <span class="filter-pill ${state.fileFilter === 'config' ? 'active' : ''}" data-filter="config">配置 (.obsidian)</span>
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

  async function renderFileList(vaultId, container) {
    const listWrapper = container.id === 'files-list-wrapper' ? container : container.querySelector('#files-list-wrapper');
    if (!listWrapper) return;
    listWrapper.innerHTML = '';

    let paths = Object.keys(state.manifest).sort();

    // Filter by type
    if (state.fileFilter === 'md') {
      paths = paths.filter((p) => p.toLowerCase().endsWith('.md'));
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

    const table = document.createElement('table');
    table.className = 'file-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>文件路径</th>
          <th style="width:120px">大小</th>
          <th style="width:180px">修改时间</th>
          <th style="width:200px;text-align:right">操作</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    for (const p of paths) {
      const meta = state.manifest[p];
      const isMd = p.toLowerCase().endsWith('.md');
      const isImg = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(p);
      const icon = isMd ? '📄' : isImg ? '🖼️' : p.startsWith('.obsidian/') ? '⚙️' : '📎';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><div class="file-name"><span>${icon}</span> <span>${escapeHtml(p)}</span></div></td>
        <td class="meta">${formatBytes(meta.size)}</td>
        <td class="meta">${new Date(meta.mtime).toLocaleString()}</td>
        <td class="actions"></td>
      `;

      tr.onclick = (e) => {
        if (e.target.closest('button')) return;
        openFile(vaultId, p);
      };

      const actionsCell = tr.querySelector('.actions');

      if (isMd) {
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
    const { stats, activity } = await res.json();

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
          <div class="stat-label">在线同步客户端</div>
          <div class="stat-value" style="color:var(--success)">${stats.activeClients} <span style="font-size:14px">台</span></div>
          <div class="stat-desc">实时 WebSocket 同步中</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">版本与回收站</div>
          <div class="stat-value">${stats.historyCount} <span style="font-size:14px">版本</span></div>
          <div class="stat-desc">回收站 ${stats.trashCount} 个待清理</div>
        </div>
      </div>

      <div class="panel-header" style="margin-top:24px">
        <h3 style="margin:0;font-size:16px;">⚡ 实时同步活动流</h3>
        <button class="secondary" id="refresh-stats-btn">🔄 刷新</button>
      </div>

      <ul class="activity-list" id="stats-activity-list"></ul>
    `;

    container.querySelector('#refresh-stats-btn').onclick = () => renderStatsSubtab(vaultId, container);

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

  // --------------------------- Subtab: Sync Logs (Vault Level) --------------

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
    const fileUrl = `${state.serverBase.replace(/\/$/, '')}/api/vaults/${vaultId}/files/${encodeURIComponentPath(path)}`;

    if (isImage) {
      renderMediaViewer(vaultId, path, fileUrl);
      return;
    }

    const res = await api(`/api/vaults/${vaultId}/files/${encodeURIComponentPath(path)}`);
    const text = await res.text();
    const baseHash = state.manifest[path]?.hash;

    mainPanel.innerHTML = '';
    const layout = document.createElement('div');
    layout.className = 'editor-layout';

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
    previewPane.innerHTML = marked ? marked.parse(text) : `<pre>${escapeHtml(text)}</pre>`;

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
      if (showPreview && marked) {
        previewPane.innerHTML = marked.parse(textarea.value);
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
    const res = await api('/api/admin/users');
    const body = await res.json();

    mainPanel.innerHTML = `
      <div class="panel-header">
        <h2>👥 用户管理</h2>
      </div>
      <div style="background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-bottom:24px;">
        <h4 style="margin:0 0 16px;font-size:14px;font-weight:600;">➕ 添加新用户</h4>
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

        <div class="form-checkbox-group">
          <label class="form-checkbox-label">
            <input id="nu-admin" type="checkbox" />
            <span>管理员权限（允许管理数据库、其他用户及全局设置）</span>
          </label>
        </div>

        <div>
          <button id="nu-submit" class="btn-primary">＋ 创建用户</button>
        </div>
      </div>
      <div id="users-table-wrap"></div>
    `;

    $('#nu-submit').onclick = async () => {
      const username = $('#nu-username').value.trim();
      const password = $('#nu-password').value;
      const role = $('#nu-admin').checked ? 'admin' : 'user';
      if (!username || !password) return;
      try {
        await api('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, role }),
        });
        toast('用户创建成功');
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
          <th>创建时间</th>
          <th style="text-align:right">操作</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    for (const u of body.users) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><b>${escapeHtml(u.username)}</b></td>
        <td><span class="badge">${u.role}</span></td>
        <td class="meta">${new Date(u.createdAt).toLocaleString()}</td>
        <td class="actions"></td>
      `;

      if (u.id !== state.user.id) {
        const del = document.createElement('button');
        del.textContent = '删除';
        del.className = 'danger';
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

  async function renderAllVaultsPanel() {
    mainPanel.innerHTML = '<div class="empty-state">加载 Vault 列表中…</div>';
    const res = await api('/api/admin/vaults');
    const body = await res.json();

    mainPanel.innerHTML = `
      <div class="panel-header">
        <h2>📚 全局 Vault 状态</h2>
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
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    for (const v of body.vaults) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><b>📓 ${escapeHtml(v.name)}</b></td>
        <td>${escapeHtml(v.ownerUsername)}</td>
        <td class="meta"><code>${v.id}</code></td>
        <td class="meta">${new Date(v.createdAt).toLocaleString()}</td>
      `;
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
      serverName: 'Nimbus',
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
              <span>设置 (Nimbus)</span>
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
        `<option value="${state.token}">当前登录主令牌 (${state.user?.username})</option>`,
        ...tokensList.map((t) => `<option value="${t.id}">[专属设备] ${escapeHtml(t.label)} (${t.maskedToken})</option>`),
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
        const rawToken = $('#plugin-token-select').value;
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
      const tokenRows = tokensList.length === 0
        ? `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px;">暂无专属设备令牌，您可点击下方创建</td></tr>`
        : tokensList.map((t) => `
            <tr>
              <td><b>${escapeHtml(t.label || '设备')}</b></td>
              <td><code>${escapeHtml(t.maskedToken)}</code></td>
              <td style="color:var(--muted);font-size:12px;">${new Date(t.createdAt).toLocaleString()}</td>
              <td style="color:var(--muted);font-size:12px;">${t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleString() : '从未使用'}</td>
              <td>
                <button class="btn-sm ghost token-del-btn" data-tokenid="${t.id}" title="注销设备令牌" style="color:var(--danger)">注销</button>
              </td>
            </tr>
          `).join('');

      container.innerHTML = `
        <div class="settings-card">
          <div class="settings-card-header">
            <h3><span>🔑</span> 多端专属设备令牌 (Device Access Tokens)</h3>
            <p>为每台设备（如 MacBook、iPhone、Windows 办公电脑）签发独立 Token，各端独立鉴权，便于安全管理</p>
          </div>

          <div class="token-table-wrap" style="margin-bottom:20px;">
            <table class="token-table">
              <thead>
                <tr>
                  <th>设备名称 / 备注</th>
                  <th>令牌预览</th>
                  <th>创建时间</th>
                  <th>最近活跃</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                ${tokenRows}
              </tbody>
            </table>
          </div>

          <div class="settings-card-header" style="margin-top:24px;">
            <h3><span>➕</span> 新建专属设备 Token</h3>
            <p>创建后请妥善复制保存，可直接在 Obsidian 客户端粘贴作为同步鉴权密钥</p>
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

          <div id="new-token-display-box" style="margin-top:16px;"></div>
        </div>
      `;

      // Bind delete token buttons
      container.querySelectorAll('.token-del-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const tid = btn.dataset.tokenid;
          if (!confirm('确定要注销并废除该设备令牌吗？该设备将无法继续同步。')) return;
          try {
            const res = await api(`/api/settings/tokens/${tid}`, { method: 'DELETE' });
            const body = await res.json();
            if (body.ok) {
              toast('设备令牌已注销');
              renderSettingsPanel('tokens');
            }
          } catch (e) {
            toast(`注销失败: ${e.message}`);
          }
        });
      });

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
            const display = $('#new-token-display-box');
            display.innerHTML = `
              <div style="background:var(--panel-2);border:1px solid #2ecc71;border-radius:var(--radius);padding:16px;">
                <div style="color:#2ecc71;font-weight:600;font-size:14px;margin-bottom:6px;">✓ 设备令牌「${escapeHtml(body.token.label)}」创建成功！</div>
                <div style="font-size:12.5px;color:var(--text-secondary);margin-bottom:8px;">请立即复制下方 Token，填入 Obsidian 插件配置：</div>
                <div style="display:flex;gap:8px;align-items:center;">
                  <input type="text" readonly value="${escapeHtml(body.token.token)}" id="created-token-value" style="font-family:ui-monospace,monospace;font-size:12px;" />
                  <button id="copy-created-token-btn" class="btn-primary" style="flex-shrink:0;">📋 复制 Token</button>
                </div>
              </div>
            `;
            $('#copy-created-token-btn')?.addEventListener('click', () => {
              navigator.clipboard.writeText(body.token.token).then(() => {
                toast('Token 已复制到剪贴板！');
              });
            });
            // Reload token list
            setTimeout(() => renderSettingsPanel('tokens'), 4000);
          } else {
            toast(`创建失败: ${body.error || '未知错误'}`);
          }
        } catch (e) {
          toast(`创建失败: ${e.message}`);
        }
      });
    } else if (subTab === 'account') {
      // 5. Account and password management tab
      container.innerHTML = `
        <div class="settings-card">
          <div class="settings-card-header">
            <h3><span>👤</span> 个人账户与安全设置</h3>
            <p>查看登录身份信息并修改密码</p>
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
      state.serverBase = serverInput || window.location.origin;
      checkAuthStatus();
    });
  }
})();
