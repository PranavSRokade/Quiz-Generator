import { extractAllPDFText } from "@/lib/PDFUtils";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();
    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const content = await extractAllPDFText();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an educational assistant that creates formative assessment questions from lecture content.",
        },
        {
          role: "user",
          content: `Using the material below, generate quiz questions about: ${topic}.
                Respond ONLY in the following JSON format:

                [
                {
                    "question": "string",
                    "options": ["string", "string", "string", "string"],
                    "answer": "string",
                    "explanation": "string (optional)"
                }
                ]

                Material:
                ${content}`,
        },
      ],
      temperature: 0.7,
    });

    const contentFromCompletion = completion.choices[0].message.content ?? "";
    const trimmed = contentFromCompletion.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(trimmed);

    return NextResponse.json({ parsed });
  } catch (error) {
    console.error("[OPENAI_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
