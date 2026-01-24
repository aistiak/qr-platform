import QRCode from 'qrcode';

export interface QRCodeOptions {
  size?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

const DEFAULT_OPTIONS: Required<QRCodeOptions> = {
  size: 512,
  margin: 2,
  errorCorrectionLevel: 'H', // High error correction for better scannability at various sizes
};

/**
 * Generate QR code as data URL (base64 image)
 */
export async function generateQRCodeDataURL(
  data: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return await QRCode.toDataURL(data, {
    width: opts.size,
    margin: opts.margin,
    errorCorrectionLevel: opts.errorCorrectionLevel,
  });
}

/**
 * Generate QR code as Buffer (for file download)
 */
export async function generateQRCodeBuffer(
  data: string,
  options: QRCodeOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return await QRCode.toBuffer(data, {
    width: opts.size,
    margin: opts.margin,
    errorCorrectionLevel: opts.errorCorrectionLevel,
  });
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRCodeSVG(
  data: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return await QRCode.toString(data, {
    type: 'svg',
    width: opts.size,
    margin: opts.margin,
    errorCorrectionLevel: opts.errorCorrectionLevel,
  });
}
