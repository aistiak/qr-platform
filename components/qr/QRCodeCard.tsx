'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QRCodeViewer } from './QRCodeViewer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface QRCodeCardProps {
  id: string;
  customName: string;
  targetType: 'url' | 'image';
  targetUrl?: string;
  hostedImagePath?: string;
  status: string;
  accessCount: number;
  createdAt: string;
  onUpdate?: () => void;
}

export function QRCodeCard({
  id,
  customName,
  targetType,
  targetUrl,
  hostedImagePath,
  status,
  accessCount,
  createdAt,
  onUpdate,
}: QRCodeCardProps) {
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Generate scan URL
  const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/scan/${id}`;

  const handlePause = async () => {
    if (status === 'paused') {
      // Resume
      await updateStatus('active');
    } else {
      // Pause
      await updateStatus('paused');
    }
  };

  const handleArchive = async () => {
    if (status === 'archived') {
      // Restore
      await updateStatus('active');
    } else {
      // Archive
      await updateStatus('archived');
    }
  };

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/qr/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      onUpdate?.();
    } catch (error) {
      console.error('Update status error:', error);
      alert('Failed to update QR code status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/qr/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete QR code');
      }

      setShowDeleteModal(false);
      onUpdate?.();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/qr/${id}/download`);
      if (!response.ok) {
        throw new Error('Failed to download QR code');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-code-${customName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download QR code');
    }
  };

  const handleShare = async () => {
    const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/scan/${id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: customName,
          text: `Check out this QR code: ${customName}`,
          url: scanUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          console.error('Share error:', error);
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(scanUrl);
        alert('QR code URL copied to clipboard!');
      } catch (error) {
        console.error('Copy error:', error);
        alert('Failed to copy QR code URL');
      }
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-shrink-0">
            <QRCodeViewer data={scanUrl} size={150} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">{customName}</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <span className="font-medium">Type:</span> {targetType === 'url' ? 'URL' : 'Image'}
              </p>
              {targetType === 'url' && targetUrl && (
                <p className="truncate">
                  <span className="font-medium">Target:</span> {targetUrl}
                </p>
              )}
              <p>
                <span className="font-medium">Status:</span>{' '}
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : status === 'paused'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {status}
                </span>
              </p>
              <p>
                <span className="font-medium">Scans:</span> {accessCount}
              </p>
              <p>
                <span className="font-medium">Created:</span>{' '}
                {new Date(createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="mt-4 flex gap-2 flex-wrap">
              <Link href={`/dashboard/qr/${id}`}>
                <Button variant="primary" size="sm">
                  View Details
                </Button>
              </Link>
              {status !== 'deleted' && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDownload}
                    disabled={loading}
                  >
                    Download
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleShare}
                    disabled={loading}
                  >
                    Share
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handlePause}
                    disabled={loading}
                  >
                    {status === 'paused' ? 'Resume' : 'Pause'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleArchive}
                    disabled={loading || status === 'paused'}
                  >
                    {status === 'archived' ? 'Restore' : 'Archive'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowDeleteModal(true)}
                    disabled={loading}
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete QR Code"
        message="Are you sure you want to delete this QR code? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}
