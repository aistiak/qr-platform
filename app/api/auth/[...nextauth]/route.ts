import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// NextAuth v5 beta - use the handlers export
export const { handlers } = NextAuth(authOptions);

export const { GET, POST } = handlers;
