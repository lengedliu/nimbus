const express = require('express');
const users = require('../users');
const { signToken } = require('../auth');

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({ hasUsers: users.hasAnyUser() });
});

// Registration is open only for the very first user (bootstrap admin).
// After that, use `npm run create-user` on the server to add accounts.
router.post('/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  if (users.hasAnyUser()) {
    return res.status(403).json({ error: 'Registration closed. Ask the server admin to create your account.' });
  }
  const user = users.createUser(username, password);
  const token = signToken(user);
  res.json({ token, user });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const user = users.verifyPassword(username, password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = signToken(user);
  res.json({ token, user });
});

module.exports = router;
