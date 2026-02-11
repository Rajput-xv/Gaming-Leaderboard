// validate submit score payload
function validateSubmitScore(req, res, next) {
  const { user_id, score } = req.body;

  if (!user_id || !score) {
    res.status(400).json({
      success: false,
      error: "user_id and score are required",
    });
    return;
  }

  if (!Number.isInteger(user_id) || user_id < 1) {
    res.status(400).json({
      success: false,
      error: "user_id must be a positive integer",
    });
    return;
  }

  if (!Number.isInteger(score) || score < 0) {
    res.status(400).json({
      success: false,
      error: "score must be a non-negative integer",
    });
    return;
  }

  next();
}

// validate user_id route param
function validateUserId(req, res, next) {
  const userId = parseInt(req.params.user_id, 10);

  if (isNaN(userId) || userId < 1) {
    res.status(400).json({
      success: false,
      error: "valid user_id is required",
    });
    return;
  }

  next();
}

module.exports = { validateSubmitScore, validateUserId };
