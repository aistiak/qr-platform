import { NextRequest } from 'next/server';
import { requireAdmin, adminForbiddenResponse } from '@/lib/utils/admin-middleware';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);

  if (!auth) {
    return adminForbiddenResponse();
  }

  try {
    await connectDB();

    const users = await User.find({})
      .select('name email role qrCodeLimit createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean();

    return successResponse({
      users: users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        qrCodeLimit: user.qrCodeLimit,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      total: users.length,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return errorResponse('Failed to fetch users', 500);
  }
}
