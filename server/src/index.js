// new relic must be required before anything else
if (process.env.NEW_RELIC_LICENSE_KEY) {
  require("newrelic");
}

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const config = require("./config/index");
const redis = require("./config/redis");
const leaderboardRoutes = require("./routes/leaderboard");
const errorHandler = require("./middleware/errorHandler");
const apiLimiter = require("./middleware/rateLimiter");

const app = express();

// security & performance middleware
app.use(helmet());
app.use(cors({ origin: true }));
app.use(compression());
app.use(express.json());

// rate limiting on API routes
app.use("/api/", apiLimiter);

// routes
app.use("/api/leaderboard", leaderboardRoutes);

// health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// global error handler
app.use(errorHandler);

async function start() {
  try {
    await redis.connect();
    console.log("redis connected");
  } catch (err) {
    console.warn("redis unavailable, running without cache");
  }

  app.listen(config.port, () => {
    console.log(`server running on port ${config.port}`);
  });
}

// only start if not in test mode
if (process.env.NODE_ENV !== "test") {
  start();
}

module.exports = app;
