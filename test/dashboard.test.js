const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'nimbus-test-dashboard-'));

const vaults = require('../src/vaults');
const storage = require('../src/storage');

test('Kanban: 初始状态下 .nimbus-kanban.json 不存在，写入后可原样读出', async () => {
  const vault = vaults.create('user-test-1', 'Kanban Vault');
  const vaultId = vault.id;

  const rawBefore = storage.readFile(vaultId, '.nimbus-kanban.json');
  assert.equal(rawBefore, null);

  const sampleBoard = {
    updatedAt: new Date().toISOString(),
    columns: [
      { id: 'todo', title: '待办', color: '#58a6ff' },
      { id: 'done', title: '已完成', color: '#3fb950' },
    ],
    cards: [
      {
        id: 'card-1',
        columnId: 'todo',
        title: '编写系统架构文档',
        priority: 'high',
        tags: ['doc'],
      },
    ],
  };

  storage.writeFile(vaultId, '.nimbus-kanban.json', Buffer.from(JSON.stringify(sampleBoard), 'utf8'));

  const rawAfter = storage.readFile(vaultId, '.nimbus-kanban.json');
  assert.ok(rawAfter);
  const parsed = JSON.parse(rawAfter.toString('utf8'));
  assert.equal(parsed.cards.length, 1);
  assert.equal(parsed.cards[0].title, '编写系统架构文档');
  assert.equal(parsed.cards[0].priority, 'high');
});

test('Task Scan: 能准确扫描 Markdown 中的 - [ ] 与 - [x] 待办', async () => {
  const vault = vaults.create('user-test-2', 'Notes Vault');
  const vaultId = vault.id;

  const mdContent = `
# 待办清单测试

- [ ] 完成看板页面开发
- [x] 配置权限归一化校验
普通文本段落，不含待办
  - [ ] 缩进子任务：编写测试用例
  - [X] 大写勾选任务：已完成项
`;

  storage.writeFile(vaultId, 'Todos.md', Buffer.from(mdContent, 'utf8'));

  const manifest = storage.getManifest(vaultId);
  assert.ok(manifest['Todos.md']);

  const fileBuf = storage.readFile(vaultId, 'Todos.md');
  assert.ok(fileBuf);

  const taskRegex = /^[ \t]*- \[( |x|X)\][ \t]+(.*)$/gm;
  const tasks = [];
  let match;
  while ((match = taskRegex.exec(fileBuf.toString('utf8'))) !== null) {
    tasks.push({
      title: match[2].trim(),
      completed: match[1].toLowerCase() === 'x',
    });
  }

  assert.equal(tasks.length, 4);
  assert.equal(tasks[0].title, '完成看板页面开发');
  assert.equal(tasks[0].completed, false);
  assert.equal(tasks[1].title, '配置权限归一化校验');
  assert.equal(tasks[1].completed, true);
  assert.equal(tasks[2].title, '缩进子任务：编写测试用例');
  assert.equal(tasks[2].completed, false);
  assert.equal(tasks[3].title, '大写勾选任务：已完成项');
  assert.equal(tasks[3].completed, true);
});
