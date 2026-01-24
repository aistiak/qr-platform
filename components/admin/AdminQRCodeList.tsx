'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { QRCodeViewer } from '@/components/qr/QRCodeViewer';
import Link from 'next/link';
import { getScanUrl } from '@/lib/utils/url';

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
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export function AdminQRCodeList() {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQRCodes();
  }, []);

  const fetchQRCodes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/qr');
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

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (qrCodes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-300">No QR codes found.</p>
      </div>
    );
  }

  const scanUrl = (id: string) => getScanUrl(id);

  return (
    <div className="space-y-6">
      {qrCodes.map((qr) => (
        <div
          key={qr.id}
          className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors"
        >
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <QRCodeViewer data={scanUrl(qr.id)} size={150} />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{qr.customName}</h3>
                {qr.user && (
                  <p className="text-sm text-gray-400">
                    Created by: <span className="text-gray-300">{qr.user.name}</span> (
                    <span className="text-gray-300">{qr.user.email}</span>)
                  </p>
                )}
              </div>
              <div className="space-y-1 text-sm text-gray-300">
                <p>
                  <span className="font-medium text-white">Type:</span> {qr.targetType === 'url' ? 'URL' : 'Image'}
                </p>
                {qr.targetType === 'url' && qr.targetUrl && (
                  <p className="truncate">
                    <span className="font-medium text-white">Target:</span>{' '}
                    <a
                      href={qr.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      {qr.targetUrl}
                    </a>
                  </p>
                )}
                <p>
                  <span className="font-medium text-white">Status:</span>{' '}
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      qr.status === 'active'
                        ? 'bg-green-900 text-green-300'
                        : qr.status === 'paused'
                        ? 'bg-yellow-900 text-yellow-300'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {qr.status}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-white">Scans:</span> {qr.accessCount}
                </p>
                <p>
                  <span className="font-medium text-white">Created:</span>{' '}
                  {new Date(qr.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="pt-2">
                <Link href={`/dashboard/qr/${qr.id}`}>
                  <span className="text-blue-400 hover:text-blue-300 hover:underline text-sm">
                    View Details →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
