import { NextRequest } from 'next/server';
import { signInSchema } from '@/lib/utils/validation';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

// Disable static generation - this route requires runtime execution
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = signInSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        validationResult.error.errors.map((e) => e.message).join(', '),
        400
      );
    }

    const { email, password } = validationResult.data;

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return errorResponse('Invalid email or password', 401);
    }

    // Return success - actual session creation handled by NextAuth on client
    return successResponse({ message: 'Sign in successful' });
  } catch (error) {
    console.error('Sign in error:', error);
    return errorResponse('Internal server error', 500);
  }
}
