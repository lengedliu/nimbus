const express = require('express');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { requireAuth } = require('../auth');
const vaultsStore = require('../vaults');
const { buildMcpServer } = require('../mcp');

const router = express.Router();
router.use(requireAuth);

/** Resolve X-Default-Vault-Name (a vault *name*, matching the reference FNS
 * project's header) to a vault id owned by the requesting user. */
function resolveDefaultVaultId(req) {
  const name = req.headers['x-default-vault-name'];
  if (!name) return undefined;
  const vault = vaultsStore.listForUser(req.user.id).find((v) => v.name === name);
  return vault?.id;
}

// StreamableHTTP — the modern, recommended MCP transport (single endpoint,
// works over plain HTTP POST). Run in *stateless* mode: a fresh McpServer +
// transport per request, so there's no server-side session to manage or
// leak between users. This is fully spec-compliant and is what most current
// MCP clients (Claude Code, Cursor, Cherry Studio's HTTP mode, etc.) expect.
router.post('/', async (req, res) => {
  try {
    const defaultVaultId = resolveDefaultVaultId(req);
    const server = buildMcpServer(req.user, defaultVaultId);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (e) {
    if (!res.headersSent) {
      res.status(500).json({ error: e.message });
    }
  }
});

// No persistent session in stateless mode, so there's nothing to stream on
// GET or terminate on DELETE — reply politely instead of a bare 404.
router.get('/', (req, res) => {
  res
    .status(405)
    .json({ error: 'This MCP endpoint runs in stateless mode: send tool calls via POST only.' });
});
router.delete('/', (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
