import mongoose, { Model, Schema } from 'mongoose';

export interface IQRCodeAccess {
  _id?: mongoose.Types.ObjectId;
  qrCodeId: mongoose.Types.ObjectId;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
  referer?: string;
}

const QRCodeAccessSchema = new Schema<IQRCodeAccess>(
  {
    qrCodeId: { type: Schema.Types.ObjectId, ref: 'QRCode', required: true },
    timestamp: { type: Date, default: Date.now, required: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    referer: { type: String },
  },
  { timestamps: false }
);

QRCodeAccessSchema.index({ qrCodeId: 1 });
QRCodeAccessSchema.index({ timestamp: 1 });
QRCodeAccessSchema.index({ qrCodeId: 1, timestamp: 1 });

const QRCodeAccess: Model<IQRCodeAccess> =
  mongoose.models.QRCodeAccess ||
  mongoose.model<IQRCodeAccess>('QRCodeAccess', QRCodeAccessSchema);

export default QRCodeAccess;
