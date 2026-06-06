'use client';

import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { getBackendUrl } from '@/lib/utils/url';

type Endpoint = {
  id: string;
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  title: string;
  auth: string;
  scopes?: string[];
  description: string;
  requestExample: string;
  responseExample: string;
};

type McpTool = {
  id: string;
  name: string;
  scope: string;
  description: string;
  arguments: string;
  responseExample: string;
};

const mcpTools: McpTool[] = [
  {
    id: 'mcp-qr-list',
    name: 'qr_list',
    scope: 'qr:list',
    description: 'List QR codes with optional status filter, limit, and pagination cursor.',
    arguments: `{
  "apiToken": "qpt_xxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
  "status": "all",
  "limit": 20,
  "cursor": "<optional_cursor>"
}`,
    responseExample: `{
  "qrs": [],
  "total": 0,
  "hasMore": false,
  "nextCursor": null
}`,
  },
  {
    id: 'mcp-qr-get',
    name: 'qr_get',
    scope: 'qr:read',
    description: 'Get QR code details by ID.',
    arguments: `{
  "apiToken": "qpt_xxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
  "id": "<qr_id>"
}`,
    responseExample: `{
  "id": "682c80...",
  "customName": "Campaign landing",
  "targetType": "url",
  "targetUrl": "https://example.com",
  "status": "active"
}`,
  },
  {
    id: 'mcp-qr-create',
    name: 'qr_create',
    scope: 'qr:create',
    description: 'Create a QR code for a URL or hosted image target.',
    arguments: `{
  "apiToken": "qpt_xxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
  "customName": "Campaign landing",
  "targetType": "url",
  "targetUrl": "https://example.com"
}`,
    responseExample: `{
  "id": "682c80...",
  "customName": "Campaign landing",
  "targetType": "url",
  "targetUrl": "https://example.com",
  "status": "active"
}`,
  },
  {
    id: 'mcp-qr-delete',
    name: 'qr_delete',
    scope: 'qr:delete',
    description: 'Soft-delete a QR code by ID.',
    arguments: `{
  "apiToken": "qpt_xxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
  "id": "<qr_id>"
}`,
    responseExample: `{
  "message": "QR code deleted successfully"
}`,
  },
];

function buildMcpExamples(backendUrl: string) {
  const mcpUrl = `${backendUrl}/mcp`;

  return {
    mcpUrl,
    mcpInitializeExample: `curl -X POST "${mcpUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": { "name": "my-client", "version": "1.0.0" }
    }
  }'`,
    mcpToolCallExample: `curl -X POST "${mcpUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -H "mcp-session-id: <session_id_from_initialize>" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "qr_list",
      "arguments": {
        "apiToken": "qpt_xxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
        "status": "all",
        "limit": 20
      }
    }
  }'`,
    mcpConfigExample: `{
  "mcpServers": {
    "qr-platform": {
      "url": "${mcpUrl}",
      "apiToken": "qpt_xxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"
    }
  }
}`,
  };
}

