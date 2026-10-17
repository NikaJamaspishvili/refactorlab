"use client";

import { useEffect } from "react";
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
  useEffect(() => {
    const timeoutId = window.setTimeout(onClose, SUBMISSION_NOTICE_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [onClose]);

  return (
    <div className="statsSubmissionNotice statsSubmissionNoticeBlue">

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
