const { WebSocketServer } = require('ws');
const url = require('url');
const { verifyToken } = require('./auth');
const users = require('./users');
const vaults = require('./vaults');
const storage = require('./storage');
const syncRules = require('./syncRules');
const syncLogger = require('./syncLogger');
const devicesStore = require('./devices');
const webhooks = require('./webhooks');

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
    // vaultId -> Set of { ws, userId, deviceId, connectedAt, isAlive }
    this.rooms = new Map();
    // vaultId -> Array of { type: 'change'|'delete'|'conflict', path, timestamp, userId }
    this.activityLogs = new Map();
    this.heartbeatInterval = null;
  }

  init(httpServer) {
    this.wss = new WebSocketServer({ noServer: true });

    // Setup 30s heartbeat interval to detect stale/dead connections and prevent mobile zombie sockets
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      for (const [vaultId, room] of this.rooms.entries()) {
        for (const client of Array.from(room)) {
          if (client.isAlive === false) {
            try {
              client.ws.terminate();
            } catch {}
            room.delete(client);
            continue;
          }
          client.isAlive = false;
          try {
            client.ws.ping();
          } catch {
            room.delete(client);
          }
        }
      }
    }, 30000);

    httpServer.on('upgrade', (req, socket, head) => {
      const { pathname, query } = url.parse(req.url, true);
      if (pathname !== '/ws') {
        socket.destroy();
        return;
      }
      const payload = query.token && verifyToken(query.token);
      const devicesStore = require('./devices');
      if (query.token && devicesStore.isTokenRevoked(query.token)) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
      const user = payload && users.findById(payload.sub);
      const vaultId = query.vaultId;
      const vault = vaultId && vaults.getById(vaultId);

      const isAdmin = user && user.role === 'admin';
      if (!user || !vault || !vaults.hasReadAccess(user.id, vaultId, isAdmin)) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      const permission = vaults.getUserPermission(user.id, vaultId, isAdmin);
      const deviceId = payload?.deviceId || payload?.tid || query.deviceId || 'device-' + user.id.slice(0, 6);
      const deviceName = payload?.deviceName || payload?.label || query.deviceName || 'Obsidian Client';

      this.wss.handleUpgrade(req, socket, head, (ws) => {
        this._onConnection(ws, user, vaultId, { deviceId, deviceName }, permission);
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

  getClients(vaultId) {
    const room = this.rooms.get(vaultId);
    if (!room) return [];
    return Array.from(room).map((c) => ({
      userId: c.userId,
      username: c.username,
      deviceName: c.deviceName || 'Obsidian Client',
      connectedAt: c.connectedAt,
    }));
  }

  _onConnection(ws, user, vaultId, deviceMeta, permission = 'read-write') {
    const deviceId = typeof deviceMeta === 'object' && deviceMeta ? deviceMeta.deviceId : 'device-' + user.id.slice(0, 6);
    const deviceName = typeof deviceMeta === 'object' && deviceMeta ? deviceMeta.deviceName : (deviceMeta || 'Obsidian Client');
    const client = { ws, userId: user.id, username: user.username, deviceId, deviceName, permission, connectedAt: Date.now(), isAlive: true };
    this._room(vaultId).add(client);

    try {
      const devicesStore = require('./devices');
      devicesStore.recordActivity(deviceId, { deviceName });
    } catch {}

    ws.on('pong', () => {
      client.isAlive = true;
    });

    this._send(ws, { type: 'init', manifest: storage.getManifest(vaultId), permission });

    ws.on('message', (raw) => {
      client.isAlive = true;
      this._onMessage(client, vaultId, raw);
    });
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
        if (buf === null) {
          syncLogger.recordLog({
            vaultId,
            userId: client.userId,
            username: client.username,
            deviceName: client.deviceName,
            action: 'pull',
            path: msg.path,
            status: 'error',
            detail: '文件不存在 (404)',
          });
          return this._send(client.ws, { type: 'error', message: 'file not found', path: msg.path });
        }

        syncLogger.recordLog({
          vaultId,
          userId: client.userId,
          username: client.username,
          deviceName: client.deviceName,
          action: 'pull',
          path: msg.path,
          size: buf.length,
          status: 'success',
          detail: '客户端拉取完整文件',
        });

        return this._send(client.ws, {
          type: 'file',
          path: msg.path,
          content: buf.toString('base64'),
          mtime: msg.mtime,
        });
      }

      if (msg.type === 'push') {
        if (client.permission === 'read-only') {
          return this._send(client.ws, { type: 'error', message: '只读权限，禁止推送更改', path: msg.path });
        }

        if (syncRules.isPathIgnored(vaultId, msg.path)) {
          syncLogger.recordLog({
            vaultId,
            userId: client.userId,
            username: client.username,
            deviceName: client.deviceName,
            action: 'ignore',
            path: msg.path,
            status: 'ignored',
            detail: '命中同步黑名单/忽略规则',
          });
          return this._send(client.ws, { type: 'ack', path: msg.path, ignored: true });
        }

        const buffer = Buffer.from(msg.content, 'base64');
        const result = storage.writeFile(vaultId, msg.path, buffer, {
          mtime: msg.mtime,
          baseHash: msg.baseHash,
        });

        if (!result.written && result.conflict) {
          this._logActivity(vaultId, { type: 'conflict', path: msg.path, conflictPath: result.conflict, userId: client.userId });
          syncLogger.recordLog({
            vaultId,
            userId: client.userId,
            username: client.username,
            deviceName: client.deviceName,
            action: 'conflict',
            path: msg.path,
            size: buffer.length,
            hash: result.currentHash,
            status: 'conflict',
            detail: `并发冲突，已创建分支副本: ${result.conflict}`,
          });

          this._send(client.ws, {
            type: 'conflict',
            path: msg.path,
            conflictPath: result.conflict,
            currentHash: result.currentHash,
          });
          // Let other clients know a conflict copy was created.
          this.broadcastFileChange(vaultId, result.conflict, { currentHash: result.currentHash }, client.userId, true);

          // Trigger webhook alert
          const v = vaults.getById(vaultId);
          webhooks.trigger('conflict.detected', {
            vaultId,
            vaultName: v ? v.name : vaultId,
            path: msg.path,
            conflictPath: result.conflict,
            username: client.username,
            deviceName: client.deviceName,
          }).catch(() => {});

          return;
        }

        this._logActivity(vaultId, { type: 'change', path: msg.path, userId: client.userId });
        syncLogger.recordLog({
          vaultId,
          userId: client.userId,
          username: client.username,
          deviceName: client.deviceName,
          action: 'update',
          path: msg.path,
          size: buffer.length,
          hash: result.currentHash,
          status: 'success',
          detail: '客户端推送更新',
        });

        this._send(client.ws, { type: 'ack', path: msg.path, hash: result.currentHash });
        this.broadcastFileChange(vaultId, msg.path, result, client.userId, client.ws);
        return;
      }

      if (msg.type === 'delete') {
        if (client.permission === 'read-only') {
          return this._send(client.ws, { type: 'error', message: '只读权限，禁止删除文件', path: msg.path });
        }

        const ok = storage.deleteFile(vaultId, msg.path);
        this._logActivity(vaultId, { type: 'delete', path: msg.path, userId: client.userId });
        syncLogger.recordLog({
          vaultId,
          userId: client.userId,
          username: client.username,
          deviceName: client.deviceName,
          action: 'delete',
          path: msg.path,
          status: ok ? 'success' : 'error',
          detail: ok ? '移入回收站' : '文件不存在',
        });

        this.broadcastFileDelete(vaultId, msg.path, client.userId, client.ws);
        return;
      }

      this._send(client.ws, { type: 'error', message: `unknown message type: ${msg.type}` });
    } catch (e) {
      syncLogger.recordLog({
        vaultId,
        userId: client.userId,
        username: client.username,
        deviceName: client.deviceName,
        action: 'error',
        path: msg.path || 'unknown',
        status: 'error',
        detail: e.message,
      });
      this._send(client.ws, { type: 'error', message: e.message });
    }
  }

  /** Push a changed file to every connected client for this vault (except the sender WebSocket if provided). */
  broadcastFileChange(vaultId, relPath, result, fromUserId, excludeWs = null) {
    this._logActivity(vaultId, { type: 'change', path: relPath, userId: fromUserId });
    const room = this.rooms.get(vaultId);
    if (!room || room.size === 0) return;
    const buf = storage.readFile(vaultId, relPath);
    if (buf === null) return;
    const payload = {
      type: 'change',
      path: relPath,
      content: buf.toString('base64'),
      hash: result?.currentHash,
    };
    for (const client of room) {
      if (excludeWs && client.ws === excludeWs) continue; // don't echo back to the pushing socket
      this._send(client.ws, payload);
    }
  }

  /** Push file deletion to all connected clients for this vault (except the sender WebSocket if provided). */
  broadcastFileDelete(vaultId, relPath, fromUserId, excludeWs = null) {
    this._logActivity(vaultId, { type: 'delete', path: relPath, userId: fromUserId });
    const room = this.rooms.get(vaultId);
    if (!room || room.size === 0) return;
    for (const client of room) {
      if (excludeWs && client.ws === excludeWs) continue; // don't echo back to the deleting socket
      this._send(client.ws, { type: 'deleted', path: relPath });
    }
  }
}

module.exports = new FnsHub();
