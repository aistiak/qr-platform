import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const email = typeof credentials.email === 'string' ? credentials.email : '';
          const password = typeof credentials.password === 'string' ? credentials.password : '';

          if (!email || !password) {
            return null;
          }

          await connectDB();

          const user = await User.findOne({ email: email.toLowerCase() });

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('NextAuth authorize error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }: any) {
      try {
        if (token && session.user) {
          session.user.id = token.sub || '';
          session.user.role = (token.role as string) || 'user';
        }
        return session;
      } catch (error) {
        console.error('NextAuth session callback error:', error);
        return session;
      }
    },
    async jwt({ token, user }: any) {
      try {
        if (user) {
          token.sub = user.id;
          token.role = user.role;
        }
        return token;
      } catch (error) {
        console.error('NextAuth jwt callback error:', error);
        return token;
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
  debug: process.env.NODE_ENV === 'development',
  trustHost: true, // Allow NextAuth to work in development without strict URL checking
};

// Export auth function for use in server components
export const { auth } = NextAuth(authOptions);
