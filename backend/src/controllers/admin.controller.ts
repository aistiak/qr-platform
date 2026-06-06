import type { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { AdminService } from '../services/admin.service';
import { handleControllerError } from './controller-error';

const adminService = new AdminService();

export class AdminController {
  async users(_req: Request, res: Response) {
    try {
      const response = await adminService.listUsers();
      return res.json(response);
    } catch (error) {
      return handleControllerError(res, error, 'Failed to fetch users');
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const response = await adminService.updateUser(req.params.id, req.body);

      logger.admin('User QR code limit updated', {
        adminUserId: req.user!.id,
        targetUserId: response.id,
        newLimit: response.qrCodeLimit,
      });

      return res.json(response);
    } catch (error) {
      return handleControllerError(res, error, 'Failed to update user');
    }
  }

  async qrCodes(req: Request, res: Response) {
    try {
      const status = String(req.query.status || 'all');
      const response = await adminService.listQRCodes(status);
      return res.json(response);
    } catch (error) {
      return handleControllerError(res, error, 'Failed to fetch QR codes');
    }
  }
}
