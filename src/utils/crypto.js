const crypto = require('crypto');
const { JWT_SECRET } = require('../config');

// 优先使用专用的 ENCRYPTION_KEY，未设置时平滑回退到 JWT_SECRET
const SECRET = process.env.ENCRYPTION_KEY || JWT_SECRET || 'nimbus-storage-encryption-key-fallback';
const CIPHER_ALGO = 'aes-256-gcm';
const KEY = crypto.createHash('sha256').update(String(SECRET)).digest();

/**
 * 敏感字段落盘加密（At-Rest Encryption）
 * 格式：enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 */
function encryptField(text) {
  if (text === null || text === undefined || text === '') return '';
  const str = String(text);
  if (str.startsWith('enc:v1:')) return str; // 避免重复加密

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(CIPHER_ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(str, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `enc:v1:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * 敏感字段内存解密
 * 兼容旧数据：如果是未加密的明文字符串，原样返回并等待下次写入时加密
 */
function decryptField(val) {
  if (typeof val !== 'string' || !val) return '';
  if (!val.startsWith('enc:v1:')) return val; // 兼容未加密的旧数据

  try {
    const parts = val.split(':');
    if (parts.length !== 5) return val;
    const [, , ivHex, tagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const cipherBuffer = Buffer.from(cipherHex, 'hex');

    const decipher = crypto.createDecipheriv(CIPHER_ALGO, KEY, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(cipherBuffer), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('[Crypto] 解密字段失败，可能是加密秘钥已变更:', err.message);
    return '';
  }
}

module.exports = {
  encryptField,
  decryptField,
};
