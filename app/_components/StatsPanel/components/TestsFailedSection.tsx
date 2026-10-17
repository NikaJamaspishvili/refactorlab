import { useState, useTransition } from "react";
import type { Dispatch, SetStateAction } from "react";
import { requestLlmHelp } from "../api";
import { getFailedSummary, toEditorPositionsFromAffectedLines } from "../data";
import type { ParsedTestsFailedPayload, SonarIssuePosition } from "../types";
import { recordsToCsv } from "../../../_tools/data_formatters";

type PointerCard = {
  startLine: number;
  endLine: number;
  content: string;
};

type CodeBlock = {
  start_line?: number;
  end_line?: number;
  explanation?: string;
};

type TestsFailedSectionProps = {
  payload: ParsedTestsFailedPayload;
  isOpen: boolean;
  onToggle: () => void;
  onRuleClick: (positions: SonarIssuePosition[]) => void;
  onLlmCodeBlocksFocus: (payload: PointerCard[]) => void;
  showAIHelpBtn: boolean;
  setShowAIHelpBtn: Dispatch<SetStateAction<boolean>>;
};

function toPosition(block: CodeBlock): SonarIssuePosition | null {
  if (typeof block.start_line !== "number" || typeof block.end_line !== "number") {
    return null;
  }

  const startLine = Math.max(1, block.start_line);
  const endLine = Math.max(startLine, block.end_line);

  return {
    line: startLine,
    column: 1,
    endline: endLine,
    endColumn: 1,
  };
}

function toPointerCard(block: CodeBlock): PointerCard | null {
  const position = toPosition(block);

  if (!position || typeof block.explanation !== "string" || block.explanation.length === 0) {
    return null;
  }

  return {
    startLine: position.line,
    endLine: position.endline ?? position.line,
    content: block.explanation,
  };
}

export function TestsFailedSection({
  payload,
  isOpen,
  onToggle,
  onRuleClick,
  onLlmCodeBlocksFocus,
  showAIHelpBtn,
  setShowAIHelpBtn,
}: TestsFailedSectionProps) {
  const [aiStatus, setAiStatus] = useState<"idle" | "hint" | "problem">("idle");
  const [hintSummary, setHintSummary] = useState("");
  const [problemSummary, setProblemSummary] = useState("");
  const [codeBlocks, setCodeBlocks] = useState<CodeBlock[]>([]);
  const [codeBlocksHighlighted, setCodeBlocksHighlighted] = useState(false);
  const [isLoading, startTransition] = useTransition();

  const handleAskForHelp = () => {
    startTransition(async () => {
      const response = await requestLlmHelp({
        STATUS: "FAILED_TEST_HELP",
        failedTests: payload.testsResult.failedTests,
        csvAffectedLines: recordsToCsv(payload.affectedLines),
        exerciseId: 2,
      });

      if (response?.analysis?.summary) {
        setProblemSummary(response.analysis.summary);
      }

      if (response?.final_hint) {
        setHintSummary(response.final_hint);
      }

      const nextCodeBlocks = Array.isArray(response?.analysis?.code_blocks)
        ? (response.analysis.code_blocks as CodeBlock[])
        : [];

      if (nextCodeBlocks.length > 0) {
        setCodeBlocks(nextCodeBlocks);
      }

      setShowAIHelpBtn(false);
      setAiStatus("hint");
    });
  };

  const handleShowProblem = () => {
    const positions = codeBlocks
      .map(toPosition)
      .filter((position): position is SonarIssuePosition => position !== null);

    const pointerCards = codeBlocks
      .map(toPointerCard)
      .filter((card): card is PointerCard => card !== null);

    if (positions.length > 0) {
      onRuleClick(positions);
    }

    onLlmCodeBlocksFocus(pointerCards);
    setAiStatus("problem");
  };

  const handleToggleAffectedBlocks = () => {
    if (codeBlocksHighlighted) {
      onRuleClick([]);
      setCodeBlocksHighlighted(false);
      return;
    }

    const positions = toEditorPositionsFromAffectedLines(payload.affectedLines);
    onRuleClick(positions);
    setCodeBlocksHighlighted(true);
  };

  return (
    <div className="statsTestsFailedWrapper">
      <button className="statsTestsFailedHeader" type="button" onClick={onToggle}>
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
                actual output: {JSON.stringify(failedTest.actual) ?? "No message"}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {payload.affectedLines.length > 0 ? (
        <button
          className="statsActionButton"
          type="button"
          onClick={handleToggleAffectedBlocks}
        >
          {codeBlocksHighlighted ? "Clear highlights" : "Highlight possible code blocks"}
        </button>
      ) : (
        <p>No affected blocks detected.</p>
      )}

      {showAIHelpBtn ? (
        <button type="button" onClick={handleAskForHelp}>
          {isLoading ? "Thinking..." : "Help Leonor 👾💻"}
        </button>
      ) : null}

      {aiStatus === "hint" && hintSummary.length > 0 ? (
        <div>
          <h1>Hint</h1>
          <p>{hintSummary}</p>
          <button type="button" onClick={handleShowProblem}>
            Show Problem
          </button>
        </div>
      ) : null}

      {aiStatus === "problem" && problemSummary.length > 0 ? (
        <div>
          <h1>Problem Summary</h1>
          <p>{problemSummary}</p>
        </div>
      ) : null}
    </div>
  );
}
