import { ESLint } from "eslint";
import sonarjs from "eslint-plugin-sonarjs";
import { sonarRuleDictionary } from "./static";
import { getContext } from "./context_parse";

export async function eslint(filepath) {
  function extractCognitiveComplexity(message) {
    const complexityMatch = message.message.match(
      /Cognitive Complexity from (\d+) to the (\d+) allowed/i,
    );
    if (!complexityMatch) return null;

    return Number(complexityMatch[1]);
  }

  const allSonarRulesAsError = Object.fromEntries(
    Object.keys(sonarRuleDictionary).map((name) => [`${name}`, "error"]),
  );

  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [
      {
        ...sonarjs.configs.recommended,
        rules: {
          ...allSonarRulesAsError,
        },
      },
    ],
  });

  const [result] = await eslint.lintFiles([filepath]);

  let object = {};

  // const fatalIssue = result.messages.filter((item) => item.fatal);
  // if (fatalIssue.length > 0) return fatalIssue;

  result.messages.forEach((message) => {
    let score = 3;

    if (message.ruleId === "sonarjs/cognitive-complexity") {
      score = extractCognitiveComplexity(message);
    }

    if (!sonarRuleDictionary[message.ruleId]) return;

    const node = getContext(
      filepath,
      message.line,
      message.column,
      sonarRuleDictionary[message.ruleId].context,
    );

    // console.log(
    //   node,
    //   message.line,
    //   message.column,
    //   message.message,
    //   sonarRuleDictionary[message.ruleId].context,
    // );

    if (object[message.ruleId]) {
      object[message.ruleId].positions.push({
        line: node.startLine,
        column: 0,
        endline: node.endLine,
        endColumn: 0,
      });
      object[message.ruleId].score += score;
    } else {
      object[message.ruleId] = {
        severity: message.severity,
        positions: [
          {
            line: node.startLine,
            column: 0,
            endline: node.endLine,
            endColumn: 0,
          },
        ],
        hint_1: sonarRuleDictionary[message.ruleId].hint_1,
        score: score,
        category: sonarRuleDictionary[message.ruleId].group,
        title: sonarRuleDictionary[message.ruleId].title,
        description: sonarRuleDictionary[message.ruleId].description,
        message: message.message,
      };
    }
  });

  return object;
}

export async function syntaxCheck(tmpFilePath) {
  const checker = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [
      {
        languageOptions: {
          ecmaVersion: "latest",
          sourceType: "module",
        },
        rules: {}, // important: no lint rules, only parser/syntax validation
      },
    ],
    ignore: false,
  });

  const [result] = await checker.lintFiles([tmpFilePath]);

  const fatalMessages = result.messages.filter((m) => m.fatal);
  return {
    ok: fatalMessages.length === 0,
    fatalMessages,
  };
}
