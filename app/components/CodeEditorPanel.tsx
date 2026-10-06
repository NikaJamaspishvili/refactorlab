"use client";

import Editor, { DiffEditor, type OnMount } from "@monaco-editor/react";
import { useEffect, useMemo, useRef, useState } from "react";

type HighlightPosition = {
  line: number;
  column: number;
  endline?: number;
  endColumn?: number;
};

type CodeEditorPanelProps = {
  code: string;
  onCodeChange: (nextCode: string) => void;
  highlightedPositions: HighlightPosition[];
  activeHint: {
    startline: number;
    endline: number;
    hint_content: string;
    solution: string;
    correct_code: string;
  } | null;
};

function replaceLinesInCode(
  sourceCode: string,
  startline: number,
  endline: number,
  replacement: string,
) {
  const lines = sourceCode.split("\n");
  const startIndex = Math.max(0, startline - 1);
  const endIndex = Math.min(lines.length - 1, endline - 1);

  if (startIndex > endIndex || startIndex >= lines.length) {
    return sourceCode;
  }

  const replacementLines = replacement.split("\n");
  lines.splice(startIndex, endIndex - startIndex + 1, ...replacementLines);
  return lines.join("\n");
}

export function CodeEditorPanel({
  code,
  onCodeChange,
  highlightedPositions,
  activeHint,
}: CodeEditorPanelProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [hintTop, setHintTop] = useState(16);

  const highlightedLine =
    highlightedPositions[0]?.line ?? activeHint?.startline;

  const diffCode = useMemo(() => {
    if (!activeHint || !showDiff) {
      return code;
    }

    return replaceLinesInCode(
      code,
      activeHint.startline,
      activeHint.endline,
      activeHint.correct_code,
    );
  }, [activeHint, code, showDiff]);

  useEffect(() => {
    setShowSolution(false);
    setShowDiff(false);
  }, [activeHint]);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!editor || !monaco) {
      return;
    }

    const nextDecorations = highlightedPositions.map((position) => {
      const startLine = Math.max(1, position.line);
      const endLine = Math.max(startLine, position.endline ?? startLine);

      return {
        range: new monaco.Range(startLine, 1, endLine, 1),
        options: {
          className: "editorHighlightRange",
          isWholeLine: true,
          linesDecorationsClassName: "editorHighlightLine",
          stickiness:
            monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      };
    });

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      nextDecorations,
    );

    if (highlightedPositions[0]?.line) {
      editor.revealLineInCenter(highlightedPositions[0].line);
    }
  }, [highlightedPositions]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !highlightedLine) {
      return;
    }

    const updateHintTop = () => {
      const nextTop = Math.max(
        16,
        editor.getTopForLineNumber(highlightedLine) - 8,
      );
      setHintTop(nextTop);
    };

    updateHintTop();

    const disposable = editor.onDidScrollChange(updateHintTop);
    return () => {
      disposable.dispose();
    };
  }, [highlightedLine, showDiff]);

  return (
    <section className="panelShell">
      <div className="panelTitle">IDE</div>
      <div className="editorWrap">
        {showDiff && activeHint ? (
          <DiffEditor
            height="100%"
            original={code}
            modified={diffCode}
            language="javascript"
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        ) : (
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={code}
            onChange={(value) => onCodeChange(value ?? "")}
            onMount={(editor, monaco) => {
              editorRef.current = editor;
              monacoRef.current = monaco;
            }}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        )}

        {activeHint ? (
          <div className="editorHintCard" style={{ top: `${hintTop}px` }}>
            <div className="editorHintTitle">AI Hint</div>
            <div className="editorHintText">{activeHint.hint_content}</div>

            {showSolution ? (
              <div className="editorHintSolution">{activeHint.solution}</div>
            ) : null}

            <div className="editorHintActions">
              <button
                type="button"
                className="editorHintButton"
                onClick={() => setShowSolution((previous) => !previous)}
              >
                {showSolution ? "Hide solution" : "Reveal solution"}
              </button>
              <button
                type="button"
                className="editorHintButton"
                onClick={() => setShowDiff((previous) => !previous)}
              >
                {showDiff ? "Back to editor" : "Display correct code"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
