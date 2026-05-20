import { Router } from 'express';
import { ApiTokenController } from '../controllers/api-token.controller';
import { PlatformQRController } from '../controllers/platform-qr.controller';
import { requireApiScope, requireApiTokenAuth, requireAuth } from '../utils/auth';

const apiTokenController = new ApiTokenController();
const platformQRController = new PlatformQRController();

export const platformRouter = Router();

platformRouter.post('/tokens', requireAuth, apiTokenController.create.bind(apiTokenController));
platformRouter.get('/tokens', requireAuth, apiTokenController.list.bind(apiTokenController));
platformRouter.get('/tokens/:id', requireAuth, apiTokenController.details.bind(apiTokenController));
platformRouter.delete('/tokens/:id', requireAuth, apiTokenController.remove.bind(apiTokenController));

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
