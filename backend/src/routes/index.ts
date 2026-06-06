import { Router } from 'express';
import { adminRouter } from './admin.routes';
import { appPlatformRouter } from './app-platform.routes';
import { authRouter } from './auth.routes';
import { imageRouter } from './image.routes';
import { platformRouter } from './platform.routes';
import { qrRouter } from './qr.routes';
import { scanRouter } from './scan.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/app/qr', qrRouter);
apiRouter.use('/images', imageRouter);
apiRouter.use('/scan', scanRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/app/platform', appPlatformRouter);
apiRouter.use('/platform', platformRouter);

apiRouter.use((_req, res) => {
  res.status(404).json({ error: 'API route not found' });
});
