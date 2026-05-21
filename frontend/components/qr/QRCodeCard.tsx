'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { QRCodeViewer } from './QRCodeViewer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import {
  generateShareLink,
  copyQRCodeImageToClipboard,
  copyToClipboard,
} from '@/lib/utils/share';
import { getScanUrl } from '@/lib/utils/url';

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
  hostedImagePath: _hostedImagePath,
  status,
  accessCount,
  createdAt,
  onUpdate,
}: QRCodeCardProps) {
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copying, setCopying] = useState(false);
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const copyMenuRef = useRef<HTMLDivElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (copyMenuRef.current && !copyMenuRef.current.contains(event.target as Node)) {
        setShowCopyMenu(false);
      }
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    }

    if (showCopyMenu || showDownloadMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showCopyMenu, showDownloadMenu]);

  // Generate scan URL using utility
  const scanUrl = getScanUrl(id);

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
      const response = await fetch(`/api/app/qr/${id}`, {
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
      toast.error('Failed to update QR code status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/app/qr/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete QR code');
      }

      setShowDeleteModal(false);
      onUpdate?.();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format: 'png' | 'svg' = 'png') => {
    try {
      const response = await fetch(`/api/app/qr/${id}/download?format=${format}`);
      if (!response.ok) {
        throw new Error('Failed to download QR code');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = format === 'svg' ? 'svg' : 'png';
      a.download = `qr-code-${customName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setShowDownloadMenu(false);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download QR code');
    }
  };

  const handleCopy = async (type: 'image' | 'link') => {
    setCopying(true);
    try {
      if (type === 'image') {
        const copied = await copyQRCodeImageToClipboard(id);
        if (copied) {
          toast.success('QR code image copied to clipboard!');
        } else {
          toast.error('Failed to copy QR code image');
        }
      } else {
        const copied = await copyToClipboard(generateShareLink(id));
        if (copied) {
          toast.success('QR code URL copied to clipboard!');
        } else {
          toast.error('Failed to copy QR code URL');
        }
      }
      setShowCopyMenu(false);
    } catch (error) {
      console.error('Copy error:', error);
      toast.error('Failed to copy QR code');
    } finally {
      setCopying(false);
    }
  };

  return (
    <>
      <Card className="hover:border-white/20 transition-colors !p-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-shrink-0">
            <QRCodeViewer data={scanUrl} size={120} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold mb-1.5 text-foreground">{customName}</h3>
            <div className="space-y-0.5 text-xs text-muted">
              <p>
                <span className="font-medium text-foreground">Type:</span> {targetType === 'url' ? 'URL' : 'Image'}
              </p>
              {targetType === 'url' && targetUrl && (
                <p className="truncate">
                  <span className="font-medium text-foreground">Target:</span> {targetUrl}
                </p>
              )}
              <p>
                <span className="font-medium text-foreground">Status:</span>{' '}
                <span
                  className={`px-1.5 py-0.5 rounded text-[11px] ${
                    status === 'active'
                      ? 'bg-green-900/50 text-green-300'
                      : status === 'paused'
                      ? 'bg-yellow-900/50 text-yellow-300'
                      : 'bg-white/10 text-muted'
                  }`}
                >
                  {status}
                </span>
              </p>
              <p>
                <span className="font-medium text-foreground">Scans:</span> {accessCount}
              </p>
              <p>
                <span className="font-medium text-foreground">Created:</span>{' '}
                {new Date(createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="mt-3 flex gap-1.5 flex-wrap">
              <Link href={`/dashboard/qr/${id}`}>
                <Button variant="primary" size="sm" className="!px-2.5 !py-1 !min-h-[30px] !text-xs">
                  View Details
                </Button>
              </Link>
              <Link href={`/dashboard/qr/${id}/analytics`}>
                <Button variant="secondary" size="sm" className="!px-2.5 !py-1 !min-h-[30px] !text-xs">
                  Analytics
                </Button>
              </Link>
              {status !== 'deleted' && (
                <>
                  <div className="relative" ref={downloadMenuRef}>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="!px-2.5 !py-1 !min-h-[30px] !text-xs"
                      onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                      disabled={loading}
                    >
                      Download
                    </Button>
                    {showDownloadMenu && (
                      <div
                        className="absolute top-full left-0 mt-1 bg-background border border-border rounded-lg shadow-xl z-10 min-w-[120px]"
                        role="menu"
                        aria-label="Download format options"
                      >
                        <button
                          onClick={() => handleDownload('png')}
                          className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-white/5 rounded-t-lg transition-colors"
                          role="menuitem"
                          aria-label="Download as PNG"
                        >
                          Download PNG
                        </button>
                        <button
                          onClick={() => handleDownload('svg')}
                          className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-white/5 rounded-b-lg transition-colors"
                          role="menuitem"
                          aria-label="Download as SVG"
                        >
                          Download SVG
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="relative" ref={copyMenuRef}>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="!px-2.5 !py-1 !min-h-[30px] !text-xs"
                      onClick={() => setShowCopyMenu(!showCopyMenu)}
                      disabled={loading || copying}
                    >
                      Copy
                    </Button>
                    {showCopyMenu && (
                      <div
                        className="absolute top-full left-0 mt-1 bg-background border border-border rounded-lg shadow-xl z-10 min-w-[120px]"
                        role="menu"
                        aria-label="Copy options"
                      >
                        <button
                          onClick={() => handleCopy('image')}
                          className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-white/5 rounded-t-lg transition-colors"
                          role="menuitem"
                          aria-label="Copy QR code image"
                        >
                          Copy Image
                        </button>
                        <button
                          onClick={() => handleCopy('link')}
                          className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-white/5 rounded-b-lg transition-colors"
                          role="menuitem"
                          aria-label="Copy QR code link"
                        >
                          Copy Link
                        </button>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="!px-2.5 !py-1 !min-h-[30px] !text-xs"
                    onClick={handlePause}
                    disabled={loading}
                  >
                    {status === 'paused' ? 'Resume' : 'Pause'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="!px-2.5 !py-1 !min-h-[30px] !text-xs"
                    onClick={handleArchive}
                    disabled={loading || status === 'paused'}
                  >
                    {status === 'archived' ? 'Restore' : 'Archive'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="!px-2.5 !py-1 !min-h-[30px] !text-xs"
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
