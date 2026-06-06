import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { env } from './env';
import { registerMcpHttpRoutes, startMcpStdioServer } from './mcp/server';
import { apiRouter } from './routes';
import { attachSessionUser } from './utils/auth';

export const app = express();
const port = env.PORT;
const frontendOrigin = env.FRONTEND_URL;

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(attachSessionUser);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'backend' });
});

app.use('/api', apiRouter);

async function bootstrap() {
  if (env.mcpHttpEnabled) {
    registerMcpHttpRoutes(app, env.mcpHttpPath);
  }

  if (env.mcpStdioEnabled) {
    await startMcpStdioServer();
  }

  app.listen(port, () => {
    const mcpUrl = env.mcpHttpEnabled
      ? `, MCP URL: http://localhost:${port}${env.mcpHttpPath}`
      : '';
    console.log(`Backend listening on port ${port}${mcpUrl}`);
  });
}

if (require.main === module) {
  bootstrap().catch((error) => {
    console.error('Failed to bootstrap backend:', error);
    process.exit(1);
  });
}
