import multer from 'multer';

export function pdfUpload(maxBytes: number) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 1, fields: 1, fieldSize: 1024, parts: 3 },
  }).single('file');
}
