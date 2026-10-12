import type { SubmitFeedback } from "../types";

type SubmitFeedbackBannerProps = {
  submitFeedback: SubmitFeedback;
  onDismiss: () => void;
};

export function SubmitFeedbackBanner({
  submitFeedback,
  onDismiss,
}: SubmitFeedbackBannerProps) {
  return (
    <div className={`statsSubmitFeedback statsSubmitFeedback${submitFeedback.direction}`}>
      <div className="statsSubmitFeedbackTitle">{submitFeedback.title}</div>
      <div className="statsSubmitFeedbackSubtitle">{submitFeedback.subtitle}</div>
      <button className="statsSubmitFeedbackButton" type="button" onClick={onDismiss}>
        Got it
      </button>
    </div>
  );
}
