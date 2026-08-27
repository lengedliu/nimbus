const fs = require('fs');
const path = require('path');
const { DATA_DIR, USERS_FILE, VAULTS_FILE } = require('./config');

const DB_CONFIG_FILE = path.join(DATA_DIR, 'db_config.json');

let sqlite3 = null;
let pg = null;
let mysql = null;

function getSqlite3() {
  if (!sqlite3) sqlite3 = require('sqlite3').verbose();
  return sqlite3;
}

function getPg() {
  if (!pg) pg = require('pg');
  return pg;
}

function getMysql() {
  if (!mysql) mysql = require('mysql2/promise');
  return mysql;
}

/**
 * DB Types: 'json' (default), 'sqlite', 'postgres', 'mysql'
 */
class DatabaseManager {
  constructor() {
    this.type = 'json';
    this.connectionConfig = {};
    this.initialized = false;
    this.sqliteDb = null;
    this.pgPool = null;
    this.mysqlPool = null;
  }

  loadPersistentConfig() {
    if (fs.existsSync(DB_CONFIG_FILE)) {
      try {
        const raw = JSON.parse(fs.readFileSync(DB_CONFIG_FILE, 'utf8'));
        if (raw && raw.type) return raw;
      } catch (err) {
        console.error('[DB] Failed to read db_config.json:', err.message);
      }
    }
    return null;
  }

