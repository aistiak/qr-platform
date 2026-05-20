import type { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { QRService } from '../services/qr.service';
import { handleControllerError } from './controller-error';

const qrService = new QRService();

export class QRController {
  async list(req: Request, res: Response) {
    try {
      const status = String(req.query.status || 'active');
      const response = await qrService.listUserQRCodes(req.user!.id, status);
      return res.json(response);
    } catch (error) {
      logger.error('Get QR codes error', error, { userId: req.user?.id });
      return handleControllerError(res, error, 'Failed to fetch QR codes');
    }
  }

  async create(req: Request, res: Response) {
    try {
      const response = await qrService.createQRCode(req.user!.id, req.body);
      return res.status(201).json(response);
    } catch (error) {
      logger.error('Create QR code error', error, { userId: req.user?.id });
      return handleControllerError(res, error, 'Failed to create QR code');
    }
  }

  async details(req: Request, res: Response) {
    try {
      const response = await qrService.getQRCodeById(req.user!.id, req.params.id);
      return res.json(response);
    } catch (error) {
      return handleControllerError(res, error, 'Failed to fetch QR code');
    }
  }

  async update(req: Request, res: Response) {
    try {
      const response = await qrService.updateQRCode(req.user!.id, req.params.id, req.body);
      return res.json(response);
    } catch (error) {
      logger.error('Update QR code error', error, { qrCodeId: req.params.id });
      return handleControllerError(res, error, 'Failed to update QR code');
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const response = await qrService.deleteQRCode(req.user!.id, req.params.id);
      return res.json(response);
    } catch (error) {
      return handleControllerError(res, error, 'Failed to delete QR code');
    }
  }

  async pause(req: Request, res: Response) {
    try {
      const response = await qrService.pauseQRCode(req.user!.id, req.params.id);
      return res.json(response);
    } catch (error) {
      return handleControllerError(res, error, 'Failed to pause QR code');
    }
  }

  async archive(req: Request, res: Response) {
    try {
      const response = await qrService.archiveQRCode(req.user!.id, req.params.id);
      return res.json(response);
    } catch (error) {
      return handleControllerError(res, error, 'Failed to archive QR code');
    }
  }

  async analytics(req: Request, res: Response) {
    try {
      const period = String(req.query.period || 'day');
      const response = await qrService.getQRCodeAnalytics(req.user!.id, req.params.id, period);
      return res.json(response);
    } catch (error) {
      return handleControllerError(res, error, 'Failed to fetch analytics');
    }
  }

  async download(req: Request, res: Response) {
    try {
      const format = String(req.query.format || 'png');
      const file = await qrService.downloadQRCode(req.user!.id, req.params.id, format, req);

      res.setHeader('Content-Type', file.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
      return res.send(file.content);
    } catch (error) {
      return handleControllerError(res, error, 'Failed to generate QR code download');
    }
  }
}
