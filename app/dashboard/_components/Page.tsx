"use client";
import AllExercises from "./AllExercises/AllExercises";
import LeaderBoard from "./LeaderBoard/LeaderBoard";
import { useState } from "react";
import { AllExercisesItem } from "../types/types";
const Page = ({
  userId,
  exerciseData,
}: {
  userId?: string;
  exerciseData: AllExercisesItem[];
}) => {
  const [tab, setTab] = useState<"LEADERBOARD" | "ALLEXERCISES">(
    "ALLEXERCISES",
  );

  return (
    <main>
      <header>
        <button onClick={() => setTab("ALLEXERCISES")}>All Exercises</button>
        <button onClick={() => setTab("LEADERBOARD")}>LeaderBoard</button>
        {/* <button onClick={() => setTab("SUBMISSIONS")}>Your Submissions</button> */}
      </header>
      {tab === "LEADERBOARD" ? (
        <LeaderBoard />
      ) : (
        <AllExercises initialData={exerciseData} userId={userId} />
      )}
    </main>
  );
};

export default Page;
