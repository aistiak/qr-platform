'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

type ApiTokenScope = 'qr:create' | 'qr:read' | 'qr:list' | 'qr:delete';
type ExpiryPreset = '1w' | '1m' | '3m' | 'unlimited';

type ApiToken = {
  id: string;
  name: string;
  tokenPrefix: string;
  scopes: ApiTokenScope[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_SCOPES: ApiTokenScope[] = ['qr:list', 'qr:read'];
const DEFAULT_EXPIRY_PRESET: ExpiryPreset = '1m';

const NAME_ADJECTIVES = [
  'Amber',
  'Brave',
  'Calm',
  'Clever',
  'Crimson',
  'Daring',
  'Emerald',
  'Fuzzy',
  'Gentle',
  'Golden',
  'Happy',
  'Hidden',
  'Lucky',
  'Mellow',
  'Misty',
  'Nimble',
  'Quiet',
  'Rapid',
  'Silver',
  'Sunny',
];

const NAME_ANIMALS = [
  'Armadillo',
  'Badger',
  'Bear',
  'Dolphin',
  'Falcon',
  'Fox',
  'Gecko',
  'Koala',
  'Lynx',
  'Monkey',
  'Otter',
  'Panda',
  'Panther',
  'Penguin',
  'Rabbit',
  'Raccoon',
  'Seal',
  'Tiger',
  'Turtle',
  'Wolf',
];

function getRandomItem(items: string[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function createSuggestedTokenName() {
  return `${getRandomItem(NAME_ADJECTIVES)} ${getRandomItem(NAME_ANIMALS)}`;
}

const scopeOptions: { value: ApiTokenScope; label: string; description: string }[] = [
  { value: 'qr:create', label: 'Create QR', description: 'Allows creating QR codes via API' },
  { value: 'qr:read', label: 'Read QR', description: 'Allows reading QR details by ID' },
  { value: 'qr:list', label: 'List QR', description: 'Allows listing QR codes with pagination' },
  { value: 'qr:delete', label: 'Delete QR', description: 'Allows deleting QR codes' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readResponsePayload(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return { error: text || `Request failed with status ${response.status}` };
}

export function ApiTokenManager() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [detailsLoadingId, setDetailsLoadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<ApiTokenScope[]>(DEFAULT_SCOPES);
  const [tokenName, setTokenName] = useState(() => createSuggestedTokenName());
  const [expiryPreset, setExpiryPreset] = useState<ExpiryPreset>(DEFAULT_EXPIRY_PRESET);
  const [newTokenValue, setNewTokenValue] = useState<string | null>(null);
  const [activeTokenId, setActiveTokenId] = useState<string | null>(null);

  const selectedScopeSet = useMemo(() => new Set(selectedScopes), [selectedScopes]);

  useEffect(() => {
    void fetchTokens();
  }, []);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/app/platform/tokens', { credentials: 'include' });
      const data = await readResponsePayload(response);
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load API tokens');
      }
      setTokens(data.apiTokens || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load API tokens');
    } finally {
      setLoading(false);
    }
  };

  const toggleScope = (scope: ApiTokenScope) => {
    setSelectedScopes((previous) =>
      previous.includes(scope) ? previous.filter((value) => value !== scope) : [...previous, scope]
    );
  };

  const getExpiryIso = (preset: ExpiryPreset) => {
    if (preset === 'unlimited') {
      return undefined;
    }

    const date = new Date();
    if (preset === '1w') {
      date.setDate(date.getDate() + 7);
    } else if (preset === '1m') {
      date.setMonth(date.getMonth() + 1);
    } else if (preset === '3m') {
      date.setMonth(date.getMonth() + 3);
    }

    return date.toISOString();
  };

  const onCreateToken = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!tokenName.trim()) {
      toast.error('Token name is required');
      return;
    }

    if (!selectedScopes.length) {
      toast.error('Select at least one scope');
      return;
    }

    setCreating(true);
    try {
      const payload: { name: string; scopes: ApiTokenScope[]; expiresAt?: string } = {
        name: tokenName.trim(),
        scopes: selectedScopes,
      };

      const expiresAt = getExpiryIso(expiryPreset);
      if (expiresAt) {
        payload.expiresAt = expiresAt;
      }

      const response = await fetch('/api/app/platform/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await readResponsePayload(response);
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create token');
      }

      setTokenName(createSuggestedTokenName());
      setExpiryPreset(DEFAULT_EXPIRY_PRESET);
      setSelectedScopes(DEFAULT_SCOPES);
      setNewTokenValue(data.token);
      setActiveTokenId(data.apiToken.id);
      setTokens((previous) => [data.apiToken, ...previous]);
      toast.success('API token created');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create token');
    } finally {
      setCreating(false);
    }
  };

  const onDeleteToken = async (tokenId: string) => {
    setDeletingId(tokenId);
    try {
      const response = await fetch(`/api/app/platform/tokens/${tokenId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await readResponsePayload(response);
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete token');
      }

      setTokens((previous) => previous.filter((token) => token.id !== tokenId));
      if (activeTokenId === tokenId) {
        setActiveTokenId(null);
      }
      toast.success('API token deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete token');
    } finally {
      setDeletingId(null);
    }
  };

  const onLoadDetails = async (tokenId: string) => {
    setDetailsLoadingId(tokenId);
    try {
      const response = await fetch(`/api/app/platform/tokens/${tokenId}`, {
        credentials: 'include',
      });
      const data = await readResponsePayload(response);
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load token details');
      }

      setTokens((previous) => previous.map((token) => (token.id === tokenId ? data : token)));
      setActiveTokenId(tokenId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load token details');
    } finally {
      setDetailsLoadingId(null);
    }
  };

  const onCopyNewToken = async () => {
    if (!newTokenValue) {
      return;
    }
    try {
      await navigator.clipboard.writeText(newTokenValue);
      toast.success('Token copied');
    } catch {
      toast.error('Failed to copy token');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-semibold text-foreground mb-2">Create API token</h2>
        <p className="text-sm text-muted mb-6">
          Choose only the scopes your integration needs. You will only see the token value once.
        </p>
        <form className="space-y-4" onSubmit={onCreateToken}>
          <Input
            id="token-name"
            label="Token name"
            value={tokenName}
            onChange={(event) => setTokenName(event.target.value)}
            placeholder="Production integration"
            maxLength={100}
          />
          <div>
            <p className="text-sm font-medium text-muted mb-2">Scopes</p>
            <div className="space-y-2">
              {scopeOptions.map((option) => (
                <label key={option.value} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <input
                    type="checkbox"
                    checked={selectedScopeSet.has(option.value)}
                    onChange={() => toggleScope(option.value)}
                    className="mt-1"
                  />
                  <span>
                    <span className="text-sm font-medium text-foreground">{option.label}</span>
                    <span className="block text-xs text-muted">{option.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted mb-2">Expiry</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setExpiryPreset('1w')}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  expiryPreset === '1w'
                    ? 'border-accent text-foreground bg-accent/10'
                    : 'border-border text-muted hover:text-foreground'
                }`}
              >
                1 week
              </button>
              <button
                type="button"
                onClick={() => setExpiryPreset('1m')}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  expiryPreset === '1m'
                    ? 'border-accent text-foreground bg-accent/10'
                    : 'border-border text-muted hover:text-foreground'
                }`}
              >
                1 month
              </button>
              <button
                type="button"
                onClick={() => setExpiryPreset('3m')}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  expiryPreset === '3m'
                    ? 'border-accent text-foreground bg-accent/10'
                    : 'border-border text-muted hover:text-foreground'
                }`}
              >
                3 months
              </button>
              <button
                type="button"
                onClick={() => setExpiryPreset('unlimited')}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  expiryPreset === 'unlimited'
                    ? 'border-accent text-foreground bg-accent/10'
                    : 'border-border text-muted hover:text-foreground'
                }`}
              >
                Unlimited
              </button>
            </div>
          </div>
          <Button type="submit" loading={creating}>
            Create token
          </Button>
        </form>
      </Card>

      {newTokenValue && (
        <Card className="border-green-500/40">
          <h3 className="text-lg font-semibold text-foreground mb-2">Copy your new token now</h3>
          <p className="text-sm text-muted mb-3">
            This secret value is shown only once. Store it securely in your integration settings.
          </p>
          <div className="rounded-lg border border-border bg-black/30 px-3 py-2 font-mono text-sm text-foreground break-all">
            {newTokenValue}
          </div>
          <div className="mt-3">
            <Button size="sm" onClick={onCopyNewToken}>
              Copy token
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-xl font-semibold text-foreground mb-2">Your API tokens</h2>
        <p className="text-sm text-muted mb-4">
          Use these tokens with the <code>Authorization: Bearer TOKEN</code> header on platform API routes.
        </p>

        {loading ? (
          <p className="text-sm text-muted">Loading tokens...</p>
        ) : tokens.length === 0 ? (
          <p className="text-sm text-muted">No API tokens yet.</p>
        ) : (
          <div className="space-y-3">
            {tokens.map((token) => {
              const isActive = activeTokenId === token.id;
              return (
                <div key={token.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{token.name}</p>
                      <p className="text-xs text-muted">Prefix: {token.tokenPrefix}</p>
                      <p className="text-xs text-muted">
                        Created: {new Date(token.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onLoadDetails(token.id)}
                        loading={detailsLoadingId === token.id}
                      >
                        {isActive ? 'Refresh details' : 'View details'}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => onDeleteToken(token.id)}
                        loading={deletingId === token.id}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {isActive && (
                    <div className="mt-3 rounded-lg bg-white/[0.03] border border-border p-3 text-sm">
                      <p className="text-foreground">
                        Scopes: <span className="text-muted">{token.scopes.join(', ')}</span>
                      </p>
                      <p className="text-foreground">
                        Last used:{' '}
                        <span className="text-muted">
                          {token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleString() : 'Never'}
                        </span>
                      </p>
                      <p className="text-foreground">
                        Expires:{' '}
                        <span className="text-muted">
                          {token.expiresAt ? new Date(token.expiresAt).toLocaleString() : 'No expiry'}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
