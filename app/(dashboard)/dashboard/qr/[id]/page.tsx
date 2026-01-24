'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QRCodeViewer } from '@/components/qr/QRCodeViewer';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
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

export default function QRCodeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [qrCode, setQrCode] = useState<QRCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    fetchQRCode();
  }, [id]);

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/qr/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch QR code');
      }

      setQrCode(data);
      setCustomName(data.customName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!qrCode) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/qr/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update QR code');
      }

      const data = await response.json();
      setQrCode(data);
      alert('QR code name updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update QR code');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-4 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !qrCode) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <ErrorMessage message={error || 'QR code not found'} />
            <Link href="/dashboard">
              <Button variant="secondary" className="mt-4">
                Back to Dashboard
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/scan/${id}`;

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card className="mb-6">
          <h1 className="text-2xl font-bold mb-6 text-white">QR Code Details</h1>

          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <QRCodeViewer data={scanUrl} size={256} />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Custom Name
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="customName"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      maxLength={100}
                      className="flex-1"
                    />
                    <Button onClick={handleSaveName} loading={saving} size="sm">
                      Save
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-300">
                  <p>
                    <span className="font-medium text-white">Type:</span> {qrCode.targetType === 'url' ? 'URL' : 'Image'}
                  </p>
                  {qrCode.targetType === 'url' && qrCode.targetUrl && (
                    <p>
                      <span className="font-medium text-white">Target URL:</span>{' '}
                      <a
                        href={qrCode.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        {qrCode.targetUrl}
                      </a>
                    </p>
                  )}
                  <p>
                    <span className="font-medium text-white">Status:</span>{' '}
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        qrCode.status === 'active'
                          ? 'bg-green-900 text-green-300'
                          : qrCode.status === 'paused'
                          ? 'bg-yellow-900 text-yellow-300'
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {qrCode.status}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-white">Total Scans:</span> {qrCode.accessCount}
                  </p>
                  <p>
                    <span className="font-medium text-white">Created:</span>{' '}
                    {new Date(qrCode.createdAt).toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium text-white">Last Updated:</span>{' '}
                    {new Date(qrCode.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
