import mongoose from 'mongoose';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import { connectDB } from '../db/mongodb';
import { HttpError } from '../core/http-error';
import { HostedImageRepository } from '../repositories/hosted-image.repository';
import { QRRepository } from '../repositories/qr.repository';
import { UserRepository } from '../repositories/user.repository';
import { generateQRCodeBuffer, generateQRCodeSVG } from '../qr/generator';
import { validateURL } from '../qr/validator';
import { aggregateQRCodeAccess, getTotalAccessCount, TimePeriod } from '../utils/analytics';
import { getScanUrl } from '../utils/url';
import { updateQRCodeSchema } from '../utils/validation';

const createQRCodeSchema = z.object({
  customName: z.string().max(100).optional(),
  targetType: z.enum(['url', 'image']),
  targetUrl: z.string().url().optional(),
  hostedImageId: z.string().optional(),
});

const qrRepository = new QRRepository();
const userRepository = new UserRepository();
const hostedImageRepository = new HostedImageRepository();

function mapHostedImage(hostedImage: any) {
  if (!hostedImage) {
    return null;
  }

  return {
    id: hostedImage._id.toString(),
    filePath: hostedImage.filePath,
  };
}

async function mapQRCode(qrCode: any) {
  return {
    id: qrCode._id.toString(),
    customName: qrCode.customName,
    targetType: qrCode.targetType,
    targetUrl: qrCode.targetUrl,
    hostedImageId: mapHostedImage(qrCode.hostedImageId),
    status: qrCode.status,
    accessCount: await getTotalAccessCount(qrCode._id.toString()),
    createdAt: qrCode.createdAt,
    updatedAt: qrCode.updatedAt,
  };
}

function getImageRootDir() {
  return process.env.IMAGE_UPLOAD_DIR || path.join(process.cwd(), 'public', 'images');
}

