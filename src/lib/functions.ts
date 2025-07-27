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

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function convertToSeconds(timestamp: string) {
  const [h, m, s] = timestamp.split(":").map(Number);
  return h * 3600 + m * 60 + s;
}
