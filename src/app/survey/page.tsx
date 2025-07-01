"use client";
import Image from "next/image";
import styles from "../../styles/page.module.css";
import React, { useState } from "react";
import CodeEditor from "../components/CodeEditor";
interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  hint: string;
  explanation: string;
  type: "mcq" | "short" | "long" | "code";
  possibleCorrectAnswers: string[];
}

const TextQuestion = React.memo(
  ({
    index,
    value,
    onChange,
    type,
  }: {
    index: number;
    value: string;
    onChange: (index: number, value: string) => void;
    type: "short" | "long";
  }) => {
    return (
      <textarea
        rows={type === "short" ? 2 : 5}
        className={styles.textArea}
        placeholder={
          type === "short"
            ? "Type your short answer..."
            : "Type your detailed answer..."
        }
        value={value}
        onChange={(e) => onChange(index, e.target.value)}
      />
    );
  }
);

export default function Home() {
  // continue work on coding exercise

  // think how to add feedback
  const [topic, setTopic] = useState("");
  const [questionType, setQuestionType] = useState("");
  const [difficulty, setDifficulty] = useState("");

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<{
    [key: number]: string;
  }>({});
  const [textAnswers, setTextAnswers] = useState<{ [key: number]: string }>({});
  const [evaluations, setEvaluations] = useState<
    { score: number; feedback: string }[] | null
  >(null);

  const [showResults, setShowResults] = useState(false);
  const [showHints, setShowHints] = useState<{ [key: number]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    setSelectedOptions({});
    setShowResults(false);

    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        body: JSON.stringify({ topic, difficulty, questionType }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setQuestions(data.parsed.questions);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (questionIndex: number, option: string) => {
    setSelectedOptions({ ...selectedOptions, [questionIndex]: option });
  };

  const handleSubmit = async () => {
    const evaluations = await evaluateWrittenAnswers();
    setEvaluations(evaluations); // Save to state
    setShowResults(true);
  };

  const toggleHint = (index: number) => {
    setShowHints((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const MCQQuestion = ({ q, index }: { q: QuizQuestion; index: number }) => (
    <>
      {q.options?.map((option, i) => (
        <label key={i} className={styles.optionLabel}>
          <input
            type="radio"
            name={`question-${index}`}
            value={option}
            checked={selectedOptions[index] === option}
            onChange={() => handleOptionChange(index, option)}
          />
          {option}
        </label>
      ))}
    </>
  );

  const evaluateWrittenAnswers = async () => {
    setEvaluating(true);

    const evaluations = await Promise.all(
      questions.map(async (q, index) => {
        if (q.type === "mcq") return null;

        const res = await fetch("/api/evaluate-answer", {
          method: "POST",
          body: JSON.stringify({
            expectedAnswer: q.answer,
            studentAnswer: textAnswers[index] || "",
          }),
          headers: { "Content-Type": "application/json" },
        });

        return await res.json(); // { score, feedback }
      })
    );

    setEvaluating(false);

    return evaluations;
  };
  const [output, setOutput] = useState("");
  const handleRunCode = async () => {
    console.log("textAnswers[0]", textAnswers[0]);
    const res = await fetch("/api/run-code", {
      method: "POST",
      body: JSON.stringify({
        language: "python", // or whichever language you're supporting
        code: textAnswers[0], // code from monaco editor
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    console.log("data", data);
    setOutput(data.output); // update this based on your API response
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.customTitle}>Survey</h1>
        <div className={styles.inputContainer}>
          <input
            type="text"
            placeholder="Enter topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className={styles.input}
          />
          <div className={styles.selectWrapper}>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
              className={styles.select}
            >
              <option value="" disabled hidden>
                Select Question Type
              </option>
              <option value="mcq">Multiple Choice</option>
              <option value="short">Short Answer</option>
              <option value="long">Long Answer</option>
              <option value="code">Code</option>
            </select>
          </div>
          {questionType !== "code" && (
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className={styles.select}
            >
              {" "}
              <option value="" disabled hidden>
                Select Difficulty
              </option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          )}
        </div>

        {/* <div className={styles.codingQuestionContainer}>
          <h2 className={styles.questionTitle}>1. Two Sum</h2>

          <div className={styles.descriptionBlock}>
            <p>
              Given an array of integers <code>nums</code> and an integer{" "}
              <code>target</code>, return the indices of the two numbers such
              that they add up to <code>target</code>.
            </p>
            <p>
              You may assume that each input would have exactly one solution,
              and you may not use the same element twice.
            </p>
          </div>

          <div className={styles.exampleBlock}>
            <h3>Example 1:</h3>
            <pre>
              Input: nums = [2,7,11,15], target = 9 Output: [0,1] Explanation:
              Because nums[0] + nums[1] == 9, we return [0, 1].
            </pre>
          </div>

          <div className={styles.constraintsBlock}>
            <h3>Constraints:</h3>
            <ul>
              <li>
                <code>2 ≤ nums.length ≤ 10⁴</code>
              </li>
              <li>
                <code>-10⁹ ≤ nums[i] ≤ 10⁹</code>
              </li>
              <li>
                <code>-10⁹ ≤ target ≤ 10⁹</code>
              </li>
              <li>Only one valid answer exists.</li>
            </ul>
          </div>

          <div className={styles.editorWrapper}>
            <CodeEditor
              language="python" // or "python", "javascript", etc.
              value={textAnswers[0] || ""}
              onChange={(val) =>
                setTextAnswers((prev) => ({ ...prev, [0]: val || "" }))
              }
            />
          </div>

          <div className={styles.buttonGroup}>
            <button onClick={handleRunCode} className={styles.runButton}>Run Code</button>
            <button className={styles.submitButton}>Submit</button>
          </div>

          <div className={styles.outputBlock}>
            <h3>Output:</h3>
            <pre>{output}</pre>
          </div>
        </div> */}

        <button onClick={fetchQuestions} className={styles.button}>
          Generate Quiz
        </button>

        {loading ? (
          <p className={styles.loadingText}>Loading...</p>
        ) : questions && questions.length > 0 ? (
          <div className={styles.questionCardContainer}>
            {questions &&
              questions.map((q, index) => (
                <div key={index} className={styles.questionCard}>
                  <p>
                    <strong>
                      {index + 1}. {q.question}
                    </strong>
                  </p>

                  {q.type === "mcq" && <MCQQuestion q={q} index={index} />}
                  {(q.type === "short" || q.type === "long") && (
                    <TextQuestion
                      index={index}
                      value={textAnswers[index] || ""}
                      type={q.type}
                      onChange={(i, val) => {
                        setTextAnswers((prev) => ({ ...prev, [i]: val }));
                      }}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => toggleHint(index)}
                    className={styles.hintButton}
                  >
                    {/* This when clicked should give a pointer to the relevant course material. */}
                    {showHints[index] ? "Hide Hint" : "Show Hint"}
                  </button>

                  {showHints[index] && (
                    <p className={styles.hintLine}>
                      <strong>Hint:</strong>{" "}
                      <em className={styles.hintText}>{q.hint}</em>
                    </p>
                  )}
                  {showResults && (
                    <div className={styles.feedback}>
                      {q.type === "mcq" ? (
                        <p
                          className={
                            selectedOptions[index] === q.answer
                              ? styles.correctAnswer
                              : styles.incorrectAnswer
                          }
                        >
                          {selectedOptions[index] === q.answer
                            ? "Correct"
                            : `Incorrect (Correct: ${q.answer})`}
                        </p>
                      ) : (
                        <p>
                          <strong>Score:</strong>{" "}
                          {`${
                            evaluations?.[index]?.score ?? "Not evaluated"
                          } / 1`}
                          <br />
                          <br />
                          <strong>Feedback:</strong>{" "}
                          <em>{evaluations?.[index]?.feedback}</em>
                        </p>
                      )}
                      <p>
                        <br />
                        <strong>Explaination:</strong> <em>{q.explanation}</em>
                      </p>

                      {q.type !== "mcq" && (
                        <p>
                          <br />
                          <strong>
                            Possible correct answers could be: -
                          </strong>{" "}
                          {q.possibleCorrectAnswers.map((answer, index) => (
                            <em key={index + 1}>
                              <br />
                              {index + 1}. {answer}
                            </em>
                          ))}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}

            {evaluating ? (
              <p className={styles.loadingText}>Evaluating...</p>
            ) : (
              questions.length > 0 &&
              !showResults && (
                <button onClick={handleSubmit} className={styles.submitButton}>
                  Submit Quiz
                </button>
              )
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
