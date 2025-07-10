import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { fullText, topic } = await req.json();

    if (!fullText || !topic) {
      return NextResponse.json(
        { error: "fullText and topic are required" },
        { status: 400 }
      );
    }

    const prompt = `You will be given educational material. Your task is to extract only the paragraphs that are specifically relevant to the topic: "${topic}". 
Return only the relevant paragraphs clearly separated by new lines.
If no paragraphs are relevant, respond clearly with: "No relevant content found.".

Material:
${fullText}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that extracts relevant text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0].message.content?.trim() || "";

    return NextResponse.json({
      filteredText: responseText,
    });
  } catch (error) {
    console.error("[OPENAI_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to filter text" },
      { status: 500 }
    );
  }
}
