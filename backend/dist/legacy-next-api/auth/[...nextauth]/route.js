"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.GET = exports.handlers = exports.dynamic = void 0;
const next_auth_1 = __importDefault(require("next-auth"));
const auth_1 = require("@/lib/auth");
// Disable static generation - this route requires runtime execution
exports.dynamic = 'force-dynamic';
// NextAuth v5 beta - use the handlers export
exports.handlers = (0, next_auth_1.default)(auth_1.authOptions).handlers;
exports.GET = exports.handlers.GET, exports.POST = exports.handlers.POST;
