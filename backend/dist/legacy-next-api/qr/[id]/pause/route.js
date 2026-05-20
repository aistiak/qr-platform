"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.POST = POST;
const auth_middleware_1 = require("@/lib/utils/auth-middleware");
const api_response_1 = require("@/lib/utils/api-response");
const mongodb_1 = require("@/lib/db/mongodb");
const QRCode_1 = __importDefault(require("@/lib/models/QRCode"));
// Disable static generation - this route requires runtime execution
exports.dynamic = 'force-dynamic';
async function POST(request, { params }) {
    const auth = await (0, auth_middleware_1.requireAuth)(request);
    if (!auth) {
        return (0, api_response_1.unauthorizedResponse)();
    }
    try {
        await (0, mongodb_1.connectDB)();
        const qrCode = await QRCode_1.default.findOne({
            _id: params.id,
            userId: auth.user.id,
            status: { $ne: 'deleted' },
        });
        if (!qrCode) {
            return (0, api_response_1.notFoundResponse)('QR code not found');
        }
        if (qrCode.status === 'paused') {
            return (0, api_response_1.successResponse)({ message: 'QR code is already paused' });
        }
        if (qrCode.status !== 'active') {
            return (0, api_response_1.errorResponse)('Can only pause active QR codes', 400);
        }
        qrCode.status = 'paused';
        await qrCode.save();
        return (0, api_response_1.successResponse)({ message: 'QR code paused successfully' });
    }
    catch (error) {
        console.error('Pause QR code error:', error);
        return (0, api_response_1.errorResponse)('Failed to pause QR code', 500);
    }
}
