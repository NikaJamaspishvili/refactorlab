"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SUBMISSION_NOTICE_TIMEOUT_MS } from "../constants";

type FirstAcceptedSubmissionNoticeProps = {
  onClose: () => void;
  variant?: "firstAccepted" | "highestScore";
};

const copyByVariant = {
  firstAccepted: {
    wrapperClass: "statsSubmissionNoticeGreen",
    actionClass: "statsSubmissionActionGreen",
    title: "🎉 First Accepted Submission",
    description: "Congratulations! Your first accepted submission has been recorded.",
  },
  highestScore: {
    wrapperClass: "statsSubmissionNoticePurple",
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

  useEffect(() => {
    const timeoutId = window.setTimeout(onClose, SUBMISSION_NOTICE_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [onClose]);

  return (
    <div className={`statsSubmissionNotice ${noticeCopy.wrapperClass}`}>

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
