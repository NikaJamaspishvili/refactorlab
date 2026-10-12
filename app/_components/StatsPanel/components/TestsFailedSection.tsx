import { getFailedSummary, toEditorPositionsFromAffectedLines } from "../data";
import type { ParsedTestsFailedPayload, SonarIssuePosition } from "../types";
import { requestLlmHelp } from "../api";
import { recordsToCsv } from "../../../tools/data_formatters";
import { useState, useTransition } from "react";

type TestsFailedSectionProps = {
  payload: ParsedTestsFailedPayload;
  isOpen: boolean;
  onToggle: () => void;
  onRuleClick: (positions: SonarIssuePosition[]) => void;
  onLlmCodeBlocksFocus: (
    payload: Array<{
      startLine: number;
      endLine: number;
      content: string;
    }>,
  ) => void;
  showAIHelpBtn: boolean;
  setShowAIHelpBtn: any;
};

export function TestsFailedSection({
  payload,
  isOpen,
  onToggle,
  onRuleClick,
  onLlmCodeBlocksFocus,
  showAIHelpBtn,
  setShowAIHelpBtn,
}: TestsFailedSectionProps) {
  const [AIstatus, setAIStatus] = useState<"idle" | "hint" | "problem">("idle");
  const [HintSummary, setHintSummary] = useState("");
  const [ProblemSummary, setProblemSummary] = useState("");
  const [CodeBlocks, setCodeBlocks] = useState<
    Array<{ start_line?: number; end_line?: number; explanation?: string }>
  >([]);
  const [codeBlocksHighlighted, setCodeBlocksHighlighted] = useState(false);
  const [loading, startTransition] = useTransition();

  const helpLeonor = () => {
    startTransition(async () => {
      const failedTests = payload.testsResult.failedTests;
      const csvAffectedLines = recordsToCsv(payload.affectedLines);

      const response = await requestLlmHelp({
        STATUS: "FAILED_TEST_HELP",
        failedTests,
        csvAffectedLines,
        exerciseId: 2,
      });

      console.log(response);

      if (response.analysis.summary)
        setProblemSummary(response.analysis.summary);
      if (response.final_hint) setHintSummary(response.final_hint);
      if (response.analysis.code_blocks.length > 0) {
        setCodeBlocks(response.analysis.code_blocks);
      }
      setShowAIHelpBtn(false);
      setAIStatus("hint");
    });
  };

  function showProblem() {
    const positions: SonarIssuePosition[] = CodeBlocks.filter((block) => {
      return (
        typeof block.start_line === "number" &&
        typeof block.end_line === "number"
      );
    }).map((block) => {
      const startLine = Math.max(1, block.start_line as number);
      const endLine = Math.max(startLine, block.end_line as number);

      return {
        line: startLine,
        column: 1,
        endline: endLine,
        endColumn: 1,
      };
    });

    if (positions.length > 0) {
      onRuleClick(positions);
    }

    const pointerCards = CodeBlocks.filter(
      (block) =>
        typeof block.start_line === "number" &&
        typeof block.end_line === "number" &&
        typeof block.explanation === "string" &&
        block.explanation.length > 0,
    ).map((block) => {
      const startLine = Math.max(1, block.start_line as number);
      const endLine = Math.max(startLine, block.end_line as number);

      return {
        startLine,
        endLine,
        content: block.explanation as string,
      };
    });

    onLlmCodeBlocksFocus(pointerCards);

    setAIStatus("problem");
  }

  return (
    <div className="statsTestsFailedWrapper">
      <button
        className="statsTestsFailedHeader"
        type="button"
        onClick={onToggle}
      >
        <span>
          {getFailedSummary(
            payload.testsResult.summary,
            payload.testsResult.failedTests?.length ?? 0,
          )}
        </span>
        <span
          className={`statsCategoryArrow ${isOpen ? "statsCategoryArrowOpen" : ""}`}
        >
          ▾
        </span>
      </button>

      {isOpen ? (
        <div className="statsTestsFailedBody">
          {(payload.testsResult.failedTests ?? []).map((failedTest, index) => (
            <div
              key={`${failedTest.name ?? "failed-test"}-${index}`}
              className="statsIssueCard"
            >
              <div className="statsIssueTitle">
                test name: {failedTest.name ?? "unknown"}
              </div>
              <div className="statsIssueDescription">
                input: {JSON.stringify(failedTest.input)}
              </div>
              <div className="statsIssueDescription">
                expected output: {JSON.stringify(failedTest.expected)}
              </div>
              <div className="statsIssueDescription" style={{ color: "red" }}>
                actual output:{" "}
                {JSON.stringify(failedTest.actual) ?? "No message"}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {payload.affectedLines.length > 0 ? (
        <button
          className="statsActionButton"
          type="button"
          onClick={() => {
            if (codeBlocksHighlighted) {
              onRuleClick([]);
              setCodeBlocksHighlighted(false);
            } else {
              const positions = toEditorPositionsFromAffectedLines(
                payload.affectedLines,
              );
              onRuleClick(positions);
              setCodeBlocksHighlighted(true);
            }
          }}
        >
          {codeBlocksHighlighted ? "X" : "Highlight possible code blocks"}
        </button>
      ) : (
        <p>No Affected blocks detected </p>
      )}
      {showAIHelpBtn && (
        <button onClick={helpLeonor}>
          {loading ? "Thinking..." : "Help Leonor 👾💻"}
        </button>
      )}

      {AIstatus == "hint" && HintSummary.length > 0 && (
        <div>
          <h1>Hint</h1>
          <p>{HintSummary}</p>
          <button onClick={showProblem}>Show Problem</button>
        </div>
      )}
      {AIstatus == "hint" && HintSummary.length > 0 && (
        <div>
          <h1>Problem Summary</h1>
          <p>{ProblemSummary}</p>
        </div>
      )}
    </div>
  );
}
