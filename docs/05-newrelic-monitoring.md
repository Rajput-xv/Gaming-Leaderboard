# New Relic Setup & Monitoring

## What New Relic Does Here

New Relic APM (Application Performance Monitoring) auto-instruments the Express server to track:
- HTTP transaction response times
- Throughput (requests/min)
- Error rates
- Slow database queries (PostgreSQL)
- External service calls (Redis)

## Step 1: Create a New Relic Account

1. Go to https://newrelic.com/signup (100 GB/month free)
2. Create an account
3. Go to API Keys section and copy your **Ingest License Key**

## Step 2: Set Environment Variables

In `.env`:

```
NEW_RELIC_APP_NAME=gaming-leaderboard
NEW_RELIC_LICENSE_KEY=<paste-your-key-here>
NEW_RELIC_LOG_LEVEL=info
```

When `NEW_RELIC_LICENSE_KEY` is set, the agent activates. When empty or missing, New Relic is skipped entirely.

## Step 3: How It's Wired

File: `server/newrelic.js` -- agent configuration:

```
app_name:            from NEW_RELIC_APP_NAME env var
license_key:         from NEW_RELIC_LICENSE_KEY env var
distributed_tracing: enabled (traces requests across services)
transaction_tracer:  records obfuscated SQL for queries > 100ms
slow_sql:            captures up to 10 slow query samples
attributes.exclude:  strips cookie and authorization headers from traces
```

File: `server/src/index.js` -- loaded conditionally at the very top:

```javascript
if (process.env.NEW_RELIC_LICENSE_KEY) {
  require("newrelic");
}
```

New Relic **must** be required before any other module. It monkey-patches `express`, `pg`, and `ioredis` to auto-instrument them.

The `npm run dev` script uses `-r dotenv/config -r newrelic` flags to load `.env` and the agent before the app starts, so the conditional `require` inside `index.js` acts as a fallback.

## Step 4: Verify It's Working

1. Start the server: `npm run dev` (this auto-loads dotenv + newrelic via the `-r` flags)
2. You should see `redis connected` and `server running on port 8000` in the terminal
3. Make a few API requests
4. Go to New Relic One dashboard -> APM -> `gaming-leaderboard`
5. Transactions should appear within 1-2 minutes

## Step 5: Key Dashboards to Check

| Dashboard | What to Look For |
|---|---|
| **Transactions** | Average response time per endpoint |
| **Databases** | Slow queries, query count, time spent in PG |
| **External services** | Redis latency |
| **Error analytics** | 4xx/5xx error rates |
| **Distributed tracing** | Full request lifecycle breakdown |

## Step 6: Set Up Alerts

In New Relic One:

1. Go to Alerts -> Create alert condition
2. **Slow response alert:** APM -> Web transaction time -> threshold > 500ms for 5 minutes
3. **Error rate alert:** APM -> Error percentage -> threshold > 5% for 5 minutes
4. **Apdex alert:** APM -> Apdex -> threshold < 0.7 for 5 minutes
5. Attach a notification channel (email or Slack)

## Configuration Reference

All options in `newrelic.js`:

| Setting | Value | Why |
|---|---|---|
| `distributed_tracing.enabled` | `true` | Traces requests across server + DB + cache |
| `transaction_tracer.record_sql` | `obfuscated` | Logs query structure but hides parameter values |
| `transaction_tracer.explain_threshold` | `100` | EXPLAIN plans for queries slower than 100ms |
| `slow_sql.enabled` | `true` | Captures slowest queries for analysis |
| `slow_sql.max_samples` | `10` | Keeps 10 slow query samples per harvest cycle |
| `attributes.exclude` | `cookie, authorization` | Security: don't send auth headers to New Relic |

## What to Report

After running the simulation script for 10-15 minutes with New Relic active:

1. Screenshot the **Transactions** overview (avg latency per endpoint)
2. Screenshot the **Database** tab (slowest queries)
3. Screenshot **Distributed tracing** for a single `/submit` request
4. Note any bottlenecks identified and what you did about them
