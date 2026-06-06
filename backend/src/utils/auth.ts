import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { ApiTokenScope } from '../models/ApiToken';
import { UserRepository } from '../repositories/user.repository';
import { ApiTokenService } from '../services/api-token.service';

export const SESSION_COOKIE_NAME = 'qr_session';
const apiTokenService = new ApiTokenService();
const userRepository = new UserRepository();

type SessionUser = {
  id: string;
  email: string;
  role: string;
  name?: string;
};

type SessionToken = {
  user: SessionUser;
};

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || 'change-this-secret';
}

export function signSessionToken(user: SessionUser): string {
  const token: SessionToken = { user };
  return jwt.sign(token, getSessionSecret(), { expiresIn: '30d' });
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, getSessionSecret()) as SessionToken;
    return decoded.user;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export function attachSessionUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (token) {
    const user = verifySessionToken(token);
    if (user) {
      req.user = user;
      req.authType = 'session';
    }
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

export function requireSessionAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.authType !== 'session') {
    res.status(401).json({ error: 'Session authentication required' });
    return;
  }
  next();
}

function getBearerToken(req: Request) {
  const authorization = req.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length).trim() || null;
}

export async function requireApiTokenAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      res.status(401).json({ error: 'Bearer token required' });
      return;
    }

    const authenticated = await apiTokenService.authenticate(token);
    if (!authenticated) {
      res.status(401).json({ error: 'Invalid or expired API token' });
      return;
    }

    const user = await userRepository.findById(authenticated.userId);
    if (!user) {
      res.status(401).json({ error: 'Invalid API token user' });
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    };
    req.apiToken = { id: authenticated.tokenId, scopes: authenticated.scopes };
    req.authType = 'api_token';

    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired API token' });
  }
}

export function requireApiScope(scope: ApiTokenScope) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiToken || req.authType !== 'api_token') {
      res.status(401).json({ error: 'API token authentication required' });
      return;
    }

    if (!req.apiToken.scopes.includes(scope)) {
      res.status(403).json({ error: `Missing required scope: ${scope}` });
      return;
    }

    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}
