import User from '../models/User';

export class UserRepository {
  async findByEmail(email: string) {
    return User.findOne({ email });
  }

  async createUser(data: {
    name: string;
    email: string;
    passwordHash: string;
    role: 'user' | 'admin';
    qrCodeLimit: number;
  }) {
    return User.create(data);
  }

  async findById(userId: string) {
    return User.findById(userId);
  }

  async listUsers() {
    return User.find({})
      .select('name email role qrCodeLimit createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean();
  }

  async updateUserQrLimit(userId: string, qrCodeLimit: number) {
    return User.findByIdAndUpdate(userId, { qrCodeLimit }, { new: true });
  }
}
