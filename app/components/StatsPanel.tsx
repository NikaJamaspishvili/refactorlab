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

type MetricKey = "complexity" | "duplication" | "function_size";

type MetricProblem = {
  id: string;
  metric: MetricKey;
  ruleId: string | null;
  problemGroup?: string;
  message: string;
  hint: string;
  deductionPoints: number;
  line: number | null;
  column: number | null;
  endLine?: number | null;
  endColumn?: number | null;
};

type AggregatedProblem = {
  id: string;
  metric: MetricKey;
  problemGroup: string;
  hint: string;
  message: string;
  occurrenceCount: number;
  locations: Array<{ line: number; column: number }>;
};

type MetricGroup = {
  metric: MetricKey;
  label: string;
  score: number;
  deductedPoints: number;
  problems: MetricProblem[];
};

type MetricGroups = Record<MetricKey, MetricGroup>;

type MaintainabilityPayload = {
  metricGroups: MetricGroups;
};

type InitialStats = {
  function_complexities?: FunctionComplexities;
  fatal?: FatalEntry[];
  duplication?: number | null;
  maintainability?: MaintainabilityPayload;
};

type StatsSnapshot = {
  function_complexities: FunctionComplexities;
  fatal: FatalEntry[];
  duplication: number | null;
  maintainability: MaintainabilityPayload;
};

type AnalyseResponse = Partial<InitialStats> & {
  status?: string;
  text?: string | null;
};

type StatsPanelProps = {
  stats: InitialStats;
  code: string;
  onProblemFocus: (target: {
    id: string;
    title: string;
    message: string;
    locations: Array<{ line: number; column: number }>;
  }) => void;
};

type PageMap = Record<MetricKey, number>;

const DEFAULT_GROUPS: MetricGroups = {
  complexity: {
    metric: "complexity",
    label: "Complexity",
    score: 100,
    deductedPoints: 0,
    problems: [],
  },
  duplication: {
    metric: "duplication",
    label: "Duplication",
    score: 100,
    deductedPoints: 0,
    problems: [],
  },
  function_size: {
    metric: "function_size",
    label: "Function size",
    score: 100,
    deductedPoints: 0,
    problems: [],
  },
};

const METRIC_ORDER: MetricKey[] = ["complexity", "duplication", "function_size"];
const PROBLEMS_PER_PAGE = 3;

const INITIAL_PAGE_MAP: PageMap = {
  complexity: 0,
  duplication: 0,
  function_size: 0,
};

function normalizeStats(input: InitialStats | StatsSnapshot): StatsSnapshot {
  return {
    function_complexities: {
      all: input.function_complexities?.all ?? [],
      avg: input.function_complexities?.avg ?? 100,
    },
    fatal: input.fatal ?? [],
    duplication: input.duplication ?? null,
    maintainability: {
      metricGroups: {
        complexity: input.maintainability?.metricGroups?.complexity ?? DEFAULT_GROUPS.complexity,
        duplication: input.maintainability?.metricGroups?.duplication ?? DEFAULT_GROUPS.duplication,
        function_size: input.maintainability?.metricGroups?.function_size ?? DEFAULT_GROUPS.function_size,
      },
    },
  };
}

function toIssueText(issue: StatIssue | string) {
  if (typeof issue === "string") {
    return issue;
  }

  const message = issue.message ?? issue.text ?? "Unknown issue";
  return `${message} || line: ${issue.line ?? "N/A"} column: ${issue.column ?? "N/A"}`;
}

function groupProblemsByTag(problems: AggregatedProblem[]) {
  return problems.reduce<Record<string, number>>((accumulator, problem) => {
    const tag = problem.problemGroup;
    accumulator[tag] = (accumulator[tag] ?? 0) + 1;
    return accumulator;
  }, {});
}