const endpoints: Endpoint[] = [
  {
    id: 'list-qrs',
    method: 'GET',
    path: '/api/platform/qrs',
    title: 'List QR codes',
    auth: 'Bearer token',
    scopes: ['qr:list'],
    description: 'Lists QR codes with cursor-based pagination.',
    requestExample: `curl -X GET "http://localhost:3000/api/platform/qrs?status=all&limit=20" \\
  -H "Authorization: Bearer qpt_xxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"`,
    responseExample: `{
  "qrs": [],
  "total": 0,
  "hasMore": false,
  "nextCursor": null
}`,
  },
  {
    id: 'create-qr',
    method: 'POST',
    path: '/api/platform/qrs',
    title: 'Create QR code',
    auth: 'Bearer token',
    scopes: ['qr:create'],
    description: 'Creates a QR for URL or hosted image target.',
    requestExample: `curl -X POST "http://localhost:3000/api/platform/qrs" \\
  -H "Authorization: Bearer qpt_xxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy" \\
  -H "Content-Type: application/json" \\
  --data '{
    "customName": "Campaign landing",
    "targetType": "url",
    "targetUrl": "https://example.com"
  }'`,
    responseExample: `{
  "id": "682c80...",
  "customName": "Campaign landing",
  "targetType": "url",
  "targetUrl": "https://example.com",
  "status": "active"
}`,
  },
  {
    id: 'get-qr',
    method: 'GET',
    path: '/api/platform/qrs/{id}',
    title: 'Get QR detail',
    auth: 'Bearer token',
    scopes: ['qr:read'],
    description: 'Returns details for a specific QR ID.',
    requestExample: `curl -X GET "http://localhost:3000/api/platform/qrs/<qr_id>" \\
  -H "Authorization: Bearer qpt_xxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"`,
    responseExample: `{
  "id": "682c80...",
  "customName": "Campaign landing",
  "targetType": "url",
  "targetUrl": "https://example.com",
  "status": "active"
}`,
  },
  {
    id: 'delete-qr',
    method: 'DELETE',
    path: '/api/platform/qrs/{id}',
    title: 'Delete QR',
    auth: 'Bearer token',
    scopes: ['qr:delete'],
    description: 'Soft-deletes a QR code.',
    requestExample: `curl -X DELETE "http://localhost:3000/api/platform/qrs/<qr_id>" \\
  -H "Authorization: Bearer qpt_xxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"`,
    responseExample: `{
  "message": "QR code deleted successfully"
}`,
  },
];

function methodColor(method: Endpoint['method']) {
  if (method === 'GET') return 'text-green-400 border-green-500/50 bg-green-500/10';
  if (method === 'POST') return 'text-blue-400 border-blue-500/50 bg-blue-500/10';
  return 'text-red-400 border-red-500/50 bg-red-500/10';
}

