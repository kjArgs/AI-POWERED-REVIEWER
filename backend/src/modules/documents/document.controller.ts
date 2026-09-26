import type { Request, Response } from 'express';
import type { DocumentService } from './document.service.js';
import { documentId, pagination, titleBody } from '../../shared/validation.js';

export class DocumentController {
  constructor(private readonly service: DocumentService) {}
  create = async (req: Request, res: Response) => {
    const { title } = titleBody.parse(req.body ?? {});
    const document = await this.service.create(req.file, title);
    res.location(`/api/documents/${document.id}`).status(201).json(document);
  };
  list = async (req: Request, res: Response) => {
    const { limit, offset } = pagination.parse(req.query);
    res.json({ documents: await this.service.list(limit, offset), limit, offset });
  };
  get = async (req: Request, res: Response) => { res.json(await this.service.get(documentId.parse(req.params.id))); };
  update = async (req: Request, res: Response) => {
    const { title } = titleBody.required().parse(req.body);
    res.json(await this.service.updateTitle(documentId.parse(req.params.id), title));
  };
  delete = async (req: Request, res: Response) => {
    await this.service.delete(documentId.parse(req.params.id));
    res.status(204).send();
  };
}
