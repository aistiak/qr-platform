import bcrypt from 'bcryptjs';
import { connectDB } from '../db/mongodb';
import { HttpError } from '../core/http-error';
import { UserRepository } from '../repositories/user.repository';
import { signInSchema, signUpSchema } from '../utils/validation';

const userRepository = new UserRepository();

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

    const isValidPassword = await bcrypt.compare(validation.data.password, user.passwordHash);
    if (!isValidPassword) {
      throw new HttpError(401, 'Invalid email or password');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    };
  }
}
