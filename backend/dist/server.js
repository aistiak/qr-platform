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
exports.app = void 0;
require("./instrument");
const Sentry = __importStar(require("@sentry/node"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const env_1 = require("./env");
const bugsink_user_1 = require("./lib/bugsink-user");
const server_1 = require("./mcp/server");
const routes_1 = require("./routes");
const auth_1 = require("./utils/auth");
exports.app = (0, express_1.default)();
const port = env_1.env.PORT;
const frontendOrigin = env_1.env.FRONTEND_URL;
exports.app.use((0, cors_1.default)({ origin: frontendOrigin, credentials: true }));
exports.app.use(express_1.default.json());
exports.app.use((0, cookie_parser_1.default)());
exports.app.use(auth_1.attachSessionUser);
exports.app.use((req, _res, next) => {
    (0, bugsink_user_1.setBugsinkUser)(req.user ?? null);
    next();
});
exports.app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'backend' });
});
exports.app.get('/test/bugsink', (_req, _res) => {
    throw new Error('Bugsink backend test error');
});
exports.app.use('/api', routes_1.apiRouter);
async function bootstrap() {
    if (env_1.env.mcpHttpEnabled) {
        (0, server_1.registerMcpHttpRoutes)(exports.app, env_1.env.mcpHttpPath);
    }
    if (env_1.env.mcpStdioEnabled) {
        await (0, server_1.startMcpStdioServer)();
    }
    Sentry.setupExpressErrorHandler(exports.app);
    exports.app.listen(port, () => {
        const mcpUrl = env_1.env.mcpHttpEnabled
            ? `, MCP URL: http://localhost:${port}${env_1.env.mcpHttpPath}`
            : '';
        console.log(`Backend listening on port ${port}${mcpUrl}`);
    });
}
if (require.main === module) {
    bootstrap().catch(async (error) => {
        console.error('Failed to bootstrap backend:', error);
        Sentry.captureException(error);
        await Sentry.flush(2000);
        process.exit(1);
    });
}
