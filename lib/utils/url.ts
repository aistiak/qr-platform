/**
 * Get the base URL for the application
 * Works in both server and client contexts
 */
export function getBaseUrl(request?: Request): string {
  // In server-side API routes, try to get from request headers first
  if (request) {
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    if (host) {
      return `${protocol}://${host}`;
    }
  }

  // Try environment variables (server-side)
  if (typeof window === 'undefined') {
    // Server-side: prefer APP_URL, then NEXTAUTH_URL, then NEXT_PUBLIC_APP_URL
    return (
      process.env.APP_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000'
    );
  }

  // Client-side: use NEXT_PUBLIC_APP_URL or construct from window
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Fallback: construct from window location
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }

  return 'http://localhost:3000';
}

/**
 * Generate a scan URL for a QR code
 */
export function getScanUrl(qrCodeId: string, request?: Request): string {
  const baseUrl = getBaseUrl(request);
  return `${baseUrl}/api/scan/${qrCodeId}`;
}
