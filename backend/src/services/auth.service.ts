import bcrypt from 'bcryptjs';
import { connectDB } from '../db/mongodb';
import { HttpError } from '../core/http-error';
import { UserRepository } from '../repositories/user.repository';
import { signInSchema, signUpSchema } from '../utils/validation';
import type { IUser } from '../models/User';

const userRepository = new UserRepository();

function toSessionUser(user: IUser) {
  return {
    id: user._id!.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
  };
}

export type GoogleProfile = {
  googleId: string;
  email: string;
  name: string;
  image?: string;
};

export class AuthService {
  async signUp(payload: unknown) {
    const validation = signUpSchema.safeParse(payload);
    if (!validation.success) {
      throw new HttpError(400, validation.error.errors.map((error) => error.message).join(', '));
    }

    await connectDB();
    const existingUser = await userRepository.findByEmail(validation.data.email);
    if (existingUser) {
      throw new HttpError(409, 'Email already exists');
    }

    const passwordHash = await bcrypt.hash(validation.data.password, 10);
    const user = await userRepository.createUser({
      name: validation.data.name,
      email: validation.data.email,
      passwordHash,
      authProvider: 'credentials',
      role: 'user',
      qrCodeLimit: 20,
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        qrCodeLimit: user.qrCodeLimit,
      },
      message: 'User created successfully',
    };
  }

  async signIn(payload: unknown) {
    const validation = signInSchema.safeParse(payload);
    if (!validation.success) {
      throw new HttpError(400, validation.error.errors.map((error) => error.message).join(', '));
    }

    await connectDB();
    const user = await userRepository.findByEmail(validation.data.email);
    if (!user) {
      throw new HttpError(401, 'Invalid email or password');
    }

    if (!user.passwordHash) {
      throw new HttpError(401, 'Please sign in with Google');
    }

    const isValidPassword = await bcrypt.compare(validation.data.password, user.passwordHash);
    if (!isValidPassword) {
      throw new HttpError(401, 'Invalid email or password');
    }

    return toSessionUser(user);
  }

  async signInWithGoogle(profile: GoogleProfile) {
    await connectDB();

    let user = await userRepository.findByGoogleId(profile.googleId);
    if (user) {
      return toSessionUser(user);
    }

    user = await userRepository.findByEmail(profile.email);
    if (user) {
      const linkedUser = await userRepository.linkGoogleAccount(user._id!.toString(), {
        googleId: profile.googleId,
        image: profile.image,
      });
      if (!linkedUser) {
        throw new HttpError(500, 'Failed to link Google account');
      }
      return toSessionUser(linkedUser);
    }

    const newUser = await userRepository.createUser({
      name: profile.name,
      email: profile.email,
      authProvider: 'google',
      googleId: profile.googleId,
      image: profile.image,
      role: 'user',
      qrCodeLimit: 20,
    });

    return toSessionUser(newUser);
  }
}
