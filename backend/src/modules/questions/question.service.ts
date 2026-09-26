import type { DocumentService } from '../documents/document.service.js';
import type { AIService } from '../../infrastructure/ai/ai.service.js';

export class QuestionService {
  constructor(private readonly documents: DocumentService, private readonly ai: AIService) {}
  async generate(id: number) {
    return { documentId: id, questions: await this.ai.generateQuestions(await this.documents.text(id)) };
  }
}
