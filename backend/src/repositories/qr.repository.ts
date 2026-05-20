import mongoose from 'mongoose';
import QRCode from '../models/QRCode';

export class QRRepository {
  async countActiveByUser(userId: string) {
    return QRCode.countDocuments({ userId: new mongoose.Types.ObjectId(userId), status: { $ne: 'deleted' } });
  }

  async createQRCode(data: {
    userId: mongoose.Types.ObjectId;
    customName: string;
    targetType: 'url' | 'image';
    targetUrl?: string;
    hostedImageId?: mongoose.Types.ObjectId;
    status: 'active' | 'paused' | 'archived' | 'deleted';
    accessCount: number;
  }) {
    return QRCode.create(data);
  }

  async listByUserAndStatus(userId: string, status: string) {
    const query: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };
    query.status = status === 'all' ? { $ne: 'deleted' } : status;

    return QRCode.find(query)
      .sort({ createdAt: -1 })
      .populate('hostedImageId', 'filename filePath')
      .lean();
  }

  async findByIdForUser(id: string, userId: string) {
    return QRCode.findOne({ _id: id, userId, status: { $ne: 'deleted' } })
      .populate('hostedImageId', 'filename filePath')
      .lean();
  }

  async findDocumentByIdForUser(id: string, userId: string) {
    return QRCode.findOne({ _id: id, userId, status: { $ne: 'deleted' } });
  }

  async findByIdWithImage(id: string) {
    return QRCode.findById(id).populate('hostedImageId', '_id filePath');
  }

  async findByIdPopulated(id: string) {
    return QRCode.findById(id).populate('hostedImageId', 'filename filePath').lean();
  }

  async save(document: any) {
    return document.save();
  }

  async countByHostedImageExcept(hostedImageId: mongoose.Types.ObjectId, excludedQrId: mongoose.Types.ObjectId) {
    return QRCode.countDocuments({ hostedImageId, _id: { $ne: excludedQrId } });
  }

  async listForAdmin(status: string) {
    const query: Record<string, unknown> = { status: { $ne: 'deleted' } };
    if (status !== 'all') {
      query.status = status;
    }

    return QRCode.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('hostedImageId', 'filename filePath')
      .lean();
  }
}
