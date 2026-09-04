const { z } = require('zod');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const storage = require('./storage');
const vaultsStore = require('./vaults');
const sharesStore = require('./shares');
const fnsHub = require('./wsHub');
const gitSync = require('./gitSync');
const webhooks = require('./webhooks');

/*
 * MCP tool set for Nimbus Vault Sync, modeled after and extending the reference
 * project's design (github.com/haierkeys/fast-note-sync-service):
 *
 * Tools operate directly on server-side storage (zero-overhead, high performance),
 * and all modifications (write, append, patch, rename, delete) go through the
 * WebSocket hub used by real-time sync. Changes made by AI agents (Cursor, Claude,
 * Cherry Studio, Cline, Roo Code, etc.) immediately reflect on connected Obsidian
 * apps and web clients without manual refreshes.
 */

function textResult(text) {
  return { content: [{ type: 'text', text }] };
}

function jsonResult(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

/** Helper: format local date as YYYY-MM-DD */
function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Helper: parse basic frontmatter, tags, links, headings from markdown text */
function analyzeMarkdown(text) {
  let frontmatter = null;
  let body = text;

  // YAML frontmatter
  const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (fmMatch) {
    frontmatter = fmMatch[1];
    body = text.slice(fmMatch[0].length);
  }

  // Tags (#tag or #parent/child)
  const tagMatches = Array.from(text.matchAll(/(?:^|\s)#([a-zA-Z0-9_\u4e00-\u9fa5\/-]+)/g)).map((m) => m[1]);
  const tags = Array.from(new Set(tagMatches));

  // Wiki links ([[target]] or [[target|alias]])
  const linkMatches = Array.from(text.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g)).map((m) => m[1].trim());
  const links = Array.from(new Set(linkMatches));

  // Headings (# Heading)
  const headingMatches = Array.from(text.matchAll(/^(#{1,6})\s+(.*)$/gm)).map((m) => ({
    level: m[1].length,
    text: m[2].trim(),
  }));

  const wordCount = (text.match(/[\u4e00-\u9fa5]|[a-zA-Z0-9_-]+/g) || []).length;
  const charCount = text.length;

  return {
    frontmatter,
    tags,
    links,
    headings: headingMatches,
    wordCount,
    charCount,
    estimatedReadingTimeMinutes: Math.ceil(wordCount / 300) || 1,
  };
}

/**
 * Build a fresh MCP server bound to one authenticated user (and optionally a
 * default vault resolved from the X-Default-Vault-Name header). A new
 * instance is created per request (stateless HTTP mode) so there's no risk
 * of one user's session leaking into another's.
 */
function buildMcpServer(user, defaultVaultId) {
  const server = new McpServer({ name: 'nimbus-fast-note-sync', version: '1.2.0' });

  function resolveVaultId(vaultId, requireWrite = false) {
    const input = (vaultId || defaultVaultId || '').trim();
    if (!input) {
      throw new Error(
        'No vault specified. Pass a vaultId (UUID or vault name), set the X-Default-Vault-Name header, or call list_vaults first.'
      );
    }
    const userVaults = vaultsStore.listForUser(user.id, user.role === 'admin');
    // 1. Match by exact ID
    let found = userVaults.find((v) => v.id === input);
    // 2. Match by exact Name
    if (!found) {
      found = userVaults.find((v) => v.name === input);
    }
    // 3. Match by Case-insensitive Name
    if (!found) {
      const lower = input.toLowerCase();
      found = userVaults.find((v) => (v.name || '').toLowerCase() === lower || (v.id || '').toLowerCase() === lower);
    }

    if (!found) {
      throw new Error(
        `Vault "${input}" not found or unauthorized for this account. Available vaults: ${userVaults.map((v) => `"${v.name}" (${v.id})`).join(', ') || 'none'}`
      );
    }

    if (requireWrite) {
      const canWrite = vaultsStore.hasWriteAccess(user.id, found.id, user.role === 'admin');
      if (!canWrite) {
        throw new Error(
          `Permission denied: You only have read-only access to vault "${found.name}". Modification operations are forbidden.`
        );
      }
    }

    return found.id;
  }

  // ------------------------- 1. Vault Management & Stats -------------------------

  server.tool(
    'list_vaults',
    'List all Obsidian vaults available to this user account with ID, name, file count, and permissions.',
    {},
    async () => {
      const vaults = vaultsStore.listForUser(user.id).map((v) => {
        const manifest = storage.getManifest(v.id) || {};
        const paths = Object.keys(manifest);
        return {
          id: v.id,
          name: v.name,
          isOwner: v.isOwner,
          permission: v.myPermission,
          fileCount: paths.length,
          totalSizeBytes: paths.reduce((acc, p) => acc + (manifest[p]?.size || 0), 0),
          isDefault: v.id === defaultVaultId,
        };
      });
      return jsonResult(vaults);
    }
  );

  server.tool(
    'get_vault_stats',
    'Get comprehensive statistics for an Obsidian vault: total notes, HTML pages, attachments, storage usage, tag counts, and recently updated notes.',
    {
      vaultId: z.string().optional().describe('Vault ID (defaults to default vault header if omitted).'),
    },
    async ({ vaultId }) => {
      const id = resolveVaultId(vaultId);
      const vault = vaultsStore.listForUser(user.id).find((v) => v.id === id);
      const manifest = storage.getManifest(id) || {};
      const paths = Object.keys(manifest);

      let mdCount = 0;
      let htmlCount = 0;
      let mediaCount = 0;
      let configCount = 0;
      let totalSize = 0;
      const allTags = {};

      const files = [];

      for (const p of paths) {
        const meta = manifest[p] || { size: 0, mtime: 0, ctime: 0 };
        totalSize += meta.size || 0;
        const lower = p.toLowerCase();
        if (lower.endsWith('.md')) {
          mdCount++;
          // Sample tags from markdown notes
          const buf = storage.readFile(id, p);
          if (buf) {
            const text = buf.toString('utf8');
            const tags = Array.from(text.matchAll(/(?:^|\s)#([a-zA-Z0-9_\u4e00-\u9fa5\/-]+)/g)).map((m) => m[1]);
            for (const t of tags) {
              allTags[t] = (allTags[t] || 0) + 1;
            }
          }
        } else if (/\.(html|htm)$/i.test(p)) {
          htmlCount++;
        } else if (p.startsWith('.obsidian/')) {
          configCount++;
        } else {
          mediaCount++;
        }
        files.push({ path: p, ...meta });
      }

      // Recent 10 modified notes
      const recentModified = files
        .filter((f) => f.path.endsWith('.md') || f.path.endsWith('.html'))
        .sort((a, b) => (b.mtime || 0) - (a.mtime || 0))
        .slice(0, 10)
        .map((f) => ({
          path: f.path,
          size: f.size,
          mtime: new Date(f.mtime).toISOString(),
          ctime: f.ctime ? new Date(f.ctime).toISOString() : undefined,
        }));

      return jsonResult({
        vaultId: id,
        vaultName: vault ? vault.name : id,
        totalFiles: paths.length,
        breakdown: {
          markdownNotes: mdCount,
          htmlPages: htmlCount,
          mediaAttachments: mediaCount,
          obsidianConfigs: configCount,
        },
        totalSizeBytes: totalSize,
        totalSizeFormatted: (totalSize / (1024 * 1024)).toFixed(2) + ' MB',
        topTags: Object.entries(allTags)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([tag, count]) => ({ tag: `#${tag}`, count })),
        recentModifiedNotes: recentModified,
      });
    }
  );

  // ------------------------- 2. Listing & Inspecting Notes -------------------------

  server.tool(
    'list_notes',
    'List note and file paths in a vault with flexible filtering (folder, extension), sorting (ctime/mtime/name/size), and optional file metadata.',
    {
      vaultId: z.string().optional().describe('Vault ID (defaults to default vault if omitted).'),
      folder: z.string().optional().describe('Optional directory prefix filter, e.g. "Projects" or "Daily".'),
      extension: z.enum(['all', 'md', 'html', 'media', 'config']).optional().describe('Filter by file type. Defaults to "all".'),
      sortBy: z.enum(['ctime', 'mtime', 'name', 'size']).optional().describe('Sort criteria. Defaults to "ctime" (creation time).'),
      sortOrder: z.enum(['desc', 'asc']).optional().describe('Sort order. Defaults to "desc" (newest first for time).'),
      limit: z.number().int().positive().max(500).optional().describe('Max files to return (default: 100).'),
      includeMetadata: z.boolean().optional().describe('If true, returns objects with size, mtime, ctime, and hash instead of plain path strings.'),
    },
    async ({ vaultId, folder, extension = 'all', sortBy = 'ctime', sortOrder = 'desc', limit = 100, includeMetadata = false }) => {
      const id = resolveVaultId(vaultId);
      const manifest = storage.getManifest(id) || {};
      let paths = Object.keys(manifest);

      if (folder) {
        const cleanFolder = folder.replace(/^\/+|\/+$/g, '') + '/';
        paths = paths.filter((p) => p.startsWith(cleanFolder) || p === folder);
      }

      if (extension === 'md') {
        paths = paths.filter((p) => p.toLowerCase().endsWith('.md'));
      } else if (extension === 'html') {
        paths = paths.filter((p) => /\.(html|htm)$/i.test(p));
      } else if (extension === 'media') {
        paths = paths.filter((p) => /\.(png|jpg|jpeg|gif|webp|svg|pdf|mp3|mp4|mov|wav|zip)$/i.test(p));
      } else if (extension === 'config') {
        paths = paths.filter((p) => p.startsWith('.obsidian/'));
      }

      paths.sort((a, b) => {
        const metaA = manifest[a] || { size: 0, mtime: 0, ctime: 0 };
        const metaB = manifest[b] || { size: 0, mtime: 0, ctime: 0 };

        let diff = 0;
        if (sortBy === 'ctime') {
          const cA = metaA.ctime || metaA.mtime || 0;
          const cB = metaB.ctime || metaB.mtime || 0;
          diff = sortOrder === 'desc' ? cB - cA : cA - cB;
        } else if (sortBy === 'mtime') {
          const mA = metaA.mtime || 0;
          const mB = metaB.mtime || 0;
          diff = sortOrder === 'desc' ? mB - mA : mA - mB;
        } else if (sortBy === 'size') {
          diff = sortOrder === 'desc' ? (metaB.size || 0) - (metaA.size || 0) : (metaA.size || 0) - (metaB.size || 0);
        }

        if (diff !== 0) return diff;
        return sortOrder === 'desc' ? b.localeCompare(a, 'zh-CN') : a.localeCompare(b, 'zh-CN');
      });

      const slice = paths.slice(0, limit);

      if (includeMetadata) {
        const result = slice.map((p) => {
          const meta = manifest[p] || {};
          return {
            path: p,
            size: meta.size || 0,
            ctime: meta.ctime ? new Date(meta.ctime).toISOString() : null,
            mtime: meta.mtime ? new Date(meta.mtime).toISOString() : null,
            hash: meta.hash,
          };
        });
        return jsonResult(result);
      }

      return textResult(slice.length ? slice.join('\n') : '(no matching files)');
    }
  );

  server.tool(
    'get_note_metadata',
    'Get rich metadata for a note including creation/modification time, size, word/character count, estimated read time, frontmatter (YAML), tags, internal wikilinks, and heading outline.',
    {
      vaultId: z.string().optional().describe('Vault ID.'),
      path: z.string().describe('Vault-relative path, e.g. "Projects/MyNote.md".'),
    },
    async ({ vaultId, path: notePath }) => {
      const id = resolveVaultId(vaultId);
      const manifest = storage.getManifest(id) || {};
      const meta = manifest[notePath];
      const buf = storage.readFile(id, notePath);

      if (buf === null) {
        throw new Error(`Note "${notePath}" not found in vault.`);
      }

      const text = buf.toString('utf8');
      const analysis = analyzeMarkdown(text);

      return jsonResult({
        path: notePath,
        sizeBytes: meta?.size || buf.length,
        ctime: meta?.ctime ? new Date(meta.ctime).toISOString() : null,
        mtime: meta?.mtime ? new Date(meta.mtime).toISOString() : null,
        hash: meta?.hash,
        ...analysis,
      });
    }
  );

  // ------------------------- 3. Reading, Writing & Patching -------------------------

  server.tool(
    'read_note',
    'Read the full UTF-8 text content of a note or file by vault-relative path.',
    {
      vaultId: z.string().optional().describe('Vault ID.'),
      path: z.string().describe('Vault-relative path, e.g. "Work/Meeting.md" or "index.html".'),
    },
    async ({ vaultId, path: notePath }) => {
      const id = resolveVaultId(vaultId);
      const buf = storage.readFile(id, notePath);
      if (buf === null) throw new Error(`File "${notePath}" not found.`);
      return textResult(buf.toString('utf8'));
    }
  );

  server.tool(
    'write_note',
    'Create a note or overwrite an existing one with full content. Automatically creates parent directories, saves a historical version snapshot, and broadcasts real-time sync to connected Obsidian and web clients.',
    {
      vaultId: z.string().optional().describe('Vault ID.'),
      path: z.string().describe('Vault-relative path, e.g. "Ideas/NewConcept.md".'),
      content: z.string().describe('Full UTF-8 text content to write.'),
      baseHash: z.string().optional().describe('Optional hash of the file when last read, for optimistic locking & conflict prevention.'),
    },
    async ({ vaultId, path: notePath, content, baseHash }) => {
      const id = resolveVaultId(vaultId, true);
      const manifest = storage.getManifest(id) || {};
      const actualBaseHash = baseHash || manifest[notePath]?.hash;
      const buffer = Buffer.from(content, 'utf8');
      const result = storage.writeFile(id, notePath, buffer, { mtime: Date.now(), baseHash: actualBaseHash });

      if (!result.written && result.conflict) {
        fnsHub.broadcastFileChange(id, result.conflict, { currentHash: result.currentHash }, user.id, true);
        return textResult(
          `Conflict detected: "${notePath}" was updated on server since last read. Your content was saved separately as "${result.conflict}".`
        );
      }

      fnsHub.broadcastFileChange(id, notePath, result, user.id);
      return textResult(`Successfully saved "${notePath}" (${buffer.length} bytes, hash: ${result.currentHash}). Real-time sync broadcasted.`);
    }
  );

  server.tool(
    'append_note',
    'Append text to an existing note (or create it if it does not exist). Ideal for logging, meeting minutes, web clips, and task items. Automatically triggers real-time synchronization.',
    {
      vaultId: z.string().optional().describe('Vault ID.'),
      path: z.string().describe('Vault-relative path, e.g. "Inbox/DailyThoughts.md".'),
      content: z.string().describe('Content to append.'),
      heading: z.string().optional().describe('Optional markdown heading (e.g. "## AI Notes" or "## Log") under which to insert the content.'),
      withTimestamp: z.boolean().optional().describe('If true, prepends a [YYYY-MM-DD HH:mm:ss] timestamp before content. Defaults to false.'),
      ensureNewline: z.boolean().optional().describe('Ensure there is a newline separator before appending. Defaults to true.'),
    },
    async ({ vaultId, path: notePath, content, heading, withTimestamp = false, ensureNewline = true }) => {
      const id = resolveVaultId(vaultId, true);
      const buf = storage.readFile(id, notePath);
      let originalText = buf ? buf.toString('utf8') : '';

      let textToAppend = content;
      if (withTimestamp) {
        const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
        textToAppend = `- [${nowStr}] ${content}`;
      }

      let newText = '';
      if (!buf) {
        // New file
        if (heading) {
          newText = `${heading}\n\n${textToAppend}\n`;
        } else {
          newText = `${textToAppend}\n`;
        }
      } else if (heading) {
        // Locate heading
        const headingRegex = new RegExp(`(^|\\n)(${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n)`, 'i');
        const match = originalText.match(headingRegex);
        if (match) {
          const insertPos = match.index + match[0].length;
          newText = originalText.slice(0, insertPos) + `${textToAppend}\n` + originalText.slice(insertPos);
        } else {
          newText = originalText.trimEnd() + `\n\n${heading}\n\n${textToAppend}\n`;
        }
      } else {
        const prefix = ensureNewline && originalText.length > 0 && !originalText.endsWith('\n') ? '\n\n' : '\n';
        newText = originalText.trimEnd() + prefix + textToAppend + '\n';
      }

      const manifest = storage.getManifest(id) || {};
      const baseHash = manifest[notePath]?.hash;
      const buffer = Buffer.from(newText, 'utf8');
      const result = storage.writeFile(id, notePath, buffer, { mtime: Date.now(), baseHash });

      fnsHub.broadcastFileChange(id, notePath, result, user.id);
      return textResult(`Successfully appended content to "${notePath}". New size: ${buffer.length} bytes. Synced to all clients.`);
    }
  );

  server.tool(
    'prepend_note',
    'Prepend text to a note (preserving YAML frontmatter if present). Ideal for adding summaries, alert banners, or priority notes to the top of an article.',
    {
      vaultId: z.string().optional().describe('Vault ID.'),
      path: z.string().describe('Vault-relative path.'),
      content: z.string().describe('Content to prepend.'),
      withTimestamp: z.boolean().optional().describe('If true, prepends a timestamp.'),
    },
    async ({ vaultId, path: notePath, content, withTimestamp = false }) => {
      const id = resolveVaultId(vaultId, true);
      const buf = storage.readFile(id, notePath);
      const originalText = buf ? buf.toString('utf8') : '';

      let textToPrepend = content;
      if (withTimestamp) {
        const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
        textToPrepend = `> **[${nowStr}]** ${content}\n\n`;
      } else if (!textToPrepend.endsWith('\n')) {
        textToPrepend += '\n\n';
      }

      let newText = '';
      const fmMatch = originalText.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
      if (fmMatch) {
        const fm = fmMatch[0];
        const rest = originalText.slice(fm.length);
        newText = fm + textToPrepend + rest;
      } else {
        newText = textToPrepend + originalText;
      }

      const manifest = storage.getManifest(id) || {};
      const baseHash = manifest[notePath]?.hash;
      const buffer = Buffer.from(newText, 'utf8');
      const result = storage.writeFile(id, notePath, buffer, { mtime: Date.now(), baseHash });

      fnsHub.broadcastFileChange(id, notePath, result, user.id);
      return textResult(`Successfully prepended content to "${notePath}". Synced to all clients.`);
    }
  );

  server.tool(
    'patch_note',
    'Perform precise text search-and-replace or section updates in a note without sending the entire file. Conflict-safe and synced in real-time.',
    {
      vaultId: z.string().optional().describe('Vault ID.'),
      path: z.string().describe('Vault-relative path.'),
      search: z.string().describe('Exact substring to find and replace.'),
      replace: z.string().describe('Replacement text.'),
      replaceAll: z.boolean().optional().describe('If true, replace all occurrences instead of only the first. Defaults to false.'),
    },
    async ({ vaultId, path: notePath, search, replace, replaceAll = false }) => {
      const id = resolveVaultId(vaultId, true);
      const buf = storage.readFile(id, notePath);
      if (buf === null) throw new Error(`Note "${notePath}" not found.`);

      const text = buf.toString('utf8');
      if (!text.includes(search)) {
        throw new Error(`Target search text was not found in "${notePath}".`);
      }

      let newText = '';
      if (replaceAll) {
        newText = text.split(search).join(replace);
      } else {
        newText = text.replace(search, replace);
      }

      const manifest = storage.getManifest(id) || {};
      const baseHash = manifest[notePath]?.hash;
      const buffer = Buffer.from(newText, 'utf8');
      const result = storage.writeFile(id, notePath, buffer, { mtime: Date.now(), baseHash });

      fnsHub.broadcastFileChange(id, notePath, result, user.id);
      return textResult(`Successfully patched "${notePath}". Replacement applied and synced.`);
    }
  );

  server.tool(
    'upload_attachment',
    'Upload a binary file, image, PDF, audio, or media attachment into the vault (via Base64 encoding or by downloading from a web source URL). Automatically updates index, broadcasts real-time sync, and provides ready-to-use Obsidian wikilink syntax (![[path]]).',
    {
      vaultId: z.string().optional().describe('Vault ID (defaults to default vault).'),
      path: z.string().describe('Vault-relative path for the attachment, e.g. "_resources/image.png" or "Attachments/spec.pdf".'),
      contentBase64: z.string().optional().describe('Base64-encoded string (or data: URL) of the binary file. Required if sourceUrl is not provided.'),
      sourceUrl: z.string().optional().describe('Direct HTTP/HTTPS URL of the image or file to download into the vault. Used if contentBase64 is omitted.'),
      overwrite: z.boolean().optional().describe('If true, overwrites any existing file at the path. Defaults to true.'),
    },
    async ({ vaultId, path: filePath, contentBase64, sourceUrl, overwrite = true }) => {
      const id = resolveVaultId(vaultId, true);
      const manifest = storage.getManifest(id) || {};

      if (manifest[filePath] && !overwrite) {
        throw new Error(`Attachment file "${filePath}" already exists in vault. Set overwrite: true to replace.`);
      }

      let buffer;
      if (contentBase64) {
        // Strip data URI header if present (e.g. data:image/png;base64,...)
        const rawBase64 = contentBase64.replace(/^data:[^;]+;base64,/, '');
        buffer = Buffer.from(rawBase64, 'base64');
      } else if (sourceUrl) {
        const resp = await fetch(sourceUrl);
        if (!resp.ok) {
          throw new Error(`Failed to download attachment from URL: HTTP ${resp.status} ${resp.statusText}`);
        }
        const arrayBuf = await resp.arrayBuffer();
        buffer = Buffer.from(arrayBuf);
      } else {
        throw new Error('Either contentBase64 or sourceUrl must be provided to upload an attachment.');
      }

      const result = storage.writeFile(id, filePath, buffer, { mtime: Date.now() });
      fnsHub.broadcastFileChange(id, filePath, result, user.id);

      const fileName = filePath.split('/').pop() || filePath;
      return jsonResult({
        success: true,
        path: filePath,
        fileName,
        sizeBytes: buffer.length,
        sizeFormatted: (buffer.length / 1024).toFixed(1) + ' KB',
        hash: result.currentHash,
        obsidianEmbedWikiLink: `![[${fileName}]]`,
        obsidianFullWikiLink: `![[${filePath}]]`,
        markdownEmbedLink: `![](${encodeURI(filePath)})`,
        message: `Attachment "${filePath}" (${buffer.length} bytes) saved and synced to all clients.`,
      });
    }
  );

  server.tool(
    'get_attachment_base64',
    'Read an attachment (image, PDF, audio, media) from the vault as a Base64-encoded string for AI visual inspection or processing.',
    {
      vaultId: z.string().optional().describe('Vault ID.'),
      path: z.string().describe('Vault-relative path of the attachment, e.g. "_resources/photo.png".'),
    },
    async ({ vaultId, path: filePath }) => {
      const id = resolveVaultId(vaultId);
      const buf = storage.readFile(id, filePath);
      if (buf === null) {
        throw new Error(`Attachment "${filePath}" not found in vault.`);
      }

      const ext = (filePath.split('.').pop() || '').toLowerCase();
      const mimeTypes = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        pdf: 'application/pdf',
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        mp4: 'video/mp4',
        zip: 'application/zip',
      };
      const mimeType = mimeTypes[ext] || 'application/octet-stream';

      return jsonResult({
        path: filePath,
        sizeBytes: buf.length,
        mimeType,
        base64: buf.toString('base64'),
        dataUrl: `data:${mimeType};base64,${buf.toString('base64')}`,
      });
    }
  );

  // ------------------------- 4. Daily Notes Support -------------------------

  server.tool(
    'get_daily_note',
    'Get or initialize today\'s (or a specified date\'s) Obsidian Daily Note. Reads existing content or optionally creates a template.',
    {
      vaultId: z.string().optional().describe('Vault ID.'),
      date: z.string().optional().describe('Date in "YYYY-MM-DD" format. Defaults to today.'),
      folder: z.string().optional().describe('Folder for daily notes (e.g. "Daily" or "Journal"). Defaults to root or "Daily" if exists.'),
      createIfMissing: z.boolean().optional().describe('If true, creates the daily note with a title header if it does not exist. Defaults to true.'),
    },
    async ({ vaultId, date, folder, createIfMissing = true }) => {
      const id = resolveVaultId(vaultId, createIfMissing);
      const targetDate = date || getTodayString();
      const manifest = storage.getManifest(id) || {};
      const allPaths = Object.keys(manifest);

      // Detect folder: if specified use it; else check if a "Daily/" folder exists in vault
      let targetFolder = folder || '';
      if (!folder) {
        if (allPaths.some((p) => p.startsWith('Daily/'))) {
          targetFolder = 'Daily';
        } else if (allPaths.some((p) => p.startsWith('Journal/'))) {
          targetFolder = 'Journal';
        } else if (allPaths.some((p) => p.startsWith('日记/'))) {
          targetFolder = '日记';
        }
      }

      const notePath = targetFolder ? `${targetFolder}/${targetDate}.md` : `${targetDate}.md`;
      let buf = storage.readFile(id, notePath);

      if (!buf && createIfMissing) {
        const initialContent = `# ${targetDate}\n\n## 📝 记录\n\n`;
        const buffer = Buffer.from(initialContent, 'utf8');
        const result = storage.writeFile(id, notePath, buffer, { mtime: Date.now() });
        fnsHub.broadcastFileChange(id, notePath, result, user.id);
        return jsonResult({
          created: true,
          path: notePath,
          date: targetDate,
          content: initialContent,
        });
      }

      if (!buf) {
        return jsonResult({
          exists: false,
          path: notePath,
          date: targetDate,
          message: `Daily note "${notePath}" does not exist yet.`,
        });
      }

      return jsonResult({
        exists: true,
        path: notePath,
        date: targetDate,
        content: buf.toString('utf8'),
      });
    }
  );

  server.tool(
    'append_daily_note',
    'Append a journal entry, task, or thought log directly into today\'s (or a specified date\'s) Daily Note with an optional timestamp.',
    {
      vaultId: z.string().optional().describe('Vault ID.'),
      content: z.string().describe('Log content to append to the daily note.'),
      date: z.string().optional().describe('Date in "YYYY-MM-DD" format. Defaults to today.'),
      folder: z.string().optional().describe('Folder path (e.g. "Daily"). Defaults to auto-detected daily folder.'),
      heading: z.string().optional().describe('Heading to append under, e.g. "## 📝 记录" or "## 待办事项".'),
      withTimestamp: z.boolean().optional().describe('Prepend [HH:mm:ss] timestamp. Defaults to true.'),
    },
    async ({ vaultId, content, date, folder, heading, withTimestamp = true }) => {
      const id = resolveVaultId(vaultId, true);
      const targetDate = date || getTodayString();
      const manifest = storage.getManifest(id) || {};
      const allPaths = Object.keys(manifest);

      let targetFolder = folder || '';
      if (!folder) {
        if (allPaths.some((p) => p.startsWith('Daily/'))) targetFolder = 'Daily';
        else if (allPaths.some((p) => p.startsWith('Journal/'))) targetFolder = 'Journal';
        else if (allPaths.some((p) => p.startsWith('日记/'))) targetFolder = '日记';
      }

      const notePath = targetFolder ? `${targetFolder}/${targetDate}.md` : `${targetDate}.md`;
      const buf = storage.readFile(id, notePath);
      let originalText = buf ? buf.toString('utf8') : `# ${targetDate}\n\n`;

      let entry = content;
      if (withTimestamp) {
        const timeStr = new Date().toLocaleTimeString('zh-CN', { hour12: false });
        entry = `- [${timeStr}] ${content}`;
      }

      let newText = '';
      if (heading) {
        const headingRegex = new RegExp(`(^|\\n)(${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n)`, 'i');
        const match = originalText.match(headingRegex);
        if (match) {
          const insertPos = match.index + match[0].length;
          newText = originalText.slice(0, insertPos) + `${entry}\n` + originalText.slice(insertPos);
        } else {
          newText = originalText.trimEnd() + `\n\n${heading}\n\n${entry}\n`;
        }
      } else {
        newText = originalText.trimEnd() + `\n\n${entry}\n`;
      }

      const baseHash = manifest[notePath]?.hash;
      const buffer = Buffer.from(newText, 'utf8');
      const result = storage.writeFile(id, notePath, buffer, { mtime: Date.now(), baseHash });

      fnsHub.broadcastFileChange(id, notePath, result, user.id);
      return textResult(`Appended to Daily Note "${notePath}". Synced to Obsidian.`);
    }
  );

  // ------------------------- 5. Search & Discovery -------------------------

  server.tool(
    'search_notes',
    'Full-text search across Markdown and HTML notes in the vault, with contextual snippets, line numbers, and regex option.',
    {
      vaultId: z.string().optional().describe('Vault ID.'),
      query: z.string().describe('Search keyword or regular expression.'),
      folder: z.string().optional().describe('Limit search to notes under this folder.'),
      limit: z.number().int().positive().max(100).optional().describe('Max matching snippets (default: 20).'),
      useRegex: z.boolean().optional().describe('Interpret query as a regular expression. Defaults to false.'),
      caseSensitive: z.boolean().optional().describe('Case sensitive match. Defaults to false.'),
    },
    async ({ vaultId, query, folder, limit = 20, useRegex = false, caseSensitive = false }) => {
      const id = resolveVaultId(vaultId);
      const manifest = storage.getManifest(id) || {};
      let notePaths = Object.keys(manifest).filter((p) => p.endsWith('.md') || /\.(html|htm|txt)$/i.test(p));

      if (folder) {
        const cleanFolder = folder.replace(/^\/+|\/+$/g, '') + '/';
        notePaths = notePaths.filter((p) => p.startsWith(cleanFolder) || p === folder);
      }

      let regex;
      if (useRegex) {
        regex = new RegExp(query, caseSensitive ? 'g' : 'gi');
      } else {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
      }

      const results = [];

      for (const p of notePaths) {
        if (results.length >= limit) break;
        const buf = storage.readFile(id, p);
        if (!buf) continue;
        const text = buf.toString('utf8');
        const lines = text.split(/\r?\n/);

        for (let i = 0; i < lines.length; i++) {
          if (results.length >= limit) break;
          const line = lines[i];
          if (regex.test(line)) {
            // Reset regex state for global
            regex.lastIndex = 0;
            results.push({
              path: p,
              lineNumber: i + 1,
              snippet: line.trim(),
            });
          }
        }
      }

      if (!results.length) {
        return textResult(`No matches found for "${query}".`);
      }

      const formatted = results.map((r) => `📄 ${r.path}:${r.lineNumber}\n   ${r.snippet}`).join('\n\n');
      return textResult(`Found ${results.length} match(es):\n\n${formatted}`);
    }
  );

  server.tool(
    'list_tags',
    'Scan and aggregate all Obsidian tags (#tag, #parent/child) across notes in the vault, with occurrence frequencies and file locations.',
    {
      vaultId: z.string().optional().describe('Vault ID.'),
      folder: z.string().optional().describe('Optional folder filter.'),
    },
    async ({ vaultId, folder }) => {
      const id = resolveVaultId(vaultId);
      const manifest = storage.getManifest(id) || {};
      let notePaths = Object.keys(manifest).filter((p) => p.toLowerCase().endsWith('.md'));

      if (folder) {
        const cleanFolder = folder.replace(/^\/+|\/+$/g, '') + '/';
        notePaths = notePaths.filter((p) => p.startsWith(cleanFolder) || p === folder);
      }

      const tagMap = {};

      for (const p of notePaths) {
        const buf = storage.readFile(id, p);
        if (!buf) continue;
        const text = buf.toString('utf8');
        const tags = Array.from(text.matchAll(/(?:^|\s)#([a-zA-Z0-9_\u4e00-\u9fa5\/-]+)/g)).map((m) => m[1]);
        for (const t of tags) {
          if (!tagMap[t]) tagMap[t] = { count: 0, notes: [] };
          tagMap[t].count++;
          if (!tagMap[t].notes.includes(p)) {
            tagMap[t].notes.push(p);
          }
        }
      }

      const sorted = Object.entries(tagMap)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([tag, data]) => ({
          tag: `#${tag}`,
          count: data.count,
          notesCount: data.notes.length,
          sampleNotes: data.notes.slice(0, 5),
        }));

      return jsonResult(sorted);
    }
  );

  // ------------------------- 6. Move, Rename & Delete -------------------------

  server.tool(
    'move_note',
    'Move or rename a note or attachment to a new path in the vault. Updates file index and broadcasts real-time sync events.',
    {
      vaultId: z.string().optional().describe('Vault ID.'),
      oldPath: z.string().describe('Current vault-relative path, e.g. "Inbox/draft.md".'),
      newPath: z.string().describe('New vault-relative path, e.g. "Archive/2026/draft.md".'),
      overwrite: z.boolean().optional().describe('If true, overwrites any file existing at newPath. Defaults to false.'),
    },
    async ({ vaultId, oldPath, newPath, overwrite = false }) => {
      const id = resolveVaultId(vaultId, true);
      const buf = storage.readFile(id, oldPath);
      if (buf === null) throw new Error(`Source note "${oldPath}" does not exist.`);

      const manifest = storage.getManifest(id) || {};
      if (manifest[newPath] && !overwrite) {
        throw new Error(`Destination "${newPath}" already exists. Set overwrite: true to replace.`);
      }

      // Write to new path
      const result = storage.writeFile(id, newPath, buf, { mtime: Date.now() });
      // Delete old path
      storage.deleteFile(id, oldPath);

      // Broadcast both operations
      fnsHub.broadcastFileDelete(id, oldPath, user.id);
      fnsHub.broadcastFileChange(id, newPath, result, user.id);

      return textResult(`Successfully moved "${oldPath}" to "${newPath}". Synced to all clients.`);
    }
  );

  server.tool(
    'delete_note',
    'Delete a note or attachment from the vault (moves to trash for safe recovery). Syncs deletion to connected Obsidian clients immediately.',
    {
      vaultId: z.string().optional().describe('Vault ID.'),
      path: z.string().describe('Vault-relative path to delete.'),
    },
    async ({ vaultId, path: notePath }) => {
      const id = resolveVaultId(vaultId, true);
      const ok = storage.deleteFile(id, notePath);
      if (ok) {
        fnsHub.broadcastFileDelete(id, notePath, user.id);
        webhooks.trigger('file.deleted', {
          vaultId: id,
          path: notePath,
          userId: user.id,
          username: user.username,
        }).catch(() => {});
        return textResult(`Deleted "${notePath}" (moved to vault trash). Synced to all connected devices.`);
      }
      return textResult(`"${notePath}" did not exist in vault.`);
    }
  );

  // ------------------------- 7. History & Snapshots -------------------------

  server.tool(
    'get_note_history',
    'List all historical backup snapshots available for a note, with version IDs, timestamps, and sizes.',
    {
      vaultId: z.string().optional().describe('Vault ID.'),
      path: z.string().describe('Vault-relative path, e.g. "Projects/Summary.md".'),
    },
    async ({ vaultId, path: notePath }) => {
      const id = resolveVaultId(vaultId);
      const history = storage.listHistory(id, notePath).map((h) => ({
        versionId: h.id,
        savedAt: new Date(h.savedAt).toISOString(),
        sizeBytes: h.size,
      }));
      return jsonResult(history);
    }
  );

  server.tool(
    'read_history_version',
    'Read the exact content of a previous historical snapshot of a note by version ID.',
    {
      vaultId: z.string().optional().describe('Vault ID.'),
      versionId: z.string().describe('Version ID returned by get_note_history.'),
    },
    async ({ vaultId, versionId }) => {
      const id = resolveVaultId(vaultId);
      const result = storage.readHistoryVersion(id, versionId);
      if (!result) throw new Error(`History version "${versionId}" not found.`);
      return textResult(result.buffer.toString('utf8'));
    }
  );

  // ------------------------- 8. Sharing Integration -------------------------

  server.tool(
    'create_share_link',
    'Create an external public web share link for a note, returning the full shareable URL.',
    {
      vaultId: z.string().optional().describe('Vault ID.'),
      path: z.string().describe('Vault-relative path of the note to share.'),
      title: z.string().optional().describe('Optional custom display title for the shared article.'),
      password: z.string().optional().describe('Optional access password.'),
      expiresDays: z.number().int().positive().optional().describe('Optional expiration in days (e.g. 7).'),
      allowCopy: z.boolean().optional().describe('Allow readers to copy full text (default: true).'),
    },
    async ({ vaultId, path: notePath, title, password, expiresDays, allowCopy = true }) => {
      const id = resolveVaultId(vaultId, true);
      const manifest = storage.getManifest(id) || {};
      if (!manifest[notePath]) {
        throw new Error(`Note "${notePath}" not found in vault.`);
      }

      const record = sharesStore.create({
        vaultId: id,
        userId: user.id,
        filePath: notePath,
        title: title || notePath,
        password,
        expiresDays,
        allowCopy,
      });

      return jsonResult({
        shareId: record.id,
        title: record.title,
        filePath: record.filePath,
        sharePath: `/share/${record.id}`,
        hasPassword: record.hasPassword,
        expiresAt: record.expiresAt ? new Date(record.expiresAt).toISOString() : null,
        allowCopy: record.allowCopy,
      });
    }
  );

  // ------------------------- 9. Git Automation & Remote Sync -------------------------

  server.tool(
    'get_vault_git_status',
    'Get Git version control and remote synchronization status of a vault (branch, uncommitted changes, unpushed commits, last commit info).',
    {
      vaultId: z.string().optional().describe('Vault ID (defaults to default vault).'),
    },
    async ({ vaultId }) => {
      const id = resolveVaultId(vaultId);
      const status = await gitSync.getStatus(id);
      return jsonResult(status);
    }
  );

  server.tool(
    'git_sync_vault',
    'Commit all current vault changes and push/pull to configured remote Git repository (GitHub, Gitee, GitLab).',
    {
      vaultId: z.string().optional().describe('Vault ID (defaults to default vault).'),
      action: z.enum(['commit_and_push', 'pull', 'test_connection']).default('commit_and_push').describe('Git action to perform.'),
      commitMessage: z.string().optional().describe('Optional custom commit message.'),
    },
    async ({ vaultId, action = 'commit_and_push', commitMessage }) => {
      const id = resolveVaultId(vaultId, true);

      if (action === 'test_connection') {
        const testRes = await gitSync.testConnection(id);
        return jsonResult(testRes);
      }

      if (action === 'pull') {
        const pullRes = await gitSync.pull(id);
        return jsonResult(pullRes);
      }

      const result = await gitSync.commitAndPush(id, {
        customMessage: commitMessage,
        author: user.username || user.id,
      });
      return jsonResult(result);
    }
  );

  return server;
}

module.exports = { buildMcpServer };

