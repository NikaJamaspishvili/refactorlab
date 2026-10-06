"use client";

import { useMemo, useState } from "react";
type StatIssue = {
  text?: string | null;
  message?: string | null;
  line?: number;
  column?: number;
};

type FatalEntry = StatIssue | string;

type InitialStats = {
  function_complexities: {
    all: Array<{ line: number; column: number; score: number }>;
    avg: number;
  };
  maintainabilityIssues: number;
  errors: StatIssue[];
  warnings?: StatIssue[];
  fatal?: FatalEntry[];
  duplication?: number | null;
};

type SonarIssuePosition = {
  line: number;
  column: number;
  endline?: number;
  endColumn?: number;
};

type SonarIssue = {
  severity: number;
  score?: number;
  positions: SonarIssuePosition[];
  category: string;
  title: string;
  description: string;
  message: string;
};

type SonarIssuesResponse = Record<string, SonarIssue>;

type GroupedIssueCategory = {
  category: string;
  score: number;
  deduction: number;
  problemCount: number;
  issues: Array<
    SonarIssue & {
      ruleId: string;
      occurrences: number;
      deductedPoints: number;
    }
  >;
};

type ChangeDirection = "up" | "down" | "same";

type SubmitFeedback = {
  direction: ChangeDirection;
  title: string;
  subtitle: string;
};

type AffectedLineRange = {
  startLine: number;
  endLine: number;
};

type FailedTest = {
  name?: string;
  input?: unknown;
  expected?: unknown;
  actual?: unknown;
  message?: string;
};

type TestsResultPayload = {
  failedTests?: FailedTest[];
  ok?: boolean;
  returnValue?: string;
  summary?: string;
};

type TestsFailedPayload = {
  status: "TESTS_FAILED";
  testsResult?: TestsResultPayload;
  affectedLines?: AffectedLineRange[];
};

type StatsPanelProps = {
  code: string;
  onRuleClick: (positions: SonarIssuePosition[]) => void;
};

function toLineOnlyPositions(
  positions: SonarIssuePosition[],
): SonarIssuePosition[] {
  return positions.map((position) => {
    const startLine = Math.max(1, position.line);
    const endLine = Math.max(startLine, position.endline ?? startLine);

    return {
      line: startLine,
      column: 1,
      endline: endLine,
      endColumn: 1,
    };
  });
}

function toIssueText(issue: StatIssue | string) {
  if (typeof issue === "string") {
    return issue;
  }

  const message = issue.message ?? issue.text ?? "Unknown issue";
  return `${message} || line: ${issue.line ?? "N/A"} column: ${issue.column ?? "N/A"}`;
}

function isSonarIssue(value: unknown): value is SonarIssue {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return (
    "category" in value &&
    typeof value.category === "string" &&
    "title" in value &&
    typeof value.title === "string" &&
    "description" in value &&
    typeof value.description === "string" &&
    "message" in value &&
    typeof value.message === "string" &&
    "severity" in value &&
    typeof value.severity === "number" &&
    (!("score" in value) || typeof value.score === "number") &&
    "positions" in value &&
    Array.isArray(value.positions)
  );
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function formatAtMostOneDecimal(value: number) {
  const rounded = roundToOneDecimal(value);
  if (Number.isInteger(rounded)) {
    return `${rounded}`;
  }

  return rounded.toFixed(1);
}

function getIssueDeduction(issue: SonarIssue) {
  const perProblemScore = issue.score ?? issue.severity;
  return roundToOneDecimal(perProblemScore * issue.positions.length);
}

function calculateCategoryScores(issues: SonarIssuesResponse) {
  const categoryDeductions: Record<string, number> = {};

  for (const issue of Object.values(issues)) {
    const category = issue.category || "Other";
    const issueDeduction = getIssueDeduction(issue);

    if (categoryDeductions[category] === undefined) {
      categoryDeductions[category] = 0;
    }

    categoryDeductions[category] = roundToOneDecimal(
      categoryDeductions[category] + issueDeduction,
    );
  }

  const categoryScores: Record<string, number> = {};
  for (const [category, deduction] of Object.entries(categoryDeductions)) {
    categoryScores[category] = roundToOneDecimal(Math.max(0, 100 - deduction));
  }

  return categoryScores;
}

function calculateFinalScore(issues: SonarIssuesResponse): number | null {
  const categoryScores = calculateCategoryScores(issues);
  const scores = Object.values(categoryScores);

  if (scores.length === 0) {
    return null;
  }

  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return roundToOneDecimal(average);
}

function getPercentChange(current: number, base: number) {
  if (base === 0) {
    return current === 0 ? 0 : 100;
  }

  const percent = Math.abs(((current - base) / base) * 100);
  return roundToOneDecimal(percent);
}

function isTestsFailedPayload(value: unknown): value is TestsFailedPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return (
    "status" in value &&
    value.status === "TESTS_FAILED" &&
    (!("affectedLines" in value) || Array.isArray(value.affectedLines))
  );
}

