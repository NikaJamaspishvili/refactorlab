'use client';

import Editor from "@monaco-editor/react";
import { useEffect, useRef } from "react";
import type * as Monaco from "monaco-editor";

type FocusTarget = {
  id: string;
  title: string;
  message: string;
  locations: Array<{ line: number; column: number }>;
};

type CodeEditorPanelProps = {
  code: string;
  onCodeChange: (nextCode: string) => void;
  focusTarget?: FocusTarget | null;
};

export function CodeEditorPanel({ code, onCodeChange, focusTarget }: CodeEditorPanelProps) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const decorationIdsRef = useRef<string[]>([]);
  const widgetRef = useRef<Monaco.editor.IContentWidget | null>(null);
  const activeProblemLinesRef = useRef<number[]>([]);
  const cursorChangeDisposableRef = useRef<Monaco.IDisposable | null>(null);

  const clearProblemHighlight = () => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    if (widgetRef.current) {
      editor.removeContentWidget(widgetRef.current);
      widgetRef.current = null;
    }

    decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, []);
    activeProblemLinesRef.current = [];
  };

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!editor || !monaco || !focusTarget || focusTarget.locations.length === 0) {
      return;
    }

    const normalizedLocations = focusTarget.locations
      .map((location) => ({
        line: Math.max(1, location.line),
        column: Math.max(1, location.column || 1),
      }))
      .sort((left, right) => left.line - right.line);

    const firstLocation = normalizedLocations[0];
    activeProblemLinesRef.current = normalizedLocations.map((location) => location.line);

    editor.revealPositionInCenter({ lineNumber: firstLocation.line, column: firstLocation.column });
    editor.setPosition({ lineNumber: firstLocation.line, column: firstLocation.column });
    editor.focus();

    decorationIdsRef.current = editor.deltaDecorations(
      decorationIdsRef.current,
      normalizedLocations.map((location) => ({
        range: new monaco.Range(location.line, 1, location.line, 1),
        options: {
          isWholeLine: true,
          className: "editorProblemLine",
          glyphMarginClassName: "editorProblemGlyph",
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      })),
    );

    if (widgetRef.current) {
      editor.removeContentWidget(widgetRef.current);
      widgetRef.current = null;
    }

    const widgetNode = document.createElement("div");
    widgetNode.className = "editorProblemWidget";

    const widgetTitle = document.createElement("div");
    widgetTitle.className = "editorProblemWidgetTitle";
    widgetTitle.textContent = focusTarget.title;

    const widgetText = document.createElement("div");
    widgetText.className = "editorProblemWidgetText";
    widgetText.textContent = `${focusTarget.message} (${normalizedLocations.length} highlighted line${normalizedLocations.length > 1 ? "s" : ""})`;

    widgetNode.append(widgetTitle, widgetText);

    const widget: Monaco.editor.IContentWidget = {
      getId: () => `problem-widget-${focusTarget.id}`,
      getDomNode: () => widgetNode,
      getPosition: () => ({
        position: { lineNumber: firstLocation.line, column: firstLocation.column },
        preference: [
          monaco.editor.ContentWidgetPositionPreference.ABOVE,
          monaco.editor.ContentWidgetPositionPreference.BELOW,
        ],
      }),
    };

    editor.addContentWidget(widget);
    widgetRef.current = widget;
  }, [focusTarget]);

  useEffect(() => {
    return () => {
      cursorChangeDisposableRef.current?.dispose();
      clearProblemHighlight();
    };
  }, []);

  return (
    <section className="panelShell">
      <div className="panelTitle">IDE</div>
      <div className="editorWrap">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={code}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;

            cursorChangeDisposableRef.current?.dispose();
            cursorChangeDisposableRef.current = editor.onDidChangeCursorPosition((event) => {
              const activeProblemLines = activeProblemLinesRef.current;

              if (activeProblemLines.length === 0) {
                return;
              }

              if (!activeProblemLines.includes(event.position.lineNumber)) {
                clearProblemHighlight();
              }
            });
          }}
          onChange={(value) => onCodeChange(value ?? "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            glyphMargin: true,
          }}
        />
      </div>
    </section>
  );
}