  savePersistentConfig(config) {
    try {
      fs.mkdirSync(path.dirname(DB_CONFIG_FILE), { recursive: true });
      fs.writeFileSync(DB_CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (err) {
      console.error('[DB] Failed to save db_config.json:', err.message);
    }
  }

  detectConfig() {
    const saved = this.loadPersistentConfig();
    if (saved) return saved;

    const dbType = (process.env.DB_TYPE || '').toLowerCase();
    if (dbType === 'sqlite' || process.env.SQLITE_PATH) {
      return {
        type: 'sqlite',
        sqlitePath: process.env.SQLITE_PATH || path.join(DATA_DIR, 'nimbus.sqlite'),
      };
    }
    if (dbType === 'postgres' || dbType === 'postgresql' || process.env.DATABASE_URL || process.env.PG_HOST) {
      return {
        type: 'postgres',
        connectionString: process.env.DATABASE_URL || '',
        host: process.env.PG_HOST || 'localhost',
        port: parseInt(process.env.PG_PORT || '5432', 10),
        user: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASSWORD || '',
        database: process.env.PG_DATABASE || 'nimbus',
        ssl: process.env.PG_SSL === 'true',
      };
    }
    if (dbType === 'mysql' || process.env.MYSQL_HOST) {
      return {
        type: 'mysql',
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306', 10),
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'nimbus',
      };
    }
    return { type: 'json' };
  }

  async close() {
    if (this.sqliteDb) {
      try {
        await new Promise((res) => this.sqliteDb.close(res));
      } catch {}
      this.sqliteDb = null;
    }
    if (this.pgPool) {
      try {
        await this.pgPool.end();
      } catch {}
      this.pgPool = null;
    }
    if (this.mysqlPool) {
      try {
        await this.mysqlPool.end();
      } catch {}
      this.mysqlPool = null;
    }
    this.initialized = false;
  }

  async init(configOverride = null) {
    await this.close();

    const config = configOverride || this.detectConfig();
    this.type = (config.type || 'json').toLowerCase();
    this.connectionConfig = { ...config, type: this.type };

    if (this.type === 'sqlite') {
      const dbPath = path.resolve(config.sqlitePath || path.join(DATA_DIR, 'nimbus.sqlite'));
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      const SQLite = getSqlite3();
      await new Promise((resolve, reject) => {
        this.sqliteDb = new SQLite.Database(dbPath, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      // Enable WAL mode for better concurrency in SQLite
      await new Promise((resolve) => {
        this.sqliteDb.run('PRAGMA journal_mode = WAL;', () => resolve());
      });
      await this._createSqliteTables();
    } else if (this.type === 'postgres' || this.type === 'postgresql') {
      this.type = 'postgres';
      const { Pool } = getPg();
      const poolConfig = config.connectionString
        ? {
            connectionString: config.connectionString,
            ssl: config.ssl ? { rejectUnauthorized: false } : false,
          }
        : {
            host: config.host,
            port: config.port || 5432,
            user: config.user,
            password: config.password,
            database: config.database,
            ssl: config.ssl ? { rejectUnauthorized: false } : false,
          };
      this.pgPool = new Pool(poolConfig);
      await this._createPostgresTables();
    } else if (this.type === 'mysql') {
      const mysqlPkg = getMysql();
      this.mysqlPool = mysqlPkg.createPool({
        host: config.host,
        port: config.port || 3306,
        user: config.user,
        password: config.password,
        database: config.database,
        waitForConnections: true,
        connectionLimit: 10,
      });
      await this._createMysqlTables();
    }

    this.initialized = true;
    console.log(`[DB] Database initialized successfully. Active engine: ${this.type.toUpperCase()}`);
    return { type: this.type, ok: true };
  }

  async _createSqliteTables() {
    const run = (sql) => new Promise((res, rej) => this.sqliteDb.run(sql, (err) => err ? rej(err) : res()));
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    await run(`
      CREATE TABLE IF NOT EXISTS vaults (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    await run(`
      CREATE TABLE IF NOT EXISTS shares (
        id TEXT PRIMARY KEY,
        vault_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        file_path TEXT NOT NULL,
        title TEXT NOT NULL,
        has_password INTEGER NOT NULL,
        password_hash TEXT,
        allow_copy INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER,
        view_count INTEGER NOT NULL DEFAULT 0
      );
    `);
    await run(`
      CREATE TABLE IF NOT EXISTS sync_rules (
        vault_id TEXT PRIMARY KEY,
        rules_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    await run(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    await run(`
      CREATE TABLE IF NOT EXISTS api_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        label TEXT NOT NULL,
        token TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_used_at INTEGER
      );
    `);
    await run(`
      CREATE TABLE IF NOT EXISTS sync_logs (
        id TEXT PRIMARY KEY,
        vault_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        device_name TEXT NOT NULL,
        client_ip TEXT,
        action TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER DEFAULT 0,
        file_hash TEXT,
        status TEXT NOT NULL,
        detail TEXT,
        timestamp INTEGER NOT NULL
      );
    `);
    await run(`
      CREATE TABLE IF NOT EXISTS vault_members (
        id TEXT PRIMARY KEY,
        vault_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        permission TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE(vault_id, user_id)
      );
    `);
  }

  async _createPostgresTables() {
    await this.pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(128) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS vaults (
        id VARCHAR(64) PRIMARY KEY,
        owner_id VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS shares (
        id VARCHAR(64) PRIMARY KEY,
        vault_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        file_path TEXT NOT NULL,
        title VARCHAR(255) NOT NULL,
        has_password BOOLEAN NOT NULL,
        password_hash VARCHAR(255),
        allow_copy BOOLEAN NOT NULL DEFAULT TRUE,
        created_at BIGINT NOT NULL,
        expires_at BIGINT,
        view_count INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS sync_rules (
        vault_id VARCHAR(64) PRIMARY KEY,
        rules_json TEXT NOT NULL,
        updated_at BIGINT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(128) PRIMARY KEY,
        value_json TEXT NOT NULL,
        updated_at BIGINT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS api_tokens (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        label VARCHAR(128) NOT NULL,
        token TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        last_used_at BIGINT
      );
      CREATE TABLE IF NOT EXISTS sync_logs (
        id VARCHAR(64) PRIMARY KEY,
        vault_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        username VARCHAR(128) NOT NULL,
        device_name VARCHAR(128) NOT NULL,
        client_ip VARCHAR(64),
        action VARCHAR(32) NOT NULL,
        file_path TEXT NOT NULL,
        file_size BIGINT DEFAULT 0,
        file_hash VARCHAR(128),
        status VARCHAR(32) NOT NULL,
        detail TEXT,
        timestamp BIGINT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS vault_members (
        id VARCHAR(64) PRIMARY KEY,
        vault_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        permission VARCHAR(32) NOT NULL,
        created_at BIGINT NOT NULL,
        UNIQUE(vault_id, user_id)
      );
    `);
  }

  async _createMysqlTables() {
    await this.mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(128) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL,
        created_at VARCHAR(64) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await this.mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS vaults (
        id VARCHAR(64) PRIMARY KEY,
        owner_id VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at VARCHAR(64) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await this.mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS shares (
        id VARCHAR(64) PRIMARY KEY,
        vault_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        file_path TEXT NOT NULL,
        title VARCHAR(255) NOT NULL,
        has_password TINYINT(1) NOT NULL,
        password_hash VARCHAR(255),
        allow_copy TINYINT(1) NOT NULL DEFAULT 1,
        created_at BIGINT NOT NULL,
        expires_at BIGINT,
        view_count INT NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await this.mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS sync_rules (
        vault_id VARCHAR(64) PRIMARY KEY,
        rules_json LONGTEXT NOT NULL,
        updated_at BIGINT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await this.mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(128) PRIMARY KEY,
        value_json LONGTEXT NOT NULL,
        updated_at BIGINT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await this.mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS api_tokens (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        label VARCHAR(128) NOT NULL,
        token TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        last_used_at BIGINT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await this.mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS sync_logs (
        id VARCHAR(64) PRIMARY KEY,
        vault_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        username VARCHAR(128) NOT NULL,
        device_name VARCHAR(128) NOT NULL,
        client_ip VARCHAR(64),
        action VARCHAR(32) NOT NULL,
        file_path TEXT NOT NULL,
        file_size BIGINT DEFAULT 0,
        file_hash VARCHAR(128),
        status VARCHAR(32) NOT NULL,
        detail TEXT,
        timestamp BIGINT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await this.mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS vault_members (
        id VARCHAR(64) PRIMARY KEY,
        vault_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        permission VARCHAR(32) NOT NULL,
        created_at BIGINT NOT NULL,
        UNIQUE KEY uk_vault_user (vault_id, user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  async testConnection(config) {
    const type = (config.type || '').toLowerCase();
    const startTime = Date.now();

    if (type === 'sqlite') {
      const SQLite = getSqlite3();
      const testPath = path.resolve(config.sqlitePath || path.join(DATA_DIR, 'test_connect.sqlite'));
      try {
        fs.mkdirSync(path.dirname(testPath), { recursive: true });
        return await new Promise((resolve) => {
          const db = new SQLite.Database(testPath, (err) => {
            if (err) return resolve({ ok: false, error: err.message });
            db.run('SELECT 1;', (rErr) => {
              db.close();
              if (rErr) return resolve({ ok: false, error: rErr.message });
              const latencyMs = Date.now() - startTime;
              resolve({ ok: true, message: `SQLite 连接测试成功 (${latencyMs}ms)`, latencyMs });
            });
          });
        });
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    if (type === 'postgres' || type === 'postgresql') {
      const { Pool } = getPg();
      const pool = new Pool(
        config.connectionString
          ? {
              connectionString: config.connectionString,
              connectionTimeoutMillis: 4000,
              ssl: config.ssl ? { rejectUnauthorized: false } : false,
            }
          : {
              host: config.host,
              port: config.port || 5432,
              user: config.user,
              password: config.password,
              database: config.database,
              connectionTimeoutMillis: 4000,
              ssl: config.ssl ? { rejectUnauthorized: false } : false,
            }
      );
      try {
        const client = await pool.connect();
        const res = await client.query('SELECT version();');
        client.release();
        await pool.end();
        const latencyMs = Date.now() - startTime;
        const ver = res.rows[0]?.version || 'PostgreSQL';
        return { ok: true, message: `PostgreSQL 连接成功 (${latencyMs}ms): ${ver.split(' on ')[0]}`, latencyMs };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    if (type === 'mysql') {
      const mysqlPkg = getMysql();
      try {
        const conn = await mysqlPkg.createConnection({
          host: config.host,
          port: config.port || 3306,
          user: config.user,
          password: config.password,
          database: config.database,
          connectTimeout: 4000,
        });
        const [rows] = await conn.query('SELECT VERSION() as ver');
        await conn.end();
        const latencyMs = Date.now() - startTime;
        const ver = rows[0]?.ver || 'MySQL';
        return { ok: true, message: `MySQL 连接成功 (${latencyMs}ms): Version ${ver}`, latencyMs };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    return { ok: true, message: 'JSON 本地文件存储模式运行就绪 (零配置/毫秒级本地 IO)', latencyMs: 0 };
  }

  getStatus() {
    return {
      type: this.type,
      activeEngine: this.type.toUpperCase(),
      initialized: this.initialized,
      config: {
        type: this.type,
        sqlitePath: this.connectionConfig.sqlitePath || path.join(DATA_DIR, 'nimbus.sqlite'),
        connectionString: this.connectionConfig.connectionString ? '***' : '',
        host: this.connectionConfig.host || '',
        port: this.connectionConfig.port || '',
        database: this.connectionConfig.database || '',
        user: this.connectionConfig.user || '',
        ssl: Boolean(this.connectionConfig.ssl),
      },
    };
  }

  // ------------------------- Generic SQL Query Helpers -------------------------

  async queryAll(sql, params = []) {
    if (this.type === 'sqlite') {
      return new Promise((res, rej) => {
        this.sqliteDb.all(sql, params, (err, rows) => (err ? rej(err) : res(rows || [])));
      });
    }
    if (this.type === 'postgres') {
      let i = 1;
      const pgSql = sql.replace(/\?/g, () => `$${i++}`);
      const result = await this.pgPool.query(pgSql, params);
      return result.rows;
    }
    if (this.type === 'mysql') {
      const [rows] = await this.mysqlPool.query(sql, params);
      return rows;
    }
    return [];
  }

  async queryOne(sql, params = []) {
    const rows = await this.queryAll(sql, params);
    return rows[0] || null;
  }

  async execute(sql, params = []) {
    if (this.type === 'sqlite') {
      return new Promise((res, rej) => {
        this.sqliteDb.run(sql, params, function (err) {
          if (err) return rej(err);
          res({ changes: this.changes, lastID: this.lastID });
        });
      });
    }
    if (this.type === 'postgres') {
      let i = 1;
      const pgSql = sql.replace(/\?/g, () => `$${i++}`);
      const result = await this.pgPool.query(pgSql, params);
      return { changes: result.rowCount };
    }
    if (this.type === 'mysql') {
      const [result] = await this.mysqlPool.query(sql, params);
      return { changes: result.affectedRows };
    }
    return { changes: 0 };
  }

  // ------------------------- Engine Switch & Data Migration -------------------------

  async switchAndMigrate(targetConfig, dataset, doMigrate = true) {
    const targetType = (targetConfig.type || 'json').toLowerCase();

    // 1. Initialize target engine
    await this.init(targetConfig);

    // 2. If migration requested, import dataset into target engine
    let migratedCounts = {
      users: 0,
      vaults: 0,
      shares: 0,
      syncRules: 0,
      systemSettings: 0,
      apiTokens: 0,
      syncLogs: 0,
    };

    if (doMigrate && dataset) {
      if (targetType === 'json') {
        // Save to JSON files
        const usersData = { users: dataset.users || [] };
        const vaultsData = { vaults: dataset.vaults || [] };
        fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2));
        fs.writeFileSync(VAULTS_FILE, JSON.stringify(vaultsData, null, 2));
        fs.writeFileSync(path.join(DATA_DIR, 'shares.json'), JSON.stringify(dataset.shares || [], null, 2));
        fs.writeFileSync(path.join(DATA_DIR, 'settings.json'), JSON.stringify(dataset.systemSettings || {}, null, 2));
        fs.writeFileSync(path.join(DATA_DIR, 'api_tokens.json'), JSON.stringify(dataset.apiTokens || [], null, 2));
        fs.writeFileSync(path.join(DATA_DIR, 'sync_logs.json'), JSON.stringify(dataset.syncLogs || [], null, 2));

        migratedCounts = {
          users: (dataset.users || []).length,
          vaults: (dataset.vaults || []).length,
          shares: (dataset.shares || []).length,
          syncRules: Object.keys(dataset.syncRules || {}).length,
          systemSettings: Object.keys(dataset.systemSettings || {}).length,
          apiTokens: (dataset.apiTokens || []).length,
          syncLogs: (dataset.syncLogs || []).length,
        };
      } else {
        // Insert into SQL tables
        // Users
        for (const u of dataset.users || []) {
          try {
            await this.execute(
              'INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)',
              [u.id, u.username, u.passwordHash, u.role, u.createdAt]
            );
            migratedCounts.users++;
          } catch (e) {
            console.warn('[DB Migrate] user insert skipped:', e.message);
          }
        }

        // Vaults
        for (const v of dataset.vaults || []) {
          try {
            await this.execute('INSERT INTO vaults (id, owner_id, name, created_at) VALUES (?, ?, ?, ?)', [
              v.id,
              v.ownerId,
              v.name,
              v.createdAt,
            ]);
            migratedCounts.vaults++;
          } catch (e) {
            console.warn('[DB Migrate] vault insert skipped:', e.message);
          }
        }

        // Shares
        for (const s of dataset.shares || []) {
          try {
            await this.execute(
              'INSERT INTO shares (id, vault_id, user_id, file_path, title, has_password, password_hash, allow_copy, created_at, expires_at, view_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [
                s.id,
                s.vaultId,
                s.userId,
                s.filePath,
                s.title,
                s.hasPassword ? 1 : 0,
                s.passwordHash || null,
                s.allowCopy ? 1 : 0,
                s.createdAt,
                s.expiresAt || null,
                s.viewCount || 0,
              ]
            );
            migratedCounts.shares++;
          } catch (e) {
            console.warn('[DB Migrate] share insert skipped:', e.message);
          }
        }

        // Sync rules
        const rulesMap = dataset.syncRules || {};
        const now = Date.now();
        for (const [vaultId, rules] of Object.entries(rulesMap)) {
          try {
            await this.execute(
              'INSERT INTO sync_rules (vault_id, rules_json, updated_at) VALUES (?, ?, ?)',
              [vaultId, JSON.stringify(rules), now]
            );
            migratedCounts.syncRules++;
          } catch (e) {
            console.warn('[DB Migrate] sync_rules insert skipped:', e.message);
          }
        }

        // System settings
        for (const [key, val] of Object.entries(dataset.systemSettings || {})) {
          try {
            await this.execute(
              'INSERT INTO system_settings (setting_key, value_json, updated_at) VALUES (?, ?, ?)',
              [key, JSON.stringify(val), now]
            );
            migratedCounts.systemSettings++;
          } catch (e) {
            console.warn('[DB Migrate] system_settings insert skipped:', e.message);
          }
        }

        // API Tokens
        for (const t of dataset.apiTokens || []) {
          try {
            await this.execute(
              'INSERT INTO api_tokens (id, user_id, label, token, created_at, last_used_at) VALUES (?, ?, ?, ?, ?, ?)',
              [t.id, t.userId, t.label, t.token, t.createdAt, t.lastUsedAt || null]
            );
            migratedCounts.apiTokens++;
          } catch (e) {
            console.warn('[DB Migrate] api_token insert skipped:', e.message);
          }
        }

        // Sync Logs
        for (const l of dataset.syncLogs || []) {
          try {
            await this.execute(
              `INSERT INTO sync_logs (id, vault_id, user_id, username, device_name, client_ip, action, file_path, file_size, file_hash, status, detail, timestamp)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                l.id,
                l.vaultId,
                l.userId,
                l.username,
                l.deviceName,
                l.clientIp || null,
                l.action,
                l.path,
                l.size || 0,
                l.hash || null,
                l.status || 'success',
                l.detail || null,
                l.timestamp,
              ]
            );
            migratedCounts.syncLogs++;
          } catch (e) {
            console.warn('[DB Migrate] sync_log insert skipped:', e.message);
          }
        }
      }
    }

    // 3. Save to persistent file
    this.savePersistentConfig(this.connectionConfig);

    return {
      ok: true,
      activeEngine: this.type.toUpperCase(),
      migrated: doMigrate,
      counts: migratedCounts,
      message: `已成功切换并更新数据库引擎至 ${this.type.toUpperCase()}${doMigrate ? '，并完成全量数据平滑迁移' : ''}`,
    };
  }
}

const dbManager = new DatabaseManager();
module.exports = dbManager;
