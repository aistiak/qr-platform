import type { Response } from 'express';
import { isHttpError } from '../core/http-error';

export function handleControllerError(res: Response, error: unknown, fallbackMessage: string) {
  if (isHttpError(error)) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  if (error instanceof Error && error.message.toLowerCase().includes('enoent')) {
    return res.status(404).json({ error: fallbackMessage });
  }

  return res.status(500).json({ error: fallbackMessage });
}
