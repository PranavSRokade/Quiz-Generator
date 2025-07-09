import { extractAllPDFText, filterTextByTopic } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const OPEN_AI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const { expectedAnswer, studentAnswer } = await req.json();

  const prompt = `
                  You are an educational assistant. Evaluate the following student answer based on the expected answer.
                  Provide a score between 0 and 1 where:
                  - 1 = completely correct
                  - 0 = completely incorrect

                  Also provide a short 1-sentence explanation of the feedback.

                  Expected Answer:
                  ${expectedAnswer}

                  Student Answer:
                  ${studentAnswer}

                  Respond in JSON like:
                  {
                    "score": 0.75,
                    "feedback": "The answer is mostly correct but missed a key detail about X."
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
