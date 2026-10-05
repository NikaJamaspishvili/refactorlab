"use client";

import { useMemo, useState } from "react";

type ComplexityEntry = {
  line: number;
  column: number;
  score: number;
};

type FunctionComplexities = {
  all: ComplexityEntry[];
  avg: number;
};

type StatIssue = {
  text?: string | null;
  message?: string | null;
  line?: number;
  column?: number;
};

type FatalEntry = StatIssue | string;

type InitialStats = {
  function_complexities: FunctionComplexities;
  maintainabilityIssues: number;
  errors: StatIssue[];
  warnings?: StatIssue[];
  fatal?: FatalEntry[];
  duplication?: number | null;
};

type StatsSnapshot = {
  function_complexities: FunctionComplexities;
  maintainabilityIssues: number;
  errors: StatIssue[];
  warnings: StatIssue[];
  fatal: FatalEntry[];
  duplication: number | null;
};

type AnalyseResponse = Partial<InitialStats> & {
  warnings?: StatIssue[];
  status?: string;
  text?: string | null;
};

type StatsPanelProps = {
  stats: InitialStats;
  code: string;
};

function normalizeStats(input: InitialStats | StatsSnapshot): StatsSnapshot {
  return {
    function_complexities: {
      all: input.function_complexities?.all ?? [],
      avg: input.function_complexities?.avg ?? 0,
    },
    maintainabilityIssues: input.maintainabilityIssues ?? 0,
    errors: input.errors ?? [],
    warnings: input.warnings ?? [],
    fatal: input.fatal ?? [],
    duplication: input.duplication ?? null,
  };
}

function toIssueText(issue: StatIssue | string) {
  if (typeof issue === "string") {
    return issue;
  }

  const message = issue.message ?? issue.text ?? "Unknown issue";
  return `${message} || line: ${issue.line ?? "N/A"} column: ${issue.column ?? "N/A"}`;
}

function getDeltaMeta(current: number | null, baseline: number | null) {
  if (current === null || baseline === null) {
    return null;
  }

  const change = current - baseline;
  if (change === 0) {
    return { label: "→ 0%", className: "statsDeltaSame" };
  }

  if (baseline === 0) {
    return {
      label: change > 0 ? "↑ new" : "↓ new",
      className: change > 0 ? "statsDeltaUp" : "statsDeltaDown",
    };
  }

  const percent = Math.abs((change / baseline) * 100).toFixed(1);
  return {
    label: `${change > 0 ? "↑" : "↓"} ${percent}%`,
    className: change > 0 ? "statsDeltaUp" : "statsDeltaDown",
  };
}

export function StatsPanel({ stats, code }: StatsPanelProps) {
  const [showErrors, setShowErrors] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [baselineStats] = useState<StatsSnapshot>(() => normalizeStats(stats));
  const [currentStats, setCurrentStats] = useState<StatsSnapshot>(() => normalizeStats(stats));

  const hasFatal = currentStats.fatal.length > 0;

  const deltas = useMemo(
    () => ({
      avgComplexity: getDeltaMeta(currentStats.function_complexities.avg, baselineStats.function_complexities.avg),
      maintainability: getDeltaMeta(currentStats.maintainabilityIssues, baselineStats.maintainabilityIssues),
      duplication: getDeltaMeta(currentStats.duplication, baselineStats.duplication),
      errors: getDeltaMeta(currentStats.errors.length, baselineStats.errors.length),
      warnings: getDeltaMeta(currentStats.warnings.length, baselineStats.warnings.length),
      fatal: getDeltaMeta(currentStats.fatal.length, baselineStats.fatal.length),
    }),
    [baselineStats, currentStats]
  );

  const handleCheckMeasurements = async () => {
    setIsChecking(true);

    try {
      const response = await fetch("http://localhost:3000/api/analyse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const data = (await response.json()) as AnalyseResponse;

      setCurrentStats((previousStats) =>
        normalizeStats({
          ...previousStats,
          ...data,
          function_complexities: data.function_complexities ?? previousStats.function_complexities,
          errors: data.errors ?? previousStats.errors,
          warnings: data.warnings ?? previousStats.warnings,
          fatal: data.fatal ?? previousStats.fatal,
          duplication: data.duplication ?? previousStats.duplication,
          maintainabilityIssues: data.maintainabilityIssues ?? previousStats.maintainabilityIssues,
        })
      );
    } catch (error) {
      console.error("Failed to check measurements", error);
    } finally {
      setIsChecking(false);
    }
  };

  if (hasFatal) {
    return (
      <section className="panelShell">
        <div className="panelTitle">Stats</div>
        <div className="statsContent">
          <div className="statsFatalTitle">Fatal</div>
          <div className="statsFatalList">
            {currentStats.fatal.map((fatalEntry, index) => (
              <div key={`${toIssueText(fatalEntry)}-${index}`}>{toIssueText(fatalEntry)}</div>
            ))}
          </div>
          <div className="statsMetric">
            <span>fatal: {currentStats.fatal.length}</span>
            {deltas.fatal ? <span className={deltas.fatal.className}>{deltas.fatal.label}</span> : null}
          </div>
          <button className="statsActionButton" type="button" onClick={handleCheckMeasurements} disabled={isChecking}>
            {isChecking ? "Checking..." : "Check measurements"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panelShell">
      <div className="panelTitle">Stats</div>
      <div className="statsContent">
        <div className="statsMetric">
          <span>Average Complexity Score: {currentStats.function_complexities.avg}</span>
          {deltas.avgComplexity ? <span className={deltas.avgComplexity.className}>{deltas.avgComplexity.label}</span> : null}
        </div>

        <div className="statsMetric">
          <span>maintainabilityIssues: {currentStats.maintainabilityIssues}</span>
          {deltas.maintainability ? <span className={deltas.maintainability.className}>{deltas.maintainability.label}</span> : null}
        </div>

        <div className="statsRow">
          <span>errors: {currentStats.errors.length}</span>
          <div className="statsRowActions">
            {deltas.errors ? <span className={deltas.errors.className}>{deltas.errors.label}</span> : null}
            <button className="statsButton" type="button" onClick={() => setShowErrors((previousValue) => !previousValue)}>
              {showErrors ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {showErrors ? (
          <div className="statsErrors">
            {currentStats.errors.length > 0 ? currentStats.errors.map((error, index) => <div key={`${toIssueText(error)}-${index}`}>{toIssueText(error)}</div>) : <div>No errors</div>}
          </div>
        ) : null}

        <div className="statsRow">
          <span>warnings: {currentStats.warnings.length}</span>
          <div className="statsRowActions">
            {deltas.warnings ? <span className={deltas.warnings.className}>{deltas.warnings.label}</span> : null}
            <button className="statsButton" type="button" onClick={() => setShowWarnings((previousValue) => !previousValue)}>
              {showWarnings ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {showWarnings ? (
          <div className="statsErrors">
            {currentStats.warnings.length > 0 ? (
              currentStats.warnings.map((warning, index) => <div key={`${toIssueText(warning)}-${index}`}>{toIssueText(warning)}</div>)
            ) : (
              <div>No warnings</div>
            )}
          </div>
        ) : null}

        <div className="statsMetric">
          <span>duplication: {currentStats.duplication ?? "N/A"}</span>
          {deltas.duplication ? <span className={deltas.duplication.className}>{deltas.duplication.label}</span> : null}
        </div>

        <button className="statsActionButton" type="button" onClick={handleCheckMeasurements} disabled={isChecking}>
          {isChecking ? "Checking..." : "Check measurements"}
        </button>
      </div>
    </section>
  );
}
