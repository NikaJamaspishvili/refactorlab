"use client";

import { useMemo, useState } from "react";
import { analyseCode, mapSonarIssues } from "./api";
import {
  buildBaselineDelta,
  buildExpandedCategories,
  buildGroupedIssues,
  buildSubmitFeedback,
  calculateCategoryScores,
  calculateFinalScore,
  isTestsFailedPayload,
  toIssueText,
} from "./data";
import { FinalScoreCard } from "./components/FinalScoreCard";
import { GroupedIssuesSection } from "./components/GroupedIssuesSection";
import { SubmitFeedbackBanner } from "./components/SubmitFeedbackBanner";
import { TestsFailedSection } from "./components/TestsFailedSection";
import type {
  FatalEntry,
  ParsedTestsFailedPayload,
  SonarIssuePosition,
  SonarIssuesResponse,
  SubmitFeedback,
} from "./types";

type StatsPanelProps = {
  code: string;
  onRuleClick: (positions: SonarIssuePosition[]) => void;
  onLlmCodeBlocksFocus: (payload: Array<{
    startLine: number;
    endLine: number;
    content: string;
  }>) => void;
};

export function StatsPanel({
  code,
  onRuleClick,
  onLlmCodeBlocksFocus,
}: StatsPanelProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [analysedIssues, setAnalysedIssues] = useState<SonarIssuesResponse>({});
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [baselineFinalScore, setBaselineFinalScore] = useState<number | null>(null);
  const [baselineCategoryScores, setBaselineCategoryScores] = useState<Record<string, number> | null>(
    null,
  );
  const [previousFinalScore, setPreviousFinalScore] = useState<number | null>(null);
  const [submitFeedback, setSubmitFeedback] = useState<SubmitFeedback | null>(null);
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [fatalMessage, setFatalMessage] = useState("");
  const [testsFailedPayload, setTestsFailedPayload] = useState<ParsedTestsFailedPayload | null>(
    null,
  );
  const [isFailedTestsOpen, setIsFailedTestsOpen] = useState(false);

  const groupedIssues = useMemo(() => buildGroupedIssues(analysedIssues), [analysedIssues]);

  const finalScore = useMemo(() => calculateFinalScore(analysedIssues), [analysedIssues]);

  const baselineDelta = useMemo(
    () => buildBaselineDelta(finalScore, baselineFinalScore),
    [finalScore, baselineFinalScore],
  );

  const resetToNeutralState = () => {
    setAnalysedIssues({});
    setSelectedRuleId(null);
    setRevealedHints({});
    onRuleClick([]);
    onLlmCodeBlocksFocus([]);
  };

  const handleCheckMeasurements = async () => {
    setIsChecking(true);

    try {
      const { status, data } = await analyseCode(code);

      if (status === 400 && data && typeof data === "object" && "status" in data) {
        const maybeStatus = (data as { status?: string }).status;

        if (maybeStatus === "FATAL_MESSAGE") {
          if (
            "fatalMessages" in data &&
            Array.isArray((data as { fatalMessages?: unknown[] }).fatalMessages) &&
            (data as { fatalMessages?: unknown[] }).fatalMessages!.length > 0
          ) {
            setFatalMessage(
              toIssueText((data as { fatalMessages: FatalEntry[] }).fatalMessages[0]),
            );
          } else {
            setFatalMessage("Fatal error while analysing code.");
          }

          resetToNeutralState();
          setTestsFailedPayload(null);
          setIsFailedTestsOpen(false);
          return;
        }
      }

      if (isTestsFailedPayload(data)) {
        setFatalMessage("");
        resetToNeutralState();
        setTestsFailedPayload({
          testsResult: data.testsResult ?? {},
          affectedLines: data.affectedLines ?? [],
        });
        setIsFailedTestsOpen(false);
        return;
      }

      setFatalMessage("");
      setTestsFailedPayload(null);

      const mappedIssues = mapSonarIssues(data);
      const nextFinalScore = calculateFinalScore(mappedIssues);
      const nextCategoryScores = calculateCategoryScores(mappedIssues);

      if (nextFinalScore !== null && baselineFinalScore === null) {
        setBaselineFinalScore(nextFinalScore);
      }

      if (baselineCategoryScores === null) {
        setBaselineCategoryScores(nextCategoryScores);
      }

      const nextFeedback = buildSubmitFeedback(nextFinalScore, previousFinalScore);
      if (nextFeedback) {
        setSubmitFeedback(nextFeedback);
      }

      setPreviousFinalScore(nextFinalScore);
      setAnalysedIssues(mappedIssues);
      setSelectedRuleId(null);
      setRevealedHints({});
      onRuleClick([]);
      setExpandedCategories(buildExpandedCategories(mappedIssues));
    } catch (error) {
      console.error("Failed to check measurements", error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <section className="panelShell">
      <div className="panelTitle">Stats</div>
      <div className="statsContent">
        {submitFeedback ? (
          <SubmitFeedbackBanner
            submitFeedback={submitFeedback}
            onDismiss={() => setSubmitFeedback(null)}
          />
        ) : null}

        {fatalMessage ? (
          <>
            <div className="statsFatalTitle">Fatal</div>
            <div className="statsFatalList">{fatalMessage}</div>
          </>
        ) : testsFailedPayload ? (
          <TestsFailedSection
            payload={testsFailedPayload}
            isOpen={isFailedTestsOpen}
            onToggle={() => setIsFailedTestsOpen((previous) => !previous)}
            onRuleClick={onRuleClick}
            onLlmCodeBlocksFocus={onLlmCodeBlocksFocus}
          />
        ) : (
          <>
            <FinalScoreCard finalScore={finalScore} baselineDelta={baselineDelta} />
            <GroupedIssuesSection
              groupedIssues={groupedIssues}
              expandedCategories={expandedCategories}
              selectedRuleId={selectedRuleId}
              revealedHints={revealedHints}
              baselineCategoryScores={baselineCategoryScores}
              onRuleClick={onRuleClick}
              onToggleCategory={(category) => {
                setExpandedCategories((previous) => ({
                  ...previous,
                  [category]: !previous[category],
                }));
              }}
              onRuleSelect={setSelectedRuleId}
              onToggleHint={(ruleId) => {
                setRevealedHints((previous) => ({
                  ...previous,
                  [ruleId]: !previous[ruleId],
                }));
              }}
            />
          </>
        )}

        <button
          className="statsActionButton"
          type="button"
          onClick={handleCheckMeasurements}
          disabled={isChecking}
        >
          {isChecking ? "Checking..." : "Check measurements"}
        </button>
      </div>
    </section>
  );
}
