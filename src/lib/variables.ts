import OpenAI from "openai";
import path from "path";

export const OPEN_AI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
export const DSA_FOLDER = path.resolve(process.cwd(), "public", "dsa");
export const DLC_FOLDER = path.resolve(process.cwd(), "public", "dlc", "pdfs");