function getImageAbsolutePath(filePath: string) {
  const normalized = filePath.replace(/^\/+/, '').replace(/^images\//, '');
  return path.join(getImageRootDir(), normalized);
}

export class QRService {
  async listUserQRCodes(userId: string, status: string) {
    await connectDB();
    const qrCodes = await qrRepository.listByUserAndStatus(userId, status);
    const mapped = await Promise.all(qrCodes.map((qrCode) => mapQRCode(qrCode)));

    return {
      qrCodes: mapped,
      total: mapped.length,
    };
  }

  async createQRCode(userId: string, payload: unknown) {
    await connectDB();

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    const activeCount = await qrRepository.countActiveByUser(userId);
    if (activeCount >= user.qrCodeLimit) {
      throw new HttpError(
        403,
        `QR code limit reached (${user.qrCodeLimit}). Please delete or archive existing QR codes.`
      );
    }

    const validation = createQRCodeSchema.safeParse(payload);
    if (!validation.success) {
      throw new HttpError(400, validation.error.errors.map((error) => error.message).join(', '));
    }

    const { customName, targetType, targetUrl, hostedImageId } = validation.data;

    if (targetType === 'url' && !targetUrl) {
      throw new HttpError(400, 'targetUrl is required when targetType is "url"');
    }

    if (targetType === 'image' && !hostedImageId) {
      throw new HttpError(400, 'hostedImageId is required when targetType is "image"');
    }

    if (targetType === 'url' && targetUrl && !validateURL(targetUrl).valid) {
      throw new HttpError(400, 'Invalid URL');
    }

    if (targetType === 'image' && hostedImageId) {
      const hostedImage = await hostedImageRepository.findByIdForUser(hostedImageId, userId);
      if (!hostedImage) {
        throw new HttpError(404, 'Hosted image not found or access denied');
      }
    }

    const qrCode = await qrRepository.createQRCode({
      userId: new mongoose.Types.ObjectId(userId),
      customName: customName || 'Untitled QR Code',
      targetType,
      targetUrl: targetType === 'url' ? targetUrl : undefined,
      hostedImageId: targetType === 'image' && hostedImageId ? new mongoose.Types.ObjectId(hostedImageId) : undefined,
      status: 'active',
      accessCount: 0,
    });

    const populated = await qrRepository.findByIdPopulated(qrCode._id.toString());

    return {
      id: populated!._id.toString(),
      customName: populated!.customName,
      targetType: populated!.targetType,
      targetUrl: populated!.targetUrl,
      hostedImageId: mapHostedImage(populated!.hostedImageId),
      status: populated!.status,
      accessCount: populated!.accessCount || 0,
      createdAt: populated!.createdAt,
      updatedAt: populated!.updatedAt,
    };
  }

  async getQRCodeById(userId: string, qrCodeId: string) {
    if (!mongoose.Types.ObjectId.isValid(qrCodeId)) {
      throw new HttpError(404, 'QR code not found');
    }

    await connectDB();
    const qrCode = await qrRepository.findByIdForUser(qrCodeId, userId);
    if (!qrCode) {
      throw new HttpError(404, 'QR code not found');
    }

    const accessCount = await getTotalAccessCount(qrCodeId);

    return {
      id: qrCode._id.toString(),
      customName: qrCode.customName,
      targetType: qrCode.targetType,
      targetUrl: qrCode.targetUrl,
      hostedImageId: mapHostedImage(qrCode.hostedImageId),
      status: qrCode.status,
      accessCount,
      createdAt: qrCode.createdAt,
      updatedAt: qrCode.updatedAt,
    };
  }

  async updateQRCode(userId: string, qrCodeId: string, payload: unknown) {
    if (!mongoose.Types.ObjectId.isValid(qrCodeId)) {
      throw new HttpError(404, 'QR code not found');
    }

    await connectDB();
    const qrCode = await qrRepository.findDocumentByIdForUser(qrCodeId, userId);
    if (!qrCode) {
      throw new HttpError(404, 'QR code not found');
    }

    const validation = updateQRCodeSchema.safeParse(payload);
    if (!validation.success) {
      throw new HttpError(400, validation.error.errors.map((error) => error.message).join(', '));
    }

    const { customName, status, targetType, targetUrl, hostedImageId } = validation.data;

    if (customName !== undefined) {
      qrCode.customName = customName;
    }

    if (status !== undefined) {
      const validTransitions: Record<string, string[]> = {
        active: ['paused', 'archived'],
        paused: ['active'],
        archived: ['active'],
      };

      if (!validTransitions[qrCode.status]?.includes(status)) {
        throw new HttpError(400, `Cannot transition from ${qrCode.status} to ${status}`);
      }

      qrCode.status = status;
    }

    const oldHostedImageId = qrCode.hostedImageId;
    let targetChanged = false;

    if (targetType !== undefined) {
      targetChanged = true;
      qrCode.targetType = targetType;

      if (targetType === 'url') {
        qrCode.hostedImageId = undefined;
        if (targetUrl) {
          const urlValidation = validateURL(targetUrl);
          if (!urlValidation.valid) {
            throw new HttpError(400, urlValidation.error || 'Invalid URL');
          }
          qrCode.targetUrl = targetUrl;
        }
      } else {
        qrCode.targetUrl = undefined;

        if (hostedImageId) {
          const hostedImage = await hostedImageRepository.findByIdForUser(hostedImageId, userId);
          if (!hostedImage) {
            throw new HttpError(404, 'Hosted image not found or access denied');
          }
          qrCode.hostedImageId = hostedImage._id;
        }
      }
    } else {
      if (targetUrl !== undefined && qrCode.targetType === 'url') {
        const urlValidation = validateURL(targetUrl);
        if (!urlValidation.valid) {
          throw new HttpError(400, urlValidation.error || 'Invalid URL');
        }
        qrCode.targetUrl = targetUrl;
        targetChanged = true;
      }

      if (hostedImageId !== undefined && qrCode.targetType === 'image') {
        const hostedImage = await hostedImageRepository.findByIdForUser(hostedImageId, userId);
        if (!hostedImage) {
          throw new HttpError(404, 'Hosted image not found or access denied');
        }
        qrCode.hostedImageId = hostedImage._id;
        targetChanged = true;
      }
    }

    await qrRepository.save(qrCode);

    if (targetChanged && oldHostedImageId && qrCode.targetType === 'url') {
      const oldImage = await hostedImageRepository.findById(oldHostedImageId.toString());
      if (oldImage) {
        const inUse = await qrRepository.countByHostedImageExcept(oldHostedImageId, qrCode._id);
        if (inUse === 0) {
          try {
            await fs.unlink(getImageAbsolutePath(oldImage.filePath));
          } catch {
            // Ignore file cleanup errors.
          }
          await hostedImageRepository.deleteById(oldHostedImageId.toString());
        }
      }
    }

    const updated = await qrRepository.findByIdPopulated(qrCode._id.toString());

    return {
      id: updated!._id.toString(),
      customName: updated!.customName,
      targetType: updated!.targetType,
      targetUrl: updated!.targetUrl,
      hostedImageId: mapHostedImage(updated!.hostedImageId),
      status: updated!.status,
      accessCount: updated!.accessCount || 0,
      createdAt: updated!.createdAt,
      updatedAt: updated!.updatedAt,
    };
  }

  async deleteQRCode(userId: string, qrCodeId: string) {
    if (!mongoose.Types.ObjectId.isValid(qrCodeId)) {
      throw new HttpError(404, 'QR code not found');
    }

    await connectDB();
    const qrCode = await qrRepository.findDocumentByIdForUser(qrCodeId, userId);
    if (!qrCode) {
      throw new HttpError(404, 'QR code not found');
    }

    qrCode.status = 'deleted';
    await qrRepository.save(qrCode);

    return { message: 'QR code deleted successfully' };
  }

  async pauseQRCode(userId: string, qrCodeId: string) {
    if (!mongoose.Types.ObjectId.isValid(qrCodeId)) {
      throw new HttpError(404, 'QR code not found');
    }

    await connectDB();
    const qrCode = await qrRepository.findDocumentByIdForUser(qrCodeId, userId);
    if (!qrCode) {
      throw new HttpError(404, 'QR code not found');
    }

    if (qrCode.status === 'paused') {
      return { message: 'QR code is already paused' };
    }

    if (qrCode.status !== 'active') {
      throw new HttpError(400, 'Can only pause active QR codes');
    }

    qrCode.status = 'paused';
    await qrRepository.save(qrCode);

    return { message: 'QR code paused successfully' };
  }

  async archiveQRCode(userId: string, qrCodeId: string) {
    if (!mongoose.Types.ObjectId.isValid(qrCodeId)) {
      throw new HttpError(404, 'QR code not found');
    }

    await connectDB();
    const qrCode = await qrRepository.findDocumentByIdForUser(qrCodeId, userId);
    if (!qrCode) {
      throw new HttpError(404, 'QR code not found');
    }

    if (qrCode.status === 'archived') {
      return { message: 'QR code is already archived' };
    }

    if (qrCode.status !== 'active') {
      throw new HttpError(400, 'Can only archive active QR codes');
    }

    qrCode.status = 'archived';
    await qrRepository.save(qrCode);

    return { message: 'QR code archived successfully' };
  }

  async getQRCodeAnalytics(userId: string, qrCodeId: string, period: string) {
    if (!mongoose.Types.ObjectId.isValid(qrCodeId)) {
      throw new HttpError(404, 'QR code not found');
    }

    await connectDB();
    const qrCode = await qrRepository.findDocumentByIdForUser(qrCodeId, userId);
    if (!qrCode) {
      throw new HttpError(404, 'QR code not found');
    }

    if (!['day', 'week', 'month'].includes(period)) {
      throw new HttpError(400, 'Invalid period. Must be "day", "week", or "month"');
    }

    const analytics = await aggregateQRCodeAccess(qrCodeId, period as TimePeriod);
    const total = await getTotalAccessCount(qrCodeId);

    return { ...analytics, total };
  }

  async downloadQRCode(userId: string, qrCodeId: string, format: string, request: any) {
    if (!mongoose.Types.ObjectId.isValid(qrCodeId)) {
      throw new HttpError(404, 'QR code not found');
    }

    await connectDB();
    const qrCode = await qrRepository.findDocumentByIdForUser(qrCodeId, userId);
    if (!qrCode) {
      throw new HttpError(404, 'QR code not found');
    }

    const scanUrl = getScanUrl(qrCodeId, request);
    const sanitizedName = (qrCode.customName || 'qr-code').replace(/[^a-z0-9]/gi, '-').toLowerCase();

    if (format === 'svg') {
      const content = await generateQRCodeSVG(scanUrl, { size: 512, errorCorrectionLevel: 'H' });
      return {
        content,
        contentType: 'image/svg+xml',
        fileName: `qr-code-${sanitizedName}.svg`,
      };
    }

    const content = await generateQRCodeBuffer(scanUrl, { size: 1024, errorCorrectionLevel: 'H' });
    return {
      content,
      contentType: 'image/png',
      fileName: `qr-code-${sanitizedName}.png`,
    };
  }
}
