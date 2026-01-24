'use client';

import { useEffect, useState } from 'react';
import { QRCodeCard } from './QRCodeCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
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

interface QRCodeListProps {
  status?: 'active' | 'paused' | 'archived' | 'all';
  showArchived?: boolean;
}

export function QRCodeList({ status = 'active', showArchived = false }: QRCodeListProps) {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [archivedQRCodes, setArchivedQRCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQRCodes();
    if (showArchived) {
      fetchArchivedQRCodes();
    }
  }, [status, showArchived]);

  const fetchQRCodes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/qr?status=${status}`);
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

  const fetchArchivedQRCodes = async () => {
    try {
      const response = await fetch('/api/qr?status=archived');
      const data = await response.json();

      if (response.ok) {
        setArchivedQRCodes(data.qrCodes || []);
      }
    } catch (err) {
      // Silently fail for archived codes
      console.error('Failed to fetch archived QR codes:', err);
    }
  };

  const handleUpdate = () => {
    fetchQRCodes();
    if (showArchived) {
      fetchArchivedQRCodes();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-center py-8">
        {error}
      </div>
    );
  }

  if (qrCodes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-300 mb-4">No QR codes yet. Create your first QR code to get started.</p>
        <Link href="/dashboard/qr/create">
          <Button>Create QR Code</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {qrCodes.length > 0 && (
        <div className="space-y-4">
          {qrCodes.map((qr) => (
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

      {showArchived && archivedQRCodes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">Archived QR Codes</h3>
          <div className="space-y-4">
            {archivedQRCodes.map((qr) => (
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
        </div>
      )}
    </div>
  );
}
