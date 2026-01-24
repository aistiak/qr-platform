import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/utils/api-response';

export async function POST(request: NextRequest) {
  // Sign out is handled client-side via NextAuth
  // This endpoint just confirms the request
  return successResponse({ message: 'Sign out successful' });
}
