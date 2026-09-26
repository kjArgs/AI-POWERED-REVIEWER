import type { Request, Response } from 'express';
import type { QuestionService } from './question.service.js';
import { documentId } from '../../shared/validation.js';

export class QuestionController {
  constructor(private readonly service: QuestionService) {}
  generate = async (req: Request, res: Response) => { res.json(await this.service.generate(documentId.parse(req.params.id))); };
}
