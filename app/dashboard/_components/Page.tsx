"use client";
import AllExercises from "./AllExercises/AllExercises";
import LeaderBoard from "./LeaderBoard/LeaderBoard";
import { useState } from "react";

const Page = ({ userId }: { userId?: string }) => {
  const [tab, setTab] = useState<"LEADERBOARD" | "ALLEXERCISES">("LEADERBOARD");

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
        <AllExercises userId={userId} />
      )}
    </main>
  );
};

export default Page;
