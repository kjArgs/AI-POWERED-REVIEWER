import type { Request, Response } from 'express';
import type { ChatService } from './chat.service.js';
import { documentId, chatBody } from '../../shared/validation.js';

export class ChatController {
  constructor(private readonly service: ChatService) {}
  answer = async (req: Request, res: Response) => {
    const { question } = chatBody.parse(req.body);
    res.json(await this.service.answer(documentId.parse(req.params.id), question));
  };
}
