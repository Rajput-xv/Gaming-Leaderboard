const redis = require("../config/redis");

const KEYS = {
  TOP_LEADERBOARD: "leaderboard:top10",
  PLAYER_RANK: (userId) => `leaderboard:rank:${userId}`,
};

async function getCache(key) {
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

async function setCache(key, value, ttlSeconds) {
  try {
    await redis.set(key, value, "EX", ttlSeconds);
  } catch (err) {
    console.error("cache set failed:", err);
  }
}

async function invalidateCache(keys) {
  try {
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error("cache invalidation failed:", err);
  }
}

module.exports = { KEYS, getCache, setCache, invalidateCache };
