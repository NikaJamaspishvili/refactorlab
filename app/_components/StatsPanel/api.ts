import type { SonarIssue, SonarIssuesResponse } from "./types";

type AnalyseResponse = {
  status: number;
  data: unknown;
};

export async function analyseCode(code: string): Promise<AnalyseResponse> {
  const response = await fetch("http://localhost:3000/api/analyse", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, exerciseId: "2" }),
  });

  const data = (await response.json()) as unknown;

  return {
    status: response.status,
    data,
  };
}

export async function requestLlmHelp(
  payload: {
    STATUS: string;
  } & Record<string, unknown>,
) {
  let URL = "http://localhost:3000/api/llm";

  switch (payload.STATUS) {
    case "FAILED_TEST_HELP":
      URL += "/failed_test_analysis";
  }

  const response = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as { STATUS: string; response: any };

  return data.response;
}

export function mapSonarIssues(input: unknown): SonarIssuesResponse {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  const mappedIssues: SonarIssuesResponse = {};

  for (const [key, value] of Object.entries(input)) {
    if (isSonarIssue(value)) {
      mappedIssues[key] = value;
    }
  }

  return mappedIssues;
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
