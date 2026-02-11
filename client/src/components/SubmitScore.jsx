import { useState } from "react";
import { submitScore } from "../api/leaderboard";

export default function SubmitScore() {
  const [userId, setUserId] = useState("");
  const [score, setScore] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    const id = parseInt(userId.replace(/^user_/, ""), 10);
    const sc = parseInt(score, 10);

    if (isNaN(id) || id < 1) {
      setError("enter a valid user id");
      return;
    }
    if (isNaN(sc) || sc < 1) {
      setError("enter a valid score (positive number)");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await submitScore(id, sc);
      setMessage(`score ${sc.toLocaleString()} submitted for user ${id}`);
      setScore("");
    } catch {
      setError("failed to submit score");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Submit Score</h2>
      <form onSubmit={handleSubmit}>
        <div className="search-row">
          <input
            type="text"
            placeholder="user id (e.g. 1 or user_1)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <input
            type="number"
            placeholder="score"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            min="1"
          />
          <button type="submit" disabled={loading}>
            {loading ? "submitting..." : "submit"}
          </button>
        </div>
      </form>

      {error && <p className="msg-error">{error}</p>}
      {message && <p className="msg-success">{message}</p>}
    </div>
  );
}
