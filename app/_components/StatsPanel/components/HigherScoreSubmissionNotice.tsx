"use client";

import { useEffect } from "react";
import type { CSSProperties } from "react";
import type { ChangeDirection } from "../types";
import { SUBMISSION_NOTICE_TIMEOUT_MS } from "../constants";

type ScoreDeltaView = {
  direction: ChangeDirection;
  label: string;
};

type HigherScoreSubmissionNoticeProps = {
  initialDelta: ScoreDeltaView;
  previousDelta: ScoreDeltaView;
  onClose: () => void;
};

export function HigherScoreSubmissionNotice({
  initialDelta,
  previousDelta,
  onClose,
}: HigherScoreSubmissionNoticeProps) {
  const countdownStyle: CSSProperties = {
    "--stats-submission-timeout": `${SUBMISSION_NOTICE_TIMEOUT_MS}ms`,
  } as CSSProperties;

  useEffect(() => {
    const timeoutId = window.setTimeout(onClose, SUBMISSION_NOTICE_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [onClose]);

  return (
    <div className="statsSubmissionNotice statsSubmissionNoticeBlue" style={countdownStyle}>
      <svg className="statsSubmissionTimerSvg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <rect
          x="1.5"
          y="1.5"
          width="97"
          height="97"
          rx="10"
          ry="10"
          pathLength="100"
          className="statsSubmissionTimerPath statsSubmissionTimerPathBlue"
        />
      </svg>

      <button className="statsSubmissionClose" type="button" onClick={onClose}>
        X
      </button>

      <div className="statsSubmissionTitle">🚀 Higher Score Submission</div>

      <div className="statsSubmissionBigMetrics">
        <div className="statsSubmissionMetricCard">
          <span className="statsSubmissionMetricLabel">vs init</span>
          <span
            className={`statsSubmissionMetricValue statsFinalScoreDelta${initialDelta.direction}`}
          >
            {initialDelta.label}
          </span>
        </div>

        <div className="statsSubmissionMetricCard">
          <span className="statsSubmissionMetricLabel">vs prev</span>
          <span
            className={`statsSubmissionMetricValue statsFinalScoreDelta${previousDelta.direction}`}
          >
            {previousDelta.label}
          </span>
        </div>
      </div>
    </div>
  );
}
