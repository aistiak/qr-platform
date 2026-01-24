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
import { z } from 'zod';

const updateQRCodeSchema = z.object({
  customName: z.string().max(100).optional(),
  status: z.enum(['active', 'paused', 'archived']).optional(),
});

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

    const qrCode = await QRCode.findOne({
      _id: params.id,
      userId: auth.user.id,
      status: { $ne: 'deleted' },
    })
      .populate('hostedImageId', 'filename filePath')
      .lean();

    if (!qrCode) {
      return notFoundResponse('QR code not found');
    }

    return successResponse({
      id: qrCode._id.toString(),
      customName: qrCode.customName,
      targetType: qrCode.targetType,
      targetUrl: qrCode.targetUrl,
      hostedImageId: qrCode.hostedImageId
        ? {
            id: (qrCode.hostedImageId as any)._id.toString(),
            filePath: (qrCode.hostedImageId as any).filePath,
          }
        : null,
      status: qrCode.status,
      accessCount: qrCode.accessCount || 0,
      createdAt: qrCode.createdAt,
      updatedAt: qrCode.updatedAt,
    });
  } catch (error) {
    console.error('Get QR code error:', error);
    return errorResponse('Failed to fetch QR code', 500);
  }
}

export async function PATCH(
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

    const body = await request.json();
    const validationResult = updateQRCodeSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        validationResult.error.errors.map((e) => e.message).join(', '),
        400
      );
    }

    const { customName, status } = validationResult.data;

    if (customName !== undefined) {
      qrCode.customName = customName;
    }

    if (status !== undefined) {
      // Validate status transitions
      const validTransitions: Record<string, string[]> = {
        active: ['paused', 'archived'],
        paused: ['active'],
        archived: ['active'],
      };

      if (!validTransitions[qrCode.status]?.includes(status)) {
        return errorResponse(
          `Cannot transition from ${qrCode.status} to ${status}`,
          400
        );
      }

      qrCode.status = status;
    }

    await qrCode.save();

    const updatedQR = await QRCode.findById(qrCode._id)
      .populate('hostedImageId', 'filename filePath')
      .lean();

    return successResponse({
      id: updatedQR!._id.toString(),
      customName: updatedQR!.customName,
      targetType: updatedQR!.targetType,
      targetUrl: updatedQR!.targetUrl,
      hostedImageId: updatedQR!.hostedImageId
        ? {
            id: (updatedQR!.hostedImageId as any)._id.toString(),
            filePath: (updatedQR!.hostedImageId as any).filePath,
          }
        : null,
      status: updatedQR!.status,
      accessCount: updatedQR!.accessCount || 0,
      createdAt: updatedQR!.createdAt,
      updatedAt: updatedQR!.updatedAt,
    });
  } catch (error) {
    console.error('Update QR code error:', error);
    return errorResponse('Failed to update QR code', 500);
  }
}

export async function DELETE(
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

    // Soft delete by setting status to deleted
    qrCode.status = 'deleted';
    await qrCode.save();

    return successResponse({ message: 'QR code deleted successfully' });
  } catch (error) {
    console.error('Delete QR code error:', error);
    return errorResponse('Failed to delete QR code', 500);
  }
}
