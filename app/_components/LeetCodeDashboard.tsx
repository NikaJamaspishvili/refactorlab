"use client";

import { useState } from "react";
import Exercises from "@/exercises.json";
import { CodeEditorPanel } from "./CodeEditorPanel";
import { StatsPanel } from "./StatsPanel";
import styles from "./LeetCodeDashboard.module.css";

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

export function LeetCodeDashboard() {
  const exercise = Exercises["2"];
  const [code, setCode] = useState(exercise.code);
  const [highlightedPositions, setHighlightedPositions] = useState<
    HighlightPosition[]
  >([]);
  const [activeHint] = useState<LlmHint | null>(null);
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
            activeHint={activeHint}
            llmPointerCards={llmPointerCards}
            onLlmCodeBlocksFocus={setLlmPointerCards}
          />
        </div>
      </section>
    </main>
  );
}
