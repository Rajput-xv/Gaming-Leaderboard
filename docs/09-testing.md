# Testing

## Setup

```bash
cd server
npm test            # run all tests once
npm run test:watch  # re-run on file changes
```

## Test Structure

Tests are in `server/src/__tests__/leaderboard.test.js`.

The service layer is tested with mocked dependencies:
- `pg.Pool` is mocked -- no real database connection needed
- `cache` utilities are mocked -- no real Redis needed

## What's Tested

### submitScore
- Verifies the transaction flow: `BEGIN -> UPSERT user -> INSERT session -> UPSERT leaderboard -> COMMIT`
- Verifies rollback on database error
- Verifies the connection is always released (no pool leaks)

### getTopPlayers
- Returns cached data when cache hit (does not query DB)
- Queries DB and caches result on cache miss

### getPlayerRank
- Returns cached rank on cache hit
- Returns `null` for non-existent player

## Why Mock Instead of Integration Tests

- Speed: tests run in milliseconds without network I/O
- Isolation: tests verify service logic, not database behavior
- CI-friendly: no external services required

## Writing More Tests

To add controller-level tests, use `supertest`:

```javascript
const request = require("supertest");
const app = require("../index");

it("should return 400 for missing user_id", async () => {
  const res = await request(app)
    .post("/api/leaderboard/submit")
    .send({ score: 100 });
  expect(res.status).toBe(400);
});
```
