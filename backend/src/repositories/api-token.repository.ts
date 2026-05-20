import mongoose from 'mongoose';
import ApiToken, { ApiTokenScope } from '../models/ApiToken';

type CreateApiTokenInput = {
  userId: string;
  name: string;
  tokenPrefix: string;
  tokenHash: string;
  scopes: ApiTokenScope[];
  expiresAt?: Date;
};

export class ApiTokenRepository {
  async create(input: CreateApiTokenInput) {
    return ApiToken.create({
      userId: new mongoose.Types.ObjectId(input.userId),
      name: input.name,
      tokenPrefix: input.tokenPrefix,
      tokenHash: input.tokenHash,
      scopes: input.scopes,
      expiresAt: input.expiresAt,
    });
  }

  async listByUser(userId: string) {
    return ApiToken.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  async findByIdForUser(id: string, userId: string) {
    return ApiToken.findOne({ _id: id, userId: new mongoose.Types.ObjectId(userId) }).lean();
  }

  async findByHash(tokenHash: string) {
    return ApiToken.findOne({ tokenHash }).lean();
  }

  async updateLastUsedAt(id: string, lastUsedAt: Date) {
    return ApiToken.updateOne({ _id: id }, { $set: { lastUsedAt } });
  }

  async deleteByIdForUser(id: string, userId: string) {
    return ApiToken.deleteOne({ _id: id, userId: new mongoose.Types.ObjectId(userId) });
  }
}
