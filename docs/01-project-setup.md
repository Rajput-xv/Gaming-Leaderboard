# Project Setup

## Prerequisites

- Node.js >= 18
- PostgreSQL (Supabase)
- Redis (local or cloud)
- Python 3 (for load simulation)

## 1. Clone & Install

```bash
git clone <repo-url>
cd Gaming-Leaderboard

# server
cd server
npm install

# client
cd ../client
npm install
```

## 2. Environment Variables

Copy the example and fill in your values:

```bash
cd server
cp .env.example .env
```

Required variables in `.env`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `REDIS_URL` | Redis connection URL (default `redis://localhost:6379`) |
| `PORT` | Server port (default `8000`) |
| `NODE_ENV` | `development` or `production` |
| `NEW_RELIC_APP_NAME` | App name shown in New Relic dashboard |
| `NEW_RELIC_LICENSE_KEY` | Your New Relic ingest license key |
| `CACHE_TTL_LEADERBOARD` | Top-10 cache TTL in seconds (default `10`) |
| `CACHE_TTL_RANK` | Player rank cache TTL in seconds (default `5`) |

## 3. Seed the Database

Run the automated seeding script:

```bash
cd server
npm run seed
```

This drops existing tables (clean slate), creates fresh tables with indexes, and populates:
- 1M users
- 5M game sessions  
- Aggregated leaderboard with rankings

Takes 2-5 minutes depending on your database connection speed.

## 4. Start the Server

```bash
cd server
npm run dev     # development with --watch + New Relic
npm start       # production
```

`npm run dev` runs `node --watch -r dotenv/config -r newrelic src/index.js` — loads `.env` first, then the New Relic agent, then starts the server with auto-restart on file changes.

Server starts on `http://localhost:8000`.

## 5. Start the Client

```bash
cd client
npm run dev
```

Client starts on `http://localhost:3000`. Vite proxies `/api` requests to the server.

## 6. Run Tests

```bash
cd server
npm test
```

## 7. Run Load Simulation

```bash
cd server/scripts
pip install requests
python simulate.py
```
