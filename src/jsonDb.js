const fs = require('fs');
const path = require('path');

/**
 * Minimal JSON-file-backed store with atomic writes.
 * Not for high concurrency — fine for a personal/small-team FNS server.
 */
class JsonDb {
  constructor(filePath, defaultValue) {
    this.filePath = filePath;
    this.defaultValue = defaultValue;
    this._ensure();
  }

  _ensure() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify(this.defaultValue, null, 2));
    }
  }

  read() {
    this._ensure();
    const raw = fs.readFileSync(this.filePath, 'utf8');
    try {
      return JSON.parse(raw);
    } catch (e) {
      return this.defaultValue;
    }
  }

  write(data) {
    const tmp = this.filePath + '.tmp.' + Date.now() + '.' + Math.random().toString(36).slice(2, 6);
    try {
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tmp, this.filePath);
    } catch (err) {
      try {
        if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      } catch {}
      throw err;
    }
  }

  update(fn) {
    const data = this.read();
    const next = fn(data);
    this.write(next);
    return next;
  }
}

module.exports = JsonDb;
