const { Pool } = require("pg");
const config = require("./index");

// connection pool with sensible defaults for high-throughput
const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("unexpected pg pool error:", err.message);
});

module.exports = pool;
