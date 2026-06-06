import mongoose, { Schema, Model } from 'mongoose';

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
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    customName: {
      type: String,
      maxlength: [100, 'Custom name must not exceed 100 characters'],
      default: 'Untitled QR Code',
      trim: true,
    },
    targetType: {
      type: String,
      enum: ['url', 'image'],
      required: [true, 'Target type is required'],
    },
    targetUrl: {
      type: String,
      validate: {
        validator: function (this: IQRCode, value: string | undefined) {
          if (this.targetType === 'url') {
            if (!value) return false;
            try {
              new URL(value);
              return true;
            } catch {
              return false;
            }
          }
          return true;
        },
        message: 'Valid URL is required when targetType is "url"',
      },
    },
    hostedImageId: {
      type: Schema.Types.ObjectId,
      ref: 'HostedImage',
      validate: {
        validator: function (this: IQRCode, value: mongoose.Types.ObjectId | undefined) {
          if (this.targetType === 'image') {
            return !!value;
          }
          return true;
        },
        message: 'Hosted image ID is required when targetType is "image"',
      },
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'archived', 'deleted'],
      default: 'active',
    },
    accessCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
QRCodeSchema.index({ userId: 1 });
QRCodeSchema.index({ status: 1 });
QRCodeSchema.index({ userId: 1, status: 1 });

const QRCode: Model<IQRCode> =
  mongoose.models.QRCode || mongoose.model<IQRCode>('QRCode', QRCodeSchema);

export default QRCode;
