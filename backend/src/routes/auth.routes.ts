import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const authController = new AuthController();
export const authRouter = Router();

authRouter.post('/signup', authController.signUp.bind(authController));
authRouter.post('/signin', authController.signIn.bind(authController));
authRouter.post('/signout', authController.signOut.bind(authController));
authRouter.get('/session', authController.session.bind(authController));
