import { QUESTION_TYPE } from "@/lib/variables";

export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface QuizQuestion {
  // Common
  type: QUESTION_TYPE;
  question: string; // For mcq/short/long: actual question | For code: title
  answer: string; // For mcq/short/long: correct answer | For code: full solution code
  explanation: string;
  hint: string;
  possibleCorrectAnswers: string[];

  // For MCQ questions only
  options?: string[];

  // For code questions only
  description?: string;
  starterCode?: string;
  constraints?: string[];
  example?: string;
  functionName?: string;
}

//Piotr's Endpoint
export interface CodeEvaluationResult {
  passed: number;
  total: number;
  score: number;
  feedback: string;
  results: {
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
  }[];
}

export interface Course {
  course_id: string;
  course_title: string;
}

export interface Lecture {
  lecture_id: string;
  lecture_title: string;
}

export interface Timestamp {
  start: string;
  end: string;
}

export interface Document {
  id: string;
  doc_id: string;
  content: string;
  timestamp: Timestamp;
  page_number: number;
  lecture_id: string;
  lecture_title: string;
  course_id: string;
  course_name: string;
  doc_type: string;
  url: string;
  thumbnail_url: string;
}

export interface SearchResult {
  document: Document;
  score: number;
}

export interface LectureFile {
  doc_id: string;
  doc_type: string;
  url: string;
  thumbnail_url: string;
}

export interface LectureFiles {
  lecture: string;
  files: LectureFile[];
}