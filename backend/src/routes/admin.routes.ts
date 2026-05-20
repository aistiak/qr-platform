import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { requireAdmin } from '../utils/auth';

const adminController = new AdminController();
export const adminRouter = Router();

adminRouter.use(requireAdmin);
adminRouter.get('/users', adminController.users.bind(adminController));
adminRouter.patch('/users/:id', adminController.updateUser.bind(adminController));
adminRouter.get('/qr', adminController.qrCodes.bind(adminController));
