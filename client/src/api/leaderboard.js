const BASE = "/api/leaderboard";

export async function fetchTopPlayers() {
  const res = await fetch(`${BASE}/top`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "failed to fetch leaderboard");
  return json.data || [];
}

export async function fetchPlayerRank(userId) {
  const res = await fetch(`${BASE}/rank/${userId}`);
  if (res.status === 404) return null;
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "failed to fetch rank");
  return json.data || null;
}
