import mongoose, { Model, Schema } from 'mongoose';

export interface IQRCode {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  customName?: string;
  targetType: 'url' | 'image';
  targetUrl?: string;
  hostedImageId?: mongoose.Types.ObjectId;
  status: 'active' | 'paused' | 'archived' | 'deleted';
  accessCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const QRCodeSchema = new Schema<IQRCode>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customName: { type: String, maxlength: 100, default: 'Untitled QR Code', trim: true },
    targetType: { type: String, enum: ['url', 'image'], required: true },
    targetUrl: {
      type: String,
      validate: {
        validator(this: IQRCode, value?: string) {
          if (this.targetType !== 'url') return true;
          if (!value) return false;
          try {
            new URL(value);
            return true;
          } catch {
            return false;
          }
        },
      },
    },
    hostedImageId: {
      type: Schema.Types.ObjectId,
      ref: 'HostedImage',
      validate: {
        validator(this: IQRCode, value?: mongoose.Types.ObjectId) {
          return this.targetType !== 'image' || !!value;
        },
      },
    },
    status: { type: String, enum: ['active', 'paused', 'archived', 'deleted'], default: 'active' },
    accessCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

QRCodeSchema.index({ userId: 1 });
QRCodeSchema.index({ status: 1 });
QRCodeSchema.index({ userId: 1, status: 1 });

const QRCode: Model<IQRCode> =
  mongoose.models.QRCode || mongoose.model<IQRCode>('QRCode', QRCodeSchema);

export default QRCode;
