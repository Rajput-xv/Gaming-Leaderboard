# Security

## Measures Implemented

| Layer | Implementation | Purpose |
|---|---|---|
| **Helmet** | `app.use(helmet())` | Sets security HTTP headers (CSP, HSTS, X-Frame-Options, etc.) |
| **CORS** | `app.use(cors({ origin: true }))` | Restricts cross-origin requests; set specific origins in production |
| **Rate limiting** | 100 req/min per IP | Prevents brute-force and DoS on API endpoints |
| **Input validation** | `validateSubmitScore`, `validateUserId` | Rejects malformed requests before they reach the service layer |
| **Parameterized queries** | `$1`, `$2` placeholders in all SQL | Prevents SQL injection |
| **Error sanitization** | 500 errors return generic message | Stack traces and internal errors are not exposed to clients |
| **New Relic attribute exclusion** | `cookie`, `authorization` headers excluded | Sensitive headers are not sent to monitoring service |

## Production Hardening (Not Implemented)

- Replace `cors({ origin: true })` with a specific allowed origin list
- Add authentication (JWT or session-based) to `/submit` endpoint
- Use HTTPS termination (e.g., behind nginx or a load balancer)
- Move rate limiter to a reverse proxy for better accuracy with multiple server instances
- Add request ID logging for trace correlation
