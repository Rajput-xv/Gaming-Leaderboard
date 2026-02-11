import Leaderboard from "./components/Leaderboard";
import RankLookup from "./components/RankLookup";
import SubmitScore from "./components/SubmitScore";

export default function App() {
  return (
    <div className="app">
      <h1>Gaming Leaderboard</h1>
      <Leaderboard />
      <RankLookup />
      <SubmitScore />
    </div>
  );
}
