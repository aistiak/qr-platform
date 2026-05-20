import { connectDB } from '../lib/db/mongodb';
import User from '../lib/models/User';
import QRCode from '../lib/models/QRCode';
import QRCodeAccess from '../lib/models/QRCodeAccess';
import HostedImage from '../lib/models/HostedImage';

async function createIndexes() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    console.log('User indexes created');

    // QRCode indexes
    await QRCode.collection.createIndex({ userId: 1 });
    await QRCode.collection.createIndex({ status: 1 });
    await QRCode.collection.createIndex({ userId: 1, status: 1 });
    console.log('QRCode indexes created');

    // QRCodeAccess indexes
    await QRCodeAccess.collection.createIndex({ qrCodeId: 1 });
    await QRCodeAccess.collection.createIndex({ timestamp: 1 });
    await QRCodeAccess.collection.createIndex({ qrCodeId: 1, timestamp: 1 });
    console.log('QRCodeAccess indexes created');

    // HostedImage indexes
    await HostedImage.collection.createIndex({ userId: 1 });
    console.log('HostedImage indexes created');

    console.log('All indexes created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();