function aggregateProblems(problems: MetricProblem[]): AggregatedProblem[] {
  const grouped = new Map<string, AggregatedProblem>();

  problems.forEach((problem) => {
    const problemGroup = problem.problemGroup ?? "General";
    const key = `${problemGroup}::${problem.hint}`;
    const locationLine = typeof problem.line === "number" ? problem.line : null;
    const locationColumn = typeof problem.column === "number" ? problem.column : 1;

    if (!grouped.has(key)) {
      grouped.set(key, {
        id: `agg-${problem.id}`,
        metric: problem.metric,
        problemGroup,
        hint: problem.hint,
        message: problem.message,
        occurrenceCount: 0,
        locations: [],
      });
    }

    const current = grouped.get(key);
    if (!current) return;

    current.occurrenceCount += 1;

    if (locationLine !== null) {
      const exists = current.locations.some(
        (location) => location.line === locationLine && location.column === locationColumn,
      );

      if (!exists) {
        current.locations.push({ line: locationLine, column: locationColumn });
      }
    }
  });

  return Array.from(grouped.values()).sort((left, right) => right.occurrenceCount - left.occurrenceCount);
}

export function StatsPanel({ stats, code, onProblemFocus }: StatsPanelProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isMaintainabilityExpanded, setIsMaintainabilityExpanded] = useState(true);
  const [revealedProblems, setRevealedProblems] = useState<Record<string, boolean>>({});
  const [pageByMetric, setPageByMetric] = useState<PageMap>(INITIAL_PAGE_MAP);
  const [currentStats, setCurrentStats] = useState<StatsSnapshot>(() => normalizeStats(stats));

  const hasFatal = currentStats.fatal.length > 0;

  const aggregatedByMetric = useMemo(() => {
    return {
      complexity: aggregateProblems(currentStats.maintainability.metricGroups.complexity.problems),
      duplication: aggregateProblems(currentStats.maintainability.metricGroups.duplication.problems),
      function_size: aggregateProblems(currentStats.maintainability.metricGroups.function_size.problems),
    } satisfies Record<MetricKey, AggregatedProblem[]>;
  }, [currentStats.maintainability.metricGroups]);

  const totalRevealPenalty = useMemo(
    () => Object.values(revealedProblems).filter(Boolean).length,
    [revealedProblems],
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
          fatal: data.fatal ?? previousStats.fatal,
          duplication: data.duplication ?? previousStats.duplication,
          maintainability: data.maintainability ?? previousStats.maintainability,
        }),
      );
      setRevealedProblems({});
      setPageByMetric(INITIAL_PAGE_MAP);
    } catch (error) {
      console.error("Failed to check measurements", error);
    } finally {
      setIsChecking(false);
    }
  };

  const revealProblem = (problemId: string) => {
    setRevealedProblems((previousValue) => {
      if (previousValue[problemId]) {
        return previousValue;
      }

      return {
        ...previousValue,
        [problemId]: true,
      };
    });
  };

  const goToPreviousPage = (metric: MetricKey) => {
    setPageByMetric((previousValue) => ({
      ...previousValue,
      [metric]: Math.max(0, previousValue[metric] - 1),
    }));
  };

  const goToNextPage = (metric: MetricKey, totalPages: number) => {
    setPageByMetric((previousValue) => ({
      ...previousValue,
      [metric]: Math.min(totalPages - 1, previousValue[metric] + 1),
    }));
  };

  const metricScores = METRIC_ORDER.map((metric) => currentStats.maintainability.metricGroups[metric].score);
  const baseFinalScore =
    metricScores.length > 0
      ? Math.round(metricScores.reduce((total, score) => total + score, 0) / metricScores.length)
      : 100;
  const finalScore = Math.max(0, baseFinalScore - totalRevealPenalty);

  if (hasFatal) {
    return (
      <section className="panelShell">
        <div className="panelTitle">Maintainability</div>
        <div className="statsContent">
          <div className="statsFatalTitle">Fatal</div>
          <div className="statsFatalList">
            {currentStats.fatal.map((fatalEntry, index) => (
              <div key={`${toIssueText(fatalEntry)}-${index}`}>{toIssueText(fatalEntry)}</div>
            ))}
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
      <div className="panelTitle">Maintainability</div>
      <div className="statsContent">
        <button
          className="statsSectionToggle"
          type="button"
          onClick={() => setIsMaintainabilityExpanded((previousValue) => !previousValue)}
        >
          Maintainability {isMaintainabilityExpanded ? "(⬇️)" : "(➡️)"}
        </button>

        {isMaintainabilityExpanded ? (
          <div className="metricGroupList">
            {METRIC_ORDER.map((metric) => {
              const group = currentStats.maintainability.metricGroups[metric];
              const aggregatedProblems = aggregatedByMetric[metric];
              const tagCounts = groupProblemsByTag(aggregatedProblems);
              const totalPages = Math.max(1, Math.ceil(aggregatedProblems.length / PROBLEMS_PER_PAGE));
              const page = Math.min(pageByMetric[metric], totalPages - 1);
              const start = page * PROBLEMS_PER_PAGE;
              const visibleProblems = aggregatedProblems.slice(start, start + PROBLEMS_PER_PAGE);

              return (
                <section key={group.metric} className="metricGroupCard">
                  <div className="metricGroupTitle">
                    - {group.label}
                    <span className="metricGroupScore">score: {group.score}/100</span>
                  </div>
                  <div className="metricGroupMeta">(related group problems): {aggregatedProblems.length}</div>

                  {aggregatedProblems.length > 0 ? (
                    <div className="metricProblemList">
                      <div className="metricSubGroupWrap">
                        {Object.entries(tagCounts).map(([tag, count]) => (
                          <span key={tag} className="metricSubGroupChip">
                            {tag} ({count})
                          </span>
                        ))}
                      </div>

                      <div className="metricProblemNav">
                        <button
                          className="statsButton"
                          type="button"
                          onClick={() => goToPreviousPage(metric)}
                          disabled={page === 0}
                          aria-label="Previous problems"
                        >
                          ←
                        </button>
                        <span className="metricPageLabel">
                          {page + 1}/{totalPages}
                        </span>
                        <button
                          className="statsButton"
                          type="button"
                          onClick={() => goToNextPage(metric, totalPages)}
                          disabled={page >= totalPages - 1}
                          aria-label="Next problems"
                        >
                          →
                        </button>
                      </div>

                      <div className="metricProblemGrid">
                        {visibleProblems.map((problem) => {
                          const isRevealed = Boolean(revealedProblems[problem.id]);

                          return (
                            <div
                              key={problem.id}
                              className={
                                isRevealed
                                  ? "metricProblemItem metricProblemItemClickable metricProblemItemRevealed"
                                  : "metricProblemItem metricProblemItemHidden"
                              }
                              onClick={() => {
                                if (!isRevealed) return;
                                if (problem.locations.length === 0) return;
                                onProblemFocus({
                                  id: problem.id,
                                  title: `${group.label} · ${problem.problemGroup}`,
                                  message: `${problem.hint} (${problem.occurrenceCount} similar spot${problem.occurrenceCount > 1 ? "s" : ""})`,
                                  locations: problem.locations,
                                });
                              }}
                            >
                              <button
                                className="metricProblemLlmButton"
                                type="button"
                                onClick={(event) => event.stopPropagation()}
                              >
                                ✨ Explain
                              </button>

                              <div className="metricProblemMeta">{problem.problemGroup}</div>
                              <div className="metricProblemText">{problem.hint}</div>

                              {!isRevealed ? (
                                <button
                                  className="metricRevealOverlay"
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    revealProblem(problem.id);
                                  }}
                                >
                                  <span className="metricRevealTitle">🔒 Locked hint</span>
                                  <span className="metricRevealHint">Reveal will deduct 1 point from final score</span>
                                </button>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="metricGroupMeta">- No issues found</div>
                  )}
                </section>
              );
            })}
          </div>
        ) : null}

        <div className="statsFinalScore">
          <span>Final score: {finalScore}/100</span>
          <span className="statsFinalScoreMeta">reveal penalty: -{totalRevealPenalty}</span>
        </div>

        <button className="statsActionButton" type="button" onClick={handleCheckMeasurements} disabled={isChecking}>
          {isChecking ? "Checking..." : "Check measurements"}
        </button>
      </div>
    </section>
  );
}
