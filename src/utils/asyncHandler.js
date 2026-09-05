/**
 * 包一层 async 路由处理函数：内部抛出的异常/reject 会被自动 catch 并交给
 * Express 的错误处理中间件，而不是让请求永远挂起、或者只在控制台打一条
 * UnhandledPromiseRejection 警告完事。
 *
 * 用法：router.get('/x', asyncHandler(async (req, res) => { ... }))
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
