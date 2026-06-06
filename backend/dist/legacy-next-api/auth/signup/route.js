"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.POST = POST;
const mongodb_1 = require("@/lib/db/mongodb");
const User_1 = __importDefault(require("@/lib/models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const validation_1 = require("@/lib/utils/validation");
const api_response_1 = require("@/lib/utils/api-response");
const logger_1 = require("@/lib/utils/logger");
// Disable static generation - this route requires runtime execution
exports.dynamic = 'force-dynamic';
async function POST(request) {
    try {
        await (0, mongodb_1.connectDB)();
        const body = await request.json();
        const validationResult = validation_1.signUpSchema.safeParse(body);
        if (!validationResult.success) {
            return (0, api_response_1.errorResponse)(validationResult.error.errors.map((e) => e.message).join(', '), 400);
        }
        const { name, email, password } = validationResult.data;
        // Check if user already exists
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return (0, api_response_1.errorResponse)('Email already exists', 409);
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // Create user
        const user = await User_1.default.create({
            name,
            email,
            passwordHash,
            role: 'user',
            qrCodeLimit: 20,
        });
        // Return user data (without password hash)
        const userResponse = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            qrCodeLimit: user.qrCodeLimit,
        };
        logger_1.logger.auth('User signed up successfully', { userId: user._id.toString(), email: user.email });
        return (0, api_response_1.createdResponse)({
            user: userResponse,
            message: 'User created successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Sign up error', error);
        return (0, api_response_1.errorResponse)('Internal server error', 500);
    }
}
