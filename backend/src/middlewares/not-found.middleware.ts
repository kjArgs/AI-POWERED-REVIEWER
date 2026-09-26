import { Request, Response } from 'express';
import { AppError } from '../shared/errors/app-error.js';

/**
 * Middleware to handle requests that don't match any route
 *
 * Should be registered AFTER all route handlers but BEFORE error middleware.
 */
export function notFoundMiddleware(req: Request, res: Response): void {
  throw new AppError('Route not found', 404);
}
