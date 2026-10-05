'use client';

import { useState } from "react";
import challengeData from "../../BAD_CODE/calculateCheckout/calculateCheckout.json";
import { CodeEditorPanel } from "./CodeEditorPanel";
import { StatsPanel } from "./StatsPanel";
import { TextPanel } from "./TextPanel";
import styles from "./LeetCodeDashboard.module.css";

const aboutContent = `${challengeData.about.title}

${challengeData.about.description}`;

export function LeetCodeDashboard() {
  const [code, setCode] = useState(challengeData.about.code);

  return (
    <main className={styles.page}>
      <header className={styles.header}>LeetCode-Style Dashboard</header>
      <section className={styles.grid}>
        <div className={`${styles.panel} ${styles.textPanel}`}>
          <TextPanel title="About" content={aboutContent} />
        </div>
        <div className={`${styles.panel} ${styles.editorPanel}`}>
          <CodeEditorPanel code={code} onCodeChange={setCode} />
        </div>
        <div className={`${styles.panel} ${styles.textPanel}`}>
          <StatsPanel stats={challengeData.initial_stats} code={code} />
        </div>
      </section>
    </main>
  );
}
