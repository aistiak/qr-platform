import type { Request } from 'express';

export function getPublicAppUrl(request?: Request): string {
  return (
    process.env.PUBLIC_APP_URL ||
    process.env.FRONTEND_URL ||
    process.env.APP_URL ||
    (request ? `${request.protocol}://${request.get('host')}` : 'http://localhost:3000')
  );
}

export function getBaseUrl(request?: Request): string {
  if (request) {
    const host = request.get('host');
    const protocol = request.get('x-forwarded-proto') || request.protocol || 'http';
    if (host) {
      return `${protocol}://${host}`;
    }
  }

  return process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
}

export function getScanUrl(qrCodeId: string, request?: Request): string {
  const publicBaseUrl = getPublicAppUrl(request);
  return `${publicBaseUrl}/c/${qrCodeId}`;
}
