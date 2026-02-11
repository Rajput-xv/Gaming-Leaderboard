const pool = require("../config/db");
const config = require("../config/index");
const { KEYS, getCache, setCache, invalidateCache } = require("../utils/cache");

// submit a score: insert session + update leaderboard atomically
async function submitScore(userId, score) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // insert new game session with default game_mode
    await client.query(
      `INSERT INTO game_sessions (user_id, score, game_mode)
       VALUES ($1, $2, 'solo')`,
      [userId, score]
    );

    // upsert leaderboard: add score to existing total or create new entry
    await client.query(
      `INSERT INTO leaderboard (user_id, total_score, rank)
       VALUES ($1, $2, 0)
       ON CONFLICT (user_id)
       DO UPDATE SET total_score = leaderboard.total_score + $2`,
      [userId, score]
    );

    await client.query("COMMIT");

    // invalidate caches so next read picks up fresh data
    await invalidateCache([KEYS.TOP_LEADERBOARD, KEYS.PLAYER_RANK(userId)]);

    return { message: "score submitted" };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// get top 10 players by total_score
async function getTopPlayers() {
  // try cache first
  const cached = await getCache(KEYS.TOP_LEADERBOARD);
  if (cached) {
    return JSON.parse(cached);
  }

  // dense_rank for accurate ranking even with tied scores
  const result = await pool.query(
    `SELECT l.user_id, u.username, l.total_score,
            DENSE_RANK() OVER (ORDER BY l.total_score DESC)::int AS rank
     FROM leaderboard l
     JOIN users u ON u.id = l.user_id
     ORDER BY l.total_score DESC
     LIMIT 10`
  );

  const rows = result.rows;
  await setCache(
    KEYS.TOP_LEADERBOARD,
    JSON.stringify(rows),
    config.cacheTtl.leaderboard
  );

  return rows;
}

// get a single player's rank
async function getPlayerRank(userId) {
  const cacheKey = KEYS.PLAYER_RANK(userId);
  const cached = await getCache(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // subquery ranks all players, outer query filters to target user
  const result = await pool.query(
    `SELECT user_id, username, total_score, rank::int
     FROM (
       SELECT l.user_id, u.username, l.total_score,
              DENSE_RANK() OVER (ORDER BY l.total_score DESC) AS rank
       FROM leaderboard l
       JOIN users u ON u.id = l.user_id
     ) ranked
     WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const player = result.rows[0];
  await setCache(cacheKey, JSON.stringify(player), config.cacheTtl.rank);

  return player;
}

module.exports = { submitScore, getTopPlayers, getPlayerRank };
