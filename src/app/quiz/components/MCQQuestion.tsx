"use client";
import React from "react";
import styles from "../quiz.module.css";

interface Props {
  q: {
    options: string[];
  };
  index: number;
  selectedOption: string;
  onChange: (index: number, option: string) => void;
  hasValidationError?: boolean;
}

const MCQQuestion: React.FC<Props> = ({
  q,
  index,
  selectedOption,
  onChange,
  hasValidationError = false,
}) => {
  return (
    <div className={`${styles.mcqContainer} ${hasValidationError ? styles.mcqContainerError : ''}`}>
      {q.options?.map((option, i) => (
        <div key={i} className={styles.optionWrapper}>
          <label className={styles.optionLabel}>
            <input
              type="radio"
              name={`question-${index}`}
              value={option}
              checked={selectedOption === option}
              onChange={() => onChange(index, option)}
            />
            {option}
          </label>
        </div>
      ))}
    </div>
  );
};

export default MCQQuestion;
