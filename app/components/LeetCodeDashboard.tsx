"use client";

import { useState } from "react";
import Exercises from "../../BAD_CODE/exercises.json";
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

export function LeetCodeDashboard() {
  const [code, setCode] = useState(Exercises["2"].code);
  const [highlightedPositions, setHighlightedPositions] = useState<
    HighlightPosition[]
  >([]);
  const [activeHint, setActiveHint] = useState<LlmHint | null>(null);

  return (
    <main className={styles.page}>
      <header className={styles.header}>LeetCode-Style Dashboard</header>
      <section className={styles.grid}>
        <div className={`${styles.panel} ${styles.editorPanel}`}>
          <CodeEditorPanel
            code={code}
            onCodeChange={setCode}
            highlightedPositions={highlightedPositions}
            activeHint={activeHint}
          />
        </div>
        <div className={`${styles.panel} ${styles.textPanel}`}>
          <StatsPanel code={code} onRuleClick={setHighlightedPositions} />
        </div>
      </section>
    </main>
  );
}
