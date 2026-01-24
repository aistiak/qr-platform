import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/utils/auth-middleware';
import {
  unauthorizedResponse,
  errorResponse,
  successResponse,
  notFoundResponse,
} from '@/lib/utils/api-response';
import { connectDB } from '@/lib/db/mongodb';
import QRCode from '@/lib/models/QRCode';
import { aggregateQRCodeAccess, getTotalAccessCount, TimePeriod } from '@/lib/utils/analytics';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request);

  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    await connectDB();

    // Verify QR code exists and belongs to user
    const qrCode = await QRCode.findOne({
      _id: params.id,
      userId: auth.user.id,
      status: { $ne: 'deleted' },
    });

    if (!qrCode) {
      return notFoundResponse('QR code not found');
    }

    // Get time period from query parameter (default: day)
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'day') as TimePeriod;

    // Validate period
    if (!['day', 'week', 'month'].includes(period)) {
      return errorResponse('Invalid period. Must be "day", "week", or "month"', 400);
    }

    // Get analytics data
    const analytics = await aggregateQRCodeAccess(params.id, period);
    const total = await getTotalAccessCount(params.id);

    return successResponse({
      ...analytics,
      total,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return errorResponse('Failed to fetch analytics', 500);
  }
}
