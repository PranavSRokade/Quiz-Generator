import fs from "fs/promises";
import path from "path";
import pdf from "pdf-parse";

const pdfDsaFolder = path.resolve(process.cwd(), "public", "dsa");
const pdfDlcFolder = path.resolve(process.cwd(), "public", "dlc", "pdfs");

export async function extractAllPDFText(questionType: string): Promise<string> {
  const pdfFolder = questionType === "code" ? pdfDsaFolder : pdfDlcFolder;

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
