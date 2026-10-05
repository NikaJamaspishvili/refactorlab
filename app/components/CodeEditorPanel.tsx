'use client';

import Editor from "@monaco-editor/react";

type CodeEditorPanelProps = {
  code: string;
  onCodeChange: (nextCode: string) => void;
};

export function CodeEditorPanel({ code, onCodeChange }: CodeEditorPanelProps) {
  return (
    <section className="panelShell">
      <div className="panelTitle">IDE</div>
      <div className="editorWrap">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={code}
          onChange={(value) => onCodeChange(value ?? "")}
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
      </div>
    </section>
  );
}
