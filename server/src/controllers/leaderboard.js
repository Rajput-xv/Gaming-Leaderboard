const leaderboardService = require("../services/leaderboard");

async function submitScore(req, res, next) {
  try {
    const { user_id, score } = req.body;
    const result = await leaderboardService.submitScore(user_id, score);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getTopPlayers(_req, res, next) {
  try {
    const players = await leaderboardService.getTopPlayers();
    res.status(200).json({ success: true, data: players });
  } catch (err) {
    next(err);
  }
}

async function getPlayerRank(req, res, next) {
  try {
    const userId = parseInt(req.params.user_id, 10);
    const rank = await leaderboardService.getPlayerRank(userId);

    if (!rank) {
      res.status(404).json({ success: false, error: "player not found" });
      return;
    }

    res.status(200).json({ success: true, data: rank });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitScore, getTopPlayers, getPlayerRank };
