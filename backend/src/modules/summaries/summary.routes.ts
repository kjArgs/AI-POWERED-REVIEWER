import { Router } from 'express';
import type { SummaryService } from './summary.service.js';
import { SummaryController } from './summary.controller.js';
import { asyncHandler } from '../../middlewares/error.middleware.js';

export function summaryRoutes(service: SummaryService) {
  const router = Router();
  const controller = new SummaryController(service);
  router.post('/:id/summary', asyncHandler(controller.generate));
  router.get('/:id/summary', asyncHandler(controller.get));
  return router;
}
