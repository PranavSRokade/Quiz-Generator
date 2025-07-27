"use client";
import styles from "./quiz.module.css";
import React, { useState, useEffect } from "react";
import { CodeEvaluationResult, QuizQuestion, Course } from "@/types";
import { LANGUAGES, QUESTION_TYPE } from "@/lib/variables";
import SurveyForm from "./components/SurveyForm";
import QuestionCard from "./components/QuestionCard";

export default function Home() {
  //utility states
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState<boolean>(false);

  //textual questions
  const [selectedCourse, setSelectedCourse] = useState<Course>();
  const [topic, setTopic] = useState("");
  const [questionType, setQuestionType] = useState<QUESTION_TYPE>(
    QUESTION_TYPE.MCQ
  );
  const [difficulty, setDifficulty] = useState("");
  const [error, setError] = useState<string>("");
  const [courses, setCourses] = useState<Course[]>([]);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<{
    [key: number]: string;
  }>({});
  const [textAnswers, setTextAnswers] = useState<{ [key: number]: string }>({});
  const [validationErrors, setValidationErrors] = useState<{
    [key: number]: boolean;
  }>({});

  const [showResults, setShowResults] = useState(false);

  //code questions
  const [language, setLanguage] = useState<LANGUAGES>(LANGUAGES.PYTHON);
  const [outputMap, setOutputMap] = useState<{ [key: number]: string }>({});
  const [evaluations, setEvaluations] = useState<CodeEvaluationResult[]>([]);
  const [showHints, setShowHints] = useState<{ [key: number]: boolean }>({});

  const toggleHint = (index: number) => {
    setShowHints((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const mcqOptionChange = (questionIndex: number, option: string) => {
    setSelectedOptions({ ...selectedOptions, [questionIndex]: option });
    setValidationErrors((prev) => ({ ...prev, [questionIndex]: false }));
  };

  const handleFetchCourses = async () => {
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

  const handleFetchQuestions = async () => {
    setLoading(true);
    setSelectedOptions({});
    setShowResults(false);
    setTextAnswers([]);
    setOutputMap([]);
    setEvaluations([]);
    setQuestions([]);
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

  const handleEvaluateTextualAnswers = async () => {
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

        return await res.json();
      })
    );

    setEvaluating(false);

    return evaluations;
  };

  const handleTextualQuizSubmit = async () => {
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

    const evaluations = await handleEvaluateTextualAnswers();
    setEvaluations(evaluations);
    setShowResults(true);

    setEvaluating(false);
  };

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
    handleFetchCourses();
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.customTitle}>Quiz Generator</h1>
        <SurveyForm
          questionType={questionType}
          setQuestionType={setQuestionType}
          topic={topic}
          setTopic={setTopic}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          language={language}
          setLanguage={setLanguage}
          selectedCourse={selectedCourse}
          setSelectedCourse={setSelectedCourse}
          courses={courses}
          onSubmit={handleFetchQuestions}
          loading={loading}
          coursesLoading={coursesLoading}
        />

        {error !== "" ? (
          <p className={styles.loadingText}>{error}</p>
        ) : questions && questions.length > 0 ? (
          <div className={styles.questionCardContainer}>
            <QuestionCard
              questions={questions}
              onMCQChange={mcqOptionChange}
              textAnswers={textAnswers}
              onTextChange={(i, val) => {
                setTextAnswers((prev) => ({ ...prev, [i]: val }));
                setValidationErrors((prev) => ({ ...prev, [i]: false }));
              }}
              outputs={outputMap}
              onRunCode={handleRunCode}
              language={language}
              showHints={showHints}
              onToggleHint={toggleHint}
              showResults={showResults}
              hasValidationError={validationErrors}
              selectedOptions={selectedOptions}
              evaluations={evaluations}
              isEvaluating={evaluating}
              onSubmitCode={handleSubmitCode}
            />

            {questions.length > 0 &&
              !showResults &&
              questionType !== QUESTION_TYPE.CODE && (
                <button
                  onClick={handleTextualQuizSubmit}
                  className={styles.submitButton}
                >
                  {evaluating ? "Evaluating..." : "Submit Quiz"}
                </button>
              )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
