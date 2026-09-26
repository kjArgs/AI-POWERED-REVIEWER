import type { DocumentService } from '../documents/document.service.js';
import type { DocumentRepository } from '../documents/document.repository.js';
import type { AIService } from '../../infrastructure/ai/ai.service.js';
import { AppError } from '../../shared/errors/app-error.js';

export class SummaryService {
  constructor(private readonly documents: DocumentService, private readonly repository: DocumentRepository, private readonly ai: AIService) {}
  async generate(id: number) {
    const content = await this.ai.summarize(await this.documents.text(id));
    const saved = await this.repository.saveSummary(id, content);
    if (!saved) throw new AppError('Document not found', 404);
    return { documentId: id, summary: saved.content, id: saved.id, createdAt: saved.created_at };
  }
  async get(id: number) {
    await this.documents.get(id);
    const saved = await this.repository.latestSummary(id);
    if (!saved) throw new AppError('Summary not found; generate one first', 404);
    return { documentId: id, summary: saved.content, id: saved.id, createdAt: saved.created_at };
  }
}
