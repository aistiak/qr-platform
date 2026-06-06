import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import mongoose from 'mongoose';
import { connectDB } from '../db/mongodb';
import { HttpError } from '../core/http-error';
import { HostedImageRepository } from '../repositories/hosted-image.repository';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

const hostedImageRepository = new HostedImageRepository();

function getImageRootDir() {
  return process.env.IMAGE_UPLOAD_DIR || path.join(process.cwd(), 'public', 'images');
}

function getImageAbsolutePath(filePath: string) {
  const normalized = filePath.replace(/^\/+/, '').replace(/^images\//, '');
  return path.join(getImageRootDir(), normalized);
}

export class ImageService {
  async uploadImage(file: Express.Multer.File, userId: string) {
    if (!file) {
      throw new HttpError(400, 'No file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new HttpError(400, 'File size exceeds 2MB limit');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new HttpError(400, 'Only JPEG and PNG images are allowed');
    }

    const image = sharp(file.buffer);
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) {
      throw new HttpError(400, 'Invalid image file');
    }

    const extension = file.mimetype === 'image/jpeg' ? 'jpg' : 'png';
    const filename = `${randomUUID()}.${extension}`;
    const rootDir = getImageRootDir();
    const userDir = path.join(rootDir, userId);
    const absoluteFilePath = path.join(userDir, filename);
    const relativeFilePath = `/images/${userId}/${filename}`;

    await fs.mkdir(userDir, { recursive: true });
    await fs.writeFile(absoluteFilePath, file.buffer);

    await connectDB();
    const hostedImage = await hostedImageRepository.createHostedImage({
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
      id: hostedImage._id.toString(),
      filePath: hostedImage.filePath,
      filename: hostedImage.filename,
    };
  }

  async getImageResponseById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpError(404, 'Image not found');
    }

    await connectDB();
    const hostedImage = await hostedImageRepository.findById(id);
    if (!hostedImage) {
      throw new HttpError(404, 'Image not found');
    }

    const fileBuffer = await fs.readFile(getImageAbsolutePath(hostedImage.filePath));

    return {
      content: fileBuffer,
      mimeType: hostedImage.mimeType,
    };
  }
}
