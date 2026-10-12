import { formatAtMostOneDecimal } from "../data";
import type { ChangeDirection } from "../types";

type BaselineDelta = {
  direction: ChangeDirection;
  label: string;
};

type FinalScoreCardProps = {
  finalScore: number | null;
  baselineDelta: BaselineDelta | null;
};

export function FinalScoreCard({ finalScore, baselineDelta }: FinalScoreCardProps) {
  return (
    <div className="statsFinalScoreCard">
      <span className="statsFinalScoreLabel">Final Score</span>
      <div className="statsFinalScoreRight">
        <span className="statsFinalScoreValue">
          {finalScore === null ? "--" : formatAtMostOneDecimal(finalScore)}/100
        </span>
        {baselineDelta ? (
          <span className={`statsFinalScoreDelta statsFinalScoreDelta${baselineDelta.direction}`}>
            {baselineDelta.label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
