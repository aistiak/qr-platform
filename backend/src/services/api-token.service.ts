import crypto from 'crypto';
import mongoose from 'mongoose';
import { z } from 'zod';
import { connectDB } from '../db/mongodb';
import { HttpError } from '../core/http-error';
import { API_TOKEN_SCOPES, ApiTokenScope } from '../models/ApiToken';
import { ApiTokenRepository } from '../repositories/api-token.repository';
import { UserRepository } from '../repositories/user.repository';

const apiTokenRepository = new ApiTokenRepository();
const userRepository = new UserRepository();

const createApiTokenSchema = z.object({
  name: z.string().min(1, 'name is required').max(100, 'name must not exceed 100 characters'),
  scopes: z.array(z.enum(API_TOKEN_SCOPES)).min(1, 'at least one scope is required'),
  expiresAt: z.string().datetime().optional(),
});

function hashToken(rawToken: string) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function createRawToken() {
  const prefix = crypto.randomBytes(4).toString('hex');
  const secret = crypto.randomBytes(24).toString('hex');
  return {
    prefix,
    rawToken: `qpt_${prefix}.${secret}`,
  };
}

function mapApiToken(token: any) {
  return {
    id: token._id.toString(),
    name: token.name,
    tokenPrefix: token.tokenPrefix,
    scopes: token.scopes,
    lastUsedAt: token.lastUsedAt || null,
    expiresAt: token.expiresAt || null,
    createdAt: token.createdAt,
    updatedAt: token.updatedAt,
  };
}

export class ApiTokenService {
  async create(userId: string, payload: unknown) {
    const validation = createApiTokenSchema.safeParse(payload);
    if (!validation.success) {
      throw new HttpError(400, validation.error.errors.map((error) => error.message).join(', '));
    }

    await connectDB();
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    const { prefix, rawToken } = createRawToken();
    const expiresAt = validation.data.expiresAt ? new Date(validation.data.expiresAt) : undefined;

    const created = await apiTokenRepository.create({
      userId,
      name: validation.data.name,
      tokenPrefix: prefix,
      tokenHash: hashToken(rawToken),
      scopes: validation.data.scopes,
      expiresAt,
    });

    return {
      token: rawToken,
      apiToken: mapApiToken(created),
    };
  }

  async list(userId: string) {
    await connectDB();
    const tokens = await apiTokenRepository.listByUser(userId);
    return {
      apiTokens: tokens.map(mapApiToken),
      total: tokens.length,
      availableScopes: API_TOKEN_SCOPES,
    };
  }

  async details(userId: string, tokenId: string) {
    if (!mongoose.Types.ObjectId.isValid(tokenId)) {
      throw new HttpError(404, 'API token not found');
    }

    await connectDB();
    const token = await apiTokenRepository.findByIdForUser(tokenId, userId);
    if (!token) {
      throw new HttpError(404, 'API token not found');
    }

    return mapApiToken(token);
  }

  async remove(userId: string, tokenId: string) {
    if (!mongoose.Types.ObjectId.isValid(tokenId)) {
      throw new HttpError(404, 'API token not found');
    }

    await connectDB();
    const result = await apiTokenRepository.deleteByIdForUser(tokenId, userId);
    if (!result.deletedCount) {
      throw new HttpError(404, 'API token not found');
    }

    return { message: 'API token deleted successfully' };
  }

  async authenticate(rawToken: string): Promise<{
    userId: string;
    tokenId: string;
    scopes: ApiTokenScope[];
  } | null> {
    await connectDB();
    const tokenHash = hashToken(rawToken);
    const token = await apiTokenRepository.findByHash(tokenHash);
    if (!token) {
      return null;
    }

    if (token.expiresAt && new Date(token.expiresAt).getTime() <= Date.now()) {
      return null;
    }

    await apiTokenRepository.updateLastUsedAt(token._id.toString(), new Date());

    return {
      userId: token.userId.toString(),
      tokenId: token._id.toString(),
      scopes: token.scopes,
    };
  }
}
