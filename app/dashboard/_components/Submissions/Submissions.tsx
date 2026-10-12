import { useState } from "react";
import { FetchSubmissionsData } from "../../_serverFunctions/submissions";
import {
  DIFFICULTY,
  PROBLEM_STATUS,
  SubmissionItem,
  title,
} from "../../types/submissions";

function Submissions() {
  const [SubmissionData, setSubmissionData] = useState<SubmissionItem[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const difficulty = formData.get("DIFFICULTY") as DIFFICULTY;
    const title = formData.get("EXERCISE_TITLE") as title;
    const problemStatus = formData.get("PROBLEM_STATUS") as PROBLEM_STATUS;

    console.log(difficulty, title, problemStatus);

    const req = {
      DIFFICULTY: difficulty,
      TITLE: title.length > 0 ? title : "",
      PROBLEM_STATUS: problemStatus,
    };

    const userId = "f785b36e-3361-46cd-add9-2d299267d623";

    const SubmissionsData = await FetchSubmissionsData(req, userId);

    const normalized = SubmissionsData.map((item) => ({
      count: item.count,
      score: item.score,
      title: item.title,
      difficulty: item.difficulty as "HARD" | "NORMAL" | "EASY",
      description: item.description,
    }));

    setSubmissionData([...normalized]);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <select name="DIFFICULTY" defaultValue={"ALL"}>
          <option value="ALL">ALL</option>
          <option value="HARD">HARD</option>
          <option value="NORMAL">NORMAL</option>
          <option value="EASY">EASY</option>
        </select>
        <select name="PROBLEM_STATUS">
          <option value="ALL">ALL</option>
          <option value="SOLVED">SOLVED</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
        </select>
        <input
          type="text"
          defaultValue={""}
          name="EXERCISE_TITLE"
          placeholder="Exercise Title..."
        />
        <button type="submit">Filter</button>
      </form>

      <section>
        {SubmissionData.map((result, index) => {
          return (
            <div key={index}>
              <section style={{ display: "flex" }}>
                <header>
                  Status: {result.score === 100 ? "SOLVED" : "IN PROGRESS..."}
                </header>
                <h1>{result.title}</h1>
                <p>{result.description}</p>
                <span
                  style={{
                    color:
                      result.difficulty === "HARD"
                        ? "red"
                        : result.difficulty === "NORMAL"
                          ? "gray"
                          : "green",
                  }}
                >
                  {result.difficulty}
                </span>
              </section>

              <span>Last submission score: {result.score}</span>
              <span>Submission count: {result.count}</span>

              <button>ANOTHER TRY🔥</button>
            </div>
          );
        })}
      </section>
    </div>
  );
}

export default Submissions;
