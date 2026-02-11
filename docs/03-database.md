# Database Setup

## Provider

Supabase (hosted PostgreSQL).

## Schema

Three tables:

```
users
  id          SERIAL PRIMARY KEY
  username    VARCHAR(255) UNIQUE NOT NULL
  join_date   TIMESTAMP DEFAULT NOW()

game_sessions
  id          SERIAL PRIMARY KEY
  user_id     INT -> users(id) ON DELETE CASCADE
  score       INT NOT NULL
  game_mode   VARCHAR(50) NOT NULL
  timestamp   TIMESTAMP DEFAULT NOW()

leaderboard
  id          SERIAL PRIMARY KEY
  user_id     INT -> users(id) ON DELETE CASCADE, UNIQUE
  total_score INT NOT NULL
  rank        INT
```

## Indexes

Created by the seeding script for performance on large datasets:

| Index | Column | Purpose |
|---|---|---|
| `idx_game_sessions_user_id` | `game_sessions(user_id)` | Fast session lookups per user |
| `idx_game_sessions_score` | `game_sessions(score DESC)` | Score-based queries |
| `idx_leaderboard_total_score` | `leaderboard(total_score DESC)` | Top-N ranking query |
| `idx_leaderboard_user_id` | `leaderboard(user_id)` | Single-user rank lookup |

## Why These Indexes

- `/top` sorts leaderboard by `total_score DESC` and joins with `users` -- the `total_score` index lets PostgreSQL avoid a full table scan + sort on millions of rows.
- `/rank/:user_id` needs to find a single user's row in the leaderboard -- the `user_id` index makes this an index scan instead of sequential.
- `submitScore` inserts into `game_sessions` with a `user_id` FK -- the `user_id` index speeds up the FK constraint check.

## Seed Data

Run the automated seeding script:

```bash
cd server
npm run seed
```

This script:

1. Drops existing tables (clean slate)
2. Creates schema with all indexes
3. Seeds 1M users (`user_1` through `user_1000000`)
4. Seeds 5M game sessions with random scores (1-10000), modes (solo/team), timestamps (past year)
5. Aggregates sessions into leaderboard with `SUM(score)` and `RANK()`
6. Creates indexes last for optimal bulk-insert performance

Takes 2-5 minutes on most database connections.

## UNIQUE Constraint on leaderboard(user_id)

The `UNIQUE(user_id)` constraint on the leaderboard table enables the `ON CONFLICT (user_id) DO UPDATE` upsert pattern used in `submitScore`. Without it, concurrent submissions for the same user could create duplicate rows.
