"use client";

import { useState } from "react";
import AllExercises from "./AllExercises/AllExercises";
import LeaderBoard from "./LeaderBoard/LeaderBoard";
import type { AllExercisesItem } from "../types/types";

type Tab = "LEADERBOARD" | "ALLEXERCISES";

type PageProps = {
  userId?: string;
  exerciseData: AllExercisesItem[];
};

function Page({ userId, exerciseData }: PageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("ALLEXERCISES");

  return (
    <main>
      <header>
        <button type="button" onClick={() => setActiveTab("ALLEXERCISES")}>
          All Exercises
        </button>
        <button type="button" onClick={() => setActiveTab("LEADERBOARD")}>
          LeaderBoard
        </button>
      </header>

      {activeTab === "LEADERBOARD" ? (
        <LeaderBoard />
      ) : (
        <AllExercises initialData={exerciseData} userId={userId} />
      )}
    </main>
  );
}

export default Page;
