'use client';

import { useEffect, useState } from 'react';
import { QRCodeCard } from './QRCodeCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

interface QRCode {
  id: string;
  customName: string;
  targetType: 'url' | 'image';
  targetUrl?: string;
  hostedImageId?: { id: string; filePath: string } | null;
  status: string;
  accessCount: number;
  createdAt: string;
  updatedAt: string;
}

type QRFilterStatus = 'active' | 'archived';
type QRViewMode = 'list' | 'gallery';
const PAGE_SIZE = 4;

export function QRCodeList() {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<QRFilterStatus>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<QRViewMode>('gallery');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchQRCodes();
  }, []);

  const fetchQRCodes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/app/qr?status=all');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch QR codes');
      }

      setQrCodes(data.qrCodes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load QR codes');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = () => {
    fetchQRCodes();
  };

  const filteredByStatus = qrCodes.filter((qr) =>
    selectedStatus === 'active' ? qr.status !== 'archived' : qr.status === 'archived'
  );
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredQRCodes = filteredByStatus.filter((qr) =>
    qr.customName.toLowerCase().includes(normalizedQuery)
  );
  const totalPages = Math.max(1, Math.ceil(filteredQRCodes.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginatedQRCodes = filteredQRCodes.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, normalizedQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-center py-8 text-sm">
        {error}
      </div>
    );
  }

  if (qrCodes.length === 0 && !loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted mb-4">No QR codes yet. Create your first QR code to get started.</p>
        <Link href="/dashboard/qr/create">
          <Button>Create QR Code</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted">
          Page {page} of {totalPages}
        </div>
        <div className="inline-flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-border p-1 bg-white/[0.02]">
            <button
              type="button"
              onClick={() => setSelectedStatus('active')}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                selectedStatus === 'active'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('archived')}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                selectedStatus === 'archived'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Archived
            </button>
          </div>
          <div className="inline-flex rounded-lg border border-border p-1 bg-white/[0.02]">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'list'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('gallery')}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'gallery'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Gallery
            </button>
          </div>
        </div>
        <div className="w-full sm:w-72">
          <Input
            id="qr-search"
            label=""
            placeholder="Search QR by name"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </div>

      {filteredQRCodes.length === 0 ? (
        <p className="text-sm text-muted">
          No {selectedStatus} QR codes found{normalizedQuery ? ' for this search.' : '.'}
        </p>
      ) : (
        <div className={viewMode === 'gallery' ? 'grid grid-cols-1 xl:grid-cols-2 gap-4' : 'space-y-4'}>
          {paginatedQRCodes.map((qr) => (
            <QRCodeCard
              key={qr.id}
              id={qr.id}
              customName={qr.customName}
              targetType={qr.targetType}
              targetUrl={qr.targetUrl}
              hostedImagePath={qr.hostedImageId?.filePath}
              status={qr.status}
              accessCount={qr.accessCount}
              createdAt={qr.createdAt}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
