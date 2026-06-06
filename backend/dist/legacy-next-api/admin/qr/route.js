"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
const admin_middleware_1 = require("@/lib/utils/admin-middleware");
const api_response_1 = require("@/lib/utils/api-response");
const mongodb_1 = require("@/lib/db/mongodb");
const QRCode_1 = __importDefault(require("@/lib/models/QRCode"));
// Import HostedImage to register the model for population
require("@/lib/models/HostedImage");
// Disable static generation - this route requires runtime execution
exports.dynamic = 'force-dynamic';
async function GET(request) {
    const auth = await (0, admin_middleware_1.requireAdmin)(request);
    if (!auth) {
        return (0, admin_middleware_1.adminForbiddenResponse)();
    }
    try {
        await (0, mongodb_1.connectDB)();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'all';
        const query = {
            status: { $ne: 'deleted' },
        };
        if (status !== 'all') {
            query.status = status;
        }
        const qrCodes = await QRCode_1.default.find(query)
            .sort({ createdAt: -1 })
            .populate('userId', 'name email')
            .populate('hostedImageId', 'filename filePath')
            .lean();
        return (0, api_response_1.successResponse)({
            qrCodes: qrCodes.map((qr) => ({
                id: qr._id.toString(),
                customName: qr.customName,
                targetType: qr.targetType,
                targetUrl: qr.targetUrl,
                hostedImageId: qr.hostedImageId
                    ? {
                        id: qr.hostedImageId._id.toString(),
                        filePath: qr.hostedImageId.filePath,
                    }
                    : null,
                status: qr.status,
                accessCount: qr.accessCount || 0,
                createdAt: qr.createdAt,
                updatedAt: qr.updatedAt,
                user: qr.userId
                    ? {
                        id: qr.userId._id.toString(),
                        name: qr.userId.name,
                        email: qr.userId.email,
                    }
                    : null,
            })),
            total: qrCodes.length,
        });
    }
    catch (error) {
        console.error('Get admin QR codes error:', error);
        return (0, api_response_1.errorResponse)('Failed to fetch QR codes', 500);
    }
}
