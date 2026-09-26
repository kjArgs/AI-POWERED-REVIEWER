import { Router } from 'express';
import type { DocumentService } from './document.service.js';
import { DocumentController } from './document.controller.js';
import { asyncHandler } from '../../middlewares/error.middleware.js';
import { pdfUpload } from '../../middlewares/upload.middleware.js';

export function documentRoutes(service: DocumentService, maxUploadBytes: number) {
  const router = Router();
  const controller = new DocumentController(service);
  router.post('/', pdfUpload(maxUploadBytes), asyncHandler(controller.create));
  router.get('/', asyncHandler(controller.list));
  router.get('/:id', asyncHandler(controller.get));
  router.patch('/:id', asyncHandler(controller.update));
  router.delete('/:id', asyncHandler(controller.delete));
  return router;
}
