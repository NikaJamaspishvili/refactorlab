import { formatAtMostOneDecimal } from "../data";
import type { ChangeDirection } from "../types";

type ScoreDelta = {
  direction: ChangeDirection;
  label: string;
};

type FinalScoreCardProps = {
  finalScore: number | null;
  initialDelta: ScoreDelta;
  previousDelta: ScoreDelta;
};

export function FinalScoreCard({
  finalScore,
  initialDelta,
  previousDelta,
}: FinalScoreCardProps) {
  return (
    <div className="statsFinalScoreCard">
      <span className="statsFinalScoreLabel">Final Score</span>
      <div className="statsFinalScoreRight statsFinalScoreRightColumn">
        <span className="statsFinalScoreValue">
          {finalScore === null ? "--" : formatAtMostOneDecimal(finalScore)}/100
        </span>

        <div className="statsDeltaLine">
          <span className="statsCategoryMeta">init</span>
          <span className={`statsFinalScoreDelta statsFinalScoreDelta${initialDelta.direction}`}>
            {initialDelta.label}
          </span>
        </div>

        <div className="statsDeltaLine">
          <span className="statsCategoryMeta">prev</span>
          <span className={`statsFinalScoreDelta statsFinalScoreDelta${previousDelta.direction}`}>
            {previousDelta.label}
          </span>
        </div>
      </div>
    </div>
  );
}
