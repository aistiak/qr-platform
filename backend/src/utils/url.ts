import type { Request } from 'express';

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
  return `${getBaseUrl(request)}/api/scan/${qrCodeId}`;
}
