/**
 * TypeScript types for User entity
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  qrCodeLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}
