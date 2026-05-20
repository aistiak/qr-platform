import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function requireAuth(
  _request: NextRequest
): Promise<{ user: { id: string; email: string; role: string } } | null> {
  const session = await auth();

  if (!session || !session.user) {
    return null;
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email!,
      role: session.user.role || 'user',
    },
  };
}

export async function requireAdmin(
  request: NextRequest
): Promise<{ user: { id: string; email: string; role: string } } | null> {
  const authResult = await requireAuth(request);

  if (!authResult || authResult.user.role !== 'admin') {
    return null;
  }

  return authResult;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
