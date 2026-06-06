"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.POST = POST;
const auth_middleware_1 = require("@/lib/utils/auth-middleware");
const api_response_1 = require("@/lib/utils/api-response");
const image_upload_1 = require("@/lib/utils/image-upload");
// Disable static generation - this route requires runtime execution
exports.dynamic = 'force-dynamic';
async function POST(request) {
    const auth = await (0, auth_middleware_1.requireAuth)(request);
    if (!auth) {
        return (0, api_response_1.unauthorizedResponse)();
    }
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        if (!file) {
            return (0, api_response_1.errorResponse)('No file provided', 400);
        }
        const result = await (0, image_upload_1.uploadAndProcessImage)(file, auth.user.id);
        return (0, api_response_1.createdResponse)({
            id: result.hostedImageId,
            filePath: result.filePath,
            filename: result.filename,
        });
    }
    catch (error) {
        console.error('Image upload error:', error);
        if (error instanceof Error) {
            return (0, api_response_1.errorResponse)(error.message, 400);
        }
        return (0, api_response_1.errorResponse)('Failed to upload image', 500);
    }
}
