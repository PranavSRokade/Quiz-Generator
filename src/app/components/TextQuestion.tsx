"use client";
import React from "react";
import styles from "../quiz/quiz.module.css";

interface TextQuestionProps {
  index: number;
  value: string;
  onChange: (index: number, value: string) => void;
  type: "short" | "long";
  hasValidationError?: boolean;
}

const TextQuestion: React.FC<TextQuestionProps> = ({
  index,
  value,
  onChange,
  type,
  hasValidationError = false,
}) => {
  return (
    <textarea
      rows={type === "short" ? 2 : 5}
      className={`${styles.textArea} ${hasValidationError ? styles.textAreaError : ''}`}
      placeholder={
        type === "short"
          ? "Type your short answer..."
          : "Type your detailed answer..."
      }
      value={value}
      onChange={(e) => onChange(index, e.target.value)}
    />
  );
};

export default TextQuestion;