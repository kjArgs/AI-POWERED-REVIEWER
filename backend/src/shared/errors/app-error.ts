/**
 * Custom error class for expected application errors
 *
 * Use this class for errors that have a known HTTP status code
 * and a message that can be returned to the client.
 *
 * Example:
 *   throw new AppError('User not found', 404);
 *   throw new AppError('Invalid input', 400);
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
