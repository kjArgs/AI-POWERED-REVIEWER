export const chatPrompt = (question: string, context: string) => `
You are an AI study assistant.

Answer the student's question using
only the provided context.

Context:
${context}

Question:
${question}
`;
