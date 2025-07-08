"use client";
import styles from "./quiz.module.css";
import React, { useState } from "react";
import CodeQuestion from "../components/CodeQuestion";
import MCQQuestion from "../components/MCQQuestion";
import TextQuestion from "../components/TextQuestion";
import { CodeEvaluationResult, QuizQuestion } from "@/types";
import { createPublicKey } from "crypto";

//TODO: Remove test cases througout the code base
export default function Home() {
  // think how to add feedback

  //utility states
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  //textual questions
  const [topic, setTopic] = useState("");
  const [questionType, setQuestionType] = useState("");
  const [difficulty, setDifficulty] = useState("");

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<{
    [key: number]: string;
  }>({});
  const [textAnswers, setTextAnswers] = useState<{ [key: number]: string }>({});

  const [showResults, setShowResults] = useState(false);
  const [showHints, setShowHints] = useState<{ [key: number]: boolean }>({});

  const fetchQuestions = async () => {
    setLoading(true);
    setSelectedOptions({});
    setShowResults(false);
    setTextAnswers([]);
    setOutputMap([]);
    setEvaluations([]);

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

  const toggleHint = (index: number) => {
    setShowHints((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const mcqOptionChange = (questionIndex: number, option: string) => {
    setSelectedOptions({ ...selectedOptions, [questionIndex]: option });
  };

  const textualQuizSubmit = async () => {
    setEvaluating(true);

    const evaluations = await evaluateWrittenAnswers();
    setEvaluations(evaluations);
    setShowResults(true);

    setEvaluating(false);
  };

  //code questions
  const [outputMap, setOutputMap] = useState<{ [key: number]: string }>({});
  const [evaluations, setEvaluations] = useState<CodeEvaluationResult[]>([]);

  const handleRunCode = async (index: number) => {
    const code = textAnswers[index] || "";

    try {
      const res = await fetch("/api/run-code", {
        method: "POST",
        body: JSON.stringify({
          language: "python",
          code,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      console.log("data", data);

      setOutputMap((prev) => ({
        ...prev,
        [index]:
          data.output !== ""
            ? data.output
            : data.error !== ""
            ? data.error
            : "No output",
      }));
    } catch (err) {
      console.error("Run code error:", err);
      setOutputMap((prev) => ({ ...prev, [index]: "Error executing code" }));
    }
  };

  const handleSubmitCode = async (index: number) => {
    setEvaluating(true);

    try {
      const res = await fetch("/api/evaluate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentCode: textAnswers[index] || "",
          expected: questions[index].answer,
          result: outputMap[index],
          functionName: questions[index].functionName,
          question: questions[index],
        }),
      });

      const result = await res.json();

      setEvaluations((prev) => ({
        ...prev,
        [index]: result,
      }));

      setEvaluating(false);
    } catch (err) {
      console.error("Error evaluating code:", err);
      setEvaluating(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.customTitle}>Quiz Generator</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchQuestions();
          }}
        >
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

          <button className={styles.button}>Generate Quiz</button>
        </form>

        {loading ? (
          <p className={styles.loadingText}>Loading...</p>
        ) : questions && questions.length > 0 ? (
          <div className={styles.questionCardContainer}>
            {questions.map((q, index) => (
              <div key={index} className={styles.questionCard}>
                {q.type !== "code" && (
                  <p>
                    <strong>
                      {index + 1}. {q.question}
                    </strong>
                  </p>
                )}

                {(() => {
                  switch (q.type) {
                    case "mcq":
                      return (
                        q.options && (
                          <MCQQuestion
                            q={q as QuizQuestion & { options: string[] }}
                            index={index}
                            selectedOption={selectedOptions[index]}
                            onChange={mcqOptionChange}
                          />
                        )
                      );

                    case "short":
                      return (
                        <TextQuestion
                          index={index}
                          value={textAnswers[index] || ""}
                          type={q.type}
                          onChange={(i, val) =>
                            setTextAnswers((prev) => ({ ...prev, [i]: val }))
                          }
                        />
                      );

                    case "long":
                      return (
                        <TextQuestion
                          index={index}
                          value={textAnswers[index] || ""}
                          type={q.type}
                          onChange={(i, val) =>
                            setTextAnswers((prev) => ({ ...prev, [i]: val }))
                          }
                        />
                      );

                    case "code":
                      return (
                        <CodeQuestion
                          questionNumber={index + 1}
                          question={q}
                          userCode={textAnswers[index] || ""}
                          output={outputMap[index] || ""}
                          onCodeChange={(val) =>
                            setTextAnswers((prev) => ({
                              ...prev,
                              [index]: val,
                            }))
                          }
                          onRunCode={() => handleRunCode(index)}
                          onSubmit={() => handleSubmitCode(index)}
                          evaluationResult={evaluations[index]}
                          isEvaluating={evaluating}
                        />
                      );

                    default:
                      return <p>Unsupported question type.</p>;
                  }
                })()}

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
              !showResults &&
              questionType !== "code" && (
                <button
                  onClick={textualQuizSubmit}
                  className={styles.submitButton}
                >
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
