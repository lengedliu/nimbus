const express = require('express');
const users = require('../users');
const { signToken } = require('../auth');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

// 和 settingsRoutes.js 的改密码接口保持一致的最低密码强度要求。
const MIN_PASSWORD_LENGTH = 6;

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
router.post('/register', rateLimitLogin, asyncHandler(async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `密码长度至少需要 ${MIN_PASSWORD_LENGTH} 位` });
  }
  if (users.hasAnyUser()) {
    return res.status(403).json({ error: 'Registration closed. Ask the server admin to create your account.' });
  }
  try {
    const user = await users.createUser(username, password);
    const token = signToken(user);
    res.json({ token, user });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}));

router.post('/login', rateLimitLogin, asyncHandler(async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const user = await users.verifyPassword(username, password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = signToken(user);
  res.json({ token, user });
}));

module.exports = router;
