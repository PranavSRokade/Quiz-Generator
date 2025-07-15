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
    const prompt = `
You are an assistant that extracts relevant paragraphs from educational material.

Given the topic: "${topic}", find all paragraphs that are related to this topic.

- Return only paragraphs that mention or explain the topic.
- Separate paragraphs with two new lines.
- If no paragraph clearly relates to the topic, respond exactly with: "No relevant content found."

Example:

Topic: Photosynthesis
Material:
Photosynthesis is the process by which plants make food.
It happens in the leaves.
The mitochondria is the powerhouse of the cell.

Relevant paragraphs:
Photosynthesis is the process by which plants make food.
It happens in the leaves.

Material:
${fullText}
`;

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
