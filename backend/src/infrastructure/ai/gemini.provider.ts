import { GoogleGenAI } from "@google/genai";

import type { AIProvider, Question } from "./ai.provider.js";

import { env } from "../../config/env.js";

export class GeminiProvider implements AIProvider {
  private readonly client: GoogleGenAI;

  constructor() {
    this.client = new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY,
    });
  }

  async summarize(text: string): Promise<string> {
    const prompt = `
Summarize the following study material.

Text:
${text}
`;

    const response = await this.client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text ?? "";
  }

  async generateQuestions(text: string): Promise<Question[]> {
    const prompt = `
Generate 5 multiple-choice questions
from the following study material.

Return JSON.

Text:
${text}
`;

    const response = await this.client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return JSON.parse(response.text ?? "[]");
  }

  async answerQuestion(question: string, context: string): Promise<string> {
    const prompt = `
Answer the student's question using the provided context.

Context:
${context}

Question:
${question}
`;

    const response = await this.client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text ?? "";
  }
}
