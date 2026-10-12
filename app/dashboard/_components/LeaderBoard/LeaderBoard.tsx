// how much problems in total solved -> how much was easy, normal, hard
// highest score, harder problems have higher score to obtain

const leaderboardData = {
  MOST_PROBLEMS_SOLVED: [
    {
      user: { username: "nika" },
      solvedCount: 20,
      detailed: { hard: 4, normal: 3, easy: 13 },
    },
    {
      user: { username: "luka" },
      solvedCount: 18,
      detailed: { hard: 5, normal: 6, easy: 7 },
    },
    {
      user: { username: "mariam" },
      solvedCount: 16,
      detailed: { hard: 3, normal: 7, easy: 6 },
    },
  ],
  MOST_PROBLEMS_TACKLED: [
    {
      user: { username: "nika" },
      tackledCount: 100,
      detailed: { hard: 40, normal: 50, easy: 10 },
    },
    {
      user: { username: "gio" },
      tackledCount: 92,
      detailed: { hard: 28, normal: 44, easy: 20 },
    },
    {
      user: { username: "ana" },
      tackledCount: 85,
      detailed: { hard: 22, normal: 41, easy: 22 },
    },
  ],
  HIGHEST_SCORE: [
    {
      user: { username: "nika" },
      sumScores: 3000,
    },
    {
      user: { username: "lasha" },
      sumScores: 2875,
    },
    {
      user: { username: "salome" },
      sumScores: 2740,
    },
  ],
};

const LeaderBoard = () => {
  return (
    <div>
      <h2>Most Problems Solved</h2>
      {leaderboardData.MOST_PROBLEMS_SOLVED.map((item, index) => (
        <div key={`solved-${item.user.username}-${index}`}>
          <p>
            #{index + 1} {item.user.username} — solved: {item.solvedCount}
          </p>
          <p>
            <span style={{ color: "red" }}>hard: {item.detailed.hard}</span> |{" "}
            <span style={{ color: "gray" }}>
              normal: {item.detailed.normal}
            </span>{" "}
            | <span style={{ color: "green" }}>easy: {item.detailed.easy}</span>
          </p>
        </div>
      ))}

      <h2>Most Problems Tackled</h2>
      {leaderboardData.MOST_PROBLEMS_TACKLED.map((item, index) => (
        <div key={`tackled-${item.user.username}-${index}`}>
          <p>
            #{index + 1} {item.user.username} — tackled: {item.tackledCount}
          </p>
          <p>
            <span style={{ color: "red" }}>hard: {item.detailed.hard}</span> |{" "}
            <span style={{ color: "gray" }}>
              normal: {item.detailed.normal}
            </span>{" "}
            | <span style={{ color: "green" }}>easy: {item.detailed.easy}</span>
          </p>
        </div>
      ))}

      <h2>Highest Score</h2>
      {leaderboardData.HIGHEST_SCORE.map((item, index) => (
        <div key={`score-${item.user.username}-${index}`}>
          <p>
            #{index + 1} {item.user.username} — score: {item.sumScores}
          </p>
        </div>
      ))}
    </div>
  );
};

export default LeaderBoard;
