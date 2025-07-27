import fs from "fs/promises";
import path from "path";
import {
  DLC_FOLDER,
  DSA_FOLDER,
  MODULES,
  SDMT_FOLDER,
  SUF_FOLDER,
} from "./variables";
import OpenAI from "openai";
import { cosineSimilarity } from "./functions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdf: any;
try {
  const originalModuleParent = module.parent;
  if (!module.parent) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (module as any).parent = {};
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  pdf = require("pdf-parse");
  if (!originalModuleParent) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (module as any).parent = originalModuleParent;
  }
} catch (error) {
  console.error("Failed to load pdf-parse:", error);
  throw new Error("PDF parsing library failed to load");
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function extractAllPDFText(
  questionType: string,
  module: MODULES
): Promise<string> {
  const pdfFolder =
    questionType === "code"
      ? DSA_FOLDER
      : module === MODULES.DISTRIBUTED_LEDGERS
      ? DLC_FOLDER
      : module === MODULES.SOFTWARE_AND_FINANCE
      ? SUF_FOLDER
      : module === MODULES.SOFTWARE_MEASUREMENT_TESTING
      ? SDMT_FOLDER
      : SDMT_FOLDER;

  try {
    const files = await fs.readdir(pdfFolder);
    const pdfFiles = files.filter((file) => file.endsWith(".pdf"));
    const allText = await Promise.all(
      pdfFiles.map(async (file) => {
        const buffer = await fs.readFile(path.join(pdfFolder, file));
        const data = await pdf(buffer);
        return data.text;
      })
    );

    return allText.join("\n\n");
  } catch (error) {
    console.error("Failed to extract PDF text:", error);
    throw new Error("PDF parsing failed.");
  }
}

export async function filterTextByTopic(
  fullText: string,
  topic: string
): Promise<string> {
  const sections = fullText
    .split(/\n{2,}/)
    .filter((section) => section.length > 50)
    .map((section) => section.slice(0, 2000));

  const BATCH_SIZE = 100;

  const topicResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: [topic],
  });
  const topicEmbedding = topicResponse.data[0].embedding;

  const allScoredSections = [];
  for (let i = 0; i < sections.length; i += BATCH_SIZE) {
    const batch = sections.slice(i, i + BATCH_SIZE);

    const batchResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: batch,
    });

    const batchEmbeddings = batchResponse.data.map((d) => d.embedding);

    const batchScoredSections = batch.map((text, idx) => ({
      text,
      score: cosineSimilarity(topicEmbedding, batchEmbeddings[idx]),
    }));

    allScoredSections.push(...batchScoredSections);
  }

  const SIMILARITY_THRESHOLD = 0.3;

  const relevantSections = allScoredSections.filter(
    (s) => s.score >= SIMILARITY_THRESHOLD
  );

  if (relevantSections.length === 0) {
    return "No relevant content found";
  }
  console.log(relevantSections.map((s) => s.text).join("\n\n"));
  return relevantSections.map((s) => s.text).join("\n\n");
}
