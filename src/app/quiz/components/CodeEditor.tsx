// components/CodeEditor.tsx
"use client";

import React from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  language?: string;
  value: string;
  onChange: (value: string | undefined) => void;
  height?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  language = "python",
  value,
  onChange,
  height = "300px",
}) => {
  return (
    <Editor
      height={height}
      language={language}
      defaultValue={value}
      value={value}
      theme="vs-dark"
      onChange={onChange}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        wordWrap: "on",
        scrollBeyondLastLine: false,
      }}
    />
  );
};

export default CodeEditor;