import { NextRequest, NextResponse } from "next/server";
import { SearchResult } from "@/types";
import { MODULES, QUESTION_TYPE } from "@/lib/variables";
import { extractAllPDFText, filterTextByTopic } from "@/lib/server-functions";
import { OPEN_AI } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const { topic, difficulty, questionType, course } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    let content: string;

    if (questionType === QUESTION_TYPE.CODE) {
      try {
        const fullText = await extractAllPDFText(
          QUESTION_TYPE.CODE,
          MODULES.DATA_STRUCTURE_ALGORITHM
        );

        const filteredContent = await filterTextByTopic(fullText, topic);

        if (filteredContent === "No relevant content found") {
          return NextResponse.json(
            {
              error: `The topic "${topic}" was not found in the Data Structures and Algorithm module. Please check your spelling or try a related topic.`,
            },
            { status: 404 }
          );
        }

        content = filteredContent;
      } catch (error) {
        console.error("Error processing DSA content:", error);
        return NextResponse.json(
          { error: "Failed to process DSA content" },
          { status: 500 }
        );
      }
    } else {
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

      content = searchResults
        .map((result) => {
          const doc = result.document;

          return (
            `Page: ${doc.page_number}\n` +
            `Start Time: ${doc.timestamp.start}\n` +
            `End Time: ${doc.timestamp.end}\n` +
            `Type: ${doc.doc_type}\n` +
            `URL: ${doc.url}\n\n` +
            `${doc.content}`
          );
        })
        .join("\n\n---\n\n");
    }

    const mcqPrompt = `Using the material below, generate minimum 5 quiz questions about: ${topic} from the module ${course}.

                    Following are various rules:

                    1. Generate only ${difficulty} level multiple-choice questions. The difficulty should reflect the complexity of the question wording, required understanding, and depth of explanation.
                    2. Add a 'source' field to each question as an object. It must include:
                      {
                        "url": string,
                        "page_number": number,
                        "timestamp": { "start": string | null, "end": string | null },
                        "doc_type": string
                      }
                      Use null for timestamps in PDFs. Use accurate document metadata.
                    3. Respond ONLY in the following JSON format:
                    {
                      "questions": [
                        {
                          "question": "string",
                          "options": ["string", "string", "string", "string"],
                          "answer": "string",
                          "explanation": "string",
                          "type": "mcq",
                          "source": {
                            "url": "string",
                            "page_number": number,
                            "timestamp": { "start": "string | null", "end": "string | null" },
                            "doc_type": "string"
                          }
                        }
                      ]
                    }
                    4. Do not use any emojies anywhere. 
                    5. The options should have meaninful distractors.
                    6. Avoid phrasing that refers to the lecturer, teaching, or delivery for example phrases like “the professor explained”, “as taught”, “what he said”, etc. Focus only on the content and concepts themselves.

                    Material:
                    ${content}`;

    const shortAnswerPrompt = `Using the material below, generate minimum 3 quiz questions about: ${topic} from the module ${course}.
      Following are various rules:

      1. Generate only ${difficulty} level short-answer questions. These questions should require a concise, precise response that tests understanding and recall without guessing.
      2. Add a 'source' field to each question as an object. It must include:
        {
          "url": string,
          "page_number": number,
          "timestamp": { "start": string | null, "end": string | null },
          "lecture_title": string,
          "doc_type": string
        }
      3. Respond ONLY in the following JSON format:
        {
          "questions": [
            {
              "question": "string",
              "answer": "string",
              "explanation": "string",
              "type": "short",
              "possibleCorrectAnswers": ["string", "string", "string", "string"],
              "source": {
                "url": "string",
                "page_number": number,
                "timestamp": { "start": "string | null", "end": "string | null" },
                "lecture_title": "string",
                "doc_type": "string"
              }
            }
          ]
        }
      4. Do not use any emojies anywhere.
      5. The answer should be accurate and brief, typically one sentence or phrase. Avoid vague or overly broad answers.
      6. Avoid phrasing that refers to the lecturer, teaching, or delivery for example phrases like “the professor explained”, “as taught”, “what he said”, etc. Focus only on the content and concepts themselves.

      Material:
      ${content}`;

    const longAnswerPrompt = `Using the material below, generate minimum 2 quiz questions about: ${topic} from the module ${course}.

      Following are various rules:

      1. Generate only ${difficulty} level long-answer questions. These should encourage deeper reflection, explanation, or analysis and require answers typically longer than a few sentences.
      2. Add a 'source' field to each question as an object. It must include:
        {
          "url": string,
          "page_number": number,
          "timestamp": { "start": string | null, "end": string | null },
          "lecture_title": string,
          "doc_type": string
        }
      3. Respond ONLY in the following JSON format:
      {
        "questions": [
          {
            "question": "string",
            "answer": "string",
            "explanation": "string",
            "type": "long",
            "possibleCorrectAnswers": ["string", "string", "string", "string"],
            "source": {
              "url": "string",
              "page_number": number,
              "timestamp": { "start": "string | null", "end": "string | null" },
              "doc_type": "string"
            }
          }
        ]
      }
      4. Do not use any emojies anywhere.
      5. The answer field should include a sample high-quality response that a well-informed learner might write, demonstrating clarity, structure, and depth.
      6. Avoid phrasing that refers to the lecturer, teaching, or delivery for example phrases like “the professor explained”, “as taught”, “what he said”, etc. Focus only on the content and concepts themselves.

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
