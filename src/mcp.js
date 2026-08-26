const { z } = require('zod');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const storage = require('./storage');
const vaultsStore = require('./vaults');
const fnsHub = require('./wsHub');

/*
 * MCP tool set for Nimbus, modeled after the reference project's MCP design
 * (github.com/haierkeys/fast-note-sync-service): tools operate directly on
 * server-side storage (no self-HTTP round trip), and every write goes through
 * the same WebSocket hub used by real-time sync — so changes made by an AI
 * client show up on connected Obsidian clients immediately, and vice versa.
 */

function textResult(text) {
  return { content: [{ type: 'text', text }] };
}

/**
 * Build a fresh MCP server bound to one authenticated user (and optionally a
 * default vault resolved from the X-Default-Vault-Name header). A new
 * instance is created per request (stateless HTTP mode) so there's no risk
 * of one user's session leaking into another's.
 */
function buildMcpServer(user, defaultVaultId) {
  const server = new McpServer({ name: 'nimbus', version: '1.1.0' });

  function resolveVaultId(vaultId) {
    const id = vaultId || defaultVaultId;
    if (!id) {
      throw new Error(
        'No vault specified. Pass a vaultId, set the X-Default-Vault-Name header, or call list_vaults first.'
      );
    }
    if (!vaultsStore.userOwnsVault(user.id, id)) {
      throw new Error(`Vault "${id}" not found for this account.`);
    }
    return id;
  }

  server.tool(
    'list_vaults',
    'List the Obsidian vaults available to this account.',
    {},
    async () => textResult(JSON.stringify(vaultsStore.listForUser(user.id), null, 2))
  );

  server.tool(
    'list_notes',
    'List note/file paths in a vault, optionally filtered to a folder prefix.',
    {
      vaultId: z.string().optional().describe('Defaults to the X-Default-Vault-Name header vault if omitted.'),
      folder: z.string().optional().describe('Only return paths starting with this prefix.'),
    },
    async ({ vaultId, folder }) => {
      const id = resolveVaultId(vaultId);
      let paths = Object.keys(storage.getManifest(id)).sort();
      if (folder) paths = paths.filter((p) => p.startsWith(folder));
      return textResult(paths.length ? paths.join('\n') : '(no matching files)');
    }
  );

  server.tool(
    'read_note',
    'Read the full text content of a note by its vault-relative path.',
    {
      vaultId: z.string().optional(),
      path: z.string().describe('Vault-relative path, e.g. "Projects/idea.md"'),
    },
    async ({ vaultId, path }) => {
      const id = resolveVaultId(vaultId);
      const buf = storage.readFile(id, path);
      if (buf === null) throw new Error(`"${path}" not found.`);
      return textResult(buf.toString('utf8'));
    }
  );

  server.tool(
    'write_note',
    'Create a note or overwrite an existing one with new full content. ' +
      'Conflict-safe: if the note changed on the server since this call last ' +
      'read it, the new content is saved as a separate conflict copy instead ' +
      'of silently overwriting. Changes sync to connected Obsidian clients immediately.',
    {
      vaultId: z.string().optional(),
      path: z.string(),
      content: z.string(),
    },
    async ({ vaultId, path, content }) => {
      const id = resolveVaultId(vaultId);
      const manifest = storage.getManifest(id);
      const baseHash = manifest[path]?.hash;
      const buffer = Buffer.from(content, 'utf8');
      const result = storage.writeFile(id, path, buffer, { mtime: Date.now(), baseHash });

      if (!result.written && result.conflict) {
        fnsHub.broadcastFileChange(id, result.conflict, { currentHash: result.currentHash }, user.id, true);
        return textResult(
          `Conflict: "${path}" was changed on the server since last read. Your content was saved ` +
            `separately as "${result.conflict}" — read both versions and merge manually.`
        );
      }

      fnsHub.broadcastFileChange(id, path, result, user.id);
      return textResult(`Saved "${path}" (hash ${result.currentHash}). Synced to connected devices.`);
    }
  );

  server.tool(
    'delete_note',
    'Delete a note from the vault. Syncs to connected devices immediately.',
    {
      vaultId: z.string().optional(),
      path: z.string(),
    },
    async ({ vaultId, path }) => {
      const id = resolveVaultId(vaultId);
      const ok = storage.deleteFile(id, path);
      fnsHub.broadcastFileDelete(id, path, user.id);
      return textResult(ok ? `Deleted "${path}". Synced to connected devices.` : `"${path}" did not exist.`);
    }
  );

  server.tool(
    'search_notes',
    'Case-insensitive full-text search across markdown notes in a vault (scans file contents directly).',
    {
      vaultId: z.string().optional(),
      query: z.string(),
      limit: z.number().int().positive().max(100).optional().describe('Max matches (default 20).'),
    },
    async ({ vaultId, query, limit }) => {
      const id = resolveVaultId(vaultId);
      const max = limit || 20;
      const manifest = storage.getManifest(id);
      const mdPaths = Object.keys(manifest).filter((p) => p.toLowerCase().endsWith('.md'));
      const needle = query.toLowerCase();
      const matches = [];

      for (const path of mdPaths) {
        if (matches.length >= max) break;
        const buf = storage.readFile(id, path);
        if (buf === null) continue;
        const text = buf.toString('utf8');
        const idx = text.toLowerCase().indexOf(needle);
        if (idx !== -1) {
          const start = Math.max(0, idx - 60);
          const end = Math.min(text.length, idx + needle.length + 60);
          const snippet =
            (start > 0 ? '…' : '') + text.slice(start, end).replace(/\n/g, ' ') + (end < text.length ? '…' : '');
          matches.push(`${path}:\n  ${snippet}`);
        }
      }
      return textResult(matches.length ? matches.join('\n\n') : `No matches for "${query}".`);
    }
  );

  return server;
}

module.exports = { buildMcpServer };
