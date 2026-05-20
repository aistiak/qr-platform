import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import HostedImage from '../models/HostedImage';
import { connectDB } from '../db/mongodb';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

export async function uploadAndProcessImage(file: Express.Multer.File, userId: string) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 2MB limit');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error('Only JPEG and PNG images are allowed');
  }

  const image = sharp(file.buffer);
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error('Invalid image file');
  }

  const extension = file.mimetype === 'image/jpeg' ? 'jpg' : 'png';
  const filename = `${randomUUID()}.${extension}`;
  const rootDir = process.env.IMAGE_UPLOAD_DIR || path.join(process.cwd(), 'public', 'images');
  const userDir = path.join(rootDir, userId);
  const absoluteFilePath = path.join(userDir, filename);
  const relativeFilePath = `/images/${userId}/${filename}`;

  await fs.mkdir(userDir, { recursive: true });
  await fs.writeFile(absoluteFilePath, file.buffer);

  await connectDB();
  const hostedImage = await HostedImage.create({
    userId,
    filename,
    originalFilename: file.originalname,
    filePath: relativeFilePath,
    mimeType: file.mimetype as 'image/jpeg' | 'image/png',
    fileSize: file.size,
    width: metadata.width,
    height: metadata.height,
  });

  return {
    hostedImageId: hostedImage._id.toString(),
    filePath: hostedImage.filePath,
    filename: hostedImage.filename,
  };
}
