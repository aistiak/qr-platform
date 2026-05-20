"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
const auth_middleware_1 = require("@/lib/utils/auth-middleware");
const api_response_1 = require("@/lib/utils/api-response");
const mongodb_1 = require("@/lib/db/mongodb");
const QRCode_1 = __importDefault(require("@/lib/models/QRCode"));
const analytics_1 = require("@/lib/utils/analytics");
// Disable static generation - this route requires runtime execution
exports.dynamic = 'force-dynamic';
async function GET(request, { params }) {
    const auth = await (0, auth_middleware_1.requireAuth)(request);
    if (!auth) {
        return (0, api_response_1.unauthorizedResponse)();
    }
    try {
        await (0, mongodb_1.connectDB)();
        // Verify QR code exists and belongs to user
        const qrCode = await QRCode_1.default.findOne({
            _id: params.id,
            userId: auth.user.id,
            status: { $ne: 'deleted' },
        });
        if (!qrCode) {
            return (0, api_response_1.notFoundResponse)('QR code not found');
        }
        // Get time period from query parameter (default: day)
        const { searchParams } = new URL(request.url);
        const period = (searchParams.get('period') || 'day');
        // Validate period
        if (!['day', 'week', 'month'].includes(period)) {
            return (0, api_response_1.errorResponse)('Invalid period. Must be "day", "week", or "month"', 400);
        }
        // Get analytics data
        const analytics = await (0, analytics_1.aggregateQRCodeAccess)(params.id, period);
        const total = await (0, analytics_1.getTotalAccessCount)(params.id);
        return (0, api_response_1.successResponse)({
            ...analytics,
            total,
        });
    }
    catch (error) {
        console.error('Get analytics error:', error);
        return (0, api_response_1.errorResponse)('Failed to fetch analytics', 500);
    }
}
