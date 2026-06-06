/**
 * TypeScript types for QR Code entity
 */

export interface QRCode {
  id: string;
  customName: string;
  targetType: 'url' | 'image';
  targetUrl?: string;
  hostedImageId?: {
    id: string;
    filePath: string;
  } | null;
  status: 'active' | 'paused' | 'archived' | 'deleted';
  accessCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface QRCodeAccess {
  id: string;
  qrCodeId: string;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
  referer?: string;
}

export interface HostedImage {
  id: string;
  userId: string;
  filename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}
