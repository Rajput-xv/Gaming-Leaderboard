# Architecture

## High-Level Design (HLD)

```
Client (React + Vite)
  |
  | HTTP (port 3000, proxied to 8000)
  v
Express Server (port 8000)
  |
  |-- helmet, cors, compression, rate-limiter
  |-- /api/leaderboard routes
  |
  +---> Redis (cache layer)
  |       - top-10 leaderboard (10s TTL)
  |       - per-user rank (5s TTL)
  |
  +---> PostgreSQL / Supabase (persistent storage)
  |       - users, game_sessions, leaderboard tables
  |
  +---> New Relic Agent (monitoring)
          - transaction traces, slow SQL, error rates
```

## Low-Level Design (LLD)

### Server Module Structure

```
src/
  index.js              -- app bootstrap, middleware stack, server start
  config/
    index.js            -- loads dotenv, exports config object
    db.js               -- pg Pool (20 connections, 5s timeout)
    redis.js            -- ioredis client (lazy connect, retry backoff)
  middleware/
    errorHandler.js     -- catches errors, returns { success: false, error }
    validate.js         -- validates request body/params before controller
    rateLimiter.js      -- express-rate-limit (100 req/min/IP)
  routes/
    leaderboard.js      -- maps HTTP methods to controller functions
  controllers/
    leaderboard.js      -- parses request, calls service, sends response
  services/
    leaderboard.js      -- business logic, transactions, cache reads/writes
  utils/
    cache.js            -- redis get/set/invalidate helpers with error handling
```

### Request Flow

```
HTTP Request
  -> helmet (security headers)
  -> cors
  -> compression (gzip)
  -> express.json (body parsing)
  -> rate limiter
  -> route matching
  -> validation middleware
  -> controller
  -> service layer
    -> cache check (redis)
    -> database query (pg) [on cache miss]
    -> cache write (redis)
  -> response
  -> error handler (if any throw)
```

### Data Flow: Submit Score

```
POST /api/leaderboard/submit { user_id: 42, score: 1500 }
  1. validateSubmitScore -- checks types and ranges
  2. controller.submitScore -- extracts body, calls service
  3. service.submitScore:
     a. pool.connect() -- grab a client from the pool
     b. BEGIN
     c. INSERT INTO users ON CONFLICT DO NOTHING (auto-create user)
     d. INSERT INTO game_sessions
     e. INSERT INTO leaderboard ON CONFLICT DO UPDATE (upsert total_score)
     f. COMMIT
     g. invalidateCache([top10, rank:42])
     h. client.release()
  4. response: { success: true, data: { message: "score submitted" } }
```

### Data Flow: Get Top Players

```
GET /api/leaderboard/top
  1. controller.getTopPlayers
  2. service.getTopPlayers:
     a. getCache("leaderboard:top10") -- check redis
     b. cache hit -> return parsed JSON
     c. cache miss -> SELECT with DENSE_RANK() LIMIT 10
     d. setCache with 10s TTL
  3. response: { success: true, data: [...] }
```

### Data Flow: Get Player Rank

```
GET /api/leaderboard/rank/42
  1. validateUserId -- checks param is positive int
  2. controller.getPlayerRank -- parses param
  3. service.getPlayerRank:
     a. getCache("leaderboard:rank:42") -- check redis
     b. cache hit -> return parsed JSON
     c. cache miss -> subquery with DENSE_RANK, filter WHERE user_id = 42
     d. setCache with 5s TTL
     e. return null if no rows (-> 404)
  4. response: { success: true, data: { ... } } or 404
```

## Client Structure

```
src/
  main.jsx          -- ReactDOM render
  App.jsx           -- layout, composes Leaderboard + RankLookup + SubmitScore
  api/
    leaderboard.js  -- fetch helpers (fetchTopPlayers, fetchPlayerRank, submitScore)
  components/
    Leaderboard.jsx -- polls /top every 5s, renders table with ranked styling
    RankLookup.jsx  -- input + search, accepts user_id or "user_X" format
    SubmitScore.jsx -- form to submit scores for any user
```

Live updates are implemented via polling (setInterval at 5s) rather than WebSockets to keep the implementation simple and stateless.
