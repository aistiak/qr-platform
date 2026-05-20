import mongoose, { Model, Schema } from 'mongoose';

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
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    originalFilename: { type: String, required: true },
    filePath: { type: String, required: true },
    mimeType: { type: String, enum: ['image/jpeg', 'image/png'], required: true },
    fileSize: { type: Number, required: true, max: 2097152 },
    width: { type: Number },
    height: { type: Number },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

HostedImageSchema.index({ userId: 1 });

const HostedImage: Model<IHostedImage> =
  mongoose.models.HostedImage || mongoose.model<IHostedImage>('HostedImage', HostedImageSchema);

export default HostedImage;
