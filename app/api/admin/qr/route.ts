import { NextRequest } from 'next/server';
import { requireAdmin, adminForbiddenResponse } from '@/lib/utils/admin-middleware';
import { unauthorizedResponse, errorResponse, successResponse } from '@/lib/utils/api-response';
import { connectDB } from '@/lib/db/mongodb';
import QRCode from '@/lib/models/QRCode';
import HostedImage from '@/lib/models/HostedImage'; // Import to register the model

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);

  if (!auth) {
    return adminForbiddenResponse();
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    const query: any = {
      status: { $ne: 'deleted' },
    };

    if (status !== 'all') {
      query.status = status;
    }

    const qrCodes = await QRCode.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('hostedImageId', 'filename filePath')
      .lean();

    return successResponse({
      qrCodes: qrCodes.map((qr) => ({
        id: qr._id.toString(),
        customName: qr.customName,
        targetType: qr.targetType,
        targetUrl: qr.targetUrl,
        hostedImageId: qr.hostedImageId
          ? {
              id: (qr.hostedImageId as any)._id.toString(),
              filePath: (qr.hostedImageId as any).filePath,
            }
          : null,
        status: qr.status,
        accessCount: qr.accessCount || 0,
        createdAt: qr.createdAt,
        updatedAt: qr.updatedAt,
        user: qr.userId
          ? {
              id: (qr.userId as any)._id.toString(),
              name: (qr.userId as any).name,
              email: (qr.userId as any).email,
            }
          : null,
      })),
      total: qrCodes.length,
    });
  } catch (error) {
    console.error('Get admin QR codes error:', error);
    return errorResponse('Failed to fetch QR codes', 500);
  }
}
