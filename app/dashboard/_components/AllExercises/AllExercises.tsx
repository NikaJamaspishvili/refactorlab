import { useState } from "react";
import { FetchAllExercisesData } from "../../_serverFunctions/allexercises";
import {
  DIFFICULTY,
  PROBLEM_STATUS,
  AllExercisesItem,
  title,
} from "../../types/types";

function AllExercises({
  userId,
  initialData,
}: {
  userId?: string;
  initialData: AllExercisesItem[];
}) {
  const [exercises, setExercises] = useState<AllExercisesItem[]>(initialData);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const difficulty = formData.get("DIFFICULTY") as DIFFICULTY;
    const title = formData.get("EXERCISE_TITLE") as title;
    const problemStatus = formData.get("PROBLEM_STATUS") as PROBLEM_STATUS;

    const req = {
      DIFFICULTY: difficulty,
      TITLE: title.length > 0 ? title : "",
      PROBLEM_STATUS: problemStatus,
    };

    const data = await FetchAllExercisesData(req, userId);

    setExercises([...data]);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <select name="DIFFICULTY">
          <option value="ALL">ALL</option>
          <option value="HARD">HARD</option>
          <option value="NORMAL">NORMAL</option>
          <option value="EASY">EASY</option>
        </select>
        <input
          name="EXERCISE_TITLE"
          type="text"
          placeholder="Exercise Title..."
        />
        <select name="PROBLEM_STATUS">
          <option value="ALL">ALL</option>
          <option value="SOLVED">SOLVED</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="FIRST_VIEW">FIRST VIEW</option>
        </select>
        <button type="submit">Filter</button>
      </form>

      <section>
        {exercises.map((result, index) => {
          const Status = !result.score
            ? "FIRST VIEW"
            : result.score === 100
              ? "SOLVED"
              : result.score < 100 && "IN PROGRESS";
          return (
            <div key={index}>
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
              <span
                style={{
                  color:
                    Status === "FIRST VIEW"
                      ? "gray"
                      : Status === "IN PROGRESS"
                        ? "green"
                        : "red",
                }}
              >
                {Status}
              </span>
            </div>
          );
        })}
      </section>
    </div>
  );
}

export default AllExercises;
