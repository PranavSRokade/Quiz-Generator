"use client";
import React from "react";
import styles from "../quiz/quiz.module.css";
import CodeEditor from "./CodeEditor";
import { CodeEvaluationResult, QuizQuestion } from "@/types";

interface CodeQuestionProps {
  questionNumber: number;
  question: QuizQuestion;
  userCode: string;
  output: string;
  onCodeChange: (value: string) => void;
  onRunCode: () => void;
  onSubmit: () => void;
  evaluationResult?: CodeEvaluationResult;
}
//TODO
//figure out how to output error

const CodeQuestion: React.FC<CodeQuestionProps> = ({
  questionNumber,
  question,
  output,
  userCode,
  onCodeChange,
  onRunCode,
  onSubmit,
  evaluationResult,
}) => {
  const {
    question: title,
    description,
    example,
    constraints,
    testCases,
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
          language="python"
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

      {evaluationResult && (
        <div className={styles.evaluationBlock}>
          <h2>Evaluation</h2>
          <p style={{ marginTop: 10, fontSize: 18 }}>
            Passed {evaluationResult.passed} / {evaluationResult.total} test
            cases
          </p>
          <p style={{ fontSize: 18, marginBottom: 10 }}>
            Score: {(evaluationResult.score * 100).toFixed(0)}%
          </p>
          <p>
            <h3>Feedback:</h3> <em>{evaluationResult.feedback}</em>
          </p>

          <h3 style={{ display: "block", marginTop: 10 }}>Test Case Details</h3>
          <ul>
            {evaluationResult.results.map((test, i) => (
              <li key={i}>
                <div className={styles.exampleBlock}>
                  <strong>Input:</strong> {test.input} |
                  <strong> Expected:</strong> {test.expected} |
                  <strong> Got:</strong> {test.actual} |
                  <p
                    className={
                      test.passed
                        ? styles.passedTestCase
                        : styles.failedTestCase
                    }
                  >
                    {test.passed ? "Passed" : "Failed"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CodeQuestion;
