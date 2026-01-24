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
import HostedImage from '@/lib/models/HostedImage';
import { getTotalAccessCount } from '@/lib/utils/analytics';
import { updateQRCodeSchema } from '@/lib/utils/validation';
import { validateURL } from '@/lib/qr/validator';
import { promises as fs } from 'fs';
import path from 'path';

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

    // Compute access count from QRCodeAccess collection
    const accessCount = await getTotalAccessCount(params.id);

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
      accessCount,
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

    const { customName, status, targetType, targetUrl, hostedImageId } = validationResult.data;

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

    // Handle target type and target updates
    let targetChanged = false;
    const oldHostedImageId = qrCode.hostedImageId;

    if (targetType !== undefined) {
      qrCode.targetType = targetType;
      targetChanged = true;

      if (targetType === 'url') {
        // Switching to URL - clear hosted image
        qrCode.hostedImageId = undefined;
        if (targetUrl) {
          // Validate URL
          const urlValidation = validateURL(targetUrl);
          if (!urlValidation.valid) {
            return errorResponse(urlValidation.error || 'Invalid URL', 400);
          }
          qrCode.targetUrl = targetUrl;
        }
      } else if (targetType === 'image') {
        // Switching to image - clear target URL
        qrCode.targetUrl = undefined;
        if (hostedImageId) {
          // Validate hosted image exists and belongs to user
          const hostedImage = await HostedImage.findOne({
            _id: hostedImageId,
            userId: auth.user.id,
          });
          if (!hostedImage) {
            return errorResponse('Hosted image not found or access denied', 404);
          }
          qrCode.hostedImageId = hostedImage._id;
        }
      }
    } else {
      // Updating target without changing type
      if (targetUrl !== undefined && qrCode.targetType === 'url') {
        const urlValidation = validateURL(targetUrl);
        if (!urlValidation.valid) {
          return errorResponse(urlValidation.error || 'Invalid URL', 400);
        }
        qrCode.targetUrl = targetUrl;
        targetChanged = true;
      }

      if (hostedImageId !== undefined && qrCode.targetType === 'image') {
        // Validate hosted image exists and belongs to user
        const hostedImage = await HostedImage.findOne({
          _id: hostedImageId,
          userId: auth.user.id,
        });
        if (!hostedImage) {
          return errorResponse('Hosted image not found or access denied', 404);
        }
        qrCode.hostedImageId = hostedImage._id;
        targetChanged = true;
      }
    }

    await qrCode.save();

    // Cleanup old hosted image if switching from image to URL
    if (targetChanged && oldHostedImageId && qrCode.targetType === 'url') {
      try {
        const oldImage = await HostedImage.findById(oldHostedImageId);
        if (oldImage) {
          // Check if image is used by other QR codes
          const otherQRCodes = await QRCode.countDocuments({
            hostedImageId: oldHostedImageId,
            _id: { $ne: qrCode._id },
          });

          // Only delete if not used by other QR codes
          if (otherQRCodes === 0) {
            const filePath = path.join(
              process.cwd(),
              'public',
              oldImage.filePath.startsWith('/') ? oldImage.filePath.slice(1) : oldImage.filePath
            );
            try {
              await fs.unlink(filePath);
            } catch (fileError) {
              console.error('Failed to delete old image file:', fileError);
            }
            await HostedImage.findByIdAndDelete(oldHostedImageId);
          }
        }
      } catch (cleanupError) {
        console.error('Failed to cleanup old hosted image:', cleanupError);
        // Don't fail the update if cleanup fails
      }
    }

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
