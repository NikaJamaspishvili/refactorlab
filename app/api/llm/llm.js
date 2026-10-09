import { AzureOpenAI } from "openai";

const endpoint = "https://psp.openai.azure.com/";
const deployment = "gpt-5-nano";
const model = "gpt-5-nano";
const apiVersion = "2024-12-01-preview";

const client = new AzureOpenAI({
  endpoint,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  deployment,
  apiVersion,
});

export async function callLLM(SYSTEM_PROMPT, HUMAN_MESSAGE, RESPONSE_FORMAT) {
  console.info("LLM AWAKE");
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: HUMAN_MESSAGE,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: RESPONSE_FORMAT,
    },
    reasoning_effort: "low",
  });

  console.log(response);
  const content = response.choices?.[0]?.message?.content ?? '{"hints":[]}';
  return content;
}
