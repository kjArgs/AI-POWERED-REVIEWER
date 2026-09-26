import type { DocumentService } from '../documents/document.service.js';
import type { AIService } from '../../infrastructure/ai/ai.service.js';
import type { RagService } from '../../infrastructure/rag/rag.service.js';

export class ChatService {
  constructor(private readonly documents: DocumentService, private readonly ai: AIService, private readonly rag?: RagService) {}
  async answer(id: number, question: string) {
    const text = await this.documents.text(id);
    if (this.rag) return { ...await this.rag.answerQuestion(id, question), mode: 'rag' as const };
    return { documentId: id, answer: await this.ai.answerQuestion(question, text), sources: [], mode: 'basic' as const };
  }
}
