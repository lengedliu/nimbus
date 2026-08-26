const { WebSocketServer } = require('ws');
const url = require('url');
const { verifyToken } = require('./auth');
const users = require('./users');
const vaults = require('./vaults');
const storage = require('./storage');
const syncRules = require('./syncRules');

/**
 * FNS realtime hub.
 *
 * Wire protocol (JSON messages over WebSocket), client -> server:
 *   { type: 'push',   path, content: base64, mtime, baseHash? }
 *   { type: 'delete', path }
 *   { type: 'pull',   path }                     // request full content of one file
 *   { type: 'ping' }
 *
 * server -> client:
 *   { type: 'init',    manifest: { path: {size, mtime, hash} } }   // sent once on connect
 *   { type: 'change',  path, content: base64, mtime, hash }        // pushed to OTHER clients when a file changes
 *   { type: 'deleted', path }
 *   { type: 'conflict', path, conflictPath, currentHash }          // sent back to the pushing client if a real conflict occurred
 *   { type: 'ack',     path, hash }                                // sent back to the pushing client on success
 *   { type: 'file',    path, content: base64, mtime, hash }        // response to 'pull'
 *   { type: 'error',   message }
 *   { type: 'pong' }
 */
class FnsHub {
  constructor() {
    // vaultId -> Set of { ws, userId, deviceId, connectedAt }
    this.rooms = new Map();
    // vaultId -> Array of { type: 'change'|'delete'|'conflict', path, timestamp, userId }
    this.activityLogs = new Map();
  }

  init(httpServer) {
    this.wss = new WebSocketServer({ noServer: true });

    httpServer.on('upgrade', (req, socket, head) => {
      const { pathname, query } = url.parse(req.url, true);
      if (pathname !== '/ws') {
        socket.destroy();
        return;
      }
      const payload = query.token && verifyToken(query.token);
      const user = payload && users.findById(payload.sub);
      const vaultId = query.vaultId;
      const vault = vaultId && vaults.getById(vaultId);

      if (!user || !vault || vault.ownerId !== user.id) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      this.wss.handleUpgrade(req, socket, head, (ws) => {
        this._onConnection(ws, user, vaultId, query.deviceId || 'Obsidian Client');
      });
    });
  }

  _room(vaultId) {
    if (!this.rooms.has(vaultId)) this.rooms.set(vaultId, new Set());
    return this.rooms.get(vaultId);
  }

  _logActivity(vaultId, item) {
    if (!this.activityLogs.has(vaultId)) this.activityLogs.set(vaultId, []);
    const list = this.activityLogs.get(vaultId);
    list.unshift({ ...item, timestamp: Date.now() });
    if (list.length > 50) list.pop();
  }

  getActivityLogs(vaultId) {
    return this.activityLogs.get(vaultId) || [];
  }

  getClientCount(vaultId) {
    return this.rooms.get(vaultId)?.size || 0;
  }

  _onConnection(ws, user, vaultId, deviceName) {
    const client = { ws, userId: user.id, deviceName, connectedAt: Date.now() };
    this._room(vaultId).add(client);

    this._send(ws, { type: 'init', manifest: storage.getManifest(vaultId) });

    ws.on('message', (raw) => this._onMessage(client, vaultId, raw));
    ws.on('close', () => this._room(vaultId).delete(client));
    ws.on('error', () => this._room(vaultId).delete(client));
  }

  _send(ws, obj) {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
  }

  _onMessage(client, vaultId, raw) {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return this._send(client.ws, { type: 'error', message: 'invalid JSON' });
    }

    try {
      if (msg.type === 'ping') {
        return this._send(client.ws, { type: 'pong' });
      }

      if (msg.type === 'pull') {
        const buf = storage.readFile(vaultId, msg.path);
        if (buf === null) return this._send(client.ws, { type: 'error', message: 'file not found', path: msg.path });
        return this._send(client.ws, {
          type: 'file',
          path: msg.path,
          content: buf.toString('base64'),
          mtime: msg.mtime,
        });
      }

      if (msg.type === 'push') {
        if (syncRules.isPathIgnored(vaultId, msg.path)) {
          return this._send(client.ws, { type: 'ack', path: msg.path, ignored: true });
        }

        const buffer = Buffer.from(msg.content, 'base64');
        const result = storage.writeFile(vaultId, msg.path, buffer, {
          mtime: msg.mtime,
          baseHash: msg.baseHash,
        });

        if (!result.written && result.conflict) {
          this._logActivity(vaultId, { type: 'conflict', path: msg.path, conflictPath: result.conflict, userId: client.userId });
          this._send(client.ws, {
            type: 'conflict',
            path: msg.path,
            conflictPath: result.conflict,
            currentHash: result.currentHash,
          });
          // Let other clients know a conflict copy was created.
          this.broadcastFileChange(vaultId, result.conflict, { currentHash: result.currentHash }, client.userId, true);
          return;
        }

        this._logActivity(vaultId, { type: 'change', path: msg.path, userId: client.userId });
        this._send(client.ws, { type: 'ack', path: msg.path, hash: result.currentHash });
        this.broadcastFileChange(vaultId, msg.path, result, client.userId);
        return;
      }

      if (msg.type === 'delete') {
        storage.deleteFile(vaultId, msg.path);
        this._logActivity(vaultId, { type: 'delete', path: msg.path, userId: client.userId });
        this.broadcastFileDelete(vaultId, msg.path, client.userId);
        return;
      }

      this._send(client.ws, { type: 'error', message: `unknown message type: ${msg.type}` });
    } catch (e) {
      this._send(client.ws, { type: 'error', message: e.message });
    }
  }

  /** Push a changed file to every OTHER connected client for this vault. */
  broadcastFileChange(vaultId, relPath, result, fromUserId, readFromDisk = false) {
    this._logActivity(vaultId, { type: 'change', path: relPath, userId: fromUserId });
    const room = this.rooms.get(vaultId);
    if (!room || room.size === 0) return;
    const buf = storage.readFile(vaultId, relPath);
    if (buf === null) return;
    const payload = {
      type: 'change',
      path: relPath,
      content: buf.toString('base64'),
      hash: result.currentHash,
    };
    for (const client of room) {
      if (client.userId === fromUserId && !readFromDisk) continue; // don't echo back to the sender (REST callers pass their own id too)
      this._send(client.ws, payload);
    }
  }

  broadcastFileDelete(vaultId, relPath, fromUserId) {
    this._logActivity(vaultId, { type: 'delete', path: relPath, userId: fromUserId });
    const room = this.rooms.get(vaultId);
    if (!room) return;
    for (const client of room) {
      if (client.userId === fromUserId) continue;
      this._send(client.ws, { type: 'deleted', path: relPath });
    }
  }
}

module.exports = new FnsHub();
