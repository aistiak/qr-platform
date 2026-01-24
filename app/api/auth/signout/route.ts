import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Sign out is handled client-side via NextAuth
  // This endpoint just confirms the request and clears cookies
  const response = NextResponse.json({ message: 'Sign out successful' });
  
  // Clear all possible NextAuth cookies
  const cookies = request.cookies.getAll();
  cookies.forEach((cookie) => {
    if (cookie.name.includes('authjs') || cookie.name.includes('next-auth')) {
      response.cookies.set(cookie.name, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }
  });
  
  return response;
}
