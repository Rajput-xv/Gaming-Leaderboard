import { useState } from "react";
import { fetchPlayerRank } from "../api/leaderboard";

export default function RankLookup() {
  const [userId, setUserId] = useState("");
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    let id;
    const input = userId.trim();
    
    // accept "user_123" or just "123"
    if (input.startsWith("user_")) {
      id = parseInt(input.slice(5), 10);
    } else {
      id = parseInt(input, 10);
    }

    if (isNaN(id) || id < 1) {
      setError("enter a valid user id or username");
      return;
    }

    setLoading(true);
    setError("");
    setNotFound(false);
    setResult(null);

    try {
      const data = await fetchPlayerRank(id);
      if (!data) {
        setNotFound(true);
      } else {
        setResult(data);
      }
    } catch {
      setError("failed to fetch rank");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Player Rank Lookup</h2>
      <div className="search-row">
        <input
          type="text"
          placeholder="enter user id or username (e.g. user_1)"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? "searching..." : "search"}
        </button>
      </div>

      {error && <p className="msg-error">{error}</p>}
      {notFound && <p className="msg-info">player not found</p>}

      {result && (
        <div className="rank-result">
          <p><strong>player:</strong> {result.username}</p>
          <p><strong>rank:</strong> #{result.rank}</p>
          <p><strong>total score:</strong> {result.total_score.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
