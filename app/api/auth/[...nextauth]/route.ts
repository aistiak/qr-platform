import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Disable static generation - this route requires runtime execution
export const dynamic = 'force-dynamic';

// NextAuth v5 beta - use the handlers export
export const { handlers } = NextAuth(authOptions);

export const { GET, POST } = handlers;
