import { promises as fs } from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';

function parseMcpEventBody(text: string) {
  for (const line of text.split('\n')) {
    if (line.startsWith('data: ')) {
      return JSON.parse(line.slice(6));
    }
  }

  return JSON.parse(text);
}

function parseToolResult(payload: { result: { content: Array<{ text: string }> } }) {
  return JSON.parse(payload.result.content[0].text);
}

describe('MCP server integration', () => {
  let mongoServer: MongoMemoryServer;
  let app: any;
  const uploadDir = path.join(process.cwd(), '.tmp-test-mcp-images');

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    process.env.SESSION_SECRET = 'test-session-secret';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.APP_URL = 'http://localhost:4000';
    process.env.IMAGE_UPLOAD_DIR = uploadDir;
    delete process.env.MCP_API_TOKEN;

    await fs.mkdir(uploadDir, { recursive: true });

    const serverModule = await import('../src/server');
    const mcpModule = await import('../src/mcp/server');
    const db = await import('../src/db/mongodb');

    app = serverModule.app;
    mcpModule.registerMcpHttpRoutes(app, '/mcp');
    await db.connectDB();
  });

  beforeEach(async () => {
    await mongoose.connection.db?.dropDatabase();
    delete process.env.MCP_API_TOKEN;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    await fs.rm(uploadDir, { recursive: true, force: true });
  });

  const signUpAndSignIn = async (
    client: ReturnType<typeof request.agent>,
    payload: { name: string; email: string; password: string }
  ) => {
    await client.post('/api/auth/signup').send(payload);
    await client.post('/api/auth/signin').send({ email: payload.email, password: payload.password });
  };

  const createApiToken = async (
    client: ReturnType<typeof request.agent>,
    scopes: Array<'qr:create' | 'qr:read' | 'qr:list' | 'qr:delete'>
  ) => {
    const response = await client.post('/api/app/platform/tokens').send({
      name: 'MCP test token',
      scopes,
    });
    expect(response.status).toBe(201);
    return response.body.token as string;
  };

  const createMcpSession = async () => {
    const init = await request(app)
      .post('/mcp')
      .set('Accept', 'application/json, text/event-stream')
      .set('Content-Type', 'application/json')
      .send({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'vitest', version: '1.0.0' },
        },
      });

    expect(init.status).toBe(200);
    const sessionId = init.headers['mcp-session-id'];
    expect(sessionId).toBeTruthy();

    await request(app)
      .post('/mcp')
      .set('Accept', 'application/json, text/event-stream')
      .set('Content-Type', 'application/json')
      .set('mcp-session-id', sessionId)
      .send({ jsonrpc: '2.0', method: 'notifications/initialized' });

    return sessionId as string;
  };

  const mcpRequest = async (sessionId: string, body: Record<string, unknown>) => {
    const response = await request(app)
      .post('/mcp')
      .set('Accept', 'application/json, text/event-stream')
      .set('Content-Type', 'application/json')
      .set('mcp-session-id', sessionId)
      .send(body);

    return {
      status: response.status,
      body: parseMcpEventBody(response.text),
    };
  };

  const callTool = async (
    sessionId: string,
    name: string,
    args: Record<string, unknown>,
    requestId = 2
  ) => {
    return mcpRequest(sessionId, {
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/call',
      params: { name, arguments: args },
    });
  };

  it('rejects MCP requests without a valid session', async () => {
    const response = await request(app)
      .post('/mcp')
      .set('Accept', 'application/json, text/event-stream')
      .set('Content-Type', 'application/json')
      .send({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain('No valid session ID provided');
  });

  it('initializes a session and exposes QR MCP tools', async () => {
    const sessionId = await createMcpSession();
    const toolsList = await mcpRequest(sessionId, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    });

    expect(toolsList.status).toBe(200);
    const toolNames = toolsList.body.result.tools.map((tool: { name: string }) => tool.name);
    expect(toolNames).toEqual(['qr_list', 'qr_get', 'qr_create', 'qr_delete']);
  });

  it('supports QR create, list, get, and delete via MCP tools', async () => {
    const client = request.agent(app);
    await signUpAndSignIn(client, {
      name: 'MCP User',
      email: 'mcp@example.com',
      password: 'password123',
    });
    const apiToken = await createApiToken(client, ['qr:create', 'qr:read', 'qr:list', 'qr:delete']);
    const sessionId = await createMcpSession();

    const created = await callTool(sessionId, 'qr_create', {
      apiToken,
      customName: 'MCP Created QR',
      targetType: 'url',
      targetUrl: 'https://example.com/mcp',
    }, 3);
    expect(created.status).toBe(200);
    const createdQr = parseToolResult(created.body);
    expect(createdQr.customName).toBe('MCP Created QR');
    expect(createdQr.targetUrl).toBe('https://example.com/mcp');

    const listed = await callTool(sessionId, 'qr_list', {
      apiToken,
      status: 'all',
      limit: 10,
    }, 4);
    expect(listed.status).toBe(200);
    const listPayload = parseToolResult(listed.body);
    expect(listPayload.total).toBe(1);
    expect(listPayload.qrs[0].id).toBe(createdQr.id);

    const details = await callTool(sessionId, 'qr_get', {
      apiToken,
      id: createdQr.id,
    }, 5);
    expect(details.status).toBe(200);
    const detailPayload = parseToolResult(details.body);
    expect(detailPayload.id).toBe(createdQr.id);

    const deleted = await callTool(sessionId, 'qr_delete', {
      apiToken,
      id: createdQr.id,
    }, 6);
    expect(deleted.status).toBe(200);
    const deletePayload = parseToolResult(deleted.body);
    expect(deletePayload.message).toBe('QR code deleted successfully');
  });

  it('rejects tool calls without an API token', async () => {
    const sessionId = await createMcpSession();
    const response = await callTool(sessionId, 'qr_list', { status: 'all' });

    expect(response.status).toBe(200);
    expect(response.body.result.isError).toBe(true);
    expect(response.body.result.content[0].text).toContain('API token is required');
  });

  it('rejects tool calls with an invalid API token', async () => {
    const sessionId = await createMcpSession();
    const response = await callTool(sessionId, 'qr_list', {
      apiToken: 'qpt_invalid.invalidtokenvalue',
      status: 'all',
    });

    expect(response.status).toBe(200);
    expect(response.body.result.isError).toBe(true);
    expect(response.body.result.content[0].text).toContain('Invalid or expired API token');
  });

  it('enforces scopes for MCP tool calls', async () => {
    const client = request.agent(app);
    await signUpAndSignIn(client, {
      name: 'Scoped MCP User',
      email: 'scoped-mcp@example.com',
      password: 'password123',
    });
    const listOnlyToken = await createApiToken(client, ['qr:list']);
    const sessionId = await createMcpSession();

    const forbiddenCreate = await callTool(sessionId, 'qr_create', {
      apiToken: listOnlyToken,
      customName: 'Should fail',
      targetType: 'url',
      targetUrl: 'https://example.com/forbidden',
    });

    expect(forbiddenCreate.status).toBe(200);
    expect(forbiddenCreate.body.result.isError).toBe(true);
    expect(forbiddenCreate.body.result.content[0].text).toContain('Missing required scope: qr:create');
  });

  it('uses MCP_API_TOKEN when apiToken is omitted from tool arguments', async () => {
    const client = request.agent(app);
    await signUpAndSignIn(client, {
      name: 'Env MCP User',
      email: 'env-mcp@example.com',
      password: 'password123',
    });
    const apiToken = await createApiToken(client, ['qr:list']);
    process.env.MCP_API_TOKEN = apiToken;

    const sessionId = await createMcpSession();
    const listed = await callTool(sessionId, 'qr_list', { status: 'all', limit: 5 });

    expect(listed.status).toBe(200);
    expect(listed.body.result.isError).toBeFalsy();
    const listPayload = parseToolResult(listed.body);
    expect(Array.isArray(listPayload.qrs)).toBe(true);
  });
});
