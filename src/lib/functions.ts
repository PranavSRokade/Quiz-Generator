import fs from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import pdf from "pdf-parse";
import {
  DLC_FOLDER,
  DSA_FOLDER,
  MODULES,
  SDMT_FOLDER,
  SUF_FOLDER,
} from "./variables";
import Fuse from "fuse.js";
import OpenAI from "openai";

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
  topic: string,
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

  const relevantSections = allScoredSections
    .filter((s) => s.score >= SIMILARITY_THRESHOLD)

  if (relevantSections.length === 0) {
    return "No relevant content found";
  }

  return relevantSections.map((s) => s.text).join("\n\n");
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dot = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const magB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  return dot / (magA * magB);
}

export async function runCodeOnPiston(language: string, code: string) {
  try {
    if (!language || !code) {
      return { error: "Missing language or code" };
    }
    const result = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language,
        version:
          language === "java"
            ? "15.0.2"
            : language === "cpp"
            ? "10.2.0"
            : "3.10.0",
        files: [{ content: code }],
      }),
    });

    const data = await result.json();
    console.log(data);

    const stderr: string = data.run?.stderr || "";
    const stdout: string = data.run?.stdout || "";

    const cleanError =
      stderr.split("\n").find((line) => line.toLowerCase().includes("error")) ||
      stderr.trim();

    return {
      output: stdout || "",
      error: cleanError || "",
    };
  } catch (err: any) {
    return {
      error: "Failed to run code",
      detail: err.message,
    };
  }
}

export async function runCodeOnJudge0(language: string, sourceCode: string) {
  const languageId = getLanguageId(language);

  try {
    const response = await fetch(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": `${process.env.RAPID_API_KEY}`,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
        body: JSON.stringify({
          source_code: sourceCode,
          language_id: languageId,
        }),
      }
    );

    const data = await response.json();
    const stderr = data.stderr || data.compile_output || "";

    const cleanError =
      stderr
        .split("\n")
        .find((line: string) => line.toLowerCase().includes("error")) ||
      stderr.trim();

    return {
      output: data.stdout?.trim() || "",
      error: cleanError || "",
    };
  } catch (err: any) {
    return {
      error: "Failed to run code",
      detail: err.message,
    };
  }
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getLanguageId(language: string): number | null {
  const mapping: Record<string, number> = {
    python: 71, // Python 3.10.0
    javascript: 63, // Node.js 18.15.0
    java: 62, // Java 17
    cpp: 54, // C++ (GCC 9.2.0)
  };
  return mapping[language.toLowerCase()] || null;
}
