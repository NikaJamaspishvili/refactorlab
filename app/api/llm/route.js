import { main } from "./llm";

export async function POST(request) {
  try {
    const { issue, code_blocks } = await request.json();
    const llm_response = await main(code_blocks, issue);
    console.log("LLM response:", llm_response);

    return Response.json({ llm_response });
  } catch (error) {
    console.error("/api/llm POST failed:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
