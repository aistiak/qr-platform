import mongoose from 'mongoose';
import { connectDB } from '../db/mongodb';
import { HttpError } from '../core/http-error';
import { QRRepository } from '../repositories/qr.repository';
import { QRCodeAccessRepository } from '../repositories/qr-access.repository';
import { getPublicAppUrl } from '../utils/url';

const qrRepository = new QRRepository();
const qrAccessRepository = new QRCodeAccessRepository();

export class ScanService {
  async resolveScanTarget(scanId: string, request: any) {
    if (!mongoose.Types.ObjectId.isValid(scanId)) {
      throw new HttpError(404, 'Resource not found');
    }

    await connectDB();
    const qrCode = await qrRepository.findByIdWithImage(scanId);

    if (!qrCode) {
      return { type: 'image', imageId: scanId } as const;
    }

    if (['paused', 'archived', 'deleted'].includes(qrCode.status)) {
      throw new HttpError(404, 'Resource not found');
    }

    await qrAccessRepository
      .createAccess({
        qrCodeId: qrCode._id.toString(),
        timestamp: new Date(),
        userAgent: request.get('user-agent') || undefined,
        referer: request.get('referer') || undefined,
        ipAddress: request.ip,
      })
      .catch(() => undefined);

    if (qrCode.targetType === 'url' && qrCode.targetUrl) {
      return { type: 'redirect', url: qrCode.targetUrl } as const;
    }

    if (qrCode.targetType === 'image' && qrCode.hostedImageId) {
      return {
        type: 'redirect',
        url: `${getPublicAppUrl(request)}/c/${(qrCode.hostedImageId as any)._id.toString()}`,
      } as const;
    }

    throw new HttpError(404, 'Resource not found');
  }
}
