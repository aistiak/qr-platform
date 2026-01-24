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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request);

  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    await connectDB();

    const qrCode = await QRCode.findOne({
      _id: params.id,
      userId: auth.user.id,
      status: { $ne: 'deleted' },
    });

    if (!qrCode) {
      return notFoundResponse('QR code not found');
    }

    if (qrCode.status === 'paused') {
      return successResponse({ message: 'QR code is already paused' });
    }

    if (qrCode.status !== 'active') {
      return errorResponse('Can only pause active QR codes', 400);
    }

    qrCode.status = 'paused';
    await qrCode.save();

    return successResponse({ message: 'QR code paused successfully' });
  } catch (error) {
    console.error('Pause QR code error:', error);
    return errorResponse('Failed to pause QR code', 500);
  }
}
