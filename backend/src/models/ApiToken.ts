import mongoose, { Model, Schema } from 'mongoose';

export const API_TOKEN_SCOPES = ['qr:create', 'qr:read', 'qr:list', 'qr:delete'] as const;
export type ApiTokenScope = (typeof API_TOKEN_SCOPES)[number];

export interface IApiToken {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  tokenPrefix: string;
  tokenHash: string;
  scopes: ApiTokenScope[];
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const ApiTokenSchema = new Schema<IApiToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    tokenPrefix: { type: String, required: true, minlength: 8, maxlength: 16 },
    tokenHash: { type: String, required: true, unique: true },
    scopes: [{ type: String, enum: API_TOKEN_SCOPES, required: true }],
    lastUsedAt: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

ApiTokenSchema.index({ userId: 1, createdAt: -1 });
ApiTokenSchema.index({ tokenPrefix: 1 });
ApiTokenSchema.index({ expiresAt: 1 });

const ApiToken: Model<IApiToken> =
  mongoose.models.ApiToken || mongoose.model<IApiToken>('ApiToken', ApiTokenSchema);

export default ApiToken;
