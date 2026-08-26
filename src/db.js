const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./config');

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
 * DB Types: 'json' (default/legacy), 'sqlite', 'postgres', 'mysql'
 */
class DatabaseManager {
  constructor() {
    this.type = 'json'; // default
    this.connectionConfig = {};
    this.initialized = false;
    this.sqliteDb = null;
    this.pgPool = null;
    this.mysqlPool = null;
  }

  detectConfigFromEnv() {
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

  async init(configOverride = null) {
    const config = configOverride || this.detectConfigFromEnv();
    this.type = config.type || 'json';
    this.connectionConfig = config;

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
      await this._createSqliteTables();
    } else if (this.type === 'postgres' || this.type === 'postgresql') {
      this.type = 'postgres';
      const { Pool } = getPg();
      const poolConfig = config.connectionString
        ? { connectionString: config.connectionString }
        : {
            host: config.host,
            port: config.port || 5432,
            user: config.user,
            password: config.password,
            database: config.database,
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
  }

  async testConnection(config) {
    const type = (config.type || '').toLowerCase();
    if (type === 'sqlite') {
      const SQLite = getSqlite3();
      const testPath = path.resolve(config.sqlitePath || path.join(DATA_DIR, 'test_connect.sqlite'));
      return new Promise((resolve) => {
        const db = new SQLite.Database(testPath, (err) => {
          if (err) return resolve({ ok: false, error: err.message });
          db.close();
          resolve({ ok: true, message: `SQLite 连接成功 (${testPath})` });
        });
      });
    }

    if (type === 'postgres' || type === 'postgresql') {
      const { Pool } = getPg();
      const pool = new Pool(
        config.connectionString
          ? { connectionString: config.connectionString, connectionTimeoutMillis: 3000 }
          : {
              host: config.host,
              port: config.port || 5432,
              user: config.user,
              password: config.password,
              database: config.database,
              connectionTimeoutMillis: 3000,
            }
      );
      try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        await pool.end();
        return { ok: true, message: 'PostgreSQL 数据库连接成功' };
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
          connectTimeout: 3000,
        });
        await conn.query('SELECT 1');
        await conn.end();
        return { ok: true, message: 'MySQL 数据库连接成功' };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    return { ok: true, message: 'JSON 本地文件存储模式正常' };
  }

  getStatus() {
    return {
      type: this.type,
      activeEngine: this.type.toUpperCase(),
      config: {
        type: this.type,
        sqlitePath: this.connectionConfig.sqlitePath || path.join(DATA_DIR, 'nimbus.sqlite'),
        host: this.connectionConfig.host || '',
        port: this.connectionConfig.port || '',
        database: this.connectionConfig.database || '',
        user: this.connectionConfig.user || '',
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
      // replace ? with $1, $2... for postgres
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
}

const dbManager = new DatabaseManager();
module.exports = dbManager;
