const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function setup() {
  const client = await pool.connect();
  try {
    console.log("creating tables...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        score INT NOT NULL,
        game_mode VARCHAR(50) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        total_score INT NOT NULL,
        rank INT,
        UNIQUE(user_id)
      )
    `);

    console.log("tables created.");
    console.log("creating indexes...");

    await client.query(`CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_game_sessions_score ON game_sessions(score DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leaderboard_total_score ON leaderboard(total_score DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id)`);

    console.log("indexes created.");
    console.log("seeding users (1000 for quick start)...");

    // check if users already exist
    const existing = await client.query("SELECT COUNT(*) FROM users");
    if (parseInt(existing.rows[0].count) > 0) {
      console.log(`${existing.rows[0].count} users already exist, skipping seed.`);
    } else {
      // seed 1000 users for quick start (run full 1M via supabase SQL editor)
      await client.query(`
        INSERT INTO users (username)
        SELECT 'user_' || generate_series(1, 1000)
      `);
      console.log("1000 users seeded.");

      console.log("seeding game sessions (5000 records)...");
      await client.query(`
        INSERT INTO game_sessions (user_id, score, game_mode, timestamp)
        SELECT
          floor(random() * 1000 + 1)::int,
          floor(random() * 10000 + 1)::int,
          CASE WHEN random() > 0.5 THEN 'solo' ELSE 'team' END,
          NOW() - INTERVAL '1 day' * floor(random() * 365)
        FROM generate_series(1, 5000)
      `);
      console.log("5000 sessions seeded.");

      console.log("populating leaderboard...");
      await client.query(`
        INSERT INTO leaderboard (user_id, total_score, rank)
        SELECT user_id, SUM(score) as total_score, RANK() OVER (ORDER BY SUM(score) DESC)
        FROM game_sessions
        GROUP BY user_id
      `);
      console.log("leaderboard populated.");
    }

    console.log("setup complete.");
  } catch (err) {
    console.error("setup failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
