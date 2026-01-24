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

    if (qrCode.status === 'archived') {
      return successResponse({ message: 'QR code is already archived' });
    }

    if (qrCode.status !== 'active') {
      return errorResponse('Can only archive active QR codes', 400);
    }

    qrCode.status = 'archived';
    await qrCode.save();

    return successResponse({ message: 'QR code archived successfully' });
  } catch (error) {
    console.error('Archive QR code error:', error);
    return errorResponse('Failed to archive QR code', 500);
  }
}
