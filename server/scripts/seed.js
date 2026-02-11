const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // set a high timeout for the client connection just in case
  connectionTimeoutMillis: 10000, 
});

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log(" Starting Database Seed...");
    const startTime = Date.now();

    // ==========================================================
    // 1. CLEANUP & SCHEMA
    // ==========================================================
    console.log("1️  Dropping old tables...");
    await client.query("DROP TABLE IF EXISTS leaderboard CASCADE");
    await client.query("DROP TABLE IF EXISTS game_sessions CASCADE");
    await client.query("DROP TABLE IF EXISTS users CASCADE");

    console.log("2️  Creating Schema (without indexes for speed)...");
    
    // Create Users
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Game Sessions
    await client.query(`
      CREATE TABLE game_sessions (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        score INT NOT NULL,
        game_mode VARCHAR(50) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Leaderboard
    await client.query(`
      CREATE TABLE leaderboard (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        total_score INT NOT NULL,
        rank INT,
        UNIQUE(user_id)
      );
    `);

    // ==========================================================
    // 2. INSERT DATA
    // ==========================================================
    console.log("3️  Seeding 1 Million Users...");
    // We use a single SQL command for this, it's fast enough
    await client.query(`
      INSERT INTO users (username)
      SELECT 'user_' || generate_series(1, 1000000);
    `);
    console.log("    Users seeded.");

    console.log("4️  Seeding 5 Million Game Sessions (in batches)...");
    // We insert in 5 chunks of 1 Million to keep memory usage low
    const totalBatches = 5;
    const rowsPerBatch = 1000000;

    for (let i = 1; i <= totalBatches; i++) {
        process.stdout.write(`    Processing batch ${i}/${totalBatches}... `);
        
        await client.query(`
            INSERT INTO game_sessions (user_id, score, game_mode, timestamp)
            SELECT
                floor(random() * 1000000 + 1)::int,
                floor(random() * 10000 + 1)::int,
                CASE WHEN random() > 0.5 THEN 'solo' ELSE 'team' END,
                NOW() - INTERVAL '1 day' * floor(random() * 365)
            FROM generate_series(1, ${rowsPerBatch});
        `);
        console.log("Done.");
    }

    console.log("5️  Populating Leaderboard...");
    await client.query(`
      INSERT INTO leaderboard (user_id, total_score, rank)
      SELECT user_id, SUM(score), RANK() OVER (ORDER BY SUM(score) DESC)
      FROM game_sessions
      GROUP BY user_id;
    `);

    // ==========================================================
    // 3. INDEXES (Create LAST for performance)
    // ==========================================================
    console.log("6️  Creating Indexes...");
    await client.query(`CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id)`);
    await client.query(`CREATE INDEX idx_game_sessions_score ON game_sessions(score DESC)`);
    await client.query(`CREATE INDEX idx_leaderboard_total_score ON leaderboard(total_score DESC)`);
    await client.query(`CREATE INDEX idx_leaderboard_user_id ON leaderboard(user_id)`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n Database seeded successfully in ${duration} seconds!`);

  } catch (err) {
    console.error("\n Seeding failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();