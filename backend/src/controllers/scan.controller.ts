import type { Request, Response } from 'express';
import { ImageService } from '../services/image.service';
import { ScanService } from '../services/scan.service';
import { handleControllerError } from './controller-error';

const scanService = new ScanService();
const imageService = new ImageService();

export class ScanController {
  async resolve(req: Request, res: Response) {
    try {
      const result = await scanService.resolveScanTarget(req.params.id, req);

      if (result.type === 'image') {
        const file = await imageService.getImageResponseById(result.imageId);
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Length', file.content.length.toString());
        return res.send(file.content);
      }

      return res.redirect(302, result.url);
    } catch (error) {
      return handleControllerError(res, error, 'Resource not found');
    }
  }
}
