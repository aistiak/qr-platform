'use client';

import { useMemo } from 'react';
import toast from 'react-hot-toast';

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

const endpoints: Endpoint[] = [
  {
    id: 'create-token',
    method: 'POST',
    path: '/api/platform/tokens',
    title: 'Create API token',
    auth: 'Session cookie (dashboard login)',
    description: 'Creates a scoped API token. The full token is returned only once.',
    requestExample: `curl -X POST "http://localhost:3000/api/platform/tokens" \\
  -H "Content-Type: application/json" \\
  -H "Cookie: qr_session=<session_cookie>" \\
  --data '{
    "name": "Production integration",
    "scopes": ["qr:list", "qr:read"],
    "expiresAt": "2026-06-20T00:00:00.000Z"
  }'`,
    responseExample: `{
  "token": "qpt_xxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
  "apiToken": {
    "id": "682c7f...",
    "name": "Production integration",
    "tokenPrefix": "xxxxxxxx",
    "scopes": ["qr:list", "qr:read"]
  }
}`,
  },
  {
    id: 'list-tokens',
    method: 'GET',
    path: '/api/platform/tokens',
    title: 'List API tokens',
    auth: 'Session cookie (dashboard login)',
    description: 'Returns all API tokens for the logged-in user.',
    requestExample: `curl -X GET "http://localhost:3000/api/platform/tokens" \\
  -H "Cookie: qr_session=<session_cookie>"`,
    responseExample: `{
  "apiTokens": [],
  "total": 0,
  "availableScopes": ["qr:create", "qr:read", "qr:list", "qr:delete"]
}`,
  },
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

export function StripeStyleDocs() {
  const toc = useMemo(
    () =>
      endpoints.map((endpoint) => ({
        id: endpoint.id,
        label: `${endpoint.method} ${endpoint.path}`,
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
        </aside>

        <main className="space-y-10">
          <section id="overview" className="rounded-2xl border border-border bg-white/[0.03] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-accent mb-3">QR Platform</p>
            <h1 className="text-3xl font-semibold mb-3">API Documentation</h1>
            <p className="text-muted leading-relaxed">
              Use these endpoints to create tokens and manage QRs programmatically. Token creation uses your dashboard
              session, and QR operations use scoped Bearer tokens.
            </p>
          </section>

          <section id="authentication" className="rounded-xl border border-border bg-white/[0.03] p-6">
            <h2 className="text-xl font-semibold mb-3">Authentication</h2>
            <div className="space-y-3 text-sm text-muted">
              <p>
                <span className="font-medium text-foreground">Session auth:</span> use dashboard login cookie
                (`qr_session`) for `/api/platform/tokens*`.
              </p>
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
        </main>
      </div>
    </div>
  );
}
