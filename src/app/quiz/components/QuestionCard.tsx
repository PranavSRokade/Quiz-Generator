import React from "react";
import styles from "../quiz.module.css";
import MCQQuestion from "./MCQQuestion";
import TextQuestion from "./TextQuestion";
import CodeQuestion from "./CodeQuestion";
import { QuizQuestion, CodeEvaluationResult } from "@/types";
import { QUESTION_TYPE, LANGUAGES } from "@/lib/variables";
import ReactMarkdown from "react-markdown";
import { convertToSeconds } from "@/lib/functions";

interface QuestionCardProps {
  questions: QuizQuestion[];
  onMCQChange: (index: number, option: string) => void;
  textAnswers: { [key: number]: string };
  onTextChange: (index: number, value: string) => void;
  outputs: { [key: number]: string };
  onRunCode: (index: number) => void;
  onSubmitCode: (index: number) => void;
  language: LANGUAGES;
  showHints: { [key: number]: boolean };
  onToggleHint: (index: number) => void;
  showResults: boolean;
  hasValidationError: {
    [key: number]: boolean;
  };
  selectedOptions: { [key: number]: string };
  evaluations: CodeEvaluationResult[];
  isEvaluating: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  questions,
  onMCQChange,
  textAnswers,
  onTextChange,
  outputs,
  onRunCode,
  language,
  showHints,
  onToggleHint,
  showResults,
  hasValidationError,
  selectedOptions,
  evaluations,
  isEvaluating,
  onSubmitCode,
}) => {
  return (
    <>
      {questions.map((question, index) => (
        <div key={index}>
          <div className={styles.questionCard}>
            {(question.type === QUESTION_TYPE.MCQ ||
              question.type === QUESTION_TYPE.SHORT ||
              question.type === QUESTION_TYPE.LONG) && (
              <p>
                <strong>
                  {index + 1}. {question.question}
                </strong>
              </p>
            )}
            {(() => {
              switch (question.type) {
                case QUESTION_TYPE.MCQ:
                  return (
                    question.options && (
                      <MCQQuestion
                        q={question as QuizQuestion & { options: string[] }}
                        index={index}
                        selectedOption={selectedOptions[index]}
                        onChange={onMCQChange}
                        hasValidationError={hasValidationError[index]}
                      />
                    )
                  );
                case QUESTION_TYPE.SHORT:
                  return (
                    <TextQuestion
                      index={index}
                      value={textAnswers[index]}
                      type={question.type}
                      onChange={onTextChange}
                      hasValidationError={hasValidationError[index]}
                    />
                  );
                case QUESTION_TYPE.LONG:
                  return (
                    <TextQuestion
                      index={index}
                      value={textAnswers[index]}
                      type={question.type}
                      onChange={onTextChange}
                      hasValidationError={hasValidationError[index]}
                    />
                  );
                case QUESTION_TYPE.CODE:
                  return (
                    <CodeQuestion
                      questionNumber={index + 1}
                      question={question}
                      userCode={textAnswers[index]}
                      output={outputs[index]}
                      onCodeChange={(value) => onTextChange(index, value)}
                      onRunCode={() => onRunCode(index)}
                      evaluationResult={evaluations?.[index]}
                      language={language}
                      isEvaluating={isEvaluating}
                      onSubmit={() => onSubmitCode(index)}
                    />
                  );
                default:
                  return <p>Unsupported question type.</p>;
              }
            })()}

            {!showResults && (
              <button
                type="button"
                onClick={() => {
                  if (question.type === QUESTION_TYPE.CODE) {
                    onToggleHint(index);
                  } else {
                    const source = question.source;
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
                  }
                }}
                className={styles.hintButton}
              >
                {showHints[index] ? "Hide Hint" : "Show Hint"}
              </button>
            )}

            {showHints[index] && (
              <p className={styles.hintLine}>
                <strong>Hint:</strong>{" "}
                <em className={styles.hintText}>{question.hint}</em>
              </p>
            )}
          </div>

          {showResults && (
            <div className={styles.evaluationBlock}>
              <h2 style={{ color: "#222", fontWeight: 700 }}>{`${
                question.type === QUESTION_TYPE.CODE ? "Code" : "Answer"
              } Evaluation`}</h2>
              <div className={styles.feedbackBlock}>
                {question.type === QUESTION_TYPE.MCQ ? (
                  <div>
                    <p
                      className={
                        selectedOptions[index] === question.answer
                          ? styles.correctAnswer
                          : styles.incorrectAnswer
                      }
                    >
                      {selectedOptions[index] === question.answer
                        ? "Correct"
                        : `Incorrect (Correct: ${question.answer})`}
                    </p>
                    <br />
                    <strong>Explaination:</strong>{" "}
                    <em>{question.explanation}</em>
                  </div>
                ) : question.type === QUESTION_TYPE.SHORT ||
                  question.type === QUESTION_TYPE.LONG ? (
                  <p>
                    <strong>Score:</strong>{" "}
                    {`${evaluations?.[index]?.score ?? "Not evaluated"} / 1`}
                    <br />
                    <br />
                    <strong>Feedback:</strong>{" "}
                    <em>{evaluations?.[index]?.feedback}</em>
                    <br />
                    <br />
                    <strong>Explaination:</strong>{" "}
                    <em>{question.explanation}</em>
                  </p>
                ) : (
                  evaluations?.[index] &&
                  evaluations?.[index]?.feedback !== "" && (
                    <ReactMarkdown>
                      {evaluations?.[index].feedback}
                    </ReactMarkdown>
                  )
                )}
                {question.type !== QUESTION_TYPE.MCQ &&
                  question.type !== QUESTION_TYPE.CODE && (
                    <p>
                      <br />
                      <strong>Possible correct answers could be: -</strong>{" "}
                      {question.possibleCorrectAnswers.map((answer, i) => (
                        <em key={i + 1}>
                          <br />
                          {i + 1}. {answer}
                        </em>
                      ))}
                    </p>
                  )}
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  );
};

export default QuestionCard;
