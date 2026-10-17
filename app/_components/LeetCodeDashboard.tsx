"use client";

import { useState } from "react";
import { CodeEditorPanel } from "./CodeEditorPanel";
import { StatsPanel } from "./StatsPanel";
import styles from "./LeetCodeDashboard.module.css";
import type { QueryInitialExerciseData } from "../api/analyse/DbLogic";
import { MAX_HINT_COUNT } from "../common";

type HighlightPosition = {
  line: number;
  column: number;
  endline?: number;
  endColumn?: number;
};

type LlmPointerCardPayload = {
  startLine: number;
  endLine: number;
  content: string;
  showNavigation?: boolean;
};

export function LeetCodeDashboard({
  initialData,
  exerciseId,
}: {
  initialData: QueryInitialExerciseData;
  exerciseId: number;
}) {
  const latestSubmission = (initialData?.latestSubmission ?? null) as {
    code: string;
    sonarDetectedProblems: { finalScore: number } & Record<string, unknown>;
  } | null;

  const initialSubmission = initialData?.initialData as {
    code: string;
    sonarDetectedProblems: { finalScore: number } & Record<string, unknown>;
  };

  const [code, setCode] = useState(
    latestSubmission?.code ?? initialSubmission.code,
  );
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
            highestScore={initialData.score}
            exerciseId={exerciseId}
            initialDetectedProblems={
              latestSubmission?.sonarDetectedProblems ??
              initialSubmission.sonarDetectedProblems
            }
            onRuleClick={setHighlightedPositions}
            onLlmCodeBlocksFocus={setLlmPointerCards}
            hintCount={initialData.hintCount!}
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
