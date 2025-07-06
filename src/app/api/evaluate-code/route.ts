import { delay, runCodeOnJudge0, runCodeOnPiston } from "@/lib/functions";
import { OPEN_AI } from "@/lib/variables";
import { TestCase } from "@/types";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const {
    studentCode,
    functionName,
    testCases,
    question: q,
  } = await req.json();

  const { question, description } = q;

  const typedTestCases = testCases as TestCase[];

  const results = [];

  for (const { input, expectedOutput } of typedTestCases) {
    const testScript = `${studentCode.trim()}
# Test
print(${functionName}(${input}))
`.trim(); //cant indent this properly as it adds space and the runCodeOnPiston is not able to execute properly.

    const result = await runCodeOnPiston("python", testScript);
    // const result = await runCodeOnJudge0("python", testScript);

    results.push({
      input,
      expected: expectedOutput,
      actual: (result.output ?? "").trim(),
      passed: (result.output ?? "").trim() === expectedOutput.trim(),
    });

    await delay(200);
  }

  const score = results.filter((r) => r.passed).length / testCases.length;

  const feedbackPrompt = `
    You are a programming tutor. A student submitted the following code for a question.

    Question:
    ${question}

    Description:
    ${description}

    Students Code:
    ${studentCode}

    Please evaluate the code quality, structure, and correctness. Point out any improvements or best practices if needed. Be concise and constructive.
    `;

  let feedback = "No feedback generated.";

  try {
    const response = await OPEN_AI.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful Python tutor." },
        { role: "user", content: feedbackPrompt },
      ],
    });

    feedback = response.choices[0].message.content || feedback;
  } catch (error) {
    console.error("OpenAI Feedback Error:", error);
    feedback = "Error generating feedback.";
  }

  return NextResponse.json({
    passed: results.filter((r) => r.passed).length,
    total: testCases.length,
    results,
    score,
    feedback,
  });
}
