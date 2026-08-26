const express = require('express');
const { requireAuth, requireAdmin } = require('../auth');
const users = require('../users');
const vaultsStore = require('../vaults');

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get('/users', (req, res) => {
  res.json({ users: users.listAll() });
});

router.post('/users', (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  try {
    const user = users.createUser(username, password, role === 'admin' ? 'admin' : 'user');
    res.json({ user });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/users/:userId', (req, res) => {
  if (req.params.userId === req.user.id) {
    return res.status(400).json({ error: "You can't delete your own account here." });
  }
  users.remove(req.params.userId);
  res.json({ ok: true });
});

// All vaults across all users, with owner username attached — for the admin dashboard.
router.get('/vaults', (req, res) => {
  const allUsers = users.listAll();
  const byId = Object.fromEntries(allUsers.map((u) => [u.id, u.username]));
  const all = allUsers.flatMap((u) => vaultsStore.listForUser(u.id));
  const withOwner = all.map((v) => ({ ...v, ownerUsername: byId[v.ownerId] || '(unknown)' }));
  res.json({ vaults: withOwner });
});

module.exports = router;
