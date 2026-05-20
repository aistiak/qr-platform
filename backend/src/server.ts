import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { z } from 'zod';
import { connectDB } from './db/mongodb';
import HostedImage from './models/HostedImage';
import QRCode from './models/QRCode';
import QRCodeAccess from './models/QRCodeAccess';
import User from './models/User';
import { generateQRCodeBuffer, generateQRCodeSVG } from './qr/generator';
import { validateURL } from './qr/validator';
import { aggregateQRCodeAccess, getTotalAccessCount, TimePeriod } from './utils/analytics';
import {
  attachSessionUser,
  clearSessionCookie,
  requireAdmin,
  requireAuth,
  setSessionCookie,
  signSessionToken,
} from './utils/auth';
import { uploadAndProcessImage } from './utils/image-upload';
import { logger } from './utils/logger';
import { getBaseUrl, getScanUrl } from './utils/url';
import { signInSchema, signUpSchema, updateQRCodeSchema } from './utils/validation';

dotenv.config();

export const app = express();
const port = Number(process.env.PORT || 4000);
const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

const createQRCodeSchema = z.object({
  customName: z.string().max(100).optional(),
  targetType: z.enum(['url', 'image']),
  targetUrl: z.string().url().optional(),
  hostedImageId: z.string().optional(),
});

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(attachSessionUser);

function getImageRootDir() {
  return process.env.IMAGE_UPLOAD_DIR || path.join(process.cwd(), 'public', 'images');
}

function getImageAbsolutePath(filePath: string) {
  const normalized = filePath.replace(/^\/+/, '').replace(/^images\//, '');
  return path.join(getImageRootDir(), normalized);
}

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'backend' });
});

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    await connectDB();
    const validation = signUpSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors.map((e) => e.message).join(', ') });
    }

    const { name, email, password } = validation.data;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ error: 'Email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role: 'user', qrCodeLimit: 20 });
    logger.auth('User signed up successfully', { userId: user._id.toString(), email: user.email });

    return res.status(201).json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        qrCodeLimit: user.qrCodeLimit,
      },
      message: 'User created successfully',
    });
  } catch (error) {
    logger.error('Sign up error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const validation = signInSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors.map((e) => e.message).join(', ') });
    }

    const { email, password } = validation.data;
    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.status(401).json({ error: 'Invalid email or password' });

    const sessionUser = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    };
    const token = signSessionToken(sessionUser);
    setSessionCookie(res, token);

    return res.json({ message: 'Sign in successful', user: sessionUser });
  } catch (error) {
    logger.error('Sign in error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/signout', (_req, res) => {
  clearSessionCookie(res);
  return res.json({ message: 'Sign out successful' });
});

app.get('/api/auth/session', (req, res) => {
  if (!req.user) return res.json(null);
  return res.json({ user: req.user });
});

// User QR routes
app.get('/api/qr', requireAuth, async (req, res) => {
  try {
    await connectDB();
    const status = String(req.query.status || 'active');
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const query: Record<string, unknown> = { userId };
    query.status = status === 'all' ? { $ne: 'deleted' } : status;

    const qrCodes = await QRCode.find(query)
      .sort({ createdAt: -1 })
      .populate('hostedImageId', 'filename filePath')
      .lean();

    const mapped = await Promise.all(
      qrCodes.map(async (qr) => ({
        id: qr._id.toString(),
        customName: qr.customName,
        targetType: qr.targetType,
        targetUrl: qr.targetUrl,
        hostedImageId: qr.hostedImageId
          ? { id: (qr.hostedImageId as any)._id.toString(), filePath: (qr.hostedImageId as any).filePath }
          : null,
        status: qr.status,
        accessCount: await getTotalAccessCount(qr._id.toString()),
        createdAt: qr.createdAt,
        updatedAt: qr.updatedAt,
      }))
    );

    return res.json({ qrCodes: mapped, total: mapped.length });
  } catch (error) {
    logger.error('Get QR codes error', error, { userId: req.user?.id });
    return res.status(500).json({ error: 'Failed to fetch QR codes' });
  }
});

app.post('/api/qr', requireAuth, async (req, res) => {
  try {
    await connectDB();
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const activeCount = await QRCode.countDocuments({ userId, status: { $ne: 'deleted' } });
    if (activeCount >= user.qrCodeLimit) {
      return res.status(403).json({
        error: `QR code limit reached (${user.qrCodeLimit}). Please delete or archive existing QR codes.`,
      });
    }

    const validation = createQRCodeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors.map((e) => e.message).join(', ') });
    }

    const { customName, targetType, targetUrl, hostedImageId } = validation.data;
    if (targetType === 'url' && !targetUrl) return res.status(400).json({ error: 'targetUrl is required when targetType is "url"' });
    if (targetType === 'image' && !hostedImageId) return res.status(400).json({ error: 'hostedImageId is required when targetType is "image"' });
    if (targetType === 'url' && targetUrl && !validateURL(targetUrl).valid) return res.status(400).json({ error: 'Invalid URL' });

    const qrCode = await QRCode.create({
      userId,
      customName: customName || 'Untitled QR Code',
      targetType,
      targetUrl: targetType === 'url' ? targetUrl : undefined,
      hostedImageId: targetType === 'image' ? new mongoose.Types.ObjectId(hostedImageId) : undefined,
      status: 'active',
      accessCount: 0,
    });

    const populated = await QRCode.findById(qrCode._id).populate('hostedImageId', 'filename filePath').lean();
    return res.status(201).json({
      id: populated!._id.toString(),
      customName: populated!.customName,
      targetType: populated!.targetType,
      targetUrl: populated!.targetUrl,
      hostedImageId: populated!.hostedImageId
        ? { id: (populated!.hostedImageId as any)._id.toString(), filePath: (populated!.hostedImageId as any).filePath }
        : null,
      status: populated!.status,
      accessCount: populated!.accessCount || 0,
      createdAt: populated!.createdAt,
      updatedAt: populated!.updatedAt,
    });
  } catch (error) {
    logger.error('Create QR code error', error, { userId: req.user?.id });
    return res.status(500).json({ error: 'Failed to create QR code' });
  }
});

