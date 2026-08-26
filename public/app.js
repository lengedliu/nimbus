(function () {
  'use strict';

  const state = {
    serverBase: localStorage.getItem('nimbus_server') || window.location.origin,
    token: localStorage.getItem('nimbus_token') || '',
    user: JSON.parse(localStorage.getItem('nimbus_user') || 'null'),
    vaults: [],
    activeVaultId: null,
    manifest: {},
    activeTab: null, // 'vault' | 'users' | 'all-vaults'
  };

  const $ = (sel) => document.querySelector(sel);
  const loginView = $('#login-view');
  const appView = $('#app-view');
  const mainPanel = $('#main-panel');

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
    setTimeout(() => el.remove(), 2500);
  }

  // ----------------------------- auth ----------------------------------------

  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const serverInput = $('#login-server').value.trim();
    if (serverInput) state.serverBase = serverInput;
    const username = $('#login-username').value.trim();
    const password = $('#login-password').value;
    $('#login-error').textContent = '';
    try {
      const res = await fetch(state.serverBase.replace(/\/$/, '') + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || '登录失败');
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
    await loadVaults();
  }

  function copyMcpConfig(vaultName) {
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
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => toast('MCP 配置已复制到剪贴板'));
    } else {
      prompt('复制下面的 MCP 配置：', text);
    }
  }

  // --------------------------- vault list ------------------------------------

  async function loadVaults() {
    const res = await api('/api/vaults');
    const body = await res.json();
    state.vaults = body.vaults;
    renderVaultList();
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

      const mcpBtn = document.createElement('button');
      mcpBtn.className = 'del';
      mcpBtn.textContent = '⧉';
      mcpBtn.title = '复制 MCP 配置';
      mcpBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        copyMcpConfig(v.name);
      });
      btn.appendChild(mcpBtn);

      const del = document.createElement('button');
      del.className = 'del';
      del.textContent = '✕';
      del.title = '删除 vault';
      del.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm(`确定删除 vault "${v.name}"？服务器上的笔记数据不会自动清除，只是取消注册。`)) return;
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
    const name = prompt('新 vault 名称：');
    if (!name) return;
    await api('/api/vaults', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    await loadVaults();
  });

  function showTab(tab) {
    state.activeVaultId = null;
    state.activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    renderVaultList();
    if (tab === 'users') renderUsersPanel();
    if (tab === 'all-vaults') renderAllVaultsPanel();
  }

  // ------------------------------ history & trash -------------------------------

  async function renderHistory(vaultId, filePath) {
    mainPanel.innerHTML = '<div class="empty-state">加载中…</div>';
    const res = await api(`/api/vaults/${vaultId}/history?path=${encodeURIComponent(filePath)}`);
    const body = await res.json();

    mainPanel.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'panel-header';
    header.innerHTML = `<h2>历史版本 · ${escapeHtml(filePath)}</h2>`;
    const backBtn = document.createElement('button');
    backBtn.className = 'secondary';
    backBtn.textContent = '← 返回列表';
    backBtn.addEventListener('click', () => openVault(vaultId));
    header.appendChild(backBtn);
    mainPanel.appendChild(header);

    if (body.history.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = '这篇笔记还没有历史版本（只有被覆盖过的文件才会留痕迹）';
      mainPanel.appendChild(empty);
      return;
    }

    const table = document.createElement('table');
    table.className = 'data-table';
    table.innerHTML = '<thead><tr><th>保存时间</th><th>大小</th><th></th></tr></thead>';
    const tbody = document.createElement('tbody');
    for (const v of body.history) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${new Date(v.savedAt).toLocaleString()}</td><td class="meta">${formatBytes(v.size)}</td><td class="actions"></td>`;
      const viewBtn = document.createElement('button');
      viewBtn.className = 'secondary';
      viewBtn.textContent = '查看';
      viewBtn.addEventListener('click', async () => {
        const r = await api(`/api/vaults/${vaultId}/history/${v.id}`);
        const text = await r.text();
        alert(text.slice(0, 4000) + (text.length > 4000 ? '\n\n…(内容较长，已截断预览)' : ''));
      });
      const restoreBtn = document.createElement('button');
      restoreBtn.textContent = '恢复此版本';
      restoreBtn.addEventListener('click', async () => {
        if (!confirm(`把 "${filePath}" 恢复到 ${new Date(v.savedAt).toLocaleString()} 这个版本？当前内容会先自动存一份历史记录，不会丢。`)) return;
        await api(`/api/vaults/${vaultId}/history/${v.id}/restore`, { method: 'POST' });
        toast('已恢复');
        openVault(vaultId);
      });
      tr.querySelector('.actions').appendChild(viewBtn);
      tr.querySelector('.actions').appendChild(restoreBtn);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    mainPanel.appendChild(table);
  }

  async function renderTrash(vaultId) {
    mainPanel.innerHTML = '<div class="empty-state">加载中…</div>';
    const res = await api(`/api/vaults/${vaultId}/trash`);
    const body = await res.json();

    mainPanel.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'panel-header';
    header.innerHTML = '<h2>🗑 回收站</h2>';
    const backBtn = document.createElement('button');
    backBtn.className = 'secondary';
    backBtn.textContent = '← 返回列表';
    backBtn.addEventListener('click', () => openVault(vaultId));
    header.appendChild(backBtn);
    mainPanel.appendChild(header);

    if (body.trash.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = '回收站是空的';
      mainPanel.appendChild(empty);
      return;
    }

    const table = document.createElement('table');
    table.className = 'data-table';
    table.innerHTML = '<thead><tr><th>路径</th><th>删除时间</th><th>大小</th><th></th></tr></thead>';
    const tbody = document.createElement('tbody');
    for (const t of body.trash) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escapeHtml(t.path)}</td><td class="meta">${new Date(t.deletedAt).toLocaleString()}</td><td class="meta">${formatBytes(t.size)}</td><td class="actions"></td>`;
      const restoreBtn = document.createElement('button');
      restoreBtn.textContent = '恢复';
      restoreBtn.addEventListener('click', async () => {
        await api(`/api/vaults/${vaultId}/trash/${t.id}/restore`, { method: 'POST' });
        toast('已恢复');
        renderTrash(vaultId);
      });
      const purgeBtn = document.createElement('button');
      purgeBtn.textContent = '彻底删除';
      purgeBtn.className = 'danger';
      purgeBtn.addEventListener('click', async () => {
        if (!confirm(`彻底删除 "${t.path}"？这个操作无法撤销。`)) return;
        await api(`/api/vaults/${vaultId}/trash/${t.id}`, { method: 'DELETE' });
        renderTrash(vaultId);
      });
      tr.querySelector('.actions').appendChild(restoreBtn);
      tr.querySelector('.actions').appendChild(purgeBtn);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    mainPanel.appendChild(table);
  }

  // ---------------------------- vault browser ----------------------------------

  async function openVault(vaultId) {
    state.activeVaultId = vaultId;
    state.activeTab = null;
    renderVaultList();
    const res = await api(`/api/vaults/${vaultId}/manifest`);
    const body = await res.json();
    state.manifest = body.manifest;
    renderFileTable(vaultId);
  }

  function renderFileTable(vaultId) {
    const vault = state.vaults.find((v) => v.id === vaultId);
    const paths = Object.keys(state.manifest).sort();
    mainPanel.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'panel-header';
    header.innerHTML = `<h2>📓 ${escapeHtml(vault ? vault.name : vaultId)}</h2>`;
    const btnGroup = document.createElement('div');
    btnGroup.style.display = 'flex';
    btnGroup.style.gap = '8px';
    const trashBtn = document.createElement('button');
    trashBtn.className = 'secondary';
    trashBtn.textContent = '🗑 回收站';
    trashBtn.addEventListener('click', () => renderTrash(vaultId));
    const newBtn = document.createElement('button');
    newBtn.className = 'secondary';
    newBtn.textContent = '+ 新建文件';
    newBtn.addEventListener('click', async () => {
      const path = prompt('新文件路径（例如 notes/hello.md）：');
      if (!path) return;
      await saveFile(vaultId, path, '', undefined);
      openVault(vaultId);
    });
    btnGroup.appendChild(trashBtn);
    btnGroup.appendChild(newBtn);
    header.appendChild(btnGroup);
    mainPanel.appendChild(header);

    if (paths.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = '这个 vault 还没有任何文件';
      mainPanel.appendChild(empty);
      return;
    }

    const table = document.createElement('table');
    table.className = 'file-table';
    table.innerHTML = `<thead><tr><th>路径</th><th>大小</th><th>修改时间</th><th></th></tr></thead>`;
    const tbody = document.createElement('tbody');
    for (const p of paths) {
      const meta = state.manifest[p];
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(p)}</td>
        <td class="meta">${formatBytes(meta.size)}</td>
        <td class="meta">${new Date(meta.mtime).toLocaleString()}</td>
        <td class="actions"></td>
      `;
      tr.addEventListener('click', () => openFile(vaultId, p));
      const histBtn = document.createElement('button');
      histBtn.textContent = '历史';
      histBtn.className = 'secondary';
      histBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        renderHistory(vaultId, p);
      });
      tr.querySelector('.actions').appendChild(histBtn);
      const del = document.createElement('button');
      del.textContent = '删除';
      del.className = 'danger';
      del.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm(`删除 "${p}"？`)) return;
        await api(`/api/vaults/${vaultId}/files/${encodeURIComponentPath(p)}`, { method: 'DELETE' });
        openVault(vaultId);
      });
      tr.querySelector('.actions').appendChild(del);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    mainPanel.appendChild(table);
  }

  async function openFile(vaultId, path) {
    const res = await api(`/api/vaults/${vaultId}/files/${encodeURIComponentPath(path)}`);
    const text = await res.text();
    const baseHash = state.manifest[path]?.hash;

    mainPanel.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'editor-wrap';

    const toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    toolbar.innerHTML = `<span class="path">${escapeHtml(path)}</span>`;
    const backBtn = document.createElement('button');
    backBtn.className = 'secondary';
    backBtn.textContent = '← 返回列表';
    backBtn.addEventListener('click', () => openVault(vaultId));
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '保存';

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.spellcheck = false;

    saveBtn.addEventListener('click', async () => {
      try {
        await saveFile(vaultId, path, textarea.value, baseHash);
        toast('已保存');
        openVault(vaultId);
      } catch (e) {
        toast('保存失败: ' + e.message);
      }
    });

    toolbar.appendChild(backBtn);
    toolbar.appendChild(saveBtn);
    wrap.appendChild(toolbar);
    wrap.appendChild(textarea);
    mainPanel.appendChild(wrap);
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

  // ------------------------------ admin: users --------------------------------

  async function renderUsersPanel() {
    mainPanel.innerHTML = '<div class="empty-state">加载中…</div>';
    const res = await api('/api/admin/users');
    const body = await res.json();

    mainPanel.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'panel-header';
    header.innerHTML = '<h2>用户管理</h2>';
    mainPanel.appendChild(header);

    const form = document.createElement('div');
    form.className = 'form-inline';
    form.innerHTML = `
      <input id="nu-username" placeholder="用户名" />
      <input id="nu-password" type="password" placeholder="密码" />
      <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--muted)">
        <input id="nu-admin" type="checkbox" style="width:auto" /> 管理员
      </label>
      <button id="nu-submit">添加用户</button>
    `;
    mainPanel.appendChild(form);
    $('#nu-submit').addEventListener('click', async () => {
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
        toast('已创建用户');
        renderUsersPanel();
      } catch (e) {
        toast('创建失败: ' + e.message);
      }
    });

    const table = document.createElement('table');
    table.className = 'data-table';
    table.innerHTML = '<thead><tr><th>用户名</th><th>角色</th><th>创建时间</th><th></th></tr></thead>';
    const tbody = document.createElement('tbody');
    for (const u of body.users) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(u.username)}</td>
        <td>${u.role}</td>
        <td class="meta">${new Date(u.createdAt).toLocaleString()}</td>
        <td class="actions"></td>
      `;
      if (u.id !== state.user.id) {
        const del = document.createElement('button');
        del.textContent = '删除';
        del.className = 'danger';
        del.addEventListener('click', async () => {
          if (!confirm(`删除用户 "${u.username}"？`)) return;
          await api(`/api/admin/users/${u.id}`, { method: 'DELETE' });
          renderUsersPanel();
        });
        tr.querySelector('.actions').appendChild(del);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    mainPanel.appendChild(table);
  }

  // ---------------------------- admin: all vaults -------------------------------

  async function renderAllVaultsPanel() {
    mainPanel.innerHTML = '<div class="empty-state">加载中…</div>';
    const res = await api('/api/admin/vaults');
    const body = await res.json();

    mainPanel.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'panel-header';
    header.innerHTML = '<h2>全部 Vault</h2>';
    mainPanel.appendChild(header);

    const table = document.createElement('table');
    table.className = 'data-table';
    table.innerHTML = '<thead><tr><th>名称</th><th>所有者</th><th>Vault ID</th><th>创建时间</th></tr></thead>';
    const tbody = document.createElement('tbody');
    for (const v of body.vaults) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(v.name)}</td>
        <td>${escapeHtml(v.ownerUsername)}</td>
        <td class="meta">${v.id}</td>
        <td class="meta">${new Date(v.createdAt).toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    mainPanel.appendChild(table);
  }

  // -------------------------------- utils ----------------------------------------

  function encodeURIComponentPath(p) {
    return p.split('/').map(encodeURIComponent).join('/');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function formatBytes(n) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  }

  // --------------------------------- boot ------------------------------------------

  if (state.token && state.user) {
    enterApp().catch(() => {
      localStorage.removeItem('nimbus_token');
      localStorage.removeItem('nimbus_user');
      location.reload();
    });
  } else {
    $('#login-server').value = state.serverBase === window.location.origin ? '' : state.serverBase;
  }
})();
