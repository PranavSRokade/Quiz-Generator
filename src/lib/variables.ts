import OpenAI from "openai";
import path from "path";
export enum MODULES {
  SOFTWARE_AND_FINANCE = "suf",
  SOFTWARE_MEASUREMENT_TESTING = "sdmt",
  DISTRIBUTED_LEDGERS = "dlc",
  DATA_STRUCTURE_ALGORITHM = "dsa",
}

export enum LANGUAGES {
  PYTHON = "python",
  CPP = "cpp",
  JAVA = "java",
}

export enum QUESTION_TYPE {
  MCQ = "mcq",
  SHORT = "short",
  LONG = "long",
  CODE = "code",
}

export const SDMT_FOLDER = path.resolve(
  process.cwd(),
  "public",
  MODULES.SOFTWARE_MEASUREMENT_TESTING
);
export const SUF_FOLDER = path.resolve(
  process.cwd(),
  "public",
  MODULES.SOFTWARE_AND_FINANCE
);
export const DLC_FOLDER = path.resolve(
  process.cwd(),
  "public",
  MODULES.DISTRIBUTED_LEDGERS
);
export const DSA_FOLDER = path.resolve(
  process.cwd(),
  "public",
  MODULES.DATA_STRUCTURE_ALGORITHM
);