import type { PDFExtractor } from './pdf-extractor.js';
import { AppError } from '../../shared/errors/app-error.js';

export class PdfService {
  constructor(private readonly extractor: PDFExtractor, private readonly maxChars = 200000) {}

  async prepare(file: Express.Multer.File | undefined) {
    if (!file) throw new AppError('A PDF file is required in the file field', 400);
    const filename = file.originalname.replace(/\\/g, '/').split('/').pop() ?? '';
    if (!filename.toLowerCase().endsWith('.pdf') || filename.length > 255 ||
        file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
      throw new AppError('Upload a valid PDF with a filename of at most 255 characters', 400);
    }
    let text: string;
    try { text = await this.extractor.extract(file.buffer); }
    catch { throw new AppError('PDF could not be read; it may be damaged or password protected', 422); }
    text = text.replace(/\u0000/g, '').trim();
    if (!text) throw new AppError('PDF has no extractable text; scanned documents require OCR', 422);
    if (text.length > this.maxChars) throw new AppError(`PDF exceeds the ${this.maxChars} character text limit`, 413);
    return { filename, extracted_text: text };
  }
}
