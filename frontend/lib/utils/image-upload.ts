import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import HostedImage from '@/lib/models/HostedImage';
import { connectDB } from '@/lib/db/mongodb';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

export interface ImageUploadResult {
  hostedImageId: string;
  filePath: string;
  filename: string;
}

export async function uploadAndProcessImage(
  file: File,
  userId: string
): Promise<ImageUploadResult> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 2MB limit');
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Only JPEG and PNG images are allowed');
  }

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Process image with sharp (validate and get dimensions)
  const image = sharp(buffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Invalid image file');
  }

  // Generate unique filename
  const extension = file.type === 'image/jpeg' ? 'jpg' : 'png';
  const filename = `${randomUUID()}.${extension}`;
  const userDir = path.join(process.cwd(), 'public', 'images', userId);
  const filePath = path.join(userDir, filename);

  // Ensure user directory exists
  await fs.mkdir(userDir, { recursive: true });

  // Save file
  await fs.writeFile(filePath, buffer);

  // Save metadata to database
  await connectDB();
  const hostedImage = await HostedImage.create({
    userId,
    filename,
    originalFilename: file.name,
    filePath: `/images/${userId}/${filename}`,
    mimeType: file.type as 'image/jpeg' | 'image/png',
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
