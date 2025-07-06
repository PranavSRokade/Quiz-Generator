import { extractAllPDFText, filterTextByTopic } from "@/lib/functions";
import { OPEN_AI } from "@/lib/variables";
import { NextRequest, NextResponse } from "next/server";

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

    //TODO
    //1. the quesitons refresh randomly

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
              "starterCode": "string",
              "solutionCode": "string",
              "testCases": [
                { "input": "string", "expectedOutput": "string" },
                { "input": "string", "expectedOutput": "string" },
                { "input": "string", "expectedOutput": "string" }
              ],
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
        6. The starterCode should include a function definition with an empty body in Python.
        7. The solutionCode must be a correct working solution for the problem.
        8. The functionName should match the function name used in both starterCode and solutionCode.
        9. The testCases should be sufficient to verify the solution correctness. Never include null values in test cases.
        10. Do not include any extra text outside the JSON response.
        11. Do not use emojis anywhere.
        12. Test cases should use Python always, and should replace null with None.

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