export function StripeStyleDocs({ backendUrl = getBackendUrl() }: { backendUrl?: string }) {
  const mcpExamples = useMemo(() => buildMcpExamples(backendUrl), [backendUrl]);

  const toc = useMemo(
    () =>
      endpoints.map((endpoint) => ({
        id: endpoint.id,
        label: `${endpoint.method} ${endpoint.path}`,
      })),
    []
  );

  const mcpToc = useMemo(
    () =>
      mcpTools.map((tool) => ({
        id: tool.id,
        label: tool.name,
      })),
    []
  );

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 docs-grid">
        <aside className="lg:sticky lg:top-24 h-fit rounded-xl border border-border bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted mb-3">API Reference</p>
          <nav className="space-y-2">
            <a href="#overview" className="block text-sm text-muted hover:text-foreground">
              Overview
            </a>
            <a href="#authentication" className="block text-sm text-muted hover:text-foreground">
              Authentication
            </a>
            {toc.map((item) => (
              <a key={item.id} href={`#${item.id}`} className="block text-sm text-muted hover:text-foreground">
                {item.label}
              </a>
            ))}
          </nav>

          <p className="text-xs uppercase tracking-[0.16em] text-muted mt-6 mb-3">MCP Server</p>
          <nav className="space-y-2">
            <a href="#mcp-overview" className="block text-sm text-muted hover:text-foreground">
              Overview
            </a>
            <a href="#mcp-config" className="block text-sm text-muted hover:text-foreground">
              MCP config
            </a>
            {/* <a href="#mcp-setup" className="block text-sm text-muted hover:text-foreground">
              Setup
            </a> */}
            <a href="#mcp-http" className="block text-sm text-muted hover:text-foreground">
              HTTP transport
            </a>
            {mcpToc.map((item) => (
              <a key={item.id} href={`#${item.id}`} className="block text-sm text-muted hover:text-foreground">
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <main className="space-y-10">
          <section id="overview" className="rounded-2xl border border-border bg-white/[0.03] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-accent mb-3">QR Platform</p>
            <h1 className="text-3xl font-semibold mb-3">API Documentation</h1>
            <p className="text-muted leading-relaxed">
              Use these endpoints to manage QR codes programmatically via the platform API. For AI agent
              integrations, see the MCP Server section below.
            </p>
          </section>

          <section id="authentication" className="rounded-xl border border-border bg-white/[0.03] p-6">
            <h2 className="text-xl font-semibold mb-3">Authentication</h2>
            <div className="space-y-3 text-sm text-muted">
              <p>
                <span className="font-medium text-foreground">Bearer auth:</span> pass API token for QR endpoints:
              </p>
              <pre className="rounded-lg bg-black/30 border border-border p-3 overflow-x-auto text-foreground">
{`Authorization: Bearer qpt_xxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy`}
              </pre>
            </div>
          </section>

          {endpoints.map((endpoint) => (
            <section key={endpoint.id} id={endpoint.id} className="rounded-xl border border-border bg-white/[0.03] p-6">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded border ${methodColor(endpoint.method)}`}>
                  {endpoint.method}
                </span>
                <code className="text-sm text-foreground">{endpoint.path}</code>
              </div>
              <h3 className="text-lg font-semibold mb-1">{endpoint.title}</h3>
              <p className="text-sm text-muted mb-3">{endpoint.description}</p>
              <p className="text-xs text-muted mb-1">Auth: {endpoint.auth}</p>
              {endpoint.scopes?.length ? (
                <p className="text-xs text-muted mb-4">Required scope: {endpoint.scopes.join(', ')}</p>
              ) : null}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-black/30 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs uppercase tracking-wide text-muted">Request</p>
                    <button
                      onClick={() => copyText(endpoint.requestExample)}
                      className="text-xs text-accent hover:opacity-90"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="text-xs text-foreground overflow-x-auto">{endpoint.requestExample}</pre>
                </div>
                <div className="rounded-lg border border-border bg-black/30 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs uppercase tracking-wide text-muted">Response</p>
                    <button
                      onClick={() => copyText(endpoint.responseExample)}
                      className="text-xs text-accent hover:opacity-90"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="text-xs text-foreground overflow-x-auto">{endpoint.responseExample}</pre>
                </div>
              </div>
            </section>
          ))}

          <section id="mcp-overview" className="rounded-2xl border border-border bg-white/[0.03] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-accent mb-3">MCP Server</p>
            <h2 className="text-2xl font-semibold mb-3">Model Context Protocol</h2>
            <p className="text-muted leading-relaxed mb-4">
              The backend exposes an MCP server so AI agents and MCP-compatible clients can manage QR codes
              using the same scoped API tokens as the platform REST API.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border bg-black/20 p-3">
                <p className="text-muted">Endpoint</p>
                <code className="text-foreground">{mcpExamples.mcpUrl}</code>
              </div>
              <div className="rounded-lg border border-border bg-black/20 p-3">
                <p className="text-muted">Transport</p>
                <p className="text-foreground">Streamable HTTP</p>
              </div>
              <div className="rounded-lg border border-border bg-black/20 p-3">
                <p className="text-muted">Tools</p>
                <p className="text-foreground">qr_list, qr_get, qr_create, qr_delete</p>
              </div>
              <div className="rounded-lg border border-border bg-black/20 p-3">
                <p className="text-muted">Auth</p>
                <p className="text-foreground">Pass apiToken per tool call, or set MCP_API_TOKEN</p>
              </div>
            </div>
          </section>

          <section id="mcp-config" className="rounded-xl border border-border bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold mb-3">MCP config</h3>
            <p className="text-sm text-muted mb-4">
              Add the MCP server to your client configuration (Cursor, Claude Desktop, or any MCP-compatible
              client). Include your API token so tools can authenticate QR operations.
            </p>
            <div className="rounded-lg border border-border bg-black/30 p-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs uppercase tracking-wide text-muted">mcp.json</p>
                <button onClick={() => copyText(mcpExamples.mcpConfigExample)} className="text-xs text-accent hover:opacity-90">
                  Copy
                </button>
              </div>
              <pre className="text-xs text-foreground overflow-x-auto">{mcpExamples.mcpConfigExample}</pre>
            </div>
            <p className="text-sm text-muted mt-4">
              Pass the configured <code className="text-foreground">apiToken</code> as the{' '}
              <code className="text-foreground">apiToken</code> argument when calling MCP tools. Create tokens
              from the dashboard under API Management.
            </p>
          </section>

          {/* <section id="mcp-setup" className="rounded-xl border border-border bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold mb-3">Setup</h3>
            <p className="text-sm text-muted mb-4">
              Enable MCP on the backend with these environment variables:
            </p>
            <pre className="rounded-lg bg-black/30 border border-border p-4 text-xs text-foreground overflow-x-auto mb-4">{`MCP_ENABLED=true
MCP_HTTP_ENABLED=true
MCP_HTTP_PATH=/mcp
MCP_STDIO_ENABLED=false

# Optional default token if clients do not pass apiToken
# MCP_API_TOKEN=qpt_xxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy`}</pre>
            <p className="text-sm text-muted">
              Create API tokens from the dashboard under API Management. Each MCP tool requires the same scope
              as its matching platform REST endpoint.
            </p>
          </section> */}

          <section id="mcp-http" className="rounded-xl border border-border bg-white/[0.03] p-6">
            <h3 className="text-lg font-semibold mb-3">HTTP transport</h3>
            <p className="text-sm text-muted mb-4">
              MCP over HTTP uses a session flow: initialize a session, then call tools with the returned{' '}
              <code className="text-foreground">mcp-session-id</code> header.
            </p>

            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-black/30 p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs uppercase tracking-wide text-muted">1. Initialize session</p>
                  <button onClick={() => copyText(mcpExamples.mcpInitializeExample)} className="text-xs text-accent hover:opacity-90">
                    Copy
                  </button>
                </div>
                <pre className="text-xs text-foreground overflow-x-auto">{mcpExamples.mcpInitializeExample}</pre>
              </div>

              <div className="rounded-lg border border-border bg-black/30 p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs uppercase tracking-wide text-muted">2. Call a tool</p>
                  <button onClick={() => copyText(mcpExamples.mcpToolCallExample)} className="text-xs text-accent hover:opacity-90">
                    Copy
                  </button>
                </div>
                <pre className="text-xs text-foreground overflow-x-auto">{mcpExamples.mcpToolCallExample}</pre>
              </div>
            </div>
          </section>

          {mcpTools.map((tool) => (
            <section key={tool.id} id={tool.id} className="rounded-xl border border-border bg-white/[0.03] p-6">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="text-xs font-semibold px-2.5 py-1 rounded border text-purple-300 border-purple-500/50 bg-purple-500/10">
                  TOOL
                </span>
                <code className="text-sm text-foreground">{tool.name}</code>
              </div>
              <h3 className="text-lg font-semibold mb-1">{tool.name}</h3>
              <p className="text-sm text-muted mb-3">{tool.description}</p>
              <p className="text-xs text-muted mb-4">Required scope: {tool.scope}</p>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-black/30 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs uppercase tracking-wide text-muted">Arguments</p>
                    <button onClick={() => copyText(tool.arguments)} className="text-xs text-accent hover:opacity-90">
                      Copy
                    </button>
                  </div>
                  <pre className="text-xs text-foreground overflow-x-auto">{tool.arguments}</pre>
                </div>
                <div className="rounded-lg border border-border bg-black/30 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs uppercase tracking-wide text-muted">Response</p>
                    <button
                      onClick={() => copyText(tool.responseExample)}
                      className="text-xs text-accent hover:opacity-90"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="text-xs text-foreground overflow-x-auto">{tool.responseExample}</pre>
                </div>
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
