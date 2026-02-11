require("dotenv").config();

const config = {
  port: parseInt(process.env.PORT || "8000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  cacheTtl: {
    leaderboard: parseInt(process.env.CACHE_TTL_LEADERBOARD || "10", 10),
    rank: parseInt(process.env.CACHE_TTL_RANK || "5", 10),
  },
};

module.exports = config;
