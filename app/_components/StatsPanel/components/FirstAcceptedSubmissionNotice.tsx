"use client";

import { useEffect } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { SUBMISSION_NOTICE_TIMEOUT_MS } from "../constants";

type FirstAcceptedSubmissionNoticeProps = {
  onClose: () => void;
  variant?: "firstAccepted" | "highestScore";
};

const copyByVariant = {
  firstAccepted: {
    wrapperClass: "statsSubmissionNoticeGreen",
    timerClass: "statsSubmissionTimerPathGreen",
    actionClass: "statsSubmissionActionGreen",
    title: "🎉 First Accepted Submission",
    description: "Congratulations! Your first accepted submission has been recorded.",
  },
  highestScore: {
    wrapperClass: "statsSubmissionNoticePurple",
    timerClass: "statsSubmissionTimerPathPurple",
    actionClass: "statsSubmissionActionPurple",
    title: "👑 Highest Score Submission",
    description: "Amazing! You just reached your highest score submission so far.",
  },
} as const;

export function FirstAcceptedSubmissionNotice({
  onClose,
  variant = "firstAccepted",
}: FirstAcceptedSubmissionNoticeProps) {
  const router = useRouter();
  const noticeCopy = copyByVariant[variant];
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
    <div
      className={`statsSubmissionNotice ${noticeCopy.wrapperClass}`}
      style={countdownStyle}
    >
      <svg className="statsSubmissionTimerSvg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <rect
          x="1.5"
          y="1.5"
          width="97"
          height="97"
          rx="10"
          ry="10"
          pathLength="100"
          className={`statsSubmissionTimerPath ${noticeCopy.timerClass}`}
        />
      </svg>

      <button className="statsSubmissionClose" type="button" onClick={onClose}>
        X
      </button>

      <div className="statsSubmissionTitle">{noticeCopy.title}</div>
      <div className="statsSubmissionText">{noticeCopy.description}</div>

      <button
        type="button"
        className={`statsSubmissionAction ${noticeCopy.actionClass}`}
        onClick={() => router.push("/dashboard")}
      >
        Back to dashboard
      </button>
    </div>
  );
}