app.get('/api/qr/:id', requireAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'QR code not found' });
    }
    await connectDB();
    const qrCode = await QRCode.findOne({
      _id: req.params.id,
      userId: req.user!.id,
      status: { $ne: 'deleted' },
    })
      .populate('hostedImageId', 'filename filePath')
      .lean();

    if (!qrCode) return res.status(404).json({ error: 'QR code not found' });
    const accessCount = await getTotalAccessCount(req.params.id);

    return res.json({
      id: qrCode._id.toString(),
      customName: qrCode.customName,
      targetType: qrCode.targetType,
      targetUrl: qrCode.targetUrl,
      hostedImageId: qrCode.hostedImageId
        ? { id: (qrCode.hostedImageId as any)._id.toString(), filePath: (qrCode.hostedImageId as any).filePath }
        : null,
      status: qrCode.status,
      accessCount,
      createdAt: qrCode.createdAt,
      updatedAt: qrCode.updatedAt,
    });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch QR code' });
  }
});

app.patch('/api/qr/:id', requireAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'QR code not found' });
    }
    await connectDB();
    const qrCode = await QRCode.findOne({ _id: req.params.id, userId: req.user!.id, status: { $ne: 'deleted' } });
    if (!qrCode) return res.status(404).json({ error: 'QR code not found' });

    const validation = updateQRCodeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors.map((e) => e.message).join(', ') });
    }

    const { customName, status, targetType, targetUrl, hostedImageId } = validation.data;
    if (customName !== undefined) qrCode.customName = customName;
    if (status !== undefined) {
      const validTransitions: Record<string, string[]> = {
        active: ['paused', 'archived'],
        paused: ['active'],
        archived: ['active'],
      };
      if (!validTransitions[qrCode.status]?.includes(status)) {
        return res.status(400).json({ error: `Cannot transition from ${qrCode.status} to ${status}` });
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
          if (!urlValidation.valid) return res.status(400).json({ error: urlValidation.error || 'Invalid URL' });
          qrCode.targetUrl = targetUrl;
        }
      } else {
        qrCode.targetUrl = undefined;
        if (hostedImageId) {
          const hostedImage = await HostedImage.findOne({ _id: hostedImageId, userId: req.user!.id });
          if (!hostedImage) return res.status(404).json({ error: 'Hosted image not found or access denied' });
          qrCode.hostedImageId = hostedImage._id;
        }
      }
    } else {
      if (targetUrl !== undefined && qrCode.targetType === 'url') {
        const urlValidation = validateURL(targetUrl);
        if (!urlValidation.valid) return res.status(400).json({ error: urlValidation.error || 'Invalid URL' });
        qrCode.targetUrl = targetUrl;
        targetChanged = true;
      }
      if (hostedImageId !== undefined && qrCode.targetType === 'image') {
        const hostedImage = await HostedImage.findOne({ _id: hostedImageId, userId: req.user!.id });
        if (!hostedImage) return res.status(404).json({ error: 'Hosted image not found or access denied' });
        qrCode.hostedImageId = hostedImage._id;
        targetChanged = true;
      }
    }

    await qrCode.save();

    if (targetChanged && oldHostedImageId && qrCode.targetType === 'url') {
      const oldImage = await HostedImage.findById(oldHostedImageId);
      if (oldImage) {
        const inUse = await QRCode.countDocuments({ hostedImageId: oldHostedImageId, _id: { $ne: qrCode._id } });
        if (inUse === 0) {
          try {
            await fs.unlink(getImageAbsolutePath(oldImage.filePath));
          } catch {
            // Ignore file cleanup errors.
          }
          await HostedImage.findByIdAndDelete(oldHostedImageId);
        }
      }
    }

    const updated = await QRCode.findById(qrCode._id).populate('hostedImageId', 'filename filePath').lean();
    return res.json({
      id: updated!._id.toString(),
      customName: updated!.customName,
      targetType: updated!.targetType,
      targetUrl: updated!.targetUrl,
      hostedImageId: updated!.hostedImageId
        ? { id: (updated!.hostedImageId as any)._id.toString(), filePath: (updated!.hostedImageId as any).filePath }
        : null,
      status: updated!.status,
      accessCount: updated!.accessCount || 0,
      createdAt: updated!.createdAt,
      updatedAt: updated!.updatedAt,
    });
  } catch (error) {
    logger.error('Update QR code error', error, { qrCodeId: req.params.id });
    return res.status(500).json({ error: 'Failed to update QR code' });
  }
});

