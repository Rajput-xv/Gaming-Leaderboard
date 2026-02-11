function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 ? "internal server error" : err.message;

  console.error(`[ERROR] ${err.message}`, err.stack);

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

module.exports = errorHandler;
