import { Router } from 'express';
import { QRController } from '../controllers/qr.controller';
import { requireAuth } from '../utils/auth';

const qrController = new QRController();
export const qrRouter = Router();

qrRouter.use(requireAuth);
qrRouter.get('/', qrController.list.bind(qrController));
qrRouter.post('/', qrController.create.bind(qrController));
qrRouter.get('/:id', qrController.details.bind(qrController));
qrRouter.patch('/:id', qrController.update.bind(qrController));
qrRouter.delete('/:id', qrController.remove.bind(qrController));
qrRouter.post('/:id/pause', qrController.pause.bind(qrController));
qrRouter.post('/:id/archive', qrController.archive.bind(qrController));
qrRouter.get('/:id/analytics', qrController.analytics.bind(qrController));
qrRouter.get('/:id/download', qrController.download.bind(qrController));
