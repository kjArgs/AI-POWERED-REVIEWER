import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { isAppError } from '../shared/errors/app-error.js';

export const errorMiddleware: ErrorRequestHandler = (error: unknown, req, res, next) => {
  if (res.headersSent) { next(error); return; }
  let statusCode = 500;
  let message = 'Internal server error';
  if (isAppError(error)) {
    statusCode = error.statusCode; message = error.message;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = error.issues.map(i => `${i.path.join('.') || 'request'}: ${i.message}`).join('; ');
  } else if (error instanceof MulterError) {
    statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = error.code === 'LIMIT_FILE_SIZE' ? 'PDF exceeds the upload size limit' : 'Invalid upload: send one PDF in the file field';
  } else if (typeof error === 'object' && error !== null && 'type' in error) {
    if (error.type === 'entity.parse.failed') { statusCode = 400; message = 'Invalid JSON body'; }
    if (error.type === 'entity.too.large') { statusCode = 413; message = 'Request body too large'; }
  }
  if (statusCode === 500) console.error(`Request failed: ${req.method} ${req.path}`);
  res.status(statusCode).json({ statusCode, message });
};

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
