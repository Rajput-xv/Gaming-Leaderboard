const leaderboardService = require("../services/leaderboard");
const pool = require("../config/db");
const cache = require("../utils/cache");

// mock db and cache so tests run without real connections
jest.mock("../config/db", () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };
  return {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue(mockClient),
    _mockClient: mockClient,
  };
});

jest.mock("../utils/cache", () => ({
  KEYS: {
    TOP_LEADERBOARD: "leaderboard:top10",
    PLAYER_RANK: (id) => `leaderboard:rank:${id}`,
  },
  getCache: jest.fn(),
  setCache: jest.fn(),
  invalidateCache: jest.fn(),
}));

describe("leaderboard service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("submitScore", () => {
    it("should insert session and upsert leaderboard in a transaction", async () => {
      const client = pool._mockClient;
      client.query.mockResolvedValue({ rows: [] });

      const result = await leaderboardService.submitScore(1, 500);

      expect(result.message).toBe("score submitted");
      // BEGIN, INSERT session, UPSERT leaderboard, COMMIT
      expect(client.query).toHaveBeenCalledTimes(4);
      expect(client.query).toHaveBeenNthCalledWith(1, "BEGIN");
      expect(client.query).toHaveBeenNthCalledWith(4, "COMMIT");
      expect(client.release).toHaveBeenCalled();
    });

    it("should rollback on error", async () => {
      const client = pool._mockClient;
      client.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(new Error("db error")); // INSERT fails

      await expect(
        leaderboardService.submitScore(1, 500)
      ).rejects.toThrow("db error");

      expect(client.query).toHaveBeenCalledWith("ROLLBACK");
      expect(client.release).toHaveBeenCalled();
    });
  });

  describe("getTopPlayers", () => {
    it("should return cached data if available", async () => {
      const cached = JSON.stringify([
        { user_id: 1, username: "user_1", total_score: 9000, rank: 1 },
      ]);
      cache.getCache.mockResolvedValue(cached);

      const result = await leaderboardService.getTopPlayers();

      expect(result).toHaveLength(1);
      expect(result[0].rank).toBe(1);
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("should query db and cache result on cache miss", async () => {
      cache.getCache.mockResolvedValue(null);
      const rows = [
        { user_id: 2, username: "user_2", total_score: 8000, rank: 1 },
      ];
      pool.query.mockResolvedValue({ rows });

      const result = await leaderboardService.getTopPlayers();

      expect(result).toEqual(rows);
      expect(cache.setCache).toHaveBeenCalled();
    });
  });

  describe("getPlayerRank", () => {
    it("should return cached rank if available", async () => {
      const cached = JSON.stringify({
        user_id: 5,
        username: "user_5",
        total_score: 7000,
        rank: 3,
      });
      cache.getCache.mockResolvedValue(cached);

      const result = await leaderboardService.getPlayerRank(5);

      expect(result.rank).toBe(3);
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("should return null for non-existent player", async () => {
      cache.getCache.mockResolvedValue(null);
      pool.query.mockResolvedValue({ rows: [] });

      const result = await leaderboardService.getPlayerRank(999999);

      expect(result).toBeNull();
    });
  });
});