app.delete('/api/qr/:id', requireAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'QR code not found' });
    }
    await connectDB();
    const qrCode = await QRCode.findOne({ _id: req.params.id, userId: req.user!.id, status: { $ne: 'deleted' } });
    if (!qrCode) return res.status(404).json({ error: 'QR code not found' });
    qrCode.status = 'deleted';
    await qrCode.save();
    return res.json({ message: 'QR code deleted successfully' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete QR code' });
  }
});

app.post('/api/qr/:id/pause', requireAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'QR code not found' });
    }
    await connectDB();
    const qrCode = await QRCode.findOne({ _id: req.params.id, userId: req.user!.id, status: { $ne: 'deleted' } });
    if (!qrCode) return res.status(404).json({ error: 'QR code not found' });
    if (qrCode.status === 'paused') return res.json({ message: 'QR code is already paused' });
    if (qrCode.status !== 'active') return res.status(400).json({ error: 'Can only pause active QR codes' });
    qrCode.status = 'paused';
    await qrCode.save();
    return res.json({ message: 'QR code paused successfully' });
  } catch {
    return res.status(500).json({ error: 'Failed to pause QR code' });
  }
});

app.post('/api/qr/:id/archive', requireAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'QR code not found' });
    }
    await connectDB();
    const qrCode = await QRCode.findOne({ _id: req.params.id, userId: req.user!.id, status: { $ne: 'deleted' } });
    if (!qrCode) return res.status(404).json({ error: 'QR code not found' });
    if (qrCode.status === 'archived') return res.json({ message: 'QR code is already archived' });
    if (qrCode.status !== 'active') return res.status(400).json({ error: 'Can only archive active QR codes' });
    qrCode.status = 'archived';
    await qrCode.save();
    return res.json({ message: 'QR code archived successfully' });
  } catch {
    return res.status(500).json({ error: 'Failed to archive QR code' });
  }
});

app.get('/api/qr/:id/analytics', requireAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'QR code not found' });
    }
    await connectDB();
    const qrCode = await QRCode.findOne({ _id: req.params.id, userId: req.user!.id, status: { $ne: 'deleted' } });
    if (!qrCode) return res.status(404).json({ error: 'QR code not found' });

    const period = (String(req.query.period || 'day') as TimePeriod);
    if (!['day', 'week', 'month'].includes(period)) {
      return res.status(400).json({ error: 'Invalid period. Must be "day", "week", or "month"' });
    }

    const analytics = await aggregateQRCodeAccess(req.params.id, period);
    const total = await getTotalAccessCount(req.params.id);
    return res.json({ ...analytics, total });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/api/qr/:id/download', requireAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'QR code not found' });
    }
    await connectDB();
    const qrCode = await QRCode.findOne({ _id: req.params.id, userId: req.user!.id, status: { $ne: 'deleted' } });
    if (!qrCode) return res.status(404).json({ error: 'QR code not found' });

    const format = String(req.query.format || 'png');
    const scanUrl = getScanUrl(req.params.id, req);
    const sanitizedName = (qrCode.customName || 'qr-code').replace(/[^a-z0-9]/gi, '-').toLowerCase();

    if (format === 'svg') {
      const svg = await generateQRCodeSVG(scanUrl, { size: 512, errorCorrectionLevel: 'H' });
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="qr-code-${sanitizedName}.svg"`);
      return res.send(svg);
    }

    const png = await generateQRCodeBuffer(scanUrl, { size: 1024, errorCorrectionLevel: 'H' });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="qr-code-${sanitizedName}.png"`);
    return res.send(png);
  } catch {
    return res.status(500).json({ error: 'Failed to generate QR code download' });
  }
});

