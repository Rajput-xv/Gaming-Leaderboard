# Redis Setup & Caching

## What Redis Does Here

Redis acts as an in-memory cache layer between the API and PostgreSQL. It stores serialized JSON responses with a TTL (time-to-live) so repeated reads avoid hitting the database.

## Install Redis Locally

**Windows (WSL or Docker):**

```bash
# Docker (simplest)
docker run -d --name redis -p 6379:6379 redis:7-alpine

# or WSL
sudo apt install redis-server
sudo service redis-server start
```

**Mac:**

```bash
brew install redis
brew services start redis
```

**Verify:**

```bash
redis-cli ping
# should return PONG
```

## Configuration

In `.env`:

```
REDIS_URL=redis://localhost:6379
CACHE_TTL_LEADERBOARD=10
CACHE_TTL_RANK=5
```

- `REDIS_URL` -- connection string. For Redis Cloud or hosted Redis, use the full URL with auth: `redis://username:password@host:port`
- `CACHE_TTL_LEADERBOARD` -- how long the top-10 response stays cached (seconds)
- `CACHE_TTL_RANK` -- how long a player's rank stays cached (seconds)

## How the Code Uses Redis

File: `server/src/config/redis.js`

```
ioredis client with:
  maxRetriesPerRequest: 3
  retryStrategy: exponential backoff (500ms * attempt, max 5s, gives up after 10 retries)
  lazyConnect: true  -- only connects when start() calls redis.connect()
  keepAlive: 10000
  connectTimeout: 10000
  TLS: auto-enabled when URL starts with rediss://
```

File: `server/src/utils/cache.js`

Three functions:
- `getCache(key)` -- returns cached string or null
- `setCache(key, value, ttlSeconds)` -- stores with EX expiry
- `invalidateCache(keys[])` -- deletes one or more keys

Cache keys:
- `leaderboard:top10` -- top 10 response
- `leaderboard:rank:{userId}` -- per-user rank response

## Cache Flow

**Read (GET /top, GET /rank/:id):**

```
request -> check redis -> cache hit? -> return cached JSON
                       -> cache miss? -> query PostgreSQL -> store in redis -> return
```

**Write (POST /submit):**

```
request -> BEGIN transaction
        -> upsert user (create if not exists)
        -> insert game session
        -> upsert leaderboard (add score to total)
        -> COMMIT
        -> invalidate leaderboard:top10
        -> invalidate leaderboard:rank:{userId}
```

## Cache Invalidation Strategy

On every score submission, two keys are deleted:
1. `leaderboard:top10` -- because the top-10 may have changed
2. `leaderboard:rank:{userId}` -- because this user's rank changed

This is a write-through invalidation pattern. The next read for those keys will miss cache, query fresh data from PostgreSQL, and repopulate the cache.

## Trade-offs

| Choice | Pro | Con |
|---|---|---|
| Short TTL (5-10s) | Near-real-time data | More DB hits under load |
| Invalidate on write | Always fresh after writes | Extra redis DEL calls per submit |
| Graceful degradation | Server works if Redis is down | Slower responses without cache |

## If Redis Is Unavailable

The server starts normally. `getCache` returns `null`, `setCache` and `invalidateCache` silently catch errors. All requests go directly to PostgreSQL. The startup log shows `redis unavailable, running without cache`.
