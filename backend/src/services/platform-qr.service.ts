import { HttpError } from '../core/http-error';
import { connectDB } from '../db/mongodb';
import { QRRepository } from '../repositories/qr.repository';
import { QRService } from './qr.service';

const qrRepository = new QRRepository();
const qrService = new QRService();

function encodeCursor(payload: { createdAt: string; id: string }) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function decodeCursor(cursor: string) {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw) as { createdAt: string; id: string };
    if (!parsed.createdAt || !parsed.id) {
      throw new Error('Invalid cursor');
    }

    return {
      createdAt: new Date(parsed.createdAt),
      id: parsed.id,
    };
  } catch {
    throw new HttpError(400, 'Invalid cursor');
  }
}

function mapHostedImage(hostedImage: any) {
  if (!hostedImage) {
    return null;
  }

  return {
    id: hostedImage._id.toString(),
    filePath: hostedImage.filePath,
  };
}

function mapQRCode(qrCode: any) {
  return {
    id: qrCode._id.toString(),
    customName: qrCode.customName,
    targetType: qrCode.targetType,
    targetUrl: qrCode.targetUrl,
    hostedImageId: mapHostedImage(qrCode.hostedImageId),
    status: qrCode.status,
    accessCount: qrCode.accessCount || 0,
    createdAt: qrCode.createdAt,
    updatedAt: qrCode.updatedAt,
  };
}

export class PlatformQRService {
  async create(userId: string, payload: unknown) {
    return qrService.createQRCode(userId, payload);
  }

  async details(userId: string, qrCodeId: string) {
    return qrService.getQRCodeById(userId, qrCodeId);
  }

  async remove(userId: string, qrCodeId: string) {
    return qrService.deleteQRCode(userId, qrCodeId);
  }

  async list(userId: string, query: { status?: string; limit?: string; cursor?: string }) {
    const status = query.status || 'all';
    if (!['all', 'active', 'paused', 'archived'].includes(status)) {
      throw new HttpError(400, 'Invalid status');
    }

    const limit = Number(query.limit || 20);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new HttpError(400, 'limit must be an integer between 1 and 100');
    }

    const decodedCursor = query.cursor ? decodeCursor(query.cursor) : undefined;
    await connectDB();
    const qrCodes = await qrRepository.listByUserAndStatusCursor(userId, status, limit, decodedCursor);
    const hasMore = qrCodes.length > limit;
    const page = hasMore ? qrCodes.slice(0, limit) : qrCodes;
    const mapped = page.map(mapQRCode);
    const last = page[page.length - 1];

    return {
      qrs: mapped,
      total: mapped.length,
      hasMore,
      nextCursor: hasMore && last?.createdAt
        ? encodeCursor({
            createdAt: last.createdAt.toISOString(),
            id: last._id.toString(),
          })
        : null,
    };
  }
}
