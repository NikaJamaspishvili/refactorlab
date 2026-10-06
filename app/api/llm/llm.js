import { AzureOpenAI } from "openai";

const endpoint = "https://psp.openai.azure.com/";
const deployment = "gpt-5-nano";
const model = "gpt-5-nano";
const apiVersion = "2024-12-01-preview";

const SYSTEM_PROMPT = `
You are a senior software engineer and code mentor.

Task:
Given:
1) a function body
2) a list of static-analysis issues (with line/column and suggested fix)

Return ONLY valid JSON matching the provided schema.
No markdown. No prose outside JSON.

Rules:
- Explain why the code causes each issue in simple teaching language.
- Keep "hint_content" <= 50 words.
- Keep "solution" <= 50 words.
- "correct_code" must be minimal and directly fix the issue.
- Use exact line ranges from the issue when available.
- If multiple issues overlap, still provide separate hints.
- If input is insufficient, return empty hints array.

Focus on clean code principles: readability, single responsibility, naming, error handling, and security.
`.trim();
export async function main(code_blocks, issues) {
  if (!apiKey) throw new Error("AZURE_OPENAI_API_KEY is required");

  const client = new AzureOpenAI({ endpoint, apiKey, deployment, apiVersion });

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          code_blocks: code_blocks,
          issues,
          output_constraints: {
            max_hint_words: 50,
            max_solution_words: 50,
          },
        }),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "code_review_hints",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            hints: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  startline: { type: "integer" },
                  endline: { type: "integer" },
                  hint_content: { type: "string" },
                  solution: { type: "string" },
                  correct_code: { type: "string" },
                },
                required: [
                  "startline",
                  "endline",
                  "hint_content",
                  "solution",
                  "correct_code",
                ],
              },
            },
          },
          required: ["hints"],
        },
      },
    },
    max_completion_tokens: 15000,
  });
  const content = response.choices?.[0]?.message?.content ?? '{"hints":[]}';
  return content;
}
