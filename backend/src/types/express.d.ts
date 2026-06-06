import type { ApiTokenScope } from '../models/ApiToken';
import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
      name?: string;
    };
    authType?: 'session' | 'api_token';
    apiToken?: {
      id: string;
      scopes: ApiTokenScope[];
    };
  }
}
