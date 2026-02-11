const Redis = require("ioredis");
const config = require("./index");

const useTls = config.redisUrl.startsWith("rediss://");

const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  keepAlive: 10000,
  connectTimeout: 10000,
  ...(useTls && { tls: { rejectUnauthorized: false } }),
  retryStrategy(times) {
    if (times > 10) return null;
    return Math.min(times * 500, 5000);
  },
  lazyConnect: true,
});

// suppress repetitive ECONNRESET spam in logs
let lastError = "";
redis.on("error", (err) => {
  if (err.message === lastError) return;
  lastError = err.message;
  console.error("redis error:", err.message);
});

redis.on("connect", () => {
  lastError = "";
});

module.exports = redis;
