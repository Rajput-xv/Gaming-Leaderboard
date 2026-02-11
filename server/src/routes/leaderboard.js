const { Router } = require("express");
const controller = require("../controllers/leaderboard");
const { validateSubmitScore, validateUserId } = require("../middleware/validate");

const router = Router();

router.post("/submit", validateSubmitScore, controller.submitScore);
router.get("/top", controller.getTopPlayers);
router.get("/rank/:user_id", validateUserId, controller.getPlayerRank);

module.exports = router;
