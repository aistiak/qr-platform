import mongoose from 'mongoose';
import { z } from 'zod';
import { connectDB } from '../db/mongodb';
import { HttpError } from '../core/http-error';
import { QRRepository } from '../repositories/qr.repository';
import { UserRepository } from '../repositories/user.repository';

const updateUserSchema = z.object({ qrCodeLimit: z.number().int().min(1, 'QR code limit must be at least 1') });

const userRepository = new UserRepository();
const qrRepository = new QRRepository();

export class AdminService {
  async listUsers() {
    await connectDB();
    const users = await userRepository.listUsers();

    return {
      users: users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        qrCodeLimit: user.qrCodeLimit,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      total: users.length,
    };
  }

  async updateUser(userId: string, payload: unknown) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new HttpError(404, 'User not found');
    }

    const validation = updateUserSchema.safeParse(payload);
    if (!validation.success) {
      throw new HttpError(400, validation.error.errors.map((error) => error.message).join(', '));
    }

    await connectDB();
    const updatedUser = await userRepository.updateUserQrLimit(userId, validation.data.qrCodeLimit);
    if (!updatedUser) {
      throw new HttpError(404, 'User not found');
    }

    return {
      id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      qrCodeLimit: updatedUser.qrCodeLimit,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  async listQRCodes(status: string) {
    await connectDB();
    const qrCodes = await qrRepository.listForAdmin(status);

    return {
      qrCodes: qrCodes.map((qrCode) => ({
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
        user: qrCode.userId
          ? {
              id: (qrCode.userId as any)._id.toString(),
              name: (qrCode.userId as any).name,
              email: (qrCode.userId as any).email,
            }
          : null,
      })),
      total: qrCodes.length,
    };
  }
}
