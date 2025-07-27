"use client";
import styles from "./quiz.module.css";
import React, { useState, useEffect } from "react";
import CodeQuestion from "./components/CodeQuestion";
import MCQQuestion from "./components/MCQQuestion";
import TextQuestion from "./components/TextQuestion";
import { CodeEvaluationResult, QuizQuestion, Course } from "@/types";
import { LANGUAGES, MODULES, QUESTION_TYPE } from "@/lib/variables";
import { convertToSeconds } from "@/lib/functions";

export default function Home() {
  //utility states
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  //textual questions
  const [selectedCourse, setSelectedCourse] = useState<Course>();
  const [topic, setTopic] = useState("");
  const [questionType, setQuestionType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [error, setError] = useState<string>("");

  // Dynamic courses state
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState<boolean>(false);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<{
    [key: number]: string;
  }>({});
  const [textAnswers, setTextAnswers] = useState<{ [key: number]: string }>({});
  const [validationErrors, setValidationErrors] = useState<{
    [key: number]: boolean;
  }>({});

  const [showResults, setShowResults] = useState(false);
  const [showHints, setShowHints] = useState<{ [key: number]: boolean }>({});

  const fetchCourses = async () => {
    setCoursesLoading(true);

    try {
      const response = await fetch("/api/get-courses", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch courses"
      );
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    setSelectedOptions({});
    setShowResults(false);
    setTextAnswers([]);
    setOutputMap([]);
    setEvaluations([]);
    setQuestions([]);
    setShowHints({});
    setError("");
    setValidationErrors({});

    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        body: JSON.stringify({
          topic,
          difficulty,
          questionType,
          course: selectedCourse,
        }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.error) {
        setLoading(false);
        setError(data.error);
        return;
      }

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
    setValidationErrors((prev) => ({ ...prev, [questionIndex]: false }));
  };

  const textualQuizSubmit = async () => {
    const newValidationErrors: { [key: number]: boolean } = {};
    let hasErrors = false;

    questions.forEach((q, index) => {
      if (q.type === "mcq" && !selectedOptions[index]) {
        newValidationErrors[index] = true;
        hasErrors = true;
      } else if (
        (q.type === "long" || q.type === "short") &&
        (!textAnswers[index] || textAnswers[index].trim() === "")
      ) {
        newValidationErrors[index] = true;
        hasErrors = true;
      }
    });

    setValidationErrors(newValidationErrors);

    if (hasErrors) {
      return;
    }

    setEvaluating(true);

    const evaluations = await evaluateWrittenAnswers();
    setEvaluations(evaluations);
    setShowResults(true);

    setEvaluating(false);
  };

  //code questions
  const [language, setLanguage] = useState<LANGUAGES>(LANGUAGES.PYTHON);
  const [outputMap, setOutputMap] = useState<{ [key: number]: string }>({});
  const [evaluations, setEvaluations] = useState<CodeEvaluationResult[]>([]);

  const handleRunCode = async (index: number) => {
    const code = textAnswers[index] || "";

    try {
      const res = await fetch("/api/run-code", {
        method: "POST",
        body: JSON.stringify({
          language: language,
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
          language: language,
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

  useEffect(() => {
    fetchCourses();
  }, []);

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
            {questionType !== QUESTION_TYPE.CODE && (
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

            {questionType === QUESTION_TYPE.CODE && (
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LANGUAGES)}
                className={styles.select}
              >
                {" "}
                <option value="" disabled hidden>
                  Select Language
                </option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            )}

            {questionType !== QUESTION_TYPE.CODE && (
              <select
                value={selectedCourse?.course_id || ""}
                onChange={(e) =>
                  setSelectedCourse(
                    courses.find(
                      (course) => course.course_id === e.target.value
                    )
                  )
                }
                className={styles.select}
                disabled={coursesLoading}
              >
                {" "}
                <option value="" disabled hidden>
                  {coursesLoading ? "Loading modules..." : "Select Module"}
                </option>
                {courses.map((course) => (
                  <option key={course.course_id} value={course.course_id}>
                    {course.course_title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button className={styles.button}>Generate Quiz</button>
        </form>

        {loading ? (
          <p className={styles.loadingText}>Loading...</p>
        ) : error !== "" ? (
          <p className={styles.loadingText}>{error}</p>
        ) : questions && questions.length > 0 ? (
          <div className={styles.questionCardContainer}>
            {questions.map((q, index) => (
              <div key={index} className={styles.questionCard}>
                {q.type !== QUESTION_TYPE.CODE && (
                  <p>
                    <strong>
                      {index + 1}. {q.question}
                    </strong>
                  </p>
                )}

                {(() => {
                  switch (q.type) {
                    case QUESTION_TYPE.MCQ:
                      return (
                        q.options && (
                          <MCQQuestion
                            q={q as QuizQuestion & { options: string[] }}
                            index={index}
                            selectedOption={selectedOptions[index]}
                            onChange={mcqOptionChange}
                            hasValidationError={
                              validationErrors[index] || false
                            }
                          />
                        )
                      );

                    case QUESTION_TYPE.SHORT:
                      return (
                        <TextQuestion
                          index={index}
                          value={textAnswers[index] || ""}
                          type={q.type}
                          hasValidationError={validationErrors[index] || false}
                          onChange={(i, val) => {
                            setTextAnswers((prev) => ({ ...prev, [i]: val }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              [i]: false,
                            }));
                          }}
                        />
                      );

                    case QUESTION_TYPE.LONG:
                      return (
                        <TextQuestion
                          index={index}
                          value={textAnswers[index] || ""}
                          type={q.type}
                          hasValidationError={validationErrors[index] || false}
                          onChange={(i, val) => {
                            setTextAnswers((prev) => ({ ...prev, [i]: val }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              [i]: false,
                            }));
                          }}
                        />
                      );

                    case QUESTION_TYPE.CODE:
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
                          language={language}
                        />
                      );

                    default:
                      return <p>Unsupported question type.</p>;
                  }
                })()}

                <button
                  type="button"
                  onClick={() => {
                    const source = q.source;
                    if (!source?.url) return;

                    let finalUrl = source.url;

                    if (source.doc_type === "mp4" && source.timestamp?.start) {
                      const seconds = convertToSeconds(source.timestamp.start);
                      const separator = source.url.includes("?") ? "&" : "?";
                      finalUrl = `${source.url}${separator}t=${seconds}`;
                    }

                    if (source.doc_type === "pdf" && source.page_number) {
                      const separator = source.url.includes("#")
                        ? ""
                        : "#page=";
                      finalUrl = `${source.url}${separator}${source.page_number}`;
                    }

                    window.open(finalUrl, "_blank");
                  }}
                  className={styles.hintButton}
                >
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
                    {q.type === QUESTION_TYPE.MCQ ? (
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

                    {q.type !== QUESTION_TYPE.MCQ && (
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
              questionType !== QUESTION_TYPE.CODE && (
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
