import { OPEN_AI } from "@/lib/openai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { expectedAnswer, studentAnswer } = await req.json();

  const prompt = `
  You are an educational assistant evaluating student answers.

  Your goal is to assess how well the student's answer shows the core meaning, intent, and conceptual understanding of the expected answer even if it is expressed differently.

  Score generously, and be flexible with:
  - Rewording, synonyms, or paraphrased ideas
  - Different valid explanations that reach the same conclusion
  - Partial but thoughtful understanding of key ideas
  - Small inaccuracies that don’t significantly change the meaning

  Only reduce the score if:
  - Key concepts are missing
  - The student misunderstood or contradicted the core idea
  - The explanation is mostly unrelated or off-topic

  Give a score between 0 and 1:
  - 1 = answer demonstrates the intended idea clearly (even if differently worded)
  - 0 = answer is entirely unrelated or incorrect

  Also provide a short, kind, one-sentence feedback that helps the student understand what was good and what could be better.

  Expected Answer:
  ${expectedAnswer}

  Student Answer:
  ${studentAnswer}

  Respond ONLY in this strict JSON format:
  {
    "score": number between 0 and 1,
    "feedback": "short one-line explanation"
  }
  `;

  const completion = await OPEN_AI.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
  });

  const raw = completion.choices[0].message.content;

  try {
    const parsed = JSON.parse(raw!);
    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      {
        score: 0,
        feedback: "Error parsing GPT response. Please try again.",
        raw,
      },
      { status: 500 }
    );
  }
}
