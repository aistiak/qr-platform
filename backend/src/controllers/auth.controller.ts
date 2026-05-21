import crypto from 'crypto';
import type { Request, Response } from 'express';
import { clearSessionCookie, setSessionCookie, signSessionToken } from '../utils/auth';
import { getGoogleOAuthClient, isGoogleAuthEnabled } from '../utils/google-oauth';
import { logger } from '../utils/logger';
import { AuthService } from '../services/auth.service';
import { handleControllerError } from './controller-error';

const authService = new AuthService();
const OAUTH_STATE_COOKIE = 'oauth_state';

function getFrontendUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:3000';
}

function getOAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 10 * 60 * 1000,
  };
}

function redirectToSignIn(res: Response, error: string) {
  return res.redirect(`${getFrontendUrl()}/auth/signin?error=${encodeURIComponent(error)}`);
}

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

  providers(_req: Request, res: Response) {
    return res.json({ google: isGoogleAuthEnabled() });
  }

  googleSignIn(_req: Request, res: Response) {
    try {
      const client = getGoogleOAuthClient();
      const state = crypto.randomBytes(32).toString('hex');

      res.cookie(OAUTH_STATE_COOKIE, state, getOAuthCookieOptions());

      const url = client.generateAuthUrl({
        access_type: 'online',
        scope: ['openid', 'email', 'profile'],
        state,
        prompt: 'select_account',
      });

      return res.redirect(url);
    } catch (error) {
      logger.error('Google sign-in redirect error', error);
      return handleControllerError(res, error, 'Google sign-in is unavailable');
    }
  }

  async googleCallback(req: Request, res: Response) {
    const clearStateCookie = () => {
      res.clearCookie(OAUTH_STATE_COOKIE, getOAuthCookieOptions());
    };

    try {
      const oauthError = req.query.error as string | undefined;
      if (oauthError) {
        clearStateCookie();
        return redirectToSignIn(res, 'google_denied');
      }

      const code = req.query.code as string | undefined;
      const state = req.query.state as string | undefined;
      const savedState = req.cookies?.[OAUTH_STATE_COOKIE];

      if (!code || !state || !savedState || state !== savedState) {
        clearStateCookie();
        return redirectToSignIn(res, 'invalid_state');
      }

      clearStateCookie();

      const client = getGoogleOAuthClient();
      const { tokens } = await client.getToken(code);

      if (!tokens.id_token) {
        return redirectToSignIn(res, 'google_failed');
      }

      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email) {
        return redirectToSignIn(res, 'google_profile');
      }

      const sessionUser = await authService.signInWithGoogle({
        googleId: payload.sub,
        email: payload.email.toLowerCase(),
        name: payload.name || payload.email.split('@')[0],
        image: payload.picture,
      });

      const token = signSessionToken(sessionUser);
      setSessionCookie(res, token);

      logger.auth('User signed in with Google', {
        userId: sessionUser.id,
        email: sessionUser.email,
      });

      return res.redirect(`${getFrontendUrl()}/dashboard`);
    } catch (error) {
      logger.error('Google callback error', error);
      clearStateCookie();
      return redirectToSignIn(res, 'google_failed');
    }
  }
}
