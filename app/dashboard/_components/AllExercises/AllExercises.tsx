import { useState } from "react";
import { FetchAllExercisesData } from "../../_serverFunctions/allexercises";
import type {
  AllExercisesItem,
  AllExercisesFilter,
  DIFFICULTY,
  PROBLEM_STATUS,
  title,
} from "../../types/types";

type ExerciseStatus = "FIRST VIEW" | "SOLVED" | "IN PROGRESS";

type AllExercisesProps = {
  userId?: string;
  initialData: AllExercisesItem[];
};

const difficultyColors: Record<string, string> = {
  HARD: "red",
  NORMAL: "gray",
  EASY: "green",
};

const statusColors: Record<ExerciseStatus, string> = {
  "FIRST VIEW": "gray",
  "IN PROGRESS": "green",
  SOLVED: "red",
};

function getExerciseStatus(score: number | null | undefined): ExerciseStatus {
  if (!score) {
    return "FIRST VIEW";
  }

  if (score === 100) {
    return "SOLVED";
  }

  return "IN PROGRESS";
}

function buildFilters(formData: FormData): AllExercisesFilter {
  const difficulty = formData.get("DIFFICULTY") as DIFFICULTY;
  const exerciseTitle = formData.get("EXERCISE_TITLE") as title;
  const problemStatus = formData.get("PROBLEM_STATUS") as PROBLEM_STATUS;

  return {
    DIFFICULTY: difficulty,
    TITLE: exerciseTitle.length > 0 ? exerciseTitle : "",
    PROBLEM_STATUS: problemStatus,
  };
}

function AllExercises({ userId, initialData }: AllExercisesProps) {
  const [exercises, setExercises] = useState<AllExercisesItem[]>(initialData);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const filters = buildFilters(new FormData(event.currentTarget));
    const data = await FetchAllExercisesData(filters, userId);

    setExercises(data);
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
        {exercises.map((exercise) => {
          const status = getExerciseStatus(exercise.score);

          return (
            <div key={exercise.exerciseId}>
              <h1>{exercise.title}</h1>
              <p>{exercise.description}</p>
              <span style={{ color: difficultyColors[exercise.difficulty] ?? "black" }}>
                {exercise.difficulty}
              </span>
              <span style={{ color: statusColors[status] }}>{status}</span>
            </div>
          );
        })}
      </section>
    </div>
  );
}

export default AllExercises;
