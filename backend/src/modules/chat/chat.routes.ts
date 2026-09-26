import { Router } from 'express';
import type { ChatService } from './chat.service.js';
import { ChatController } from './chat.controller.js';
import { asyncHandler } from '../../middlewares/error.middleware.js';

export function chatRoutes(service: ChatService) {
  const router = Router();
  router.post('/:id/chat', asyncHandler(new ChatController(service).answer));
  return router;
}
