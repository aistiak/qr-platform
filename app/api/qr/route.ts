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
import HostedImage from '@/lib/models/HostedImage'; // Import to register the model
import { getTotalAccessCount } from '@/lib/utils/analytics';

// Ensure HostedImage model is registered by referencing it
// This ensures the import executes and registers the model with Mongoose
if (typeof HostedImage !== 'undefined') {
  // Model is registered via import side-effect
}
import User from '@/lib/models/User';
import { logger } from '@/lib/utils/logger';
import mongoose from 'mongoose';
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
    
    // Ensure HostedImage model is registered
    // In Next.js, sometimes models need to be explicitly registered before use
    // The import at the top should register it, but we verify and force registration if needed
    if (!mongoose.models.HostedImage) {
      logger.warn('HostedImage model not found, attempting dynamic import');
      // Force import to ensure model is registered
      const HostedImageModule = await import('@/lib/models/HostedImage');
      // Access the default export to ensure module executes
      void HostedImageModule.default;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';

    // Convert userId string to ObjectId
    let userIdObjectId: mongoose.Types.ObjectId;
    try {
      userIdObjectId = new mongoose.Types.ObjectId(auth.user.id);
    } catch (error) {
      logger.error('Invalid user ID format', error, { userId: auth.user.id });
      return errorResponse('Invalid user ID', 400);
    }

    const query: any = {
      userId: userIdObjectId,
    };

    // Always exclude deleted items, and filter by status if not 'all'
    if (status === 'all') {
      query.status = { $ne: 'deleted' };
    } else {
      // Filter by specific status (which implicitly excludes deleted since deleted is not active/paused/archived)
      query.status = status;
    }

    const qrCodes = await QRCode.find(query)
      .sort({ createdAt: -1 })
      .populate('hostedImageId', 'filename filePath')
      .lean();

    // Compute access counts for all QR codes
    const qrCodesWithAccessCount = await Promise.all(
      qrCodes.map(async (qr) => {
        try {
          const accessCount = await getTotalAccessCount(qr._id.toString());
          return {
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
            accessCount,
            createdAt: qr.createdAt,
            updatedAt: qr.updatedAt,
          };
        } catch (err) {
          // If access count fails, default to 0 and log warning
          logger.warn('Failed to get access count for QR code', { 
            qrCodeId: qr._id.toString(), 
            error: err 
          });
          return {
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
            accessCount: 0,
            createdAt: qr.createdAt,
            updatedAt: qr.updatedAt,
          };
        }
      })
    );

    return successResponse({
      qrCodes: qrCodesWithAccessCount,
      total: qrCodesWithAccessCount.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('Get QR codes error', error, { 
      userId: auth?.user?.id || 'unknown',
      errorMessage,
      errorStack 
    });
    console.error('Detailed error:', error);
    return errorResponse(`Failed to fetch QR codes: ${errorMessage}`, 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);

  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    await connectDB();

    // Convert userId string to ObjectId
    let userIdObjectId: mongoose.Types.ObjectId;
    try {
      userIdObjectId = new mongoose.Types.ObjectId(auth.user.id);
    } catch (error) {
      logger.error('Invalid user ID format in POST', error, { userId: auth.user.id });
      return errorResponse('Invalid user ID', 400);
    }

    // Check QR code limit
    const user = await User.findById(userIdObjectId);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    const activeQRCount = await QRCode.countDocuments({
      userId: userIdObjectId,
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
      userId: userIdObjectId,
      customName: customName || 'Untitled QR Code',
      targetType,
      targetUrl: targetType === 'url' ? targetUrl : undefined,
      hostedImageId: targetType === 'image' ? (hostedImageId ? new mongoose.Types.ObjectId(hostedImageId) : undefined) : undefined,
      status: 'active',
      accessCount: 0,
    });

    const populatedQR = await QRCode.findById(qrCode._id)
      .populate('hostedImageId', 'filename filePath')
      .lean();

    logger.qrCode('QR code created', {
      qrCodeId: populatedQR!._id.toString(),
      userId: auth.user.id,
      targetType: populatedQR!.targetType,
    });

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
    logger.error('Create QR code error', error, { userId: auth.user.id });
    return errorResponse('Failed to create QR code', 500);
  }
}
