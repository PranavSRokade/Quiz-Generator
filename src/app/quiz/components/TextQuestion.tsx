"use client";
import React from "react";
import styles from "../quiz.module.css";

interface TextQuestionProps {
  index: number;
  value: string;
  onChange: (index: number, value: string) => void;
  type: "short" | "long";
  hasValidationError?: boolean;
}

const countWords = (text?: string | null): number => {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
};

const getWordCountStatus = (
  wordCount: number,
  type: "short" | "long"
): "good" | "warning" | "error" => {
  const ranges = {
    short: { min: 20, max: 30 },
    long: { min: 150, max: 200 },
  };

  const range = ranges[type];
  const tolerance = 10;

  if (wordCount >= range.min && wordCount <= range.max) {
    return "good";
  } else if (
    wordCount >= range.min - tolerance &&
    wordCount <= range.max + tolerance
  ) {
    return "warning";
  } else {
    return "error";
  }
};

const TextQuestion: React.FC<TextQuestionProps> = ({
  index,
  value,
  onChange,
  type,
  hasValidationError = false,
}) => {
  const wordCount = countWords(value);
  const status = getWordCountStatus(wordCount, type);
  const recommendedRange = type === "short" ? "20-30" : "150-200";

  return (
    <div className={styles.textQuestionContainer}>
      <textarea
        rows={type === "short" ? 2 : 5}
        className={`${styles.textArea} ${
          hasValidationError ? styles.textAreaError : ""
        }`}
        placeholder={"Type your answer..."}
        value={value}
        onChange={(e) => onChange(index, e.target.value)}
      />
      <div
        className={`${styles.wordCounter} ${
          styles[
            `wordCounter${status.charAt(0).toUpperCase() + status.slice(1)}`
          ]
        }`}
      >
        {wordCount} words ({recommendedRange} recommended)
      </div>
    </div>
  );
};

export default TextQuestion;
