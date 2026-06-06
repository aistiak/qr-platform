import QRCode from 'qrcode';

export interface QRCodeOptions {
  size?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

const DEFAULT_OPTIONS: Required<QRCodeOptions> = {
  size: 512,
  margin: 2,
  errorCorrectionLevel: 'H',
};

export async function generateQRCodeBuffer(
  data: string,
  options: QRCodeOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return QRCode.toBuffer(data, {
    width: opts.size,
    margin: opts.margin,
    errorCorrectionLevel: opts.errorCorrectionLevel,
  });
}

export async function generateQRCodeSVG(
  data: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return QRCode.toString(data, {
    type: 'svg',
    width: opts.size,
    margin: opts.margin,
    errorCorrectionLevel: opts.errorCorrectionLevel,
  });
}
