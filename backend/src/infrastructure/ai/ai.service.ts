import type { AIProvider, Question } from "./ai.provider.js";

export class AIService {
  constructor(private readonly provider: AIProvider) {}

  async summarize(text: string): Promise<string> {
    return this.provider.summarize(text);
  }

  async generateQuestions(text: string): Promise<Question[]> {
    return this.provider.generateQuestions(text);
  }

  async answerQuestion(question: string, context: string): Promise<string> {
    return this.provider.answerQuestion(question, context);
  }
}
