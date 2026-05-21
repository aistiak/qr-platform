import mongoose, { Model, Schema } from 'mongoose';

export type AuthProvider = 'credentials' | 'google';

export interface IUser {
  _id?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string;
  authProvider: AuthProvider;
  googleId?: string;
  image?: string;
  role: 'user' | 'admin';
  qrCodeLimit: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, minlength: 1, maxlength: 100, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: { type: String },
    authProvider: { type: String, enum: ['credentials', 'google'], default: 'credentials' },
    googleId: { type: String },
    image: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    qrCodeLimit: { type: Number, default: 20, min: 1 },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ googleId: 1 }, { unique: true, sparse: true });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
