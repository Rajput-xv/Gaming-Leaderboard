# Performance Optimization

## Problem

With 1M users, 5M game sessions, and continuous writes, naive queries are too slow. The `/top` endpoint does a sort on the entire leaderboard table. The `/rank/:id` endpoint computes ranks across all rows just to find one user.

## Optimizations Applied

### 1. Database Indexing

| Index | Query it speeds up |
|---|---|
| `leaderboard(total_score DESC)` | `/top` -- avoids full table sort, uses index scan |
| `leaderboard(user_id)` | `/rank/:id` and upsert conflict detection |
| `game_sessions(user_id)` | FK constraint checks on insert, session lookups |
| `game_sessions(score DESC)` | Any score-range queries |

Without the `total_score DESC` index, PostgreSQL must sort all leaderboard rows on every `/top` request. With it, the planner uses an index-only scan for the top-10.

### 2. Redis Caching

| Key | TTL | Cuts DB load for |
|---|---|---|
| `leaderboard:top10` | 10s | `/top` -- the most frequent read |
| `leaderboard:rank:{id}` | 5s | `/rank/:id` -- per-user lookups |

Cache-hit response time: ~1ms (redis round-trip).
Cache-miss response time: varies (50ms-500ms depending on table size).

### 3. Query Optimization

- `DENSE_RANK()` window function used instead of self-joins or subqueries for ranking.
- `LIMIT 10` applied after ranking so PostgreSQL only materializes top results.
- Parameterized queries (`$1`, `$2`) to enable prepared statement caching in `pg`.

### 4. Connection Pooling

`pg.Pool` with `max: 20` connections. This avoids creating a new TCP connection per request. Under load, requests queue for an available connection instead of failing.

### 5. Response Compression

`compression` middleware gzip-compresses JSON responses. The top-10 payload compresses significantly since usernames are repetitive patterns.

### 6. Upsert Pattern

`ON CONFLICT (user_id) DO UPDATE SET total_score = total_score + $2` avoids a SELECT-then-UPDATE cycle. Single atomic statement, single row lock.

## What Could Be Done Further

- **Materialized views** for the leaderboard ranking (refresh periodically instead of computing DENSE_RANK on every cache miss)
- **Redis sorted sets** (`ZADD`/`ZRANK`) to maintain rankings in-memory, eliminating the DB rank query entirely
- **Read replicas** to split read traffic from write traffic
- **Batch rank recalculation** via a background job instead of computing on read