function toEditorPositionsFromAffectedLines(
  affectedLines: AffectedLineRange[],
): SonarIssuePosition[] {
  return affectedLines.map((range) => {
    const startLine = Math.max(1, range.startLine);
    const endLine = Math.max(startLine, range.endLine);

    return {
      line: startLine,
      column: 1,
      endline: endLine,
      endColumn: 1,
    };
  });
}

function getFailedSummary(summary: string | undefined, failedCount: number) {
  const matches = summary?.match(/(\d+)\s*\/\s*(\d+)/);
  if (!matches) {
    return `${failedCount} failed`;
  }

  const passed = Number(matches[1]);
  const total = Number(matches[2]);
  const failed = Math.max(0, total - passed);

  return `${failed}/${total} failed.`;
}

export function StatsPanel({ code, onRuleClick }: StatsPanelProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [analysedIssues, setAnalysedIssues] = useState<SonarIssuesResponse>({});
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [baselineFinalScore, setBaselineFinalScore] = useState<number | null>(
    null,
  );
  const [baselineCategoryScores, setBaselineCategoryScores] = useState<Record<
    string,
    number
  > | null>(null);
  const [previousFinalScore, setPreviousFinalScore] = useState<number | null>(
    null,
  );
  const [submitFeedback, setSubmitFeedback] = useState<SubmitFeedback | null>(
    null,
  );
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>(
    {},
  );

  const [fata, setFatal] = useState("");
  const [testsFailedPayload, setTestsFailedPayload] = useState<{
    testsResult: TestsResultPayload;
    affectedLines: AffectedLineRange[];
  } | null>(null);
  const [isFailedTestsOpen, setIsFailedTestsOpen] = useState(false);

  const groupedIssues = useMemo<GroupedIssueCategory[]>(() => {
    const groups: Record<string, GroupedIssueCategory> = {};

    for (const [ruleId, issue] of Object.entries(analysedIssues)) {
      if (!isSonarIssue(issue)) {
        continue;
      }

      const categoryName = issue.category || "Other";

      if (!groups[categoryName]) {
        groups[categoryName] = {
          category: categoryName,
          score: 100,
          deduction: 0,
          problemCount: 0,
          issues: [],
        };
      }

      const deductedPoints = getIssueDeduction(issue);

      groups[categoryName].issues.push({
        ...issue,
        ruleId,
        occurrences: issue.positions.length,
        deductedPoints,
      });
    }

    const groupedArray = Object.values(groups).map((group) => {
      const categoryDeduction = roundToOneDecimal(
        group.issues.reduce((sum, issue) => {
          return sum + issue.deductedPoints;
        }, 0),
      );

      const problemCount = group.issues.reduce((sum, issue) => {
        return sum + issue.occurrences;
      }, 0);

      const score = roundToOneDecimal(Math.max(0, 100 - categoryDeduction));

      return {
        ...group,
        score,
        deduction: categoryDeduction,
        problemCount,
      };
    });

    groupedArray.sort((a, b) => a.category.localeCompare(b.category));
    return groupedArray;
  }, [analysedIssues]);

  const finalScore = useMemo(() => {
    if (groupedIssues.length === 0) {
      return null;
    }

    const total = groupedIssues.reduce((sum, group) => sum + group.score, 0);
    return roundToOneDecimal(total / groupedIssues.length);
  }, [groupedIssues]);

  const baselineDelta = useMemo(() => {
    if (finalScore === null || baselineFinalScore === null) {
      return null;
    }

    const change = roundToOneDecimal(finalScore - baselineFinalScore);
    const percent = getPercentChange(finalScore, baselineFinalScore);

    if (change > 0) {
      return {
        direction: "up" as const,
        label: `↑ ${formatAtMostOneDecimal(percent)}%`,
      };
    }

    if (change < 0) {
      return {
        direction: "down" as const,
        label: `↓ ${formatAtMostOneDecimal(percent)}%`,
      };
    }

    return {
      direction: "same" as const,
      label: `→ ${formatAtMostOneDecimal(0)}%`,
    };
  }, [finalScore, baselineFinalScore]);

  const sendLllmrequest = async (issue: any) => {
    console.log(issue);
    const response = await fetch("http://localhost:3000/api/llm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ issue, code }),
    });

    const data = (await response.json()) as any;
    console.log(data);
    const finalcontent = (await JSON.parse(data.llm_response)) as any;

    console.log(finalcontent);
  };

  const handleCheckMeasurements = async () => {
    setIsChecking(true);

    try {
      const response = await fetch("http://localhost:3000/api/analyse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, exerciseId: "2" }),
      });

      const data = (await response.json()) as any;

      console.log(data);

      if (response.status === 400) {
        if (data.status === "FATAL_MESSAGE") {
          if (
            Array.isArray(data.fatalMessages) &&
            data.fatalMessages.length > 0
          ) {
            setFatal(toIssueText(data.fatalMessages[0] as FatalEntry));
          } else {
            setFatal("Fatal error while analysing code.");
          }

          setAnalysedIssues({});
          setSelectedRuleId(null);
          setRevealedHints({});
          setTestsFailedPayload(null);
          setIsFailedTestsOpen(false);
          onRuleClick([]);
          return;
        }
      }

      if (isTestsFailedPayload(data)) {
        setFatal("");
        setAnalysedIssues({});
        setSelectedRuleId(null);
        setRevealedHints({});
        setTestsFailedPayload({
          testsResult: data.testsResult ?? {},
          affectedLines: data.affectedLines ?? [],
        });
        setIsFailedTestsOpen(false);
        onRuleClick([]);
        return;
      }

      setFatal("");
      setTestsFailedPayload(null);

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        return;
      }

      const mappedIssues: SonarIssuesResponse = {};

      for (const [key, value] of Object.entries(data)) {
        if (isSonarIssue(value)) {
          mappedIssues[key] = value;
        }
      }

      const nextFinalScore = calculateFinalScore(mappedIssues);
      const nextCategoryScores = calculateCategoryScores(mappedIssues);

      if (nextFinalScore !== null && baselineFinalScore === null) {
        setBaselineFinalScore(nextFinalScore);
      }

      if (baselineCategoryScores === null) {
        setBaselineCategoryScores(nextCategoryScores);
      }

      if (nextFinalScore !== null && previousFinalScore !== null) {
        const change = roundToOneDecimal(nextFinalScore - previousFinalScore);
        const percent = getPercentChange(nextFinalScore, previousFinalScore);

        if (change > 0) {
          setSubmitFeedback({
            direction: "up",
            title: "Great improvement",
            subtitle: `Score increased by ${formatAtMostOneDecimal(percent)}%`,
          });
        } else if (change < 0) {
          setSubmitFeedback({
            direction: "down",
            title: "Score decreased",
            subtitle: `Score dropped by ${formatAtMostOneDecimal(percent)}%`,
          });
        } else {
          setSubmitFeedback({
            direction: "same",
            title: "No score change",
            subtitle: "Your score stayed the same",
          });
        }
      }

      if (nextFinalScore !== null && previousFinalScore === null) {
        setSubmitFeedback({
          direction: "same",
          title: "Baseline captured",
          subtitle: `Starting score is ${formatAtMostOneDecimal(nextFinalScore)}/100`,
        });
      }

      setPreviousFinalScore(nextFinalScore);
      setAnalysedIssues(mappedIssues);
      setSelectedRuleId(null);
      setRevealedHints({});
      onRuleClick([]);

      const nextExpandedCategories: Record<string, boolean> = {};
      for (const issue of Object.values(mappedIssues)) {
        if (!nextExpandedCategories[issue.category]) {
          nextExpandedCategories[issue.category] = false;
        }
      }
      setExpandedCategories(nextExpandedCategories);
    } catch (error) {
      console.error("Failed to check measurements", error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <section className="panelShell">
      <div className="panelTitle">Stats</div>
      <div className="statsContent">
        {submitFeedback ? (
          <div
            className={`statsSubmitFeedback statsSubmitFeedback${submitFeedback.direction}`}
          >
            <div className="statsSubmitFeedbackTitle">
              {submitFeedback.title}
            </div>
            <div className="statsSubmitFeedbackSubtitle">
              {submitFeedback.subtitle}
            </div>
            <button
              className="statsSubmitFeedbackButton"
              type="button"
              onClick={() => setSubmitFeedback(null)}
            >
              Got it
            </button>
          </div>
        ) : null}

        {fata ? (
          <>
            <div className="statsFatalTitle">Fatal</div>
            <div className="statsFatalList">{fata}</div>
          </>
        ) : testsFailedPayload ? (
          <div className="statsTestsFailedWrapper">
            <button
              className="statsTestsFailedHeader"
              type="button"
              onClick={() => setIsFailedTestsOpen((previous) => !previous)}
            >
              <span>
                {getFailedSummary(
                  testsFailedPayload.testsResult.summary,
                  testsFailedPayload.testsResult.failedTests?.length ?? 0,
                )}
              </span>
              <span
                className={`statsCategoryArrow ${isFailedTestsOpen ? "statsCategoryArrowOpen" : ""}`}
              >
                ▾
              </span>
            </button>

            {isFailedTestsOpen ? (
              <div className="statsTestsFailedBody">
                {(testsFailedPayload.testsResult.failedTests ?? []).map(
                  (failedTest, index) => (
                    <div
                      key={`${failedTest.name ?? "failed-test"}-${index}`}
                      className="statsIssueCard"
                    >
                      <div className="statsIssueTitle">
                        test name: {failedTest.name ?? "unknown"}
                      </div>
                      <div className="statsIssueDescription">
                        input: {JSON.stringify(failedTest.input)}
                      </div>
                      <div className="statsIssueDescription">
                        expected output: {JSON.stringify(failedTest.expected)}
                      </div>
                      <div
                        className="statsIssueDescription"
                        style={{ color: "red" }}
                      >
                        actual output:{" "}
                        {JSON.stringify(failedTest.actual) ?? "No message"}
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : null}

            <button
              className="statsActionButton"
              type="button"
              onClick={() => {
                const positions = toEditorPositionsFromAffectedLines(
                  testsFailedPayload.affectedLines,
                );
                onRuleClick(positions);
              }}
              disabled={testsFailedPayload.affectedLines.length === 0}
            >
              Highlight possible code blocks
            </button>
          </div>
        ) : (
          <>
            <div className="statsFinalScoreCard">
              <span className="statsFinalScoreLabel">Final Score</span>
              <div className="statsFinalScoreRight">
                <span className="statsFinalScoreValue">
                  {finalScore === null
                    ? "--"
                    : formatAtMostOneDecimal(finalScore)}
                  /100
                </span>
                {baselineDelta ? (
                  <span
                    className={`statsFinalScoreDelta statsFinalScoreDelta${baselineDelta.direction}`}
                  >
                    {baselineDelta.label}
                  </span>
                ) : null}
              </div>
            </div>

            {groupedIssues.length > 0 ? (
              <div className="statsGroupedIssues">
                {groupedIssues.map((group) => {
                  const isOpen = expandedCategories[group.category] ?? false;

                  return (
                    <div key={group.category} className="statsCategoryCard">
                      <button
                        className="statsCategoryHeader"
                        type="button"
                        onClick={() => {
                          setExpandedCategories((previous) => ({
                            ...previous,
                            [group.category]: !isOpen,
                          }));
                        }}
                      >
                        <span className="statsCategoryName">
                          {group.category}
                        </span>
                        <span className="statsCategoryHeaderRight">
                          <span className="statsCategoryScore">
                            {formatAtMostOneDecimal(group.score)}/100
                          </span>
                          {baselineCategoryScores?.[group.category] !==
                          undefined ? (
                            <span
                              className={`statsFinalScoreDelta statsFinalScoreDelta${
                                group.score >
                                baselineCategoryScores[group.category]
                                  ? "up"
                                  : group.score <
                                      baselineCategoryScores[group.category]
                                    ? "down"
                                    : "same"
                              }`}
                            >
                              {group.score >
                              baselineCategoryScores[group.category]
                                ? `+${formatAtMostOneDecimal(
                                    group.score -
                                      baselineCategoryScores[group.category],
                                  )} ↑`
                                : group.score <
                                    baselineCategoryScores[group.category]
                                  ? `-${formatAtMostOneDecimal(
                                      baselineCategoryScores[group.category] -
                                        group.score,
                                    )} ↓`
                                  : `0 →`}
                            </span>
                          ) : null}
                          <span
                            className={`statsCategoryArrow ${isOpen ? "statsCategoryArrowOpen" : ""}`}
                          >
                            ▾
                          </span>
                        </span>
                      </button>

                      <div
                        className={`statsCategoryBody ${isOpen ? "statsCategoryBodyOpen" : ""}`}
                      >
                        <div className="statsCategoryBodyInner">
                          <div className="statsCategoryMeta">
                            {group.problemCount} problems ·{" "}
                            {group.issues.length} rules · deduction: -
                            {formatAtMostOneDecimal(group.deduction)}
                          </div>

                          {group.issues.map((issue: any) => (
                            <div
                              key={`${group.category}-${issue.ruleId}`}
                              className={`statsIssueCard statsIssueCardClickable ${selectedRuleId === issue.ruleId ? "statsIssueCardActive" : ""}`}
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                setSelectedRuleId(issue.ruleId);
                                onRuleClick(
                                  toLineOnlyPositions(issue.positions),
                                );
                              }}
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                                  event.preventDefault();
                                  setSelectedRuleId(issue.ruleId);
                                  onRuleClick(
                                    toLineOnlyPositions(issue.positions),
                                  );
                                }
                              }}
                            >
                              <div className="statsIssueTitle">
                                {issue.title}
                              </div>
                              <div className="statsIssueDescription">
                                {issue.description}
                              </div>
                              {revealedHints[issue.ruleId] ? (
                                <div
                                  className="statsIssueAction"
                                  dangerouslySetInnerHTML={{
                                    __html: `action: ${issue.hint_1}`,
                                  }}
                                />
                              ) : null}
                              <div className="statsIssueMeta">
                                occurrences: {issue.occurrences} · deduction: -
                                {formatAtMostOneDecimal(issue.deductedPoints)}
                              </div>
                              <div className="statsIssueButtons">
                                <div
                                  className="statsButton"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setRevealedHints((previous) => ({
                                      ...previous,
                                      [issue.ruleId]: !previous[issue.ruleId],
                                    }));
                                  }}
                                >
                                  <div>
                                    <button>
                                      {revealedHints[issue.ruleId]
                                        ? "X"
                                        : "action"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="statsEmptyState">
                Click <strong>Check measurements</strong> to load category
                scores.
              </div>
            )}
          </>
        )}

        <button
          className="statsActionButton"
          type="button"
          onClick={handleCheckMeasurements}
          disabled={isChecking}
        >
          {isChecking ? "Checking..." : "Check measurements"}
        </button>
      </div>
    </section>
  );
}
