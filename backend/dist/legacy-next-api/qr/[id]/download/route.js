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
const server_1 = require("next/server");
const auth_middleware_1 = require("@/lib/utils/auth-middleware");
const api_response_1 = require("@/lib/utils/api-response");
const mongodb_1 = require("@/lib/db/mongodb");
const QRCode_1 = __importDefault(require("@/lib/models/QRCode"));
const generator_1 = require("@/lib/qr/generator");
const url_1 = require("@/lib/utils/url");
// Disable static generation - this route requires runtime execution
exports.dynamic = 'force-dynamic';
async function GET(request, { params }) {
    const auth = await (0, auth_middleware_1.requireAuth)(request);
    if (!auth) {
        return (0, auth_middleware_1.unauthorizedResponse)();
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
        // Get format from query parameter (default: png)
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'png';
        // Generate scan URL using the base URL utility
        const scanUrl = (0, url_1.getScanUrl)(params.id, request);
        const sanitizedName = (qrCode.customName || 'qr-code').replace(/[^a-z0-9]/gi, '-').toLowerCase();
        if (format === 'svg') {
            // Generate SVG
            const { generateQRCodeSVG } = await Promise.resolve().then(() => __importStar(require('@/lib/qr/generator')));
            const svgString = await generateQRCodeSVG(scanUrl, {
                size: 512,
                errorCorrectionLevel: 'H', // High error correction for better quality
            });
            return new server_1.NextResponse(svgString, {
                headers: {
                    'Content-Type': 'image/svg+xml',
                    'Content-Disposition': `attachment; filename="qr-code-${sanitizedName}.svg"`,
                },
            });
        }
        else {
            // Generate PNG (default)
            const qrBuffer = await (0, generator_1.generateQRCodeBuffer)(scanUrl, {
                size: 1024, // Higher resolution for better quality
                errorCorrectionLevel: 'H', // High error correction for better scannability
            });
            return new server_1.NextResponse(qrBuffer, {
                headers: {
                    'Content-Type': 'image/png',
                    'Content-Disposition': `attachment; filename="qr-code-${sanitizedName}.png"`,
                },
            });
        }
    }
    catch (error) {
        console.error('Download QR code error:', error);
        return (0, api_response_1.errorResponse)('Failed to generate QR code download', 500);
    }
}
