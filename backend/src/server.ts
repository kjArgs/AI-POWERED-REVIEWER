import 'dotenv/config';
import { createApp } from './app.js';
import { env } from './config/env.js';

/**
 * Start the HTTP server
 *
 * This file:
 * - Imports the configured Express application
 * - Starts the HTTP server
 * - Handles server startup and shutdown
 */

const app = createApp();
const port = env.PORT;

const server = app.listen(port, () => {
  console.log(`✓ Server running on http://localhost:${port}`);
  console.log(`✓ Environment: ${env.NODE_ENV}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
