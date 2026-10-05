import { ESLint } from "eslint";
import sonarjs from "eslint-plugin-sonarjs";
import {
  COMPLEXITY_RULE_GROUP,
  DEDUCTION_PER_ISSUE,
  METRIC,
  RULE_HINTS,
  RULE_TO_METRIC,
  fallbackHintForMetric,
  metricLabel,
} from "./static";

export async function eslint(filepath) {
  const MERGEABLE_RULES = new Set(["sonarjs/no-collapsible-if"]);

  function normalizeMessage(m) {
    return {
      ruleId: m.ruleId ?? null,
      severity: m.severity ?? null,
      fatal: Boolean(m.fatal),
      text: m.message ?? "",
      line: m.line ?? null,
      column: m.column ?? null,
      endLine: m.endLine ?? null,
      endColumn: m.endColumn ?? null,
    };
  }

  function buildHint(message) {
    const metric = RULE_TO_METRIC[message.ruleId] ?? METRIC.COMPLEXITY;
    return RULE_HINTS[message.ruleId] || fallbackHintForMetric(metric);
  }

  function mergeProblems(problems) {
    const sorted = [...problems].sort((left, right) => {
      const leftLine = left.line ?? Number.MAX_SAFE_INTEGER;
      const rightLine = right.line ?? Number.MAX_SAFE_INTEGER;
      if (leftLine !== rightLine) {
        return leftLine - rightLine;
      }

      return (left.column ?? 0) - (right.column ?? 0);
    });

    const merged = [];
    const consumed = new Array(sorted.length).fill(false);

    for (let index = 0; index < sorted.length; index += 1) {
      if (consumed[index]) continue;

      const current = sorted[index];
      if (!MERGEABLE_RULES.has(current.ruleId || "")) {
        merged.push(current);
        continue;
      }

      const cluster = [current];
      consumed[index] = true;
      let clusterLastLine = current.endLine ?? current.line ?? 0;

      for (let nextIndex = index + 1; nextIndex < sorted.length; nextIndex += 1) {
        if (consumed[nextIndex]) continue;

        const candidate = sorted[nextIndex];
        if (candidate.ruleId !== current.ruleId) continue;

        const candidateStart = candidate.line ?? Number.MAX_SAFE_INTEGER;
        if (candidateStart - clusterLastLine > 3) {
          break;
        }

        cluster.push(candidate);
        consumed[nextIndex] = true;
        clusterLastLine = Math.max(clusterLastLine, candidate.endLine ?? candidate.line ?? clusterLastLine);
      }

      if (cluster.length === 1) {
        merged.push(current);
        continue;
      }

      const first = cluster[0];
      const last = cluster[cluster.length - 1];
      merged.push({
        ...first,
        endLine: Math.max(first.endLine ?? first.line ?? 0, last.endLine ?? last.line ?? 0),
        message: `${first.message} (grouped ${cluster.length} similar nested-if spots in this block)`,
        hint: "These nested `if` checks are part of one block 🌿. Merge or flatten them together.",
      });
    }

    return merged;
  }

  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [
      {
        ...sonarjs.configs.recommended,
        rules: {
          "sonarjs/nested-control-flow": ["warn", { maximumNestingLevel: 3 }],
          "sonarjs/expression-complexity": ["warn", { max: 3 }],
          "sonarjs/no-nested-functions": ["warn", { threshold: 4 }],
          "sonarjs/no-collapsible-if": "warn",
          "sonarjs/elseif-without-else": "warn",
          "sonarjs/too-many-break-or-continue-in-loop": "warn",
          "sonarjs/no-nested-switch": "warn",
          "sonarjs/no-identical-conditions": "warn",
          "sonarjs/no-duplicated-branches": "warn",
          "sonarjs/no-gratuitous-expressions": "warn",
          "sonarjs/max-lines": ["warn", { maximum: 250 }],
          "sonarjs/max-lines-per-function": ["warn", { maximum: 40 }],
        },
      },
    ],
  });

  const [result] = await eslint.lintFiles([filepath]);

  const metricGroups = {
    [METRIC.COMPLEXITY]: {
      metric: METRIC.COMPLEXITY,
      label: metricLabel(METRIC.COMPLEXITY),
      score: 100,
      deductedPoints: 0,
      problems: [],
    },
    [METRIC.DUPLICATION]: {
      metric: METRIC.DUPLICATION,
      label: metricLabel(METRIC.DUPLICATION),
      score: 100,
      deductedPoints: 0,
      problems: [],
    },
    [METRIC.FUNCTION_SIZE]: {
      metric: METRIC.FUNCTION_SIZE,
      label: metricLabel(METRIC.FUNCTION_SIZE),
      score: 100,
      deductedPoints: 0,
      problems: [],
    },
  };

  const response = {
    errors: [],
    warnings: [],
    fatal: [],
    function_complexities: {
      all: [],
      avg: 100,
    },
    maintainabilityIssues: 0,
    maintainability: {
      metricGroups,
    },
  };

  result.messages.forEach((message, index) => {
    const normalisedMessage = normalizeMessage(message);

    if (message.ruleId?.startsWith("sonarjs")) {
      const metric = RULE_TO_METRIC[message.ruleId] ?? METRIC.COMPLEXITY;
      const deductionPoints = DEDUCTION_PER_ISSUE;

      response.maintainabilityIssues += 1;

      const problem = {
        id: `${message.ruleId || "unknown"}-${index}`,
        metric,
        ruleId: message.ruleId ?? null,
        problemGroup:
          metric === METRIC.COMPLEXITY
            ? (COMPLEXITY_RULE_GROUP[message.ruleId] ?? "Complexity")
            : metric === METRIC.FUNCTION_SIZE
              ? "Function size overflow"
              : "Duplication",
        message: normalisedMessage.text,
        hint: buildHint(message),
        deductionPoints,
        line: normalisedMessage.line,
        column: normalisedMessage.column,
        endLine: normalisedMessage.endLine,
        endColumn: normalisedMessage.endColumn,
      };

      metricGroups[metric].problems.push(problem);
      metricGroups[metric].deductedPoints += deductionPoints;
    }

    if (message.fatal) {
      response.fatal.push(normalisedMessage);
    }

    if (!message.fatal && message.severity === 2) {
      response.errors.push(normalisedMessage);
    }

    if (message.severity === 1) {
      response.warnings.push(normalisedMessage);
    }
  });

  Object.values(metricGroups).forEach((group) => {
    const mergedProblems = mergeProblems(group.problems);
    group.problems = mergedProblems;
    group.deductedPoints = mergedProblems.length * DEDUCTION_PER_ISSUE;
    group.score = Math.max(0, 100 - group.deductedPoints);
  });

  return response;
}
