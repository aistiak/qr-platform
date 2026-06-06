import User, { AuthProvider } from '../models/User';

export class UserRepository {
  async findByEmail(email: string) {
    return User.findOne({ email });
  }

  async findByGoogleId(googleId: string) {
    return User.findOne({ googleId });
  }

  async createUser(data: {
    name: string;
    email: string;
    passwordHash?: string;
    authProvider?: AuthProvider;
    googleId?: string;
    image?: string;
    role: 'user' | 'admin';
    qrCodeLimit: number;
  }) {
    return User.create(data);
  }

  async linkGoogleAccount(
    userId: string,
    data: { googleId: string; image?: string }
  ) {
    return User.findByIdAndUpdate(
      userId,
      {
        googleId: data.googleId,
        ...(data.image ? { image: data.image } : {}),
      },
      { new: true }
    );
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
