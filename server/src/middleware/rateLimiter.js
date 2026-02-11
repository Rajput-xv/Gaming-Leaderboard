const rateLimit = require("express-rate-limit");

// 100 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "too many requests, try again later",
  },
});

module.exports = apiLimiter;
