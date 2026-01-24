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

    // Generate scan URL
    const scanUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/scan/${params.id}`;

    // Generate QR code buffer
    const qrBuffer = await generateQRCodeBuffer(scanUrl, { size: 512 });

    // Return as PNG download
    return new NextResponse(qrBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="qr-code-${qrCode.customName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png"`,
      },
    });
  } catch (error) {
    console.error('Download QR code error:', error);
    return errorResponse('Failed to generate QR code download', 500);
  }
}
