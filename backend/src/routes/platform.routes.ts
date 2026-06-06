import { Router } from 'express';
import { PlatformQRController } from '../controllers/platform-qr.controller';
import { requireApiScope, requireApiTokenAuth } from '../utils/auth';

const platformQRController = new PlatformQRController();

export const platformRouter = Router();

platformRouter.use('/qrs', requireApiTokenAuth);
platformRouter.post(
  '/qrs',
  requireApiScope('qr:create'),
  platformQRController.create.bind(platformQRController)
);
platformRouter.get('/qrs', requireApiScope('qr:list'), platformQRController.list.bind(platformQRController));
platformRouter.get(
  '/qrs/:id',
  requireApiScope('qr:read'),
  platformQRController.details.bind(platformQRController)
);
platformRouter.delete(
  '/qrs/:id',
  requireApiScope('qr:delete'),
  platformQRController.remove.bind(platformQRController)
);
