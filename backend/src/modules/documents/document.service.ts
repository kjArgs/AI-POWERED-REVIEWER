import type { DocumentRepository } from './document.repository.js';
import type { PdfService } from '../../infrastructure/pdf/pdf.service.js';
import type { RagService } from '../../infrastructure/rag/rag.service.js';
import { AppError } from '../../shared/errors/app-error.js';

export class DocumentService {
  constructor(private readonly repository: DocumentRepository, private readonly pdf: PdfService, private readonly rag?: RagService) {}

  async create(file: Express.Multer.File | undefined, title?: string) {
    const document = await this.pdf.prepare(file);
    const chunks = this.rag ? await this.rag.prepareChunks(document.extracted_text) : [];
    return this.repository.create({ ...document, title: title ?? document.filename.replace(/\.pdf$/i, '') }, chunks);
  }

  async get(id: number) {
    const document = await this.repository.find(id);
    if (!document) throw new AppError('Document not found', 404);
    return document;
  }

  async text(id: number) {
    const document = await this.get(id);
    if (!document.extracted_text?.trim()) throw new AppError('Document has no extracted text', 422);
    return document.extracted_text;
  }

  list(limit: number, offset: number) { return this.repository.list(limit, offset); }

  async updateTitle(id: number, title: string) {
    const document = await this.repository.updateTitle(id, title);
    if (!document) throw new AppError('Document not found', 404);
    return document;
  }

  async delete(id: number) {
    if (!await this.repository.delete(id)) throw new AppError('Document not found', 404);
  }
}
