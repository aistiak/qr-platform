import type { Request, Response } from 'express';
import { PlatformQRService } from '../services/platform-qr.service';
import { handleControllerError } from './controller-error';

const platformQRService = new PlatformQRService();

export class PlatformQRController {
  async create(req: Request, res: Response) {
    try {
      const response = await platformQRService.create(req.user!.id, req.body);
      return res.status(201).json(response);
    } catch (error) {
      return handleControllerError(res, error, 'Failed to create QR code');
    }
  }

  async details(req: Request, res: Response) {
    try {
      const response = await platformQRService.details(req.user!.id, req.params.id);
      return res.json(response);
    } catch (error) {
      return handleControllerError(res, error, 'Failed to fetch QR code');
    }
  }

  async list(req: Request, res: Response) {
    try {
      const response = await platformQRService.list(req.user!.id, {
        status: req.query.status ? String(req.query.status) : undefined,
        limit: req.query.limit ? String(req.query.limit) : undefined,
        cursor: req.query.cursor ? String(req.query.cursor) : undefined,
      });
      return res.json(response);
    } catch (error) {
      return handleControllerError(res, error, 'Failed to fetch QR codes');
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const response = await platformQRService.remove(req.user!.id, req.params.id);
      return res.json(response);
    } catch (error) {
      return handleControllerError(res, error, 'Failed to delete QR code');
    }
  }
}
