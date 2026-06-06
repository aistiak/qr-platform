"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const server_1 = require("./mcp/server");
const routes_1 = require("./routes");
const auth_1 = require("./utils/auth");
dotenv_1.default.config();
exports.app = (0, express_1.default)();
const port = Number(process.env.PORT || 4000);
const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
exports.app.use((0, cors_1.default)({ origin: frontendOrigin, credentials: true }));
exports.app.use(express_1.default.json());
exports.app.use((0, cookie_parser_1.default)());
exports.app.use(auth_1.attachSessionUser);
exports.app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'backend' });
});
exports.app.use('/api', routes_1.apiRouter);
async function bootstrap() {
    const mcpEnabled = process.env.MCP_ENABLED === 'true' || process.env.MCP_ONLY === 'true';
    const mcpHttpEnabled = mcpEnabled && process.env.MCP_HTTP_ENABLED !== 'false';
    const mcpStdioEnabled = mcpEnabled && process.env.MCP_STDIO_ENABLED === 'true';
    if (mcpHttpEnabled) {
        const mcpPath = process.env.MCP_HTTP_PATH || '/mcp';
        (0, server_1.registerMcpHttpRoutes)(exports.app, mcpPath);
    }
    if (mcpStdioEnabled) {
        await (0, server_1.startMcpStdioServer)();
    }
    exports.app.listen(port, () => {
        const mcpPath = process.env.MCP_HTTP_PATH || '/mcp';
        const mcpUrl = mcpHttpEnabled ? `, MCP URL: http://localhost:${port}${mcpPath}` : '';
        console.log(`Backend listening on port ${port}${mcpUrl}`);
    });
}
if (require.main === module) {
    bootstrap().catch((error) => {
        console.error('Failed to bootstrap backend:', error);
        process.exit(1);
    });
}
