"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAndProcessImage = uploadAndProcessImage;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const sharp_1 = __importDefault(require("sharp"));
const HostedImage_1 = __importDefault(require("../models/HostedImage"));
const mongodb_1 = require("../db/mongodb");
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];
async function uploadAndProcessImage(file, userId) {
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds 2MB limit');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new Error('Only JPEG and PNG images are allowed');
    }
    const image = (0, sharp_1.default)(file.buffer);
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image file');
    }
    const extension = file.mimetype === 'image/jpeg' ? 'jpg' : 'png';
    const filename = `${(0, crypto_1.randomUUID)()}.${extension}`;
    const rootDir = process.env.IMAGE_UPLOAD_DIR || path_1.default.join(process.cwd(), 'public', 'images');
    const userDir = path_1.default.join(rootDir, userId);
    const absoluteFilePath = path_1.default.join(userDir, filename);
    const relativeFilePath = `/images/${userId}/${filename}`;
    await fs_1.promises.mkdir(userDir, { recursive: true });
    await fs_1.promises.writeFile(absoluteFilePath, file.buffer);
    await (0, mongodb_1.connectDB)();
    const hostedImage = await HostedImage_1.default.create({
        userId,
        filename,
        originalFilename: file.originalname,
        filePath: relativeFilePath,
        mimeType: file.mimetype,
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
