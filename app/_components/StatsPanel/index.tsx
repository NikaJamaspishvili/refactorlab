"use client";

import { useCallback, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import { GROUPS } from "@/app/api/analyse/static";
import { analyseCode, getAnalysisMeta, mapSonarIssues } from "./api";
import {
  formatAtMostOneDecimal,
  getPercentChange,
  isTestsFailedPayload,
  roundToOneDecimal,
  toIssueText,
} from "./data";
import { FinalScoreCard } from "./components/FinalScoreCard";
import { FirstAcceptedSubmissionNotice } from "./components/FirstAcceptedSubmissionNotice";
import { HigherScoreSubmissionNotice } from "./components/HigherScoreSubmissionNotice";
import { TestsFailedSection } from "./components/TestsFailedSection";
import type {
  ChangeDirection,
  FatalEntry,
  ParsedTestsFailedPayload,
  SonarIssuePosition,
  SonarIssuesResponse,
  SubmissionStatus,
} from "./types";
import { MAX_HINT_COUNT } from "@/app/common";

type PointerCard = {
  startLine: number;
  endLine: number;
  content: string;
  showNavigation?: boolean;
};

type StatsPanelProps = {
  code: string;
  exerciseId: number;
  initialDetectedProblems: Record<string, unknown> | null;
  hintCount: number;
  highestScore: number | null;
  onRuleClick: (positions: SonarIssuePosition[]) => void;
  onLlmCodeBlocksFocus: (payload: PointerCard[]) => void;
};

type ScoreDelta = {
  direction: ChangeDirection;
  label: string;
};

const STATIC_GROUP_NAMES = Object.values(GROUPS);
const ZERO_PERCENT_DELTA: ScoreDelta = {
  direction: "same",
  label: `→ ${formatAtMostOneDecimal(0)}%`,
};

function buildDefaultGroupScores() {
  return Object.fromEntries(
    STATIC_GROUP_NAMES.map((group) => [group, 100]),
  ) as Record<string, number>;
}

function buildGroupScoresFromIssues(issues: SonarIssuesResponse) {
  const scores = buildDefaultGroupScores();

  for (const issue of Object.values(issues)) {
    const group = issue.category;
    if (!(group in scores)) {
      continue;
    }

    const deduction = issue.score ?? issue.severity;
    scores[group] = roundToOneDecimal(Math.max(0, scores[group] - deduction));
  }

  return scores;
}

function calculateFinalScoreFromGroups(scores: Record<string, number>) {
  const values = STATIC_GROUP_NAMES.map((group) => scores[group] ?? 100);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;

  return roundToOneDecimal(average);
}

function buildPercentDelta(
  currentValue: number,
  comparedValue: number | undefined,
): ScoreDelta {
  if (comparedValue === undefined) {
    return ZERO_PERCENT_DELTA;
  }

  if (currentValue > comparedValue) {
    return {
      direction: "up",
      label: `↑ ${formatAtMostOneDecimal(getPercentChange(currentValue, comparedValue))}%`,
    };
  }

  if (currentValue < comparedValue) {
    return {
      direction: "down",
      label: `↓ ${formatAtMostOneDecimal(getPercentChange(currentValue, comparedValue))}%`,
    };
  }

  return ZERO_PERCENT_DELTA;
}

function readFatalMessage(data: unknown): string {
  if (!data || typeof data !== "object" || !("fatalMessages" in data)) {
    return "Fatal error while analysing code.";
  }

  const fatalMessages = (data as { fatalMessages?: unknown[] }).fatalMessages;
  if (!Array.isArray(fatalMessages) || fatalMessages.length === 0) {
    return "Fatal error while analysing code.";
  }

  return toIssueText(fatalMessages[0] as FatalEntry);
}

function isFatalResponse(status: number, data: unknown): boolean {
  if (status !== 400 || !data || typeof data !== "object") {
    return false;
  }

  return (
    "status" in data && (data as { status?: string }).status === "FATAL_MESSAGE"
  );
}

export function StatsPanel({
  code,
  exerciseId,
  initialDetectedProblems,
  hintCount,
  highestScore: personalHighestScore,
  onRuleClick,
  onLlmCodeBlocksFocus,
}: StatsPanelProps) {
  const baselineGroupScores = useMemo(() => buildDefaultGroupScores(), []);

  const hydratedInitialIssues = useMemo(
    () => mapSonarIssues(initialDetectedProblems),
    [initialDetectedProblems],
  );

  const hydratedInitialGroupScores = useMemo(() => {
    if (Object.keys(hydratedInitialIssues).length === 0) {
      return baselineGroupScores;
    }

    return buildGroupScoresFromIssues(hydratedInitialIssues);
  }, [baselineGroupScores, hydratedInitialIssues]);

  const hydratedInitialFinalScore = useMemo(() => {
    const meta = getAnalysisMeta(initialDetectedProblems);

    return (
      meta.finalScore ??
      calculateFinalScoreFromGroups(hydratedInitialGroupScores)
    );
  }, [hydratedInitialGroupScores, initialDetectedProblems]);

  const [isChecking, setIsChecking] = useState(false);
  const [showAIHelpBtn, setShowAIHelpBtn] = useState(true);

  const [analysedIssues, setAnalysedIssues] = useState<SonarIssuesResponse>(
    hydratedInitialIssues,
  );
  const [groupScores, setGroupScores] = useState<Record<string, number>>(
    hydratedInitialGroupScores,
  );
  const [initialGroupScores] = useState<Record<string, number>>(
    hydratedInitialGroupScores,
  );
  const [previousGroupScores, setPreviousGroupScores] = useState<Record<
    string,
    number
  > | null>(null);

  const [currentFinalScore, setCurrentFinalScore] = useState<number>(
    hydratedInitialFinalScore,
  );
  const [initialFinalScore] = useState<number>(hydratedInitialFinalScore);
  const [previousFinalScore, setPreviousFinalScore] = useState<number>();

  const [lastCheckedCode, setLastCheckedCode] = useState<string | null>(() =>
    initialDetectedProblems ? code : null,
  );

  const [fatalMessage, setFatalMessage] = useState("");
  const [testsFailedPayload, setTestsFailedPayload] =
    useState<ParsedTestsFailedPayload | null>(null);
  const [isFailedTestsOpen, setIsFailedTestsOpen] = useState(false);

  const [showFirstAcceptedNotice, setShowFirstAcceptedNotice] = useState(false);
  const [showHighestScoreNotice, setShowHighestScoreNotice] = useState(false);
  const [showHigherScoreNotice, setShowHigherScoreNotice] = useState(false);
  const [firstAcceptedNoticeKey, setFirstAcceptedNoticeKey] = useState(0);
  const [highestScoreNoticeKey, setHighestScoreNoticeKey] = useState(0);
  const [hintCountState, setHintCount] = useState(MAX_HINT_COUNT - hintCount);

  const initialFinalDelta = useMemo(
    () => buildPercentDelta(currentFinalScore, initialFinalScore),
    [currentFinalScore, initialFinalScore],
  );

  const previousFinalDelta = useMemo(
    () => buildPercentDelta(currentFinalScore, previousFinalScore),
    [currentFinalScore, previousFinalScore],
  );

  const clearHighlights = () => {
    onRuleClick([]);
    onLlmCodeBlocksFocus([]);
  };

  const closeFirstAcceptedNotice = useCallback(() => {
    setShowFirstAcceptedNotice(false);
  }, []);

  const closeHighestScoreNotice = useCallback(() => {
    setShowHighestScoreNotice(false);
  }, []);

  const closeHigherScoreNotice = useCallback(() => {
    setShowHigherScoreNotice(false);
  }, []);

  const openSubmissionNotices = (submissionStatus: SubmissionStatus[]) => {
    if (submissionStatus.includes("FIRST_ACCEPTED_SUBMISSION")) {
      setFirstAcceptedNoticeKey((previous) => previous + 1);
      setShowFirstAcceptedNotice(true);
    }

    if (submissionStatus.includes("HIGHEST_SCORE_SUBMISSION")) {
      setHighestScoreNoticeKey((previous) => previous + 1);
      setShowHighestScoreNotice(true);
    }

    if (submissionStatus.includes("HIGHER_SCORE_SUBMISSION")) {
      setShowHigherScoreNotice(true);
    }
  };

  const handleCheckMeasurements = async (isHintCheck = false) => {
    const isCodeUnchanged =
      lastCheckedCode !== null && lastCheckedCode === code;
    if (isCodeUnchanged) {
      return analysedIssues;
    }

    setIsChecking(true);

    try {
      const { status, data } = await analyseCode(code, {
        exerciseId,
        isHint: isHintCheck,
      });
      if (isHintCheck) setHintCount(MAX_HINT_COUNT - (data as any).hintCount);
      setLastCheckedCode(code);

      if (isFatalResponse(status, data)) {
        setFatalMessage(readFatalMessage(data));
        setTestsFailedPayload(null);
        setIsFailedTestsOpen(false);
        clearHighlights();
        return null;
      }

      if (isTestsFailedPayload(data)) {
        setShowAIHelpBtn(true);
        setFatalMessage("");
        setTestsFailedPayload({
          testsResult: data.testsResult ?? {},
          affectedLines: data.affectedLines ?? [],
        });
        setIsFailedTestsOpen(false);
        clearHighlights();
        return null;
      }

      setFatalMessage("");
      setTestsFailedPayload(null);

      const mappedIssues = mapSonarIssues(data);
      const nextGroupScores = buildGroupScoresFromIssues(mappedIssues);
      const { finalScore: responseFinalScore, submissionStatus } =
        getAnalysisMeta(data);
      const nextFinalScore =
        responseFinalScore ?? calculateFinalScoreFromGroups(nextGroupScores);

      setPreviousGroupScores(groupScores);
      setPreviousFinalScore(currentFinalScore);

      setGroupScores(nextGroupScores);
      setCurrentFinalScore(nextFinalScore);
      setAnalysedIssues(mappedIssues);

      if (!isHintCheck) {
        onRuleClick([]);
      }

      openSubmissionNotices(submissionStatus);
      return mappedIssues;
    } catch (error) {
      console.error("Failed to check measurements", error);
      return null;
    } finally {
      setIsChecking(false);
    }
  };

  const focusFirstIssueHint = (issues: SonarIssuesResponse) => {
    const firstIssue = Object.values(issues)[0];
    const firstPosition = firstIssue?.positions?.[0];

    if (!firstIssue || !firstPosition) {
      alert("ALL PROBLEMS HAVE BEEN SOLVED");
      return;
    }

    onLlmCodeBlocksFocus([
      {
        startLine: firstPosition.line,
        endLine: firstPosition.endline ?? firstPosition.line,
        content: firstIssue.message,
        showNavigation: false,
      },
    ]);
  };

  const handleRecheckAndHint = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const isCodeUnchanged =
      lastCheckedCode !== null && lastCheckedCode === code;
    if (isCodeUnchanged) {
      focusFirstIssueHint(analysedIssues);
      return;
    }

    const mappedIssues = await handleCheckMeasurements(true);
    if (mappedIssues) {
      focusFirstIssueHint(mappedIssues);
    }
  };

  return (
    <section className="panelShell">
      <div className="panelTitle">Stats</div>
      <div className="statsContent">
        {showFirstAcceptedNotice ? (
          <FirstAcceptedSubmissionNotice
            key={firstAcceptedNoticeKey}
            onClose={closeFirstAcceptedNotice}
          />
        ) : null}

        {showHighestScoreNotice ? (
          <FirstAcceptedSubmissionNotice
            key={highestScoreNoticeKey}
            variant="highestScore"
            onClose={closeHighestScoreNotice}
          />
        ) : null}

        {showHigherScoreNotice ? (
          <HigherScoreSubmissionNotice
            initialDelta={initialFinalDelta}
            previousDelta={previousFinalDelta}
            onClose={closeHigherScoreNotice}
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
            setShowAIHelpBtn={setShowAIHelpBtn}
            showAIHelpBtn={showAIHelpBtn}
          />
        ) : (
          <>
            <FinalScoreCard
              finalScore={currentFinalScore}
              initialDelta={initialFinalDelta}
              personalHighestScore={personalHighestScore}
              previousDelta={previousFinalDelta}
            />

            <div className="statsGroupedIssues">
              {STATIC_GROUP_NAMES.map((group) => {
                const score = groupScores[group] ?? 100;
                const initialDelta = buildPercentDelta(
                  score,
                  initialGroupScores[group],
                );
                const previousDelta = buildPercentDelta(
                  score,
                  previousGroupScores?.[group],
                );

                return (
                  <div key={group} className="statsCategoryCard">
                    <div className="statsCategoryHeader statsCategoryHeaderStatic">
                      <span className="statsCategoryName">{group}</span>
                      <span className="statsCategoryHeaderRight">
                        <span className="statsCategoryScore">
                          {formatAtMostOneDecimal(score)}/100
                        </span>
                      </span>
                    </div>

                    <div className="statsCategoryBody statsCategoryBodyOpen">
                      <div className="statsCategoryBodyInner statsCategoryBodyInnerCompact">
                        <div className="statsDeltaLine">
                          <span className="statsCategoryMeta">init</span>
                          <span
                            className={`statsFinalScoreDelta statsFinalScoreDelta${initialDelta.direction}`}
                          >
                            {initialDelta.label}
                          </span>
                        </div>
                        <div className="statsDeltaLine">
                          <span className="statsCategoryMeta">prev</span>
                          <span
                            className={`statsFinalScoreDelta statsFinalScoreDelta${previousDelta.direction}`}
                          >
                            {previousDelta.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <button
          className="statsActionButton"
          type="button"
          onClick={() => void handleCheckMeasurements()}
          disabled={isChecking}
        >
          {isChecking ? "Submitting..." : "Submit"}
        </button>

        {!testsFailedPayload && currentFinalScore !== 100 && (
          <button
            type="button"
            disabled={hintCountState === 0}
            onClick={handleRecheckAndHint}
          >
            {hintCountState === 0
              ? `Hint exhausted`
              : `Hint: ${hintCountState} remaining`}
          </button>
        )}
      </div>
    </section>
  );
}
