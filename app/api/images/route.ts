import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/utils/auth-middleware';
import { unauthorizedResponse, errorResponse, createdResponse } from '@/lib/utils/api-response';
import { uploadAndProcessImage } from '@/lib/utils/image-upload';

// Disable static generation - this route requires runtime execution
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);

  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return errorResponse('No file provided', 400);
    }

    const result = await uploadAndProcessImage(file, auth.user.id);

    return createdResponse({
      id: result.hostedImageId,
      filePath: result.filePath,
      filename: result.filename,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }
    return errorResponse('Failed to upload image', 500);
  }
}
