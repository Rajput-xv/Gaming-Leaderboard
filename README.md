# Gaming Leaderboard

A backend-focused leaderboard system built with Node.js, Express, PostgreSQL (Supabase), and Redis. Includes a lightweight React frontend for viewing rankings and looking up players.

[Github Link](https://github.com/Rajput-xv/Gaming-Leaderboard)

## Tech Stack

- **Backend:** Node.js, Express 4, PostgreSQL (Supabase), Redis (ioredis), New Relic APM
- **Frontend:** React 18, Vite
- **Testing:** Jest (unit tests with mocked DB and cache)

## New Relic Dashboard Overview

![Dashboard Overview](image-4.png)
![Dashboard Overview](image-5.png)
![Dashboard transaction](image-1.png)
![Dashboard transaction](image-2.png)
![Dashboard transaction](image-3.png)

## Project Structure

```
server/
  src/
    index.js              # express app, middleware setup, server start
    config/               # db pool, redis client, env config
    services/             # core business logic (score submission, ranking)
    controllers/          # request/response handling
    middleware/            # validation, rate limiting, error handler
    routes/               # api route definitions
    utils/                # redis cache helpers
    __tests__/
      leaderboard.test.js # 6 unit tests for the service layer
  scripts/
    seed.js               # database setup and seeding (1M users, 5M sessions)
    simulate.py           # python load simulation

client/
  src/
    App.jsx               # main layout
    components/
      Leaderboard.jsx     # top 10 table with live polling
      RankLookup.jsx      # search player by user id or username
      SubmitScore.jsx     # submit scores for any user
    api/
      leaderboard.js      # fetch helpers

docs/                     # modular documentation (10 files)
```

## API Endpoints

All routes are prefixed with `/api/leaderboard`.

| Method | Endpoint         | Description                     |
|--------|------------------|---------------------------------|
| POST   | `/submit`        | Submit a score for a user       |
| GET    | `/top`           | Get top 10 players by score     |
| GET    | `/rank/:user_id` | Get rank and score for a player |

### POST /api/leaderboard/submit

```json
{ "user_id": 1, "score": 500 }
```

Response:
```json
{ "success": true, "data": { "message": "score submitted" } }
```

### GET /api/leaderboard/top

Response:
```json
{
  "success": true,
  "data": [
    { "user_id": 42, "username": "user_42", "total_score": 98200, "rank": 1 }
  ]
}
```

### GET /api/leaderboard/rank/:user_id

Response:
```json
{
  "success": true,
  "data": { "user_id": 5, "username": "user_5", "total_score": 4500, "rank": 312 }
}
```

## Database Schema

![Database Schema](image.png)

Three tables with proper indexing for large-scale queries:

- **users** - id, username, join_date
- **game_sessions** - id, user_id (FK), score, game_mode, timestamp
- **leaderboard** - id, user_id (FK, unique), total_score, rank

Indexes on `game_sessions(user_id)`, `game_sessions(score DESC)`, `leaderboard(total_score DESC)`, and `leaderboard(user_id)`.

## How It Works

1. **Score Submission** runs inside a database transaction. It auto-creates the user if needed, inserts a game session, and upserts the leaderboard total atomically. If anything fails, the whole thing rolls back.

2. **Top 10 Query** uses `DENSE_RANK() OVER (ORDER BY total_score DESC)` so tied scores get the same rank. Results are cached in Redis for 10 seconds.

3. **Player Rank Lookup** uses a subquery with `DENSE_RANK()` to compute rank on the fly. Cached per player for 5 seconds.

4. **Cache Invalidation** happens on every score submission. Both the top 10 cache and the specific player's rank cache are cleared immediately.

## Setup

### Environment Variables

Create `server/.env`:

```
PORT=8000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@host:5432/postgres
REDIS_URL=redis://default:password@host:port
NEW_RELIC_APP_NAME=gaming-leaderboard
NEW_RELIC_LICENSE_KEY=your_key_here
CACHE_TTL_LEADERBOARD=10
CACHE_TTL_RANK=5
```

### Install and Run

```bash
# server
cd server
npm install
npm run seed        # creates tables and seeds 1M users + 5M sessions
npm run dev         # starts on port 8000 with --watch + New Relic

# client (separate terminal)
cd client
npm install
npm run dev         # starts on port 3000, proxies /api to :8000
```

## Testing

```bash
cd server
npm test
```

Runs 6 unit tests covering:
- Score submission (transaction commit and rollback)
- Top 10 retrieval (cache hit and miss)
- Player rank lookup (cache hit, miss, and non-existent player)

All tests mock the database and Redis so they run without external services.

## Key Design Decisions

- **Transactions for atomicity** - score submission uses BEGIN/COMMIT/ROLLBACK to keep game_sessions and leaderboard in sync
- **DENSE_RANK over application-level ranking** - handles tied scores correctly without extra logic
- **Cache-aside pattern** - read from Redis first, fall back to PostgreSQL, cache the result
- **Short TTLs** - 10s for leaderboard, 5s for individual rank; keeps data fresh without hammering the database
- **Rate limiting** - 100 requests per minute per IP to prevent abuse
- **Input validation** - middleware validates user_id and score before they reach the service layer