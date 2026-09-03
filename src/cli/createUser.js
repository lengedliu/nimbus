#!/usr/bin/env node
const readline = require('readline');
const dbManager = require('../db');
const users = require('../users');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

(async () => {
  try {
    await dbManager.init();
    await users.loadFromDb();
  } catch {}

  const username = (await ask('Username: ')).trim();
  const password = (await ask('Password: ')).trim();
  const roleInput = (await ask('Role (user/admin) [user]: ')).trim().toLowerCase();
  rl.close();

  if (!username || !password) {
    console.error('Username and password are required.');
    process.exit(1);
  }

  try {
    const user = await users.createUser(username, password, roleInput === 'admin' ? 'admin' : undefined);
    console.log(`Created user "${user.username}" (id: ${user.id}, role: ${user.role})`);
    setTimeout(() => process.exit(0), 500);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
