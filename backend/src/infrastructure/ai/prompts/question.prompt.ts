export const questionPrompt = (text: string) => `
You are an AI study assistant.

Generate 5 multiple-choice questions
based only on the following material.
Each question must have four choices labeled A., B., C., D. in that order.
Return a JSON array with question, choices, and answer fields.
The answer must be the correct choice letter: A, B, C, or D.

Study Material:
${text}
`;
