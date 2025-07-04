export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface QuizQuestion {
  // Common
  type: "mcq" | "short" | "long" | "code";
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
  testCases?: TestCase[];
  constraints?: string[];
  example?: string;
  functionName?: string;
}

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
