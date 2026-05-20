"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
exports.POST = POST;
const auth_middleware_1 = require("@/lib/utils/auth-middleware");
const api_response_1 = require("@/lib/utils/api-response");
const mongodb_1 = require("@/lib/db/mongodb");
const QRCode_1 = __importDefault(require("@/lib/models/QRCode"));
const HostedImage_1 = __importDefault(require("@/lib/models/HostedImage")); // Import to register the model
const analytics_1 = require("@/lib/utils/analytics");
// Ensure HostedImage model is registered by referencing it
// This ensures the import executes and registers the model with Mongoose
if (typeof HostedImage_1.default !== 'undefined') {
    // Model is registered via import side-effect
}
const User_1 = __importDefault(require("@/lib/models/User"));
const logger_1 = require("@/lib/utils/logger");
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
const validator_1 = require("@/lib/qr/validator");
const createQRCodeSchema = zod_1.z.object({
    customName: zod_1.z.string().max(100).optional(),
    targetType: zod_1.z.enum(['url', 'image']),
    targetUrl: zod_1.z.string().url().optional(),
    hostedImageId: zod_1.z.string().optional(),
});
// Disable static generation - this route requires runtime execution
exports.dynamic = 'force-dynamic';
async function GET(request) {
    const auth = await (0, auth_middleware_1.requireAuth)(request);
    if (!auth) {
        return (0, api_response_1.unauthorizedResponse)();
    }
    try {
        await (0, mongodb_1.connectDB)();
        // Ensure HostedImage model is registered
        // In Next.js, sometimes models need to be explicitly registered before use
        // The import at the top should register it, but we verify and force registration if needed
        if (!mongoose_1.default.models.HostedImage) {
            logger_1.logger.warn('HostedImage model not found, attempting dynamic import');
            // Force import to ensure model is registered
            const HostedImageModule = await Promise.resolve().then(() => __importStar(require('@/lib/models/HostedImage')));
            // Access the default export to ensure module executes
            void HostedImageModule.default;
        }
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'active';
        // Convert userId string to ObjectId
        let userIdObjectId;
        try {
            userIdObjectId = new mongoose_1.default.Types.ObjectId(auth.user.id);
        }
        catch (error) {
            logger_1.logger.error('Invalid user ID format', error, { userId: auth.user.id });
            return (0, api_response_1.errorResponse)('Invalid user ID', 400);
        }
        const query = {
            userId: userIdObjectId,
        };
        // Always exclude deleted items, and filter by status if not 'all'
        if (status === 'all') {
            query.status = { $ne: 'deleted' };
        }
        else {
            // Filter by specific status (which implicitly excludes deleted since deleted is not active/paused/archived)
            query.status = status;
        }
        const qrCodes = await QRCode_1.default.find(query)
            .sort({ createdAt: -1 })
            .populate('hostedImageId', 'filename filePath')
            .lean();
        // Compute access counts for all QR codes
        const qrCodesWithAccessCount = await Promise.all(qrCodes.map(async (qr) => {
            try {
                const accessCount = await (0, analytics_1.getTotalAccessCount)(qr._id.toString());
                return {
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
                    accessCount,
                    createdAt: qr.createdAt,
                    updatedAt: qr.updatedAt,
                };
            }
            catch (err) {
                // If access count fails, default to 0 and log warning
                logger_1.logger.warn('Failed to get access count for QR code', {
                    qrCodeId: qr._id.toString(),
                    error: err
                });
                return {
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
                    accessCount: 0,
                    createdAt: qr.createdAt,
                    updatedAt: qr.updatedAt,
                };
            }
        }));
        return (0, api_response_1.successResponse)({
            qrCodes: qrCodesWithAccessCount,
            total: qrCodesWithAccessCount.length,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger_1.logger.error('Get QR codes error', error, {
            userId: auth?.user?.id || 'unknown',
            errorMessage,
            errorStack
        });
        console.error('Detailed error:', error);
        return (0, api_response_1.errorResponse)(`Failed to fetch QR codes: ${errorMessage}`, 500);
    }
}
async function POST(request) {
    const auth = await (0, auth_middleware_1.requireAuth)(request);
    if (!auth) {
        return (0, api_response_1.unauthorizedResponse)();
    }
    try {
        await (0, mongodb_1.connectDB)();
        // Convert userId string to ObjectId
        let userIdObjectId;
        try {
            userIdObjectId = new mongoose_1.default.Types.ObjectId(auth.user.id);
        }
        catch (error) {
            logger_1.logger.error('Invalid user ID format in POST', error, { userId: auth.user.id });
            return (0, api_response_1.errorResponse)('Invalid user ID', 400);
        }
        // Check QR code limit
        const user = await User_1.default.findById(userIdObjectId);
        if (!user) {
            return (0, api_response_1.errorResponse)('User not found', 404);
        }
        const activeQRCount = await QRCode_1.default.countDocuments({
            userId: userIdObjectId,
            status: { $ne: 'deleted' },
        });
        if (activeQRCount >= user.qrCodeLimit) {
            return (0, api_response_1.errorResponse)(`QR code limit reached (${user.qrCodeLimit}). Please delete or archive existing QR codes.`, 403);
        }
        const body = await request.json();
        const validationResult = createQRCodeSchema.safeParse(body);
        if (!validationResult.success) {
            return (0, api_response_1.errorResponse)(validationResult.error.errors.map((e) => e.message).join(', '), 400);
        }
        const { customName, targetType, targetUrl, hostedImageId } = validationResult.data;
        // Validate based on target type
        if (targetType === 'url' && !targetUrl) {
            return (0, api_response_1.errorResponse)('targetUrl is required when targetType is "url"', 400);
        }
        if (targetType === 'url' && targetUrl) {
            const urlValidation = (0, validator_1.validateURL)(targetUrl);
            if (!urlValidation.valid) {
                return (0, api_response_1.errorResponse)(urlValidation.error || 'Invalid URL', 400);
            }
        }
        if (targetType === 'image' && !hostedImageId) {
            return (0, api_response_1.errorResponse)('hostedImageId is required when targetType is "image"', 400);
        }
        // Create QR code
        const qrCode = await QRCode_1.default.create({
            userId: userIdObjectId,
            customName: customName || 'Untitled QR Code',
            targetType,
            targetUrl: targetType === 'url' ? targetUrl : undefined,
            hostedImageId: targetType === 'image' ? (hostedImageId ? new mongoose_1.default.Types.ObjectId(hostedImageId) : undefined) : undefined,
            status: 'active',
            accessCount: 0,
        });
        const populatedQR = await QRCode_1.default.findById(qrCode._id)
            .populate('hostedImageId', 'filename filePath')
            .lean();
        logger_1.logger.qrCode('QR code created', {
            qrCodeId: populatedQR._id.toString(),
            userId: auth.user.id,
            targetType: populatedQR.targetType,
        });
        return (0, api_response_1.createdResponse)({
            id: populatedQR._id.toString(),
            customName: populatedQR.customName,
            targetType: populatedQR.targetType,
            targetUrl: populatedQR.targetUrl,
            hostedImageId: populatedQR.hostedImageId
                ? {
                    id: populatedQR.hostedImageId._id.toString(),
                    filePath: populatedQR.hostedImageId.filePath,
                }
                : null,
            status: populatedQR.status,
            accessCount: populatedQR.accessCount || 0,
            createdAt: populatedQR.createdAt,
            updatedAt: populatedQR.updatedAt,
        });
    }
    catch (error) {
        logger_1.logger.error('Create QR code error', error, { userId: auth.user.id });
        return (0, api_response_1.errorResponse)('Failed to create QR code', 500);
    }
}
