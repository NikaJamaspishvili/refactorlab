"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { fetchLeaderboardInfo } from "../../_serverFunctions/leaderboard";
import { graphType } from "../../types/types";

type Difficulty = "HARD" | "NORMAL" | "EASY";

const LeaderBoard = () => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [section, setSection] = useState<graphType>("MOST_PROBLEMS_TACKLED");
  const [isPending, startTransition] = useTransition();

  async function handleTabChange(nextSection?: graphType) {
    if (nextSection === section) return;
    startTransition(async () => {
      const selected = nextSection ?? section;
      if (nextSection) setSection(nextSection);

      const data = await fetchLeaderboardInfo(selected, [
        "HARD",
        "NORMAL",
        "EASY",
      ]);
      setLeaderboard(data.response);
    });
  }

  useEffect(() => {
    handleTabChange();
  }, []);

  const rows = useMemo(() => {
    const valueKey =
      section === "MOST_PROBLEMS_SOLVED"
        ? "solvedCount"
        : section === "MOST_PROBLEMS_TACKLED"
          ? "tackledCount"
          : "scoreSum";

    const byUser: Record<
      string,
      {
        userId: string;
        username: string;
        HARD: number;
        NORMAL: number;
        EASY: number;
        TOTAL: number;
      }
    > = {};

    for (const bucket of leaderboard) {
      const difficulty = bucket.difficulty as Difficulty;
      const list = bucket.data;

      for (const item of list) {
        const userId = item.userId;
        const value = item[valueKey];

        if (!byUser[userId]) {
          byUser[userId] = {
            userId,
            username: item.username,
            HARD: 0,
            NORMAL: 0,
            EASY: 0,
            TOTAL: 0,
          };
        }

        byUser[userId][difficulty] = value;
        byUser[userId].TOTAL =
          byUser[userId].HARD + byUser[userId].NORMAL + byUser[userId].EASY;
      }
    }

    return Object.values(byUser).sort((a, b) => b.TOTAL - a.TOTAL);
  }, [leaderboard, section]);

  return (
    <div>
      <nav style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <button onClick={() => handleTabChange("MOST_PROBLEMS_SOLVED")}>
          Most Problems Solved
        </button>
        <button onClick={() => handleTabChange("MOST_PROBLEMS_TACKLED")}>
          Most Problems Tackled
        </button>
        <button onClick={() => handleTabChange("HIGHEST_SCORE")}>
          Highest Score
        </button>
      </nav>

      {isPending ? (
        <p>Loading...</p>
      ) : rows.length === 0 ? (
        <p>No data</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>HARD</th>
              <th>MEDIUM</th>
              <th>EASY</th>
              <th>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.userId}>
                <td>{row.username}</td>
                <td>{row.HARD}</td>
                <td>{row.NORMAL}</td>
                <td>{row.EASY}</td>
                <td>{row.TOTAL}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LeaderBoard;
