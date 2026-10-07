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
    You are professional software engineer that can trace problems in code and find bugs.
    You are also an excellent teacher at making developers understand that same problems.

    Your main task is to find why tests failed and what bugs caused it, based on what you see in the context I give you.

    For contexy you will get:

    - Filtered out code blocks of LATEST USER MODIFIED CODE that caused Tests failure, only left ones that have relation with output and only they could be reason of failure. You will also get lines of those code blocks as information.
    - Filtered out code blocks of INITIAL CODE (NON MODIFIED ORIGINAL, WHERE ALL TESTS PASSED) that caused Tests failure, only left ones that have relation with output and only they could be reason of failure. You will also get lines of those code blocks as information.
    - Failing tests array containing necessary input,excpected and received output values.


    After you succesfully find bug and come up with good general hint, your job is to return response in this structured way.

    IMPORTANT: only observe the exact logic that fails the tests. we don't care about: clean code, code smells, design patter mistakes in code.
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
