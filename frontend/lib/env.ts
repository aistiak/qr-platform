import { z } from 'zod';

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

const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    SESSION_SECRET: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    NEXTAUTH_SECRET: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    BACKEND_INTERNAL_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
    NEXTAUTH_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
    APP_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
    ENABLE_LOGGING: z.enum(['true', 'false']).optional(),
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
  });

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_BACKEND_URL: z.string().url(),
  NEXT_PUBLIC_UMAMI_HOST: z.preprocess(emptyToUndefined, z.string().url().optional()),
  NEXT_PUBLIC_UMAMI_WEBSITE_ID: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
  NEXT_PUBLIC_BUGSINK_DSN: z.preprocess(emptyToUndefined, z.string().url().optional()),
});

function formatValidationErrors(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'environment';
      return `  - ${path}: ${issue.message}`;
    })
    .join('\n');
}

function shouldSkipValidation(): boolean {
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    return true;
  }

  // Next.js build phase may not have runtime env available yet.
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return true;
  }

  return false;
}

function parseEnv() {
  if (shouldSkipValidation()) {
    return {
      NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') ?? 'development',
      sessionSecret:
        process.env.SESSION_SECRET ??
        process.env.NEXTAUTH_SECRET ??
        'change-this-secret',
      BACKEND_INTERNAL_URL: process.env.BACKEND_INTERNAL_URL,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      APP_URL: process.env.APP_URL,
      NEXT_PUBLIC_APP_URL:
        process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      NEXT_PUBLIC_BACKEND_URL:
        process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000',
      NEXT_PUBLIC_UMAMI_HOST: process.env.NEXT_PUBLIC_UMAMI_HOST,
      NEXT_PUBLIC_UMAMI_WEBSITE_ID: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
      NEXT_PUBLIC_BUGSINK_DSN: process.env.NEXT_PUBLIC_BUGSINK_DSN,
      isProduction: process.env.NODE_ENV === 'production',
      isDevelopment: process.env.NODE_ENV === 'development',
      loggingEnabled:
        process.env.ENABLE_LOGGING === 'true' ||
        process.env.NODE_ENV !== 'production',
    };
  }

  const serverResult = serverEnvSchema.safeParse(process.env);
  if (!serverResult.success) {
    console.error(
      'Invalid frontend server environment variables:\n' +
        formatValidationErrors(serverResult.error),
    );
    throw new Error('Invalid frontend server environment variables');
  }

  const clientResult = clientEnvSchema.safeParse(process.env);
  if (!clientResult.success) {
    console.error(
      'Invalid frontend client environment variables:\n' +
        formatValidationErrors(clientResult.error),
    );
    throw new Error('Invalid frontend client environment variables');
  }

  const serverData = serverResult.data;
  const clientData = clientResult.data;

  return {
    ...serverData,
    ...clientData,
    sessionSecret: serverData.SESSION_SECRET ?? serverData.NEXTAUTH_SECRET!,
    isProduction: serverData.NODE_ENV === 'production',
    isDevelopment: serverData.NODE_ENV === 'development',
    loggingEnabled:
      serverData.ENABLE_LOGGING === 'true' || serverData.NODE_ENV !== 'production',
  };
}

export type Env = ReturnType<typeof parseEnv>;

export const env = parseEnv();