app.post('/api/images', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const result = await uploadAndProcessImage(req.file, req.user!.id);
    return res.status(201).json({ id: result.hostedImageId, filePath: result.filePath, filename: result.filename });
  } catch (error) {
    if (error instanceof Error) return res.status(400).json({ error: error.message });
    return res.status(500).json({ error: 'Failed to upload image' });
  }
});

app.get('/api/images/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Image not found' });
    }
    await connectDB();
    const hostedImage = await HostedImage.findById(req.params.id);
    if (!hostedImage) return res.status(404).json({ error: 'Image not found' });

    const fileBuffer = await fs.readFile(getImageAbsolutePath(hostedImage.filePath));
    res.setHeader('Content-Type', hostedImage.mimeType);
    res.setHeader('Content-Length', fileBuffer.length.toString());
    return res.send(fileBuffer);
  } catch {
    return res.status(404).json({ error: 'Image file not found' });
  }
});

app.get('/api/scan/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    await connectDB();
    const qrCode = await QRCode.findById(req.params.id).populate('hostedImageId', '_id filePath');
    if (!qrCode || ['paused', 'archived', 'deleted'].includes(qrCode.status)) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    await QRCodeAccess.create({
      qrCodeId: qrCode._id,
      timestamp: new Date(),
      userAgent: req.get('user-agent') || undefined,
      referer: req.get('referer') || undefined,
      ipAddress: req.ip,
    }).catch(() => undefined);

    let redirectUrl = '';
    if (qrCode.targetType === 'url' && qrCode.targetUrl) {
      redirectUrl = qrCode.targetUrl;
    } else if (qrCode.targetType === 'image' && qrCode.hostedImageId) {
      redirectUrl = `${getBaseUrl(req)}/api/images/${(qrCode.hostedImageId as any)._id}`;
    } else {
      return res.status(404).json({ error: 'Resource not found' });
    }

    return res.redirect(302, redirectUrl);
  } catch {
    return res.status(404).json({ error: 'Resource not found' });
  }
});

// Admin routes
app.get('/api/admin/users', requireAdmin, async (_req, res) => {
  try {
    await connectDB();
    const users = await User.find({})
      .select('name email role qrCodeLimit createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({
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
    });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.patch('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'User not found' });
    }
    await connectDB();
    const updateSchema = z.object({ qrCodeLimit: z.number().int().min(1, 'QR code limit must be at least 1') });
    const validation = updateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors.map((e) => e.message).join(', ') });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.qrCodeLimit = validation.data.qrCodeLimit;
    await user.save();

    logger.admin('User QR code limit updated', {
      adminUserId: req.user!.id,
      targetUserId: user._id.toString(),
      newLimit: validation.data.qrCodeLimit,
    });

    return res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      qrCodeLimit: user.qrCodeLimit,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch {
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

app.get('/api/admin/qr', requireAdmin, async (req, res) => {
  try {
    await connectDB();
    const status = String(req.query.status || 'all');
    const query: Record<string, unknown> = { status: { $ne: 'deleted' } };
    if (status !== 'all') query.status = status;

    const qrCodes = await QRCode.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('hostedImageId', 'filename filePath')
      .lean();

    return res.json({
      qrCodes: qrCodes.map((qr) => ({
        id: qr._id.toString(),
        customName: qr.customName,
        targetType: qr.targetType,
        targetUrl: qr.targetUrl,
        hostedImageId: qr.hostedImageId
          ? { id: (qr.hostedImageId as any)._id.toString(), filePath: (qr.hostedImageId as any).filePath }
          : null,
        status: qr.status,
        accessCount: qr.accessCount || 0,
        createdAt: qr.createdAt,
        updatedAt: qr.updatedAt,
        user: qr.userId
          ? { id: (qr.userId as any)._id.toString(), name: (qr.userId as any).name, email: (qr.userId as any).email }
          : null,
      })),
      total: qrCodes.length,
    });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch QR codes' });
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}
