import { formatAtMostOneDecimal, getCategoryDelta, toLineOnlyPositions } from "../data";
import type { GroupedIssueCategory, SonarIssuePosition } from "../types";

type GroupedIssuesSectionProps = {
  groupedIssues: GroupedIssueCategory[];
  expandedCategories: Record<string, boolean>;
  selectedRuleId: string | null;
  revealedHints: Record<string, boolean>;
  baselineCategoryScores: Record<string, number> | null;
  onRuleClick: (positions: SonarIssuePosition[]) => void;
  onToggleCategory: (category: string) => void;
  onRuleSelect: (ruleId: string) => void;
  onToggleHint: (ruleId: string) => void;
};

export function GroupedIssuesSection({
  groupedIssues,
  expandedCategories,
  selectedRuleId,
  revealedHints,
  baselineCategoryScores,
  onRuleClick,
  onToggleCategory,
  onRuleSelect,
  onToggleHint,
}: GroupedIssuesSectionProps) {
  if (groupedIssues.length === 0) {
    return (
      <div className="statsEmptyState">
        Click <strong>Check measurements</strong> to load category scores.
      </div>
    );
  }

  return (
    <div className="statsGroupedIssues">
      {groupedIssues.map((group) => {
        const isOpen = expandedCategories[group.category] ?? false;
        const categoryDelta = getCategoryDelta(
          group.score,
          baselineCategoryScores,
          group.category,
        );

        return (
          <div key={group.category} className="statsCategoryCard">
            <button
              className="statsCategoryHeader"
              type="button"
              onClick={() => onToggleCategory(group.category)}
            >
              <span className="statsCategoryName">{group.category}</span>
              <span className="statsCategoryHeaderRight">
                <span className="statsCategoryScore">{formatAtMostOneDecimal(group.score)}/100</span>
                {categoryDelta ? (
                  <span
                    className={`statsFinalScoreDelta statsFinalScoreDelta${categoryDelta.direction}`}
                  >
                    {categoryDelta.label}
                  </span>
                ) : null}
                <span className={`statsCategoryArrow ${isOpen ? "statsCategoryArrowOpen" : ""}`}>
                  ▾
                </span>
              </span>
            </button>

            <div className={`statsCategoryBody ${isOpen ? "statsCategoryBodyOpen" : ""}`}>
              <div className="statsCategoryBodyInner">
                <div className="statsCategoryMeta">
                  {group.problemCount} problems · {group.issues.length} rules · deduction: -
                  {formatAtMostOneDecimal(group.deduction)}
                </div>

                {group.issues.map((issue) => (
                  <div
                    key={`${group.category}-${issue.ruleId}`}
                    className={`statsIssueCard statsIssueCardClickable ${
                      selectedRuleId === issue.ruleId ? "statsIssueCardActive" : ""
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      onRuleSelect(issue.ruleId);
                      onRuleClick(toLineOnlyPositions(issue.positions));
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onRuleSelect(issue.ruleId);
                        onRuleClick(toLineOnlyPositions(issue.positions));
                      }
                    }}
                  >
                    <div className="statsIssueTitle">{issue.title}</div>
                    <div className="statsIssueDescription">{issue.description}</div>
                    {revealedHints[issue.ruleId] ? (
                      <div
                        className="statsIssueAction"
                        dangerouslySetInnerHTML={{
                          __html: `action: ${issue.hint_1}`,
                        }}
                      />
                    ) : null}
                    <div className="statsIssueMeta">
                      occurrences: {issue.occurrences} · deduction: -
                      {formatAtMostOneDecimal(issue.deductedPoints)}
                    </div>
                    <div className="statsIssueButtons">
                      <div
                        className="statsButton"
                        onClick={(event) => {
                          event.stopPropagation();
                          onToggleHint(issue.ruleId);
                        }}
                      >
                        <div>
                          <button>{revealedHints[issue.ruleId] ? "X" : "action"}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
