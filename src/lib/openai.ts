import OpenAI from "openai";

export const OPEN_AI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});