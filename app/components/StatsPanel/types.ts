export type StatIssue = {
  text?: string | null;
  message?: string | null;
  line?: number;
  column?: number;
};

export type FatalEntry = StatIssue | string;

export type SonarIssuePosition = {
  line: number;
  column: number;
  endline?: number;
  endColumn?: number;
};

export type SonarIssue = {
  severity: number;
  score?: number;
  positions: SonarIssuePosition[];
  category: string;
  title: string;
  description: string;
  message: string;
  hint_1?: string;
};

export type SonarIssuesResponse = Record<string, SonarIssue>;

export type GroupedIssue = SonarIssue & {
  ruleId: string;
  occurrences: number;
  deductedPoints: number;
};

export type GroupedIssueCategory = {
  category: string;
  score: number;
  deduction: number;
  problemCount: number;
  issues: GroupedIssue[];
};

export type ChangeDirection = "up" | "down" | "same";

export type SubmitFeedback = {
  direction: ChangeDirection;
  title: string;
  subtitle: string;
};

export type AffectedLineRange = {
  startLine: number;
  endLine: number;
};

export type FailedTest = {
  name?: string;
  input?: unknown;
  expected?: unknown;
  actual?: unknown;
  message?: string;
};

export type TestsResultPayload = {
  failedTests?: FailedTest[];
  ok?: boolean;
  returnValue?: string;
  summary?: string;
};

export type TestsFailedPayload = {
  status: "TESTS_FAILED";
  testsResult?: TestsResultPayload;
  affectedLines?: AffectedLineRange[];
};

export type ParsedTestsFailedPayload = {
  testsResult: TestsResultPayload;
  affectedLines: AffectedLineRange[];
};
