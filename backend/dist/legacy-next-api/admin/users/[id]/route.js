"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.PATCH = PATCH;
const admin_middleware_1 = require("@/lib/utils/admin-middleware");
const api_response_1 = require("@/lib/utils/api-response");
const mongodb_1 = require("@/lib/db/mongodb");
const User_1 = __importDefault(require("@/lib/models/User"));
const logger_1 = require("@/lib/utils/logger");
const zod_1 = require("zod");
// Disable static generation - this route requires runtime execution
exports.dynamic = 'force-dynamic';
const updateUserSchema = zod_1.z.object({
    qrCodeLimit: zod_1.z.number().int().min(1, 'QR code limit must be at least 1'),
});
async function PATCH(request, { params }) {
    const auth = await (0, admin_middleware_1.requireAdmin)(request);
    if (!auth) {
        return (0, admin_middleware_1.adminForbiddenResponse)();
    }
    try {
        await (0, mongodb_1.connectDB)();
        const user = await User_1.default.findById(params.id);
        if (!user) {
            return (0, api_response_1.notFoundResponse)('User not found');
        }
        const body = await request.json();
        const validationResult = updateUserSchema.safeParse(body);
        if (!validationResult.success) {
            return (0, api_response_1.errorResponse)(validationResult.error.errors.map((e) => e.message).join(', '), 400);
        }
        const { qrCodeLimit } = validationResult.data;
        user.qrCodeLimit = qrCodeLimit;
        await user.save();
        logger_1.logger.admin('User QR code limit updated', {
            adminUserId: auth.user.id,
            targetUserId: user._id.toString(),
            newLimit: qrCodeLimit,
        });
        return (0, api_response_1.successResponse)({
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            qrCodeLimit: user.qrCodeLimit,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    }
    catch (error) {
        logger_1.logger.error('Update user error', error, {
            adminUserId: auth.user.id,
            targetUserId: params.id,
        });
        return (0, api_response_1.errorResponse)('Failed to update user', 500);
    }
}
