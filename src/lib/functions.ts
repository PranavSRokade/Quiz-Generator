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

export function convertToSeconds(timestamp: string) {
  const [h, m, s] = timestamp.split(":").map(Number);
  return h * 3600 + m * 60 + s;
}
