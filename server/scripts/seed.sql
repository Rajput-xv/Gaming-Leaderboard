-- =============================================================
-- Gaming Leaderboard - Database Schema & Seed Data
-- Run this against your Supabase PostgreSQL database
-- =============================================================

-- Schema
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    score INT NOT NULL,
    game_mode VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leaderboard (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    total_score INT NOT NULL,
    rank INT,
    UNIQUE(user_id)
);

-- Performance indexes for queries on millions of rows
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_score ON game_sessions(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_total_score ON leaderboard(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id);

-- =============================================================
-- Seed Data (adjust numbers if too slow)
-- =============================================================

-- Populate users (1M records)
INSERT INTO users (username)
SELECT 'user_' || generate_series(1, 1000000);

-- Populate game sessions (5M records)
INSERT INTO game_sessions (user_id, score, game_mode, timestamp)
SELECT
    floor(random() * 1000000 + 1)::int,
    floor(random() * 10000 + 1)::int,
    CASE WHEN random() > 0.5 THEN 'solo' ELSE 'team' END,
    NOW() - INTERVAL '1 day' * floor(random() * 365)
FROM generate_series(1, 5000000);

-- Populate leaderboard by aggregating scores
INSERT INTO leaderboard (user_id, total_score, rank)
SELECT user_id, SUM(score) as total_score, RANK() OVER (ORDER BY SUM(score) DESC)
FROM game_sessions
GROUP BY user_id;
