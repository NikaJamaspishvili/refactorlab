import type { ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { OnMount } from "@monaco-editor/react";
import IDELinePointerCard from "./IDELinePointerCard";

type MonacoEditor = Parameters<OnMount>[0];
type MonacoApi = Parameters<OnMount>[1];

type CardPlacement = "above" | "below";
type FitResult = {
  placement: CardPlacement;
  maxBodyHeight?: number;
};

export type IdeHighlightAndCardInput = {
  startLine: number;
  endLine: number;
  content: string;
  startColumn?: number;
  endColumn?: number;
  footer?: ReactNode;
};

export type IdeRenderContentAndHighlightTool = {
  render: (input: IdeHighlightAndCardInput) => void;
  clear: () => void;
  dispose: () => void;
};

export function createIdeRenderContentAndHighlightTool(
  editor: MonacoEditor,
  monaco: MonacoApi,
): IdeRenderContentAndHighlightTool {
  let decorationIds: string[] = [];
  let widgetRoot: Root | null = null;
  let widgetDomNode: HTMLDivElement | null = null;
  let widgetId: string | null = null;
  let widgetRange: { line: number; column: number } | null = null;
  let widgetPlacement: CardPlacement = "above";
  let widgetMaxBodyHeight: number | undefined;
  let widgetContent = "";
  let widgetFooter: ReactNode | undefined;
  let scrollDisposable: { dispose: () => void } | null = null;

  const cardGapInLines = 1;

  const clearDecorations = () => {
    decorationIds = editor.deltaDecorations(decorationIds, []);
  };

  const clearWidget = () => {
    if (scrollDisposable) {
      scrollDisposable.dispose();
      scrollDisposable = null;
    }

    if (widgetId && widgetDomNode) {
      editor.removeContentWidget({
        getId: () => widgetId as string,
        getDomNode: () => widgetDomNode as HTMLDivElement,
        getPosition: () => null,
      });
    }

    const rootToUnmount = widgetRoot;
    if (rootToUnmount) {
      setTimeout(() => {
        rootToUnmount.unmount();
      }, 0);
    }

    widgetRoot = null;
    widgetDomNode = null;
    widgetId = null;
    widgetRange = null;
    widgetContent = "";
    widgetFooter = undefined;
    widgetMaxBodyHeight = undefined;
  };

  const clear = () => {
    clearDecorations();
    clearWidget();
  };

  const applyWidgetGap = () => {
    if (!widgetDomNode) {
      return;
    }

    const lineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight);
    const pixelGap = lineHeight * cardGapInLines;

    if (widgetPlacement === "above") {
      widgetDomNode.style.marginBottom = `${pixelGap}px`;
      widgetDomNode.style.marginTop = "0px";
    } else {
      widgetDomNode.style.marginTop = `${pixelGap}px`;
      widgetDomNode.style.marginBottom = "0px";
    }
  };

  const selectPlacement = (targetLine: number): FitResult => {
    if (!widgetDomNode) {
      return { placement: "above" };
    }

    const layout = editor.getLayoutInfo();
    const lineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight);
    const cardHeight = widgetDomNode.offsetHeight || lineHeight * 8;
    const gap = lineHeight * cardGapInLines;
    const verticalPadding = 8;
    const minBodyHeight = 64;
    const headerAndFooterReserve = 96;

    const lineTop = editor.getTopForLineNumber(targetLine) - editor.getScrollTop();
    const lineBottom = lineTop + lineHeight;

    const availableAbove = Math.max(0, lineTop - verticalPadding);
    const availableBelow = Math.max(0, layout.height - lineBottom - verticalPadding);

    const needsBelow = availableAbove < cardHeight + gap;
    const needsAbove = availableBelow < cardHeight + gap;

    const choosePlacement = (): CardPlacement => {
      if (needsBelow && !needsAbove) {
        return "below";
      }

      if (needsAbove && !needsBelow) {
        return "above";
      }

      if (needsAbove && needsBelow) {
        return availableBelow >= availableAbove ? "below" : "above";
      }

      return "above";
    };

    const placement = choosePlacement();

    const spaceForPlacement = placement === "above" ? availableAbove : availableBelow;
    const fullNeeded = cardHeight + gap;

    if (spaceForPlacement >= fullNeeded) {
      return { placement };
    }

    const maxCardHeight = Math.max(140, spaceForPlacement - gap);
    const maxBodyHeight = Math.max(
      minBodyHeight,
      maxCardHeight - headerAndFooterReserve,
    );

    return {
      placement,
      maxBodyHeight,
    };
  };

  const buildContentWidget = () => {
    return {
      getId: () => widgetId as string,
      getDomNode: () => widgetDomNode as HTMLDivElement,
      getPosition: () => {
        if (!widgetRange) {
          return null;
        }

        return {
          position: {
            lineNumber: widgetRange.line,
            column: widgetRange.column,
          },
          preference:
            widgetPlacement === "above"
              ? [monaco.editor.ContentWidgetPositionPreference.ABOVE]
              : [monaco.editor.ContentWidgetPositionPreference.BELOW],
        };
      },
    };
  };

  const renderCard = () => {
    if (!widgetRoot) {
      return;
    }

    widgetRoot.render(
      <IDELinePointerCard
        content={widgetContent}
        footer={widgetFooter}
        pointerSide={widgetPlacement === "above" ? "bottom" : "top"}
        maxBodyHeight={widgetMaxBodyHeight}
      />,
    );
  };

  const relayoutWidget = () => {
    if (!widgetDomNode || !widgetRange) {
      return;
    }

    const fit = selectPlacement(widgetRange.line);
    if (
      fit.placement !== widgetPlacement ||
      fit.maxBodyHeight !== widgetMaxBodyHeight
    ) {
      widgetPlacement = fit.placement;
      widgetMaxBodyHeight = fit.maxBodyHeight;
      renderCard();

      applyWidgetGap();
    }

    editor.layoutContentWidget(buildContentWidget());
  };

  const render = ({
    startLine,
    endLine,
    content,
    startColumn,
    endColumn,
    footer,
  }: IdeHighlightAndCardInput) => {
    clearDecorations();

    const normalizedStartLine = Math.max(1, startLine);
    const normalizedEndLine = Math.max(normalizedStartLine, endLine);

    const hasColumns =
      typeof startColumn === "number" && typeof endColumn === "number";

    const normalizedStartColumn = hasColumns ? Math.max(1, startColumn) : 1;
    const normalizedEndColumn = hasColumns
      ? Math.max(normalizedStartColumn, endColumn)
      : 1;

    const highlightRange = hasColumns
      ? new monaco.Range(
          normalizedStartLine,
          normalizedStartColumn,
          normalizedEndLine,
          normalizedEndColumn,
        )
      : new monaco.Range(normalizedStartLine, 1, normalizedEndLine, 1);

    decorationIds = editor.deltaDecorations([], [
      {
        range: highlightRange,
        options: {
          className: "editorHighlightRange",
          isWholeLine: !hasColumns,
          linesDecorationsClassName: !hasColumns
            ? "editorHighlightLine"
            : undefined,
          stickiness:
            monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      },
    ]);

    if (!widgetId) {
      widgetId = `ide-line-pointer-card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    if (!widgetDomNode) {
      widgetDomNode = document.createElement("div");
      widgetDomNode.style.pointerEvents = "auto";
      widgetDomNode.style.zIndex = "20";
    }

    if (!widgetRoot) {
      widgetRoot = createRoot(widgetDomNode);
    }

    widgetRange = {
      line: normalizedStartLine,
      column: normalizedStartColumn,
    };

    editor.addContentWidget(buildContentWidget());
    editor.revealLineInCenter(normalizedStartLine);

    widgetContent = content;
    widgetFooter = footer;

    const fit = selectPlacement(normalizedStartLine);
    widgetPlacement = fit.placement;
    widgetMaxBodyHeight = fit.maxBodyHeight;
    renderCard();

    applyWidgetGap();
    editor.layoutContentWidget(buildContentWidget());

    if (!scrollDisposable) {
      scrollDisposable = editor.onDidScrollChange(relayoutWidget);
    }
  };

  const dispose = () => {
    clear();
  };

  return {
    render,
    clear,
    dispose,
  };
}
