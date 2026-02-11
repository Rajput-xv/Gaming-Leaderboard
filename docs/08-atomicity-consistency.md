# Atomicity & Consistency

## The Problem

When multiple users submit scores simultaneously:
- Two inserts for the same user could create duplicate leaderboard rows
- A crash between inserting the session and updating the leaderboard leaves data inconsistent
- Cached rankings become stale after writes

## Solution: Database Transactions

`submitScore` wraps all writes in a PostgreSQL transaction:

```
BEGIN
  INSERT INTO game_sessions (...)
  INSERT INTO leaderboard (...) ON CONFLICT (user_id) DO UPDATE
COMMIT
```

If any statement fails, the entire transaction rolls back. The `finally` block always releases the connection back to the pool.

### What the transaction guarantees:
- **Atomicity** -- both inserts succeed or neither does
- **Isolation** -- PostgreSQL's default `READ COMMITTED` isolation prevents dirty reads
- **Durability** -- committed data survives crashes

## Handling Concurrent Writes

The `ON CONFLICT (user_id) DO UPDATE` upsert handles the race condition where two requests try to insert a leaderboard row for the same user simultaneously. PostgreSQL locks the conflicting row, one request wins and inserts, the other updates. No duplicate rows, no lost writes.

## Cache Invalidation

After a successful commit, two cache keys are deleted:

```
DEL leaderboard:top10
DEL leaderboard:rank:{userId}
```

This ensures the next read fetches fresh data from the database. The pattern is:
1. Write to DB (source of truth)
2. Invalidate cache (not update -- avoids cache/DB mismatch)
3. Next read repopulates cache

### Why invalidate instead of update?
- Simpler: no need to compute the new rank in the write path
- Safer: if the cache update fails, stale data would persist until TTL expires
- The TTL acts as a safety net: even if invalidation fails, data refreshes within seconds

## Trade-offs

| Concern | Approach | Trade-off |
|---|---|---|
| Duplicate rows | `UNIQUE(user_id)` + upsert | Requires the unique constraint on leaderboard |
| Partial writes | Transaction (BEGIN/COMMIT/ROLLBACK) | Slight overhead per write from transaction management |
| Stale cache | Invalidate on write + short TTL | Brief window (ms) where cache is empty and next read hits DB |
| Isolation level | `READ COMMITTED` (PG default) | Sufficient for this use case; `SERIALIZABLE` would add overhead |
