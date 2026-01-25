import { NextRequest } from 'next/server';
import { requireAdmin, adminForbiddenResponse } from '@/lib/utils/admin-middleware';
import {
  errorResponse,
  successResponse,
  notFoundResponse,
} from '@/lib/utils/api-response';
import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

// Disable static generation - this route requires runtime execution
export const dynamic = 'force-dynamic';

const updateUserSchema = z.object({
  qrCodeLimit: z.number().int().min(1, 'QR code limit must be at least 1'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request);

  if (!auth) {
    return adminForbiddenResponse();
  }

  try {
    await connectDB();

    const user = await User.findById(params.id);

    if (!user) {
      return notFoundResponse('User not found');
    }

    const body = await request.json();
    const validationResult = updateUserSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        validationResult.error.errors.map((e) => e.message).join(', '),
        400
      );
    }

    const { qrCodeLimit } = validationResult.data;

    user.qrCodeLimit = qrCodeLimit;
    await user.save();

    logger.admin('User QR code limit updated', {
      adminUserId: auth.user.id,
      targetUserId: user._id.toString(),
      newLimit: qrCodeLimit,
    });

    return successResponse({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      qrCodeLimit: user.qrCodeLimit,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    logger.error('Update user error', error, {
      adminUserId: auth.user.id,
      targetUserId: params.id,
    });
    return errorResponse('Failed to update user', 500);
  }
}
