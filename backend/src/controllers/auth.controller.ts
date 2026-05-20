import type { Request, Response } from 'express';
import { clearSessionCookie, setSessionCookie, signSessionToken } from '../utils/auth';
import { logger } from '../utils/logger';
import { AuthService } from '../services/auth.service';
import { handleControllerError } from './controller-error';

const authService = new AuthService();

export class AuthController {
  async signUp(req: Request, res: Response) {
    try {
      const response = await authService.signUp(req.body);
      logger.auth('User signed up successfully', { userId: response.user.id, email: response.user.email });
      return res.status(201).json(response);
    } catch (error) {
      logger.error('Sign up error', error);
      return handleControllerError(res, error, 'Internal server error');
    }
  }

  async signIn(req: Request, res: Response) {
    try {
      const sessionUser = await authService.signIn(req.body);
      const token = signSessionToken(sessionUser);
      setSessionCookie(res, token);

      return res.json({ message: 'Sign in successful', user: sessionUser });
    } catch (error) {
      logger.error('Sign in error', error);
      return handleControllerError(res, error, 'Internal server error');
    }
  }

  signOut(_req: Request, res: Response) {
    clearSessionCookie(res);
    return res.json({ message: 'Sign out successful' });
  }

  session(req: Request, res: Response) {
    if (!req.user) {
      return res.json(null);
    }

    return res.json({ user: req.user });
  }
}
