# API Reference

Base URL: `http://localhost:8000/api/leaderboard`

---

## POST /submit

Submit a player's score.

**Request body:**

```json
{ "user_id": 42, "score": 1500 }
```

**Validation rules:**
- `user_id` - required, positive integer
- `score` - required, non-negative integer

**Success (200):**

```json
{ "success": true, "data": { "message": "score submitted" } }
```

**Error (400):**

```json
{ "success": false, "error": "user_id and score are required" }
```

---

## GET /top

Retrieve top 10 players by total score.

**Success (200):**

```json
{
  "success": true,
  "data": [
    { "user_id": 1, "username": "user_1", "total_score": 95000, "rank": 1 },
    { "user_id": 7, "username": "user_7", "total_score": 91000, "rank": 2 }
  ]
}
```

---

## GET /rank/:user_id

Fetch a single player's rank.

**Example:** `GET /rank/42`

**Success (200):**

```json
{
  "success": true,
  "data": { "user_id": 42, "username": "user_42", "total_score": 5400, "rank": 312 }
}
```

**Not found (404):**

```json
{ "success": false, "error": "player not found" }
```

---

## Rate Limiting

All `/api/*` routes are limited to 100 requests per minute per IP.

**Rate limit exceeded (429):**

```json
{ "success": false, "error": "too many requests, try again later" }
```

---

## Health Check

`GET /health` returns `{ "status": "ok" }`.
