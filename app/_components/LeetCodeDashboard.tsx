"use client";

import { useState } from "react";
import Exercises from "@/exercises.json";
import { CodeEditorPanel } from "./CodeEditorPanel";
import { StatsPanel } from "./StatsPanel";
import styles from "./LeetCodeDashboard.module.css";
import type { QueryInitialExerciseData } from "../api/analyse/DbLogic";

type HighlightPosition = {
  line: number;
  column: number;
  endline?: number;
  endColumn?: number;
};

type LlmHint = {
  startline: number;
  endline: number;
  hint_content: string;
  solution: string;
  correct_code: string;
};

type LlmPointerCardPayload = {
  startLine: number;
  endLine: number;
  content: string;
  showNavigation?: boolean;
};

export function LeetCodeDashboard({
  initialData,
}: {
  initialData: QueryInitialExerciseData;
}) {
  const latestSubmission = initialData.latestSubmission as {
    code: string;
    sonarDetectedProblems: Record<string, unknown>;
  };

  const [code, setCode] = useState(latestSubmission.code);
  const [highlightedPositions, setHighlightedPositions] = useState<
    HighlightPosition[]
  >([]);
  const [llmPointerCards, setLlmPointerCards] = useState<
    LlmPointerCardPayload[]
  >([]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>LeetCode-Style Dashboard</header>
      <section className={styles.grid}>
        <div className={`${styles.panel} ${styles.textPanel}`}>
          <StatsPanel
            code={code}
            initialScoring={exercise.scoring}
            onRuleClick={setHighlightedPositions}
            onLlmCodeBlocksFocus={setLlmPointerCards}
          />
        </div>
        <div className={`${styles.panel} ${styles.editorPanel}`}>
          <CodeEditorPanel
            code={code}
            onCodeChange={setCode}
            highlightedPositions={highlightedPositions}
            activeHint={null}
            llmPointerCards={llmPointerCards}
            onLlmCodeBlocksFocus={setLlmPointerCards}
          />
        </div>
      </section>
    </main>
  );
}
