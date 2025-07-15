import { NextRequest, NextResponse } from "next/server";
import { SearchResult } from "@/types";
import OpenAI from "openai";

const OPEN_AI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { topic, difficulty, questionType, course } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const searchResponse = await fetch("http://46.101.49.168/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: {
          question: topic,
        },
        filters: {
          courses_ids: [course.course_id],
        },
      }),
    });

    if (!searchResponse.ok) {
      return NextResponse.json(
        { error: "Failed to search for relevant content" },
        { status: 500 }
      );
    }

    const searchResults: SearchResult[] = await searchResponse.json();

    if (!searchResults || searchResults.length === 0) {
      return NextResponse.json(
        {
          error: `The topic "${topic}" was not found in the selected module "${course.course_title}". Please check your spelling, try a related topic, or select a different module.`,
        },
        { status: 404 }
      );
    }

    const content = searchResults
      .map((result) => result.document.content)
      .join("\n\n");

    console.log("content", content.length);

    const mcqPrompt = `Using the material below, generate quiz questions about: ${topic} from the module ${course}.

                    Following are various rules:

                    1. Generate only ${difficulty} level multiple-choice questions. The difficulty should reflect the complexity of the question wording, required understanding, and depth of explanation.
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

    const shortAnswerPrompt = `Using the material below, generate quiz questions about: ${topic} from the module ${course.course_id}.
      Following are various rules:

      1. Generate only ${difficulty} level short-answer questions. These questions should require a concise, precise response that tests understanding and recall without guessing.
      2. Make sure each question includes a hint to help the user before they answer, but NEVER gives away the correct answer.
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
      4. Do not use any emojies anywhere.
      5. The answer should be accurate and brief, typically one sentence or phrase. Avoid vague or overly broad answers.

      Material:
      ${content}`;

    const longAnswerPrompt = `Using the material below, generate quiz questions about: ${topic} from the module ${course.course_id}.

      Following are various rules:

      1. Generate only ${difficulty} level long-answer questions. These should encourage deeper reflection, explanation, or analysis and require answers typically longer than a few sentences.
      2. Make sure each question includes a hint to help the user before they answer, but NEVER gives away the correct answer.
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
      4. Do not use any emojies anywhere.
      5. The answer field should include a sample high-quality response that a well-informed learner might write, demonstrating clarity, structure, and depth.

      Material:
      ${content}`;

    const codingQuestionPrompt = `Using the material below, generate two coding exercises based on the topic: ${topic}.
        Follow these rules carefully:

        1. The question should be at the EASY level and test a meaningful programming concept (e.g., algorithms, data structures, or language syntax).
        2. The response should be in the following strict JSON format:

        {
          "questions": 
          [
            {
              "question": "string",
              "description": "string", 
              "example": "string", 
              "constraints": ["string", "string"],
              "explanation": "string",
              "hint": "string",
              "type": "code",
              "functionName": "string",
            }
          ]
        }

        3. The description should clearly explain the task and what the user is expected to implement.
        4. The example should show one clear input/output pair. Never include null values in example. For data structures like binary trees or linked lists, represent inputs as serialized arrays or strings (e.g., "[1, 2, 3, null, 4]") instead of raw object constructors.
        5. The constraints should include realistic conditions or limits (e.g., array length, input size).
        6. Do not include any extra text outside the JSON response.
        7. Do not use emojies anywhere.
        8. Each question must include a helpful hint that guides the learner in the right direction without revealing the answer.

        Material:
        ${content}`;

    const completion = await OPEN_AI.chat.completions.create({
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
              : questionType === "long"
              ? longAnswerPrompt
              : codingQuestionPrompt,
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
