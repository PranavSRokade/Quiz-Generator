import fs from "fs/promises";
import path from "path";
import pdf from "pdf-parse";

const pdfFolder = path.resolve(process.cwd(), "public", "dlc", "pdfs");

export async function extractAllPDFText(): Promise<string> {
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
