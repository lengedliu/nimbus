const express = require('express');
const users = require('../users');
const { signToken } = require('../auth');

const router = express.Router();

// Lightweight in-memory rate limiter for login brute-force protection
const loginAttempts = new Map(); // ip -> { count, firstAttempt }

function rateLimitLogin(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxAttempts = 15; // 15 attempts per minute per IP

  const record = loginAttempts.get(ip);
  if (!record || now - record.firstAttempt > windowMs) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return next();
  }

  if (record.count >= maxAttempts) {
    return res.status(429).json({ error: '登录尝试过于频繁，请稍后再试 (Rate Limited)' });
  }

  record.count++;
  next();
}

router.get('/status', (req, res) => {
  res.json({ hasUsers: users.hasAnyUser() });
});

// Registration is open only for the very first user (bootstrap admin).
// After that, use `npm run create-user` on the server to add accounts.
router.post('/register', rateLimitLogin, (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  if (users.hasAnyUser()) {
    return res.status(403).json({ error: 'Registration closed. Ask the server admin to create your account.' });
  }
  const user = users.createUser(username, password);
  const token = signToken(user);
  res.json({ token, user });
});

router.post('/login', rateLimitLogin, (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const user = users.verifyPassword(username, password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = signToken(user);
  res.json({ token, user });
});

module.exports = router;
