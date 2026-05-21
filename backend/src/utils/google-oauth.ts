import { OAuth2Client } from 'google-auth-library';
import { HttpError } from '../core/http-error';

export function isGoogleAuthEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function getGoogleCallbackUrl(): string {
  return (
    process.env.GOOGLE_CALLBACK_URL ||
    `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/auth/google/callback`
  );
}

export function getGoogleOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new HttpError(503, 'Google sign-in is not configured');
  }

  return new OAuth2Client(clientId, clientSecret, getGoogleCallbackUrl());
}
