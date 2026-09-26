import express from 'express';
import { requestLoggerMiddleware } from './middlewares/request-logger.middleware.js';
import { notFoundMiddleware } from './middlewares/not-found.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { exampleRouter } from './modules/example/example.routes.js';

/**
 * Create and configure the Express application
 *
 * This file:
 * - Creates the Express app
 * - Registers middleware
 * - Registers routes
 * - Registers error handling
 *
 * Keeps application configuration separate from server startup.
 */
export function createApp(): express.Application {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLoggerMiddleware);

  // Routes
  app.use('/api/example', exampleRouter);

  // Add more routes here as you add modules
  // app.use('/api/users', usersRouter);
  // app.use('/api/products', productsRouter);

  // 404 handling (must come after all routes)
  app.use(notFoundMiddleware);

  // Error handling (must come last)
  app.use(errorMiddleware);

  return app;
}
