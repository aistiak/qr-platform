import { z } from 'zod';

export const signUpSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters'),
  email: z.string().email('Please provide a valid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signInSchema = z.object({
  email: z.string().email('Please provide a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const updateQRCodeSchema = z.object({
  customName: z.string().max(100).optional(),
  status: z.enum(['active', 'paused', 'archived']).optional(),
  targetType: z.enum(['url', 'image']).optional(),
  targetUrl: z.string().url().optional(),
  hostedImageId: z.string().optional(),
}).refine(
  (data) => {
    // If targetType is provided, ensure corresponding target is provided
    if (data.targetType === 'url' && !data.targetUrl) {
      return false;
    }
    if (data.targetType === 'image' && !data.hostedImageId) {
      return false;
    }
    return true;
  },
  {
    message: 'targetUrl is required when targetType is "url", and hostedImageId is required when targetType is "image"',
  }
);

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type UpdateQRCodeInput = z.infer<typeof updateQRCodeSchema>;