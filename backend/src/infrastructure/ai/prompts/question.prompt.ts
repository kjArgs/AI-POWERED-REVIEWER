export const questionPrompt = (text: string) => `
You are an AI study assistant.

Generate study questions based only on the provided study material.

Create the following:

1. 5 Multiple-Choice Questions
2. 5 Enumeration Questions
3. 5 Explanation Questions

Return ONLY valid JSON.
Do not include markdown, code blocks, or additional text outside the JSON.

Use exactly this structure:

{
  "multiple_choice": [
    {
      "question": "Question here",
      "choices": [
        "A. Choice",
        "B. Choice",
        "C. Choice",
        "D. Choice"
      ],
      "answer": "A"
    }
  ],
  "enumeration": [
    {
      "question": "Enumerate the...",
      "answer": [
        "Answer 1",
        "Answer 2",
        "Answer 3"
      ]
    }
  ],
  "explanation": [
    {
      "question": "Explain...",
      "answer": "Expected explanation here."
    }
  ]
}

Rules:

MULTIPLE CHOICE:
- Generate exactly 5 questions.
- Each question must have exactly 4 choices.
- Choices must be labeled A., B., C., and D. in that order.
- Only one choice should be correct.
- The "answer" field must contain only the correct letter: A, B, C, or D.
- Make incorrect choices plausible but clearly incorrect based on the material.

ENUMERATION:
- Generate exactly 5 questions.
- Questions should ask the student to list important concepts, steps, characteristics, components, or examples.
- The "answer" field must be an array containing all expected answers.
- Only ask enumeration questions when the answers can be found in the provided material.

EXPLANATION:
- Generate exactly 5 questions.
- Questions should require the student to explain a concept, process, relationship, purpose, or reason.
- Avoid questions that can be answered with only one word.
- The "answer" field should contain a concise expected answer based on the material.

GENERAL RULES:
- Base every question and answer only on the provided study material.
- Do not introduce information that is not present in the material.
- Avoid duplicate or nearly identical questions.
- Focus on the most important concepts.
- Use clear and student-friendly language.
- Vary the difficulty of the questions.
- Ensure all answers are supported by the provided material.

Study Material:

${text}
`;
