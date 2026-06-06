import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const PLACEHOLDER_SECRETS = [
  'change-this-in-production',
  'change-this-secret',
  'change-this-secret-in-production-use-openssl-rand-base64-32',
];

function emptyToUndefined(value: unknown): unknown {
  if (value === '' || value === undefined || value === null) {
    return undefined;
  }
  return value;
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    FRONTEND_URL: z.string().url().default('http://localhost:3000'),
    SESSION_SECRET: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    NEXTAUTH_SECRET: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    GOOGLE_CLIENT_ID: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    GOOGLE_CLIENT_SECRET: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    GOOGLE_CALLBACK_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
    APP_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
    PUBLIC_APP_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
    IMAGE_UPLOAD_DIR: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    ENABLE_LOGGING: z.enum(['true', 'false']).optional(),
    MCP_ENABLED: z.enum(['true', 'false']).optional(),
    MCP_ONLY: z.enum(['true', 'false']).optional(),
    MCP_HTTP_ENABLED: z.enum(['true', 'false']).optional(),
    MCP_STDIO_ENABLED: z.enum(['true', 'false']).optional(),
    MCP_HTTP_PATH: z.preprocess(emptyToUndefined, z.string().startsWith('/').optional()),
    MCP_API_TOKEN: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  })
  .superRefine((data, ctx) => {
    const sessionSecret = data.SESSION_SECRET ?? data.NEXTAUTH_SECRET;

    if (!sessionSecret) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'SESSION_SECRET (or NEXTAUTH_SECRET) is required',
        path: ['SESSION_SECRET'],
      });
      return;
    }

    if (data.NODE_ENV === 'production') {
      const isPlaceholder = PLACEHOLDER_SECRETS.some((placeholder) =>
        sessionSecret.includes(placeholder),
      );
      if (isPlaceholder) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'SESSION_SECRET must be set to a secure value in production',
          path: ['SESSION_SECRET'],
        });
      }
    }

    const hasGoogleId = Boolean(data.GOOGLE_CLIENT_ID);
    const hasGoogleSecret = Boolean(data.GOOGLE_CLIENT_SECRET);
    if (hasGoogleId !== hasGoogleSecret) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must both be set or both omitted',
        path: ['GOOGLE_CLIENT_ID'],
      });
    }
  });

function formatValidationErrors(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'environment';
      return `  - ${path}: ${issue.message}`;
    })
    .join('\n');
}

function parseEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid backend environment variables:\n' + formatValidationErrors(result.error));
    throw new Error('Invalid backend environment variables');
  }

  const data = result.data;
  const sessionSecret = data.SESSION_SECRET ?? data.NEXTAUTH_SECRET!;

  return {
    ...data,
    sessionSecret,
    isProduction: data.NODE_ENV === 'production',
    isDevelopment: data.NODE_ENV === 'development',
    isTest: data.NODE_ENV === 'test',
    loggingEnabled: data.ENABLE_LOGGING === 'true' || data.NODE_ENV !== 'production',
    mcpEnabled: data.MCP_ENABLED === 'true' || data.MCP_ONLY === 'true',
    mcpHttpEnabled:
      (data.MCP_ENABLED === 'true' || data.MCP_ONLY === 'true') &&
      data.MCP_HTTP_ENABLED !== 'false',
    mcpStdioEnabled:
      (data.MCP_ENABLED === 'true' || data.MCP_ONLY === 'true') &&
      data.MCP_STDIO_ENABLED === 'true',
    mcpHttpPath: data.MCP_HTTP_PATH ?? '/mcp',
    googleOAuthEnabled: Boolean(data.GOOGLE_CLIENT_ID && data.GOOGLE_CLIENT_SECRET),
  };
}

export type Env = ReturnType<typeof parseEnv>;

export const env = parseEnv();
