import { Router } from 'express';
import type { QuestionService } from './question.service.js';
import { QuestionController } from './question.controller.js';
import { asyncHandler } from '../../middlewares/error.middleware.js';

export function questionRoutes(service: QuestionService) {
  const router = Router();
  router.post('/:id/questions', asyncHandler(new QuestionController(service).generate));
  return router;
}
