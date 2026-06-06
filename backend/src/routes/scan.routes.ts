import { Router } from 'express';
import { ScanController } from '../controllers/scan.controller';

const scanController = new ScanController();
export const scanRouter = Router();

scanRouter.get('/:id', scanController.resolve.bind(scanController));
