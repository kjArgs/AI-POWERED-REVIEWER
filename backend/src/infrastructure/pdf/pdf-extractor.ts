import { PDFParse } from 'pdf-parse';

export interface PDFExtractor {
  extract(buffer: Buffer): Promise<string>;
}

export class PdfExtractor implements PDFExtractor {
  async extract(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer, isEvalSupported: false });
    try {
      const result = await parser.getText();
      return result.pages.map(page => page.text).join('\n\n');
    } finally {
      await parser.destroy();
    }
  }
}
