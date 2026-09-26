import type { Request, Response } from 'express';
import type { SummaryService } from './summary.service.js';
import { documentId } from '../../shared/validation.js';

export class SummaryController {
  constructor(private readonly service: SummaryService) {}
  generate = async (req: Request, res: Response) => { res.status(201).json(await this.service.generate(documentId.parse(req.params.id))); };
  get = async (req: Request, res: Response) => { res.json(await this.service.get(documentId.parse(req.params.id))); };
}
