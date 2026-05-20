import QRCodeAccess from '../models/QRCodeAccess';

export class QRCodeAccessRepository {
  async createAccess(data: {
    qrCodeId: string;
    timestamp: Date;
    userAgent?: string;
    referer?: string;
    ipAddress?: string;
  }) {
    return QRCodeAccess.create(data);
  }
}
