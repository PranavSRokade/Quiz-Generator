import fs from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import pdf from "pdf-parse";
import { DLC_FOLDER, DSA_FOLDER } from "./variables";

export async function extractAllPDFText(questionType: string): Promise<string> {
  const pdfFolder = questionType === "code" ? DSA_FOLDER : DLC_FOLDER;

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

export function filterTextByTopic(fullText: string, topic: string): string {
  const lowerTopic = topic.toLowerCase();

  const sections = fullText.split(/\n{2,}/);

  const relevantSections = sections.filter((sec) =>
    sec.toLowerCase().includes(lowerTopic)
  );

  return relevantSections.slice(0, 10).join("\n\n");
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
        version: "3.10.0",
        files: [{ content: code }],
      }),
    });

    const data = await result.json();
    console.log("data of piston", data);
    return {
      output: data.run?.stdout || "",
      stderr: data.run?.stderr || "",
      exitCode: data.run?.code,
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
