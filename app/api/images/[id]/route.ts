import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import HostedImage from '@/lib/models/HostedImage';
import { readFile } from 'fs/promises';
import path from 'path';
import { notFoundResponse } from '@/lib/utils/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const hostedImage = await HostedImage.findById(params.id);

    if (!hostedImage) {
      return notFoundResponse('Image not found');
    }

    // Construct file path
    const filePath = path.join(
      process.cwd(),
      'public',
      hostedImage.filePath.startsWith('/') ? hostedImage.filePath.slice(1) : hostedImage.filePath
    );

    try {
      const fileBuffer = await readFile(filePath);

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': hostedImage.mimeType,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
    } catch (fileError) {
      console.error('File read error:', fileError);
      return notFoundResponse('Image file not found');
    }
  } catch (error) {
    console.error('Image serve error:', error);
    return notFoundResponse('Failed to serve image');
  }
}
