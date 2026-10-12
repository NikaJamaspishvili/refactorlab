"use client";
import Submissions from "./Submissions/Submissions";
import AllExercises from "./AllExercises/AllExercises";
import LeaderBoard from "./LeaderBoard/LeaderBoard";
import { useState } from "react";

const Page = () => {
  const [tab, setTab] = useState<
    "LEADERBOARD" | "ALLEXERCISES" | "SUBMISSIONS"
  >("ALLEXERCISES");

  return (
    <main>
      <header>
        <button onClick={() => setTab("ALLEXERCISES")}>All Exercises</button>
        <button onClick={() => setTab("LEADERBOARD")}>LeaderBoard</button>
        <button onClick={() => setTab("SUBMISSIONS")}>Your Submissions</button>
      </header>
      {tab === "SUBMISSIONS" ? (
        <Submissions />
      ) : tab === "LEADERBOARD" ? (
        <LeaderBoard />
      ) : (
        <AllExercises />
      )}
    </main>
  );
};

export default Page;
