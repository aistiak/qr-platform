"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateQRCodeSchema = exports.signInSchema = exports.signUpSchema = void 0;
const zod_1 = require("zod");
exports.signUpSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters'),
    email: zod_1.z.string().email('Please provide a valid email address').toLowerCase(),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
exports.signInSchema = zod_1.z.object({
    email: zod_1.z.string().email('Please provide a valid email address').toLowerCase(),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.updateQRCodeSchema = zod_1.z
    .object({
    customName: zod_1.z.string().max(100).optional(),
    status: zod_1.z.enum(['active', 'paused', 'archived']).optional(),
    targetType: zod_1.z.enum(['url', 'image']).optional(),
    targetUrl: zod_1.z.string().url().optional(),
    hostedImageId: zod_1.z.string().optional(),
})
    .refine((data) => !((data.targetType === 'url' && !data.targetUrl) ||
    (data.targetType === 'image' && !data.hostedImageId)), {
    message: 'targetUrl is required when targetType is "url", and hostedImageId is required when targetType is "image"',
});
