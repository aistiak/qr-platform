"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.POST = POST;
const validation_1 = require("@/lib/utils/validation");
const api_response_1 = require("@/lib/utils/api-response");
const mongodb_1 = require("@/lib/db/mongodb");
const User_1 = __importDefault(require("@/lib/models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Disable static generation - this route requires runtime execution
exports.dynamic = 'force-dynamic';
async function POST(request) {
    try {
        const body = await request.json();
        const validationResult = validation_1.signInSchema.safeParse(body);
        if (!validationResult.success) {
            return (0, api_response_1.errorResponse)(validationResult.error.errors.map((e) => e.message).join(', '), 400);
        }
        const { email, password } = validationResult.data;
        await (0, mongodb_1.connectDB)();
        const user = await User_1.default.findOne({ email: email.toLowerCase() });
        if (!user) {
            return (0, api_response_1.errorResponse)('Invalid email or password', 401);
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return (0, api_response_1.errorResponse)('Invalid email or password', 401);
        }
        // Return success - actual session creation handled by NextAuth on client
        return (0, api_response_1.successResponse)({ message: 'Sign in successful' });
    }
    catch (error) {
        console.error('Sign in error:', error);
        return (0, api_response_1.errorResponse)('Internal server error', 500);
    }
}
