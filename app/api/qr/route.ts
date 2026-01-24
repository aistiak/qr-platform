import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/utils/auth-middleware';
import {
  unauthorizedResponse,
  errorResponse,
  successResponse,
  createdResponse,
} from '@/lib/utils/api-response';
import { connectDB } from '@/lib/db/mongodb';
import QRCode from '@/lib/models/QRCode';
import User from '@/lib/models/User';
import { z } from 'zod';
import { validateURL } from '@/lib/qr/validator';

const createQRCodeSchema = z.object({
  customName: z.string().max(100).optional(),
  targetType: z.enum(['url', 'image']),
  targetUrl: z.string().url().optional(),
  hostedImageId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);

  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';

    const query: any = {
      userId: auth.user.id,
      status: { $ne: 'deleted' },
    };

    if (status !== 'all') {
      query.status = status;
    }

    const qrCodes = await QRCode.find(query)
      .sort({ createdAt: -1 })
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
      })),
      total: qrCodes.length,
    });
  } catch (error) {
    console.error('Get QR codes error:', error);
    return errorResponse('Failed to fetch QR codes', 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);

  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    await connectDB();

    // Check QR code limit
    const user = await User.findById(auth.user.id);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    const activeQRCount = await QRCode.countDocuments({
      userId: auth.user.id,
      status: { $ne: 'deleted' },
    });

    if (activeQRCount >= user.qrCodeLimit) {
      return errorResponse(
        `QR code limit reached (${user.qrCodeLimit}). Please delete or archive existing QR codes.`,
        403
      );
    }

    const body = await request.json();
    const validationResult = createQRCodeSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        validationResult.error.errors.map((e) => e.message).join(', '),
        400
      );
    }

    const { customName, targetType, targetUrl, hostedImageId } = validationResult.data;

    // Validate based on target type
    if (targetType === 'url' && !targetUrl) {
      return errorResponse('targetUrl is required when targetType is "url"', 400);
    }

    if (targetType === 'url' && targetUrl) {
      const urlValidation = validateURL(targetUrl);
      if (!urlValidation.valid) {
        return errorResponse(urlValidation.error || 'Invalid URL', 400);
      }
    }

    if (targetType === 'image' && !hostedImageId) {
      return errorResponse('hostedImageId is required when targetType is "image"', 400);
    }

    // Create QR code
    const qrCode = await QRCode.create({
      userId: auth.user.id,
      customName: customName || 'Untitled QR Code',
      targetType,
      targetUrl: targetType === 'url' ? targetUrl : undefined,
      hostedImageId: targetType === 'image' ? hostedImageId : undefined,
      status: 'active',
      accessCount: 0,
    });

    const populatedQR = await QRCode.findById(qrCode._id)
      .populate('hostedImageId', 'filename filePath')
      .lean();

    return createdResponse({
      id: populatedQR!._id.toString(),
      customName: populatedQR!.customName,
      targetType: populatedQR!.targetType,
      targetUrl: populatedQR!.targetUrl,
      hostedImageId: populatedQR!.hostedImageId
        ? {
            id: (populatedQR!.hostedImageId as any)._id.toString(),
            filePath: (populatedQR!.hostedImageId as any).filePath,
          }
        : null,
      status: populatedQR!.status,
      accessCount: populatedQR!.accessCount || 0,
      createdAt: populatedQR!.createdAt,
      updatedAt: populatedQR!.updatedAt,
    });
  } catch (error) {
    console.error('Create QR code error:', error);
    return errorResponse('Failed to create QR code', 500);
  }
}
