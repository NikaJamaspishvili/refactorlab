import type {
  AffectedLineRange,
  FatalEntry,
  GroupedIssueCategory,
  SonarIssue,
  SonarIssuePosition,
  SonarIssuesResponse,
  SubmitFeedback,
  TestsFailedPayload,
} from "./types";

export function toLineOnlyPositions(
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

export function toEditorPositionsFromAffectedLines(
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

export function toIssueText(issue: FatalEntry) {
  if (typeof issue === "string") {
    return issue;
  }

  const message = issue.message ?? issue.text ?? "Unknown issue";
  return `${message} || line: ${issue.line ?? "N/A"} column: ${issue.column ?? "N/A"}`;
}

export function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

export function formatAtMostOneDecimal(value: number) {
  const rounded = roundToOneDecimal(value);
  if (Number.isInteger(rounded)) {
    return `${rounded}`;
  }

  return rounded.toFixed(1);
}

export function getIssueDeduction(issue: SonarIssue) {
  const perProblemScore = issue.score ?? issue.severity;
  return roundToOneDecimal(perProblemScore * issue.positions.length);
}

export function calculateCategoryScores(issues: SonarIssuesResponse) {
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

export function calculateFinalScore(issues: SonarIssuesResponse): number | null {
  const categoryScores = calculateCategoryScores(issues);
  const scores = Object.values(categoryScores);

  if (scores.length === 0) {
    return null;
  }

  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return roundToOneDecimal(average);
}

export function getPercentChange(current: number, base: number) {
  if (base === 0) {
    return current === 0 ? 0 : 100;
  }

  const percent = Math.abs(((current - base) / base) * 100);
  return roundToOneDecimal(percent);
}

export function buildGroupedIssues(
  analysedIssues: SonarIssuesResponse,
): GroupedIssueCategory[] {
  const groups: Record<string, GroupedIssueCategory> = {};

  for (const [ruleId, issue] of Object.entries(analysedIssues)) {
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
}

export function buildBaselineDelta(
  finalScore: number | null,
  baselineFinalScore: number | null,
) {
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
}

export function buildSubmitFeedback(
  nextFinalScore: number | null,
  previousFinalScore: number | null,
): SubmitFeedback | null {
  if (nextFinalScore === null) {
    return null;
  }

  if (previousFinalScore === null) {
    return {
      direction: "same",
      title: "Baseline captured",
      subtitle: `Starting score is ${formatAtMostOneDecimal(nextFinalScore)}/100`,
    };
  }

  const change = roundToOneDecimal(nextFinalScore - previousFinalScore);
  const percent = getPercentChange(nextFinalScore, previousFinalScore);

  if (change > 0) {
    return {
      direction: "up",
      title: "Great improvement",
      subtitle: `Score increased by ${formatAtMostOneDecimal(percent)}%`,
    };
  }

  if (change < 0) {
    return {
      direction: "down",
      title: "Score decreased",
      subtitle: `Score dropped by ${formatAtMostOneDecimal(percent)}%`,
    };
  }

  return {
    direction: "same",
    title: "No score change",
    subtitle: "Your score stayed the same",
  };
}

export function buildExpandedCategories(issues: SonarIssuesResponse) {
  const nextExpandedCategories: Record<string, boolean> = {};

  for (const issue of Object.values(issues)) {
    if (!nextExpandedCategories[issue.category]) {
      nextExpandedCategories[issue.category] = false;
    }
  }

  return nextExpandedCategories;
}

export function isTestsFailedPayload(value: unknown): value is TestsFailedPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return (
    "status" in value &&
    value.status === "TESTS_FAILED" &&
    (!("affectedLines" in value) || Array.isArray(value.affectedLines))
  );
}

export function getFailedSummary(summary: string | undefined, failedCount: number) {
  const matches = summary?.match(/(\d+)\s*\/\s*(\d+)/);
  if (!matches) {
    return `${failedCount} failed`;
  }

  const passed = Number(matches[1]);
  const total = Number(matches[2]);
  const failed = Math.max(0, total - passed);

  return `${failed}/${total} failed.`;
}

export function getCategoryDelta(
  currentScore: number,
  baselineScores: Record<string, number> | null,
  category: string,
) {
  const baselineScore = baselineScores?.[category];

  if (baselineScore === undefined) {
    return null;
  }

  if (currentScore > baselineScore) {
    return {
      direction: "up" as const,
      label: `+${formatAtMostOneDecimal(currentScore - baselineScore)} ↑`,
    };
  }

  if (currentScore < baselineScore) {
    return {
      direction: "down" as const,
      label: `-${formatAtMostOneDecimal(baselineScore - currentScore)} ↓`,
    };
  }

  return {
    direction: "same" as const,
    label: "0 →",
  };
}
