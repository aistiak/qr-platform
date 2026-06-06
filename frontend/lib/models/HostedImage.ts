import mongoose, { Schema, Model } from 'mongoose';

export interface IHostedImage {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  filename: string;
  originalFilename: string;
  filePath: string;
  mimeType: 'image/jpeg' | 'image/png';
  fileSize: number;
  width?: number;
  height?: number;
  createdAt?: Date;
}

const HostedImageSchema = new Schema<IHostedImage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    filename: {
      type: String,
      required: [true, 'Filename is required'],
    },
    originalFilename: {
      type: String,
      required: [true, 'Original filename is required'],
    },
    filePath: {
      type: String,
      required: [true, 'File path is required'],
    },
    mimeType: {
      type: String,
      enum: ['image/jpeg', 'image/png'],
      required: [true, 'MIME type is required'],
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      max: [2097152, 'File size must not exceed 2MB'],
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
HostedImageSchema.index({ userId: 1 });

const HostedImage: Model<IHostedImage> =
  mongoose.models.HostedImage ||
  mongoose.model<IHostedImage>('HostedImage', HostedImageSchema);

export default HostedImage;
