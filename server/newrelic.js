"use strict";

exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || "gaming-leaderboard"],
  license_key: process.env.NEW_RELIC_LICENSE_KEY || "",
  logging: {
    level: process.env.NEW_RELIC_LOG_LEVEL || "info",
  },
  distributed_tracing: {
    enabled: true,
  },
  transaction_tracer: {
    enabled: true,
    record_sql: "obfuscated",
    // log queries slower than 100ms
    explain_threshold: 100,
  },
  slow_sql: {
    enabled: true,
    max_samples: 10,
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      "request.headers.cookie",
      "request.headers.authorization",
    ],
  },
};
