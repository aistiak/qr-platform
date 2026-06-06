"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.GET = GET;
const server_1 = require("next/server");
const mongodb_1 = require("@/lib/db/mongodb");
const HostedImage_1 = __importDefault(require("@/lib/models/HostedImage"));
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const api_response_1 = require("@/lib/utils/api-response");
// Disable static generation - this route requires runtime execution
exports.dynamic = 'force-dynamic';
async function GET(request, { params }) {
    try {
        await (0, mongodb_1.connectDB)();
        const hostedImage = await HostedImage_1.default.findById(params.id);
        if (!hostedImage) {
            return (0, api_response_1.notFoundResponse)('Image not found');
        }
        // Construct file path
        const filePath = path_1.default.join(process.cwd(), 'public', hostedImage.filePath.startsWith('/') ? hostedImage.filePath.slice(1) : hostedImage.filePath);
        try {
            const fileBuffer = await (0, promises_1.readFile)(filePath);
            return new server_1.NextResponse(fileBuffer, {
                headers: {
                    'Content-Type': hostedImage.mimeType,
                    'Content-Length': fileBuffer.length.toString(),
                },
            });
        }
        catch (fileError) {
            console.error('File read error:', fileError);
            return (0, api_response_1.notFoundResponse)('Image file not found');
        }
    }
    catch (error) {
        console.error('Image serve error:', error);
        return (0, api_response_1.notFoundResponse)('Failed to serve image');
    }
}
