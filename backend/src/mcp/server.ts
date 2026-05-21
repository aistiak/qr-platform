import { randomUUID } from 'crypto';
import type { Express, Request, Response } from 'express';
import { z } from 'zod';
import { ApiTokenScope } from '../models/ApiToken';
import { ApiTokenService } from '../services/api-token.service';
import { PlatformQRService } from '../services/platform-qr.service';

const apiTokenService = new ApiTokenService();
const platformQRService = new PlatformQRService();

function toTextContent(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}

function requireScope(scopes: ApiTokenScope[], required: ApiTokenScope) {
  if (!scopes.includes(required)) {
    throw new Error(`Missing required scope: ${required}`);
  }
}

async function authenticate(inputToken: string | undefined, requiredScope: ApiTokenScope) {
  const token = inputToken || process.env.MCP_API_TOKEN;
  if (!token) {
    throw new Error('API token is required. Pass apiToken or set MCP_API_TOKEN.');
  }

  const auth = await apiTokenService.authenticate(token);
  if (!auth) {
    throw new Error('Invalid or expired API token.');
  }

  requireScope(auth.scopes, requiredScope);
  return auth.userId;
}

function createMcpServer() {
  const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js') as { McpServer: any };

  const server = new McpServer({
    name: 'qr-platform-backend-mcp',
    version: '0.1.0',
  });

  server.tool(
    'qr_list',
    'List QR codes with optional filters and pagination cursor.',
    {
      apiToken: z.string().optional(),
      status: z.enum(['all', 'active', 'paused', 'archived']).optional(),
      limit: z.number().int().min(1).max(100).optional(),
      cursor: z.string().optional(),
    },
    async (input: any) => {
      const userId = await authenticate(input.apiToken, 'qr:list');
      const data = await platformQRService.list(userId, {
        status: input.status,
        limit: input.limit ? String(input.limit) : undefined,
        cursor: input.cursor,
      });

      return toTextContent(data);
    }
  );

  server.tool(
    'qr_get',
    'Get QR code details by id.',
    {
      apiToken: z.string().optional(),
      id: z.string().min(1),
    },
    async (input: any) => {
      const userId = await authenticate(input.apiToken, 'qr:read');
      const data = await platformQRService.details(userId, input.id);
      return toTextContent(data);
    }
  );

  server.tool(
    'qr_create',
    'Create a QR code for URL or hosted image.',
    {
      apiToken: z.string().optional(),
      customName: z.string().max(100).optional(),
      targetType: z.enum(['url', 'image']),
      targetUrl: z.string().url().optional(),
      hostedImageId: z.string().optional(),
    },
    async (input: any) => {
      const userId = await authenticate(input.apiToken, 'qr:create');
      if (input.targetType === 'url' && !input.targetUrl) {
        throw new Error('targetUrl is required when targetType is "url".');
      }
      if (input.targetType === 'image' && !input.hostedImageId) {
        throw new Error('hostedImageId is required when targetType is "image".');
      }

      const data = await platformQRService.create(userId, {
        customName: input.customName,
        targetType: input.targetType,
        targetUrl: input.targetUrl,
        hostedImageId: input.hostedImageId,
      });
      return toTextContent(data);
    }
  );

  server.tool(
    'qr_delete',
    'Soft-delete a QR code by id.',
    {
      apiToken: z.string().optional(),
      id: z.string().min(1),
    },
    async (input: any) => {
      const userId = await authenticate(input.apiToken, 'qr:delete');
      const data = await platformQRService.remove(userId, input.id);
      return toTextContent(data);
    }
  );

  return server;
}

export async function startMcpStdioServer() {
  const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js') as {
    StdioServerTransport: any;
  };
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

export function registerMcpHttpRoutes(app: Express, path = '/mcp') {
  const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js') as {
    StreamableHTTPServerTransport: any;
  };
  const { isInitializeRequest } = require('@modelcontextprotocol/sdk/types.js') as {
    isInitializeRequest: (body: unknown) => boolean;
  };

  const transports: Record<string, any> = {};

  const handleMcpPost = async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    try {
      let transport: any;
      if (sessionId && transports[sessionId]) {
        transport = transports[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (createdSessionId: string) => {
            transports[createdSessionId] = transport;
          },
        });

        transport.onclose = () => {
          const activeSessionId = transport.sessionId;
          if (activeSessionId && transports[activeSessionId]) {
            delete transports[activeSessionId];
          }
        };

        const server = createMcpServer();
        await server.connect(transport);
      } else {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided',
          },
          id: null,
        });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : 'Internal server error',
          },
          id: null,
        });
      }
    }
  };

  const handleMcpGetOrDelete = async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }

    try {
      await transports[sessionId].handleRequest(req, res);
    } catch {
      if (!res.headersSent) {
        res.status(500).send('Failed to process MCP request');
      }
    }
  };

  app.post(path, handleMcpPost);
  app.get(path, handleMcpGetOrDelete);
  app.delete(path, handleMcpGetOrDelete);
}
