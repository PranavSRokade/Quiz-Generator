"use client";
import React from "react";
import styles from "../quiz.module.css";
import CodeEditor from "./CodeEditor";
import { CodeEvaluationResult, QuizQuestion } from "@/types";
import ReactMarkdown from "react-markdown";

interface CodeQuestionProps {
  questionNumber: number;
  question: QuizQuestion;
  userCode: string;
  output: string;
  onCodeChange: (value: string) => void;
  onRunCode: () => void;
  onSubmit: () => void;
  evaluationResult?: CodeEvaluationResult;
  isEvaluating?: boolean;
  language: string;
}

const CodeQuestion: React.FC<CodeQuestionProps> = ({
  questionNumber,
  question,
  output,
  userCode,
  onCodeChange,
  onRunCode,
  onSubmit,
  evaluationResult,
  isEvaluating,
  language
}) => {
  const {
    question: title,
    description,
    example,
    constraints,
    hint,
    functionName,
  } = question;

  return (
    <div>
      <h2 className={styles.questionTitle}>
        {questionNumber}. {title}
      </h2>

      {functionName && (
        <p className={styles.functionName}>
          <strong>Function to implement:</strong> <code>{functionName}</code>
        </p>
      )}
      <div className={styles.descriptionBlock}>
        <p>{description}</p>
      </div>

      <div className={styles.exampleBlock}>
        <h3>Example:</h3>
        <pre>{example}</pre>
      </div>

      <div className={styles.constraintsBlock}>
        <h3>Constraints:</h3>
        <ul>
          {constraints?.map((item, idx) => (
            <li key={idx}>
              <code>{item}</code>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.editorWrapper}>
        <CodeEditor
          language={language}
          value={userCode}
          onChange={(val) => onCodeChange(val || "")}
        />
      </div>

      <div className={styles.buttonGroup}>
        <button onClick={onRunCode} className={styles.runButton}>
          Run Code
        </button>
        <button onClick={onSubmit} className={styles.submitButton}>
          Submit
        </button>
      </div>

      <div className={styles.outputBlock}>
        <h3>Output:</h3>
        <pre>{output}</pre>
      </div>

      {isEvaluating && <p className={styles.loadingText}>Evaluating...</p>}

      {evaluationResult && (
        <div className={styles.evaluationBlock}>
          <h2>Evaluation</h2>
          <div className={styles.feedbackBlock}>
            <h3>Feedback</h3>
            <ReactMarkdown>{evaluationResult.feedback}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeQuestion;
