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
const User_1 = __importDefault(require("@/lib/models/User"));
// Disable static generation - this route requires runtime execution
exports.dynamic = 'force-dynamic';
async function GET(request) {
    const auth = await (0, admin_middleware_1.requireAdmin)(request);
    if (!auth) {
        return (0, admin_middleware_1.adminForbiddenResponse)();
    }
    try {
        await (0, mongodb_1.connectDB)();
        const users = await User_1.default.find({})
            .select('name email role qrCodeLimit createdAt updatedAt')
            .sort({ createdAt: -1 })
            .lean();
        return (0, api_response_1.successResponse)({
            users: users.map((user) => ({
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                qrCodeLimit: user.qrCodeLimit,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            })),
            total: users.length,
        });
    }
    catch (error) {
        console.error('Get users error:', error);
        return (0, api_response_1.errorResponse)('Failed to fetch users', 500);
    }
}
