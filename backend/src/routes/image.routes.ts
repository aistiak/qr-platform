import multer from 'multer';
import { Router } from 'express';
import { ImageController } from '../controllers/image.controller';
import { requireAuth } from '../utils/auth';

const imageController = new ImageController();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

export const imageRouter = Router();

imageRouter.post('/', requireAuth, upload.single('file'), imageController.upload.bind(imageController));
imageRouter.get('/:id', imageController.details.bind(imageController));
