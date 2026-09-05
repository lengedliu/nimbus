const fs = require('fs');
const path = require('path');
const { DATA_DIR, VERSION } = require('./config');
const dbManager = require('./db');
const vaultsStore = require('./vaults');

/**
 * 生产级健康检查探针：真实检测数据库读写、磁盘剩余空间及存储卷写入权限
 */
async function getHealthStatus() {
  const issues = [];
  let dbOk = false;
  let diskStats = null;

  // 1. 探测数据库真实连通性
  try {
    if (dbManager.type === 'json') {
      const exists = fs.existsSync(DATA_DIR);
      if (!exists) {
        issues.push('数据存储主目录 DATA_DIR 不存在');
      } else {
        dbOk = true;
      }
    } else {
      await dbManager.queryOne('SELECT 1 as alive');
      dbOk = true;
    }
  } catch (err) {
    issues.push(`数据库查询失败: ${err.message}`);
  }

  // 2. 探测磁盘存储写入能力与剩余空间
  try {
    const testFile = path.join(DATA_DIR, `.health-probe-${Date.now()}.tmp`);
    fs.writeFileSync(testFile, 'ok', 'utf8');
    fs.unlinkSync(testFile);

    let freeMb = null;
    let totalMb = null;
    if (typeof fs.statfsSync === 'function') {
      const stat = fs.statfsSync(DATA_DIR);
      totalMb = Math.round((stat.blocks * stat.bsize) / (1024 * 1024));
      freeMb = Math.round((stat.bavail * stat.bsize) / (1024 * 1024));
      if (freeMb < 100) {
        issues.push(`磁盘可用空间不足预警 (${freeMb} MB < 100 MB)`);
      }
    }

    diskStats = {
      writable: true,
      freeMb,
      totalMb,
    };
  } catch (err) {
    issues.push(`存储卷写入权限异常: ${err.message}`);
    diskStats = {
      writable: false,
      error: err.message,
    };
  }

  const mem = process.memoryUsage();
  const memStats = {
    rssMb: Math.round(mem.rss / 1024 / 1024),
    heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
  };

  const isHealthy = issues.length === 0;

  return {
    ok: isHealthy,
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'nimbus-vault-sync',
    version: VERSION,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    database: {
      type: dbManager.type || 'json',
      connected: dbOk,
    },
    storage: diskStats,
    memory: memStats,
    vaultsCount: vaultsStore.getRawVaults ? vaultsStore.getRawVaults().length : 0,
    issues: issues.length > 0 ? issues : undefined,
  };
}

module.exports = {
  getHealthStatus,
};
