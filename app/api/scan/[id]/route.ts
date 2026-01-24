import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import QRCode from '@/lib/models/QRCode';
import HostedImage from '@/lib/models/HostedImage'; // Import to register the model
import QRCodeAccess from '@/lib/models/QRCodeAccess';
import { notFoundResponse } from '@/lib/utils/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const qrCode = await QRCode.findById(params.id).populate('hostedImageId', 'filePath');

    if (!qrCode) {
      return notFoundResponse();
    }

    // Check if QR code is paused, archived, or deleted - return 404
    if (qrCode.status === 'paused' || qrCode.status === 'archived' || qrCode.status === 'deleted') {
      return notFoundResponse();
    }

    // Record access for analytics
    try {
      await QRCodeAccess.create({
        qrCodeId: qrCode._id,
        timestamp: new Date(),
        userAgent: request.headers.get('user-agent') || undefined,
        referer: request.headers.get('referer') || undefined,
      });
    } catch (analyticsError) {
      // Don't fail the redirect if analytics recording fails
      console.error('Analytics recording error:', analyticsError);
    }

    // Determine redirect URL
    let redirectUrl: string;

    if (qrCode.targetType === 'url' && qrCode.targetUrl) {
      redirectUrl = qrCode.targetUrl;
    } else if (qrCode.targetType === 'image' && qrCode.hostedImageId) {
      const hostedImage = qrCode.hostedImageId as any;
      redirectUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${hostedImage.filePath}`;
    } else {
      return notFoundResponse();
    }

    // Redirect to target
    return NextResponse.redirect(redirectUrl, { status: 302 });
  } catch (error) {
    console.error('Scan QR code error:', error);
    return notFoundResponse();
  }
}
