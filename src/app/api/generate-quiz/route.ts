import { extractAllPDFText, filterTextByTopic } from "@/lib/PDFUtils";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { topic, difficulty, questionType } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const unfilteredContent = await extractAllPDFText(questionType);

    const filteredContent = filterTextByTopic(unfilteredContent, topic);

    const content =
      questionType === "code" ? filteredContent : unfilteredContent;

    const mcqPrompt = `Using the material below, generate quiz questions about: ${topic}.

                    Following are various rules.

                    1. Generate only ${difficulty}-level multiple-choice questions. The difficulty should reflect the complexity of the question wording, required understanding, and depth of explanation.
                    2. Make sure each question includes a hint to help the user before they answer, but NEVER gives away the correct answer.
                    3. Respond ONLY in the following JSON format:
                    {
                      "questions": [
                        {
                          "question": "string",
                          "options": ["string", "string", "string", "string"],
                          "answer": "string",
                          "explanation": "string"
                          "hint": "string",
                          "type": "mcq",
                        }
                      ]
                    }
                    4. Do not use any emojies anywhere. 
                    5. The options should have meaninful distractors.

                    Material:
                    ${content}`;

    const shortAnswerPrompt = `Using the material below, generate quiz questions about: ${topic}.
      Following are various rules:

      1. Generate only ${difficulty}-level **short-answer** questions. These questions should require a concise, precise response that tests understanding and recall without guessing.
      2. Each question must include a hint that guides the learner toward the answer, but NEVER reveals or directly implies the correct answer.
      3. Respond ONLY in the following JSON format:
      {
        "questions": [
          {
            "question": "string",
            "answer": "string",
            "explanation": "string",
            "hint": "string"
            "type": "short",
            "possibleCorrectAnswers": ["string", "string", "string", "string"]
          }
        ]
      }
      4. Do not use any emojis anywhere.
      5. The answer should be accurate and brief — typically one sentence or phrase. Avoid ambiguous or overly broad answers.

      Material:
      ${content}`;

    const longAnswerPrompt = `Using the material below, generate quiz questions about: ${topic}.

      Following are various rules:

      1. Generate only ${difficulty}-level **long-answer** questions. These should encourage deeper reflection, explanation, or analysis and require answers typically longer than a few sentences.
      2. Each question must include a hint that provides direction on how to approach or frame the response, without giving away key points or the correct answer.
      3. Respond ONLY in the following JSON format:
      {
        "questions": [
          {
            "question": "string",
            "answer": "string",
            "explanation": "string",
            "hint": "string"
            "type": "long",
            "possibleCorrectAnswers": ["string", "string", "string", "string"]

          }
        ]
      }
      4. Do not use any emojis anywhere.
      5. The answer field should include a sample high-quality response that a well-informed learner might write, demonstrating clarity, structure, and depth.

      Material:
      ${content}`;

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
          content:
            questionType === "mcq"
              ? mcqPrompt
              : questionType === "short"
              ? shortAnswerPrompt
              : longAnswerPrompt,
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
