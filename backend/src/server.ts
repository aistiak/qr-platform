import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { registerMcpHttpRoutes, startMcpStdioServer } from './mcp/server';
import { apiRouter } from './routes';
import { attachSessionUser } from './utils/auth';

dotenv.config();

export const app = express();
const port = Number(process.env.PORT || 4000);
const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(attachSessionUser);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'backend' });
});

app.use('/api', apiRouter);

async function bootstrap() {
  const mcpEnabled = process.env.MCP_ENABLED === 'true' || process.env.MCP_ONLY === 'true';
  const mcpHttpEnabled = mcpEnabled && process.env.MCP_HTTP_ENABLED !== 'false';
  const mcpStdioEnabled = mcpEnabled && process.env.MCP_STDIO_ENABLED === 'true';

  if (mcpHttpEnabled) {
    const mcpPath = process.env.MCP_HTTP_PATH || '/mcp';
    registerMcpHttpRoutes(app, mcpPath);
  }

  if (mcpStdioEnabled) {
    await startMcpStdioServer();
  }

  app.listen(port, () => {
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
