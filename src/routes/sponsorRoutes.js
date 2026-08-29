const express = require('express');
const sponsorsStore = require('../sponsors');
const { requireAuth, requireAdmin } = require('../auth');

const router = express.Router();

// Public / Authenticated read endpoint
router.get('/', (req, res) => {
  res.json(sponsorsStore.getAll());
});

// Admin update payment & description config
router.post('/config', requireAuth, requireAdmin, (req, res) => {
  const updated = sponsorsStore.updateConfig(req.body || {});
  res.json({ ok: true, config: updated });
});

// Admin add a sponsor record
router.post('/record', requireAuth, requireAdmin, (req, res) => {
  const { name, amount, message, date, color, platform } = req.body || {};
  if (!name) {
    return res.status(400).json({ error: '支持者昵称不能为空' });
  }
  const created = sponsorsStore.addSponsor({ name, amount, message, date, color, platform });
  res.json({ ok: true, sponsor: created });
});

// Admin delete a sponsor record
router.delete('/record/:id', requireAuth, requireAdmin, (req, res) => {
  const deleted = sponsorsStore.deleteSponsor(req.params.id);
  if (deleted) {
    res.json({ ok: true });
  } else {
    res.status(404).json({ error: '未找到该赞助记录' });
  }
});

module.exports = router;
