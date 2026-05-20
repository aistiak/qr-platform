import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from './auth-middleware';

/**
 * Middleware to require admin role
 * Returns user info if authenticated and is admin, null otherwise
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ user: { id: string; email: string; role: string } } | null> {
  const authResult = await requireAuth(request);

  if (!authResult) {
    return null;
  }

  if (authResult.user.role !== 'admin') {
    return null;
  }

  return authResult;
}

/**
 * Helper to return 403 Forbidden response for non-admin users
 */
export function adminForbiddenResponse() {
  return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
}
