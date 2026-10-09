import { callLLM } from "../llm";
import EXERCISES from "@/exercises.json";

const RESPONSE_FORMAT = {
  name: "hint_report",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      final_hint: {
        type: "string",
        description: "Final generated hint. Keep under 100 words.",
        maxLength: 700,
      },
      analysis: {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: {
            type: "string",
            description:
              "One broad summary of the problem and why tests failed.",
          },
          code_blocks: {
            type: "array",
            description: "List of problematic code blocks and fixes.",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                start_line: {
                  type: "integer",
                  minimum: 1,
                },
                end_line: {
                  type: "integer",
                  minimum: 1,
                },
                explanation: {
                  type: "string",
                  description:
                    "Why this code block caused the problem and what fix was applied.",
                },
              },
              required: ["start_line", "end_line", "explanation"],
            },
          },
        },
        required: ["summary", "code_blocks"],
      },
    },
    required: ["final_hint", "analysis"],
  },
};

const SYSTEM_MESSAGE = `
You are a deterministic test-failure debugger.

MISSION
Find only the root-cause logic errors that directly explain the CURRENT failing tests, then return output in the required JSON schema.

CONTEXT YOU RECEIVE
1) Failing tests (with expected vs actual)
2) User-updated code snippets + line numbers
3) Original passing code snippets + line numbers

SCOPE (STRICT)
Include a point ONLY if changing that exact code would change at least one currently failing test from fail -> pass.

EXCLUDE (HARD BAN)
Do NOT mention any of the following unless they are a direct root cause of a current failing test:
- clean code / readability
- architecture / design patterns
- refactoring opportunities
- duplication
- naming
- code smells
- “harmless”, “non-blocking”, “not primary”, “can be improved”, “nice to have”
- any issue that does not alter current failing test outcomes

FORBIDDEN OUTPUT BEHAVIOR
- Do not add secondary observations.
- Do not add optional improvements.
- Do not add caveats about unrelated code quality.
- Do not report “also consider” items.
- Do not include items labeled as “not primary cause”.

EVIDENCE REQUIREMENT (PER ITEM)
For every reported issue, you must provide:
- failing test evidence (expected vs actual mismatch)
- the exact responsible snippet/line range
- the minimal fix direction tied to that mismatch

DECISION FILTER (APPLY BEFORE WRITING)
For each candidate point, run:
Q1: If fixed, would at least one current failing test pass?
Q2: Can I prove it from provided tests/snippets?
If Q1 != YES or Q2 != YES, exclude the point.

PRIORITIZATION
- Report only root causes.
- If multiple failures share one root cause, report once.
- Prefer minimal set of causes that explains all observed failures.

UNCERTAINTY RULE
If evidence is insufficient, say so briefly in summary and do not invent causes.

STYLE
- Be concise, concrete, and test-linked.
- No generic best-practice commentary.
- No mention of excluded categories unless they are proven root cause.

    `;

export async function POST(request) {
  try {
    const { failedTests, csvAffectedLines, exerciseId } = await request.json();

    const HUMAN_MESSAGE = `
    failedTests: 
    ${JSON.stringify(failedTests)}

    User Updated Hot lines and content: 
    ${csvAffectedLines}

    Initial/original code Hot lines and content: 
    ${JSON.stringify(EXERCISES[exerciseId].HotLines)}


    Reject any output item that cannot be mapped to a fail->pass change for a current failing test.
    `;

    const response = await callLLM(
      SYSTEM_MESSAGE,
      HUMAN_MESSAGE,
      RESPONSE_FORMAT,
    );

    return Response.json({
      STATUS: "FAILED_TEST_HELP",
      response: JSON.parse(response),
    });
  } catch (error) {
    throw new Error(error);
  } finally {
  }
}
