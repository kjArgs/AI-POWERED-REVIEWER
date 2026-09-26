import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to log HTTP requests with duration
 *
 * Example output:
 *   GET /api/example ---- success ---- 12 ms
 *   POST /api/example ---- success ---- 8 ms
 *   GET /unknown ---- 404 ---- 2 ms
 */
export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startTime = Date.now();
  const method = req.method;
  const path = req.path;

  // Capture the original send function
  const originalSend = res.send;

  // Override res.send to log when response is sent
  res.send = function (data: unknown) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const status = statusCode >= 400 ? statusCode : 'success';

    console.log(`${method} ${path} ---- ${status} ---- ${duration} ms`);

    // Call the original send function
    return originalSend.call(this, data);
  };

  next();
}
