"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
const server_1 = require("next/server");
const mongodb_1 = require("@/lib/db/mongodb");
const QRCode_1 = __importDefault(require("@/lib/models/QRCode"));
// Import HostedImage to register the model for population
require("@/lib/models/HostedImage");
const QRCodeAccess_1 = __importDefault(require("@/lib/models/QRCodeAccess"));
const api_response_1 = require("@/lib/utils/api-response");
const url_1 = require("@/lib/utils/url");
// Disable static generation - this route requires runtime execution
exports.dynamic = 'force-dynamic';
async function GET(request, { params }) {
    try {
        await (0, mongodb_1.connectDB)();
        const qrCode = await QRCode_1.default.findById(params.id).populate('hostedImageId', '_id filePath');
        if (!qrCode) {
            return (0, api_response_1.notFoundResponse)();
        }
        // Check if QR code is paused, archived, or deleted - return 404
        if (qrCode.status === 'paused' || qrCode.status === 'archived' || qrCode.status === 'deleted') {
            return (0, api_response_1.notFoundResponse)();
        }
        // Record access for analytics
        try {
            await QRCodeAccess_1.default.create({
                qrCodeId: qrCode._id,
                timestamp: new Date(),
                userAgent: request.headers.get('user-agent') || undefined,
                referer: request.headers.get('referer') || undefined,
            });
        }
        catch (analyticsError) {
            // Don't fail the redirect if analytics recording fails
            console.error('Analytics recording error:', analyticsError);
        }
        // Determine redirect URL
        let redirectUrl;
        if (qrCode.targetType === 'url' && qrCode.targetUrl) {
            redirectUrl = qrCode.targetUrl;
        }
        else if (qrCode.targetType === 'image' && qrCode.hostedImageId) {
            const hostedImage = qrCode.hostedImageId;
            const baseUrl = (0, url_1.getBaseUrl)(request);
            redirectUrl = `${baseUrl}/api/images/${hostedImage._id}`;
        }
        else {
            return (0, api_response_1.notFoundResponse)();
        }
        // Redirect to target
        return server_1.NextResponse.redirect(redirectUrl, { status: 302 });
    }
    catch (error) {
        console.error('Scan QR code error:', error);
        return (0, api_response_1.notFoundResponse)();
    }
}
