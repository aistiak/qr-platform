import type { Request, Response } from 'express';
import { ImageService } from '../services/image.service';
import { handleControllerError } from './controller-error';

const imageService = new ImageService();

export class ImageController {
  async upload(req: Request, res: Response) {
    try {
      const response = await imageService.uploadImage(req.file!, req.user!.id);
      return res.status(201).json(response);
    } catch (error) {
      return handleControllerError(res, error, 'Failed to upload image');
    }
  }

  async details(req: Request, res: Response) {
    try {
      const file = await imageService.getImageResponseById(req.params.id);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Length', file.content.length.toString());
      return res.send(file.content);
    } catch (error) {
      return handleControllerError(res, error, 'Image file not found');
    }
  }
}
