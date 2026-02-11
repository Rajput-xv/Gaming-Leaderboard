import { useEffect, useState } from "react";
import { fetchTopPlayers } from "../api/leaderboard";

const POLL_INTERVAL = 5000;

export default function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await fetchTopPlayers();
        if (active) {
          setPlayers(data);
          setError("");
        }
      } catch (err) {
        if (active) setError("failed to load leaderboard");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    // live-updating via polling
    const interval = setInterval(load, POLL_INTERVAL);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) return <div className="card"><p className="msg-loading">loading leaderboard...</p></div>;
  if (error) return <div className="card"><p className="msg-error">{error}</p></div>;

  // top 3 get colored ranks
  function rankClass(rank) {
    if (rank === 1) return "rank-gold";
    if (rank === 2) return "rank-silver";
    if (rank === 3) return "rank-bronze";
    return "";
  }

  return (
    <div className="card">
      <h2>Top 10 Players</h2>
      <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.user_id}>
              <td className={rankClass(p.rank)}>#{p.rank}</td>
              <td>{p.username}</td>
              <td>{p.total_score.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
