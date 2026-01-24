import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/utils/auth-middleware';
import {
  unauthorizedResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/utils/api-response';
import { connectDB } from '@/lib/db/mongodb';
import QRCode from '@/lib/models/QRCode';
import { generateQRCodeBuffer } from '@/lib/qr/generator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request);

  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    await connectDB();

    const qrCode = await QRCode.findOne({
      _id: params.id,
      userId: auth.user.id,
      status: { $ne: 'deleted' },
    });

    if (!qrCode) {
      return notFoundResponse('QR code not found');
    }

    // Get format from query parameter (default: png)
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'png';

    // Generate scan URL
    const scanUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/scan/${params.id}`;

    const sanitizedName = qrCode.customName.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    if (format === 'svg') {
      // Generate SVG
      const { generateQRCodeSVG } = await import('@/lib/qr/generator');
      const svgString = await generateQRCodeSVG(scanUrl, { 
        size: 512,
        errorCorrectionLevel: 'H', // High error correction for better quality
      });

      return new NextResponse(svgString, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': `attachment; filename="qr-code-${sanitizedName}.svg"`,
        },
      });
    } else {
      // Generate PNG (default)
      const qrBuffer = await generateQRCodeBuffer(scanUrl, { 
        size: 1024, // Higher resolution for better quality
        errorCorrectionLevel: 'H', // High error correction for better scannability
      });

      return new NextResponse(qrBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="qr-code-${sanitizedName}.png"`,
        },
      });
    }
  } catch (error) {
    console.error('Download QR code error:', error);
    return errorResponse('Failed to generate QR code download', 500);
  }
}
