import { delay, runCodeOnJudge0, runCodeOnPiston } from "@/lib/functions";
import { OPEN_AI } from "@/lib/variables";
import { TestCase } from "@/types";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { studentCode, question } = await req.json();


  const feedbackPrompt = `
    You are a programming tutor. A student submitted the following code for a question.

    Question:
    ${question.question}

    Description:
    ${question.description}

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
    feedback,
  });
}
