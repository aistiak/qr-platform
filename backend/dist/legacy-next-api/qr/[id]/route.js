"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
exports.PATCH = PATCH;
exports.DELETE = DELETE;
const auth_middleware_1 = require("@/lib/utils/auth-middleware");
const api_response_1 = require("@/lib/utils/api-response");
const mongodb_1 = require("@/lib/db/mongodb");
const QRCode_1 = __importDefault(require("@/lib/models/QRCode"));
const HostedImage_1 = __importDefault(require("@/lib/models/HostedImage"));
const analytics_1 = require("@/lib/utils/analytics");
const validation_1 = require("@/lib/utils/validation");
const validator_1 = require("@/lib/qr/validator");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
// Disable static generation - this route requires runtime execution
exports.dynamic = 'force-dynamic';
async function GET(request, { params }) {
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
        })
            .populate('hostedImageId', 'filename filePath')
            .lean();
        if (!qrCode) {
            return (0, api_response_1.notFoundResponse)('QR code not found');
        }
        // Compute access count from QRCodeAccess collection
        const accessCount = await (0, analytics_1.getTotalAccessCount)(params.id);
        return (0, api_response_1.successResponse)({
            id: qrCode._id.toString(),
            customName: qrCode.customName,
            targetType: qrCode.targetType,
            targetUrl: qrCode.targetUrl,
            hostedImageId: qrCode.hostedImageId
                ? {
                    id: qrCode.hostedImageId._id.toString(),
                    filePath: qrCode.hostedImageId.filePath,
                }
                : null,
            status: qrCode.status,
            accessCount,
            createdAt: qrCode.createdAt,
            updatedAt: qrCode.updatedAt,
        });
    }
    catch (error) {
        console.error('Get QR code error:', error);
        return (0, api_response_1.errorResponse)('Failed to fetch QR code', 500);
    }
}
async function PATCH(request, { params }) {
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
        const body = await request.json();
        const validationResult = validation_1.updateQRCodeSchema.safeParse(body);
        if (!validationResult.success) {
            return (0, api_response_1.errorResponse)(validationResult.error.errors.map((e) => e.message).join(', '), 400);
        }
        const { customName, status, targetType, targetUrl, hostedImageId } = validationResult.data;
        if (customName !== undefined) {
            qrCode.customName = customName;
        }
        if (status !== undefined) {
            // Validate status transitions
            const validTransitions = {
                active: ['paused', 'archived'],
                paused: ['active'],
                archived: ['active'],
            };
            if (!validTransitions[qrCode.status]?.includes(status)) {
                return (0, api_response_1.errorResponse)(`Cannot transition from ${qrCode.status} to ${status}`, 400);
            }
            qrCode.status = status;
        }
        // Handle target type and target updates
        let targetChanged = false;
        const oldHostedImageId = qrCode.hostedImageId;
        if (targetType !== undefined) {
            qrCode.targetType = targetType;
            targetChanged = true;
            if (targetType === 'url') {
                // Switching to URL - clear hosted image
                qrCode.hostedImageId = undefined;
                if (targetUrl) {
                    // Validate URL
                    const urlValidation = (0, validator_1.validateURL)(targetUrl);
                    if (!urlValidation.valid) {
                        return (0, api_response_1.errorResponse)(urlValidation.error || 'Invalid URL', 400);
                    }
                    qrCode.targetUrl = targetUrl;
                }
            }
            else if (targetType === 'image') {
                // Switching to image - clear target URL
                qrCode.targetUrl = undefined;
                if (hostedImageId) {
                    // Validate hosted image exists and belongs to user
                    const hostedImage = await HostedImage_1.default.findOne({
                        _id: hostedImageId,
                        userId: auth.user.id,
                    });
                    if (!hostedImage) {
                        return (0, api_response_1.errorResponse)('Hosted image not found or access denied', 404);
                    }
                    qrCode.hostedImageId = hostedImage._id;
                }
            }
        }
        else {
            // Updating target without changing type
            if (targetUrl !== undefined && qrCode.targetType === 'url') {
                const urlValidation = (0, validator_1.validateURL)(targetUrl);
                if (!urlValidation.valid) {
                    return (0, api_response_1.errorResponse)(urlValidation.error || 'Invalid URL', 400);
                }
                qrCode.targetUrl = targetUrl;
                targetChanged = true;
            }
            if (hostedImageId !== undefined && qrCode.targetType === 'image') {
                // Validate hosted image exists and belongs to user
                const hostedImage = await HostedImage_1.default.findOne({
                    _id: hostedImageId,
                    userId: auth.user.id,
                });
                if (!hostedImage) {
                    return (0, api_response_1.errorResponse)('Hosted image not found or access denied', 404);
                }
                qrCode.hostedImageId = hostedImage._id;
                targetChanged = true;
            }
        }
        await qrCode.save();
        // Cleanup old hosted image if switching from image to URL
        if (targetChanged && oldHostedImageId && qrCode.targetType === 'url') {
            try {
                const oldImage = await HostedImage_1.default.findById(oldHostedImageId);
                if (oldImage) {
                    // Check if image is used by other QR codes
                    const otherQRCodes = await QRCode_1.default.countDocuments({
                        hostedImageId: oldHostedImageId,
                        _id: { $ne: qrCode._id },
                    });
                    // Only delete if not used by other QR codes
                    if (otherQRCodes === 0) {
                        const filePath = path_1.default.join(process.cwd(), 'public', oldImage.filePath.startsWith('/') ? oldImage.filePath.slice(1) : oldImage.filePath);
                        try {
                            await fs_1.promises.unlink(filePath);
                        }
                        catch (fileError) {
                            console.error('Failed to delete old image file:', fileError);
                        }
                        await HostedImage_1.default.findByIdAndDelete(oldHostedImageId);
                    }
                }
            }
            catch (cleanupError) {
                console.error('Failed to cleanup old hosted image:', cleanupError);
                // Don't fail the update if cleanup fails
            }
        }
        const updatedQR = await QRCode_1.default.findById(qrCode._id)
            .populate('hostedImageId', 'filename filePath')
            .lean();
        return (0, api_response_1.successResponse)({
            id: updatedQR._id.toString(),
            customName: updatedQR.customName,
            targetType: updatedQR.targetType,
            targetUrl: updatedQR.targetUrl,
            hostedImageId: updatedQR.hostedImageId
                ? {
                    id: updatedQR.hostedImageId._id.toString(),
                    filePath: updatedQR.hostedImageId.filePath,
                }
                : null,
            status: updatedQR.status,
            accessCount: updatedQR.accessCount || 0,
            createdAt: updatedQR.createdAt,
            updatedAt: updatedQR.updatedAt,
        });
    }
    catch (error) {
        console.error('Update QR code error:', error);
        return (0, api_response_1.errorResponse)('Failed to update QR code', 500);
    }
}
async function DELETE(request, { params }) {
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
        // Soft delete by setting status to deleted
        qrCode.status = 'deleted';
        await qrCode.save();
        return (0, api_response_1.successResponse)({ message: 'QR code deleted successfully' });
    }
    catch (error) {
        console.error('Delete QR code error:', error);
        return (0, api_response_1.errorResponse)('Failed to delete QR code', 500);
    }
}
