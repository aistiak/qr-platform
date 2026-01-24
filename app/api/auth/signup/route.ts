import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { signUpSchema } from '@/lib/utils/validation';
import { createdResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validationResult = signUpSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        validationResult.error.errors.map((e) => e.message).join(', '),
        400
      );
    }

    const { name, email, password } = validationResult.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse('Email already exists', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'user',
      qrCodeLimit: 20,
    });

    // Return user data (without password hash)
    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      qrCodeLimit: user.qrCodeLimit,
    };

    logger.auth('User signed up successfully', { userId: user._id.toString(), email: user.email });

    return createdResponse({
      user: userResponse,
      message: 'User created successfully',
    });
  } catch (error) {
    logger.error('Sign up error', error);
    return errorResponse('Internal server error', 500);
  }
}
