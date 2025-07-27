import React from "react";
import styles from "../quiz.module.css";
import { LANGUAGES, MODULES, QUESTION_TYPE } from "@/lib/variables";
import { Course } from "@/types";

interface SurveyFormProps {
  questionType: QUESTION_TYPE;
  setQuestionType: (type: QUESTION_TYPE) => void;
  topic: string;
  setTopic: (topic: string) => void;
  difficulty: string;
  setDifficulty: (difficulty: string) => void;
  language: LANGUAGES;
  setLanguage: (val: LANGUAGES) => void;
  selectedCourse: Course | undefined;
  setSelectedCourse: (course: Course) => void;
  courses: Course[];
  onSubmit: () => void;
  loading: boolean;
  coursesLoading: boolean;
}

const SurveyForm: React.FC<SurveyFormProps> = ({
  questionType,
  setQuestionType,
  topic,
  setTopic,
  difficulty,
  setDifficulty,
  language,
  setLanguage,
  selectedCourse,
  setSelectedCourse,
  courses,
  onSubmit,
  loading,
  coursesLoading,
}) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
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
          onChange={(e) => setQuestionType(e.target.value as QUESTION_TYPE)}
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
          onChange={(e) => {
            const foundCourse = courses.find(
              (course) => course.course_id === e.target.value
            );
            if (foundCourse) {
              setSelectedCourse(foundCourse);
            }
          }}
          className={styles.select}
          disabled={coursesLoading}
        >
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

    <button disabled={loading} className={styles.button}>
      {loading ? "Loading..." : "Generate Quiz"}
    </button>
  </form>
);

export default SurveyForm;
