// e.g. git@github.com:user/repo.git — 标准 SCP 短语法，没有 scheme
const SCP_LIKE_GIT_URL_RE = /^[A-Za-z0-9._-]+@[A-Za-z0-9._-]+:[A-Za-z0-9._~/-]+$/;

const ALLOWED_GIT_URL_PROTOCOLS = new Set(['http:', 'https:', 'git:', 'ssh:']);

/**
 * 校验一个 Git 远程地址是否安全，只允许标准的 http(s)/git/ssh URL，
 * 或者 git@host:path 这种标准 SCP 短语法。
 *
 * 拒绝一切其他形式——最重要的是拒绝 Git 自带的 ext:: / fd:: 这类"外部传输协议"
 * （可以被用来执行任意命令，是公开资料里很经典的 git 远程 RCE 手法），以及
 * file:// 本地路径（能读到服务器上其他 vault 的内容，造成跨租户数据泄露）。
 *
 * 校验失败抛出 Error；调用方应该把这个 message 原样展示给用户。
 * 空字符串/未设置视为合法（代表"未配置远程仓库"）。
 */
function validateGitRemoteUrl(url) {
  if (!url) return;
  const trimmed = String(url).trim();
  if (!trimmed) return;

  if (/[\r\n]/.test(trimmed)) {
    throw new Error('Git 远程地址不能包含换行符。');
  }

  let parsed = null;
  try {
    parsed = new URL(trimmed);
  } catch {
    parsed = null;
  }

  if (parsed) {
    if (!ALLOWED_GIT_URL_PROTOCOLS.has(parsed.protocol)) {
      throw new Error(
        `不支持的 Git 远程地址协议 "${parsed.protocol}"，只允许 http:// https:// git:// ssh://`
      );
    }
    return;
  }

  if (SCP_LIKE_GIT_URL_RE.test(trimmed)) {
    return;
  }

  throw new Error(
    `无法识别的 Git 远程地址格式："${trimmed}"。请使用类似 https://host/repo.git 或 ` +
    `git@host:path/repo.git 的标准格式。`
  );
}

module.exports = { validateGitRemoteUrl };
