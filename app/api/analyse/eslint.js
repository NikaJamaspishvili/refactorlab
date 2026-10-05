import { ESLint } from "eslint";
import sonarjs from "eslint-plugin-sonarjs";

export async function eslint(filepath) {
  function extractCognitiveComplexity(message) {
    const complexityMatch = message.message.match(
      /Cognitive Complexity from (\d+) to the (\d+) allowed/i,
    );
    if (!complexityMatch) return null;

    return {
      line: message.line,
      column: message.column,
      score: Number(complexityMatch[1]),
    };
  }

  function normalizeMessage(m) {
    return {
      ruleId: m.ruleId ?? null,
      severity: m.severity ?? null, // 1 warn, 2 error
      fatal: Boolean(m.fatal),
      text: m.message ?? "",
      line: m.line ?? null,
      column: m.column ?? null,
    };
  }

  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [
      {
        ...sonarjs.configs.recommended,
        rules: {
          ...sonarjs.configs.recommended.rules,
          "sonarjs/cognitive-complexity": ["error", 0],
        },
      },
    ],
  });

  const [result] = await eslint.lintFiles([filepath]);

  let response = {
    errors: [],
    warnings: [],
    fatal: [],
    function_complexities: {
      all: [],
      avg: 0,
    },
    maintainabilityIssues: 0,
  };

  result.messages.map((message) => {
    const normalisedMessage = normalizeMessage(message);
    const complexity = extractCognitiveComplexity(message);
    if (message.ruleId?.startsWith("sonarjs")) {
      if (complexity) {
        response.function_complexities.all.push(complexity);
        response.function_complexities.avg += complexity.score;
      } else {
        response.maintainabilityIssues += 1;
      }
    }

    if (message.fatal) {
      response.fatal.push(normalisedMessage);
    }

    if (
      !message.fatal &&
      message.severity === 2 &&
      message.ruleId !== "sonarjs/cognitive-complexity"
    ) {
      response.errors.push(normalisedMessage);
    }

    if (message.severity === 1) {
      response.warnings.push(normalisedMessage);
    }
  });

  response.function_complexities.avg =
    100 -
    Math.round(
      response.function_complexities.avg /
        response.function_complexities.all.length,
    );

  return response;
}
