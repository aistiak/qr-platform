'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { QRCodeViewer } from './QRCodeViewer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  generateShareLink,
  generateSocialShareUrls,
  shareContent,
  copyToClipboard,
  isWebShareSupported,
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  // Close download menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    }

    if (showDownloadMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDownloadMenu]);

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

  const handleDownload = async (format: 'png' | 'svg' = 'png') => {
    try {
      const response = await fetch(`/api/qr/${id}/download?format=${format}`);
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
      alert('Failed to download QR code');
    }
  };

  const handleShare = async (method?: 'web' | 'twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'email' | 'copy') => {
    const scanUrl = generateShareLink(id);
    const shareUrls = generateSocialShareUrls(scanUrl, customName, `Check out this QR code: ${customName}`);

    if (!method) {
      // Try Web Share API first
      if (isWebShareSupported()) {
        const shared = await shareContent({
          title: customName,
          text: `Check out this QR code: ${customName}`,
          url: scanUrl,
        });
        if (shared) {
          setShowShareModal(false);
          return;
        }
      }
      // Show share modal if Web Share API not available or failed
      setShowShareModal(true);
      return;
    }

    try {
      switch (method) {
        case 'web':
          await shareContent({
            title: customName,
            text: `Check out this QR code: ${customName}`,
            url: scanUrl,
          });
          break;
        case 'twitter':
          window.open(shareUrls.twitter, '_blank', 'width=600,height=400');
          break;
        case 'facebook':
          window.open(shareUrls.facebook, '_blank', 'width=600,height=400');
          break;
        case 'linkedin':
          window.open(shareUrls.linkedin, '_blank', 'width=600,height=400');
          break;
        case 'whatsapp':
          window.open(shareUrls.whatsapp, '_blank');
          break;
        case 'email':
          window.location.href = shareUrls.email;
          break;
        case 'copy':
          const copied = await copyToClipboard(scanUrl);
          if (copied) {
            alert('QR code URL copied to clipboard!');
          } else {
            alert('Failed to copy QR code URL');
          }
          break;
      }
      setShowShareModal(false);
    } catch (error) {
      console.error('Share error:', error);
      alert('Failed to share QR code');
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
            <h3 className="text-lg font-semibold mb-2 text-white">{customName}</h3>
            <div className="space-y-1 text-sm text-gray-300">
              <p>
                <span className="font-medium text-white">Type:</span> {targetType === 'url' ? 'URL' : 'Image'}
              </p>
              {targetType === 'url' && targetUrl && (
                <p className="truncate">
                  <span className="font-medium text-white">Target:</span> {targetUrl}
                </p>
              )}
              <p>
                <span className="font-medium text-white">Status:</span>{' '}
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    status === 'active'
                      ? 'bg-green-900 text-green-300'
                      : status === 'paused'
                      ? 'bg-yellow-900 text-yellow-300'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {status}
                </span>
              </p>
              <p>
                <span className="font-medium text-white">Scans:</span> {accessCount}
              </p>
              <p>
                <span className="font-medium text-white">Created:</span>{' '}
                {new Date(createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="mt-4 flex gap-2 flex-wrap">
              <Link href={`/dashboard/qr/${id}`}>
                <Button variant="primary" size="sm">
                  View Details
                </Button>
              </Link>
              <Link href={`/dashboard/qr/${id}/analytics`}>
                <Button variant="secondary" size="sm">
                  Analytics
                </Button>
              </Link>
              {status !== 'deleted' && (
                <>
                  <div className="relative" ref={downloadMenuRef}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                      disabled={loading}
                    >
                      Download
                    </Button>
                    {showDownloadMenu && (
                      <div
                        className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]"
                        role="menu"
                        aria-label="Download format options"
                      >
                        <button
                          onClick={() => handleDownload('png')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-t-lg transition-colors"
                          role="menuitem"
                          aria-label="Download as PNG"
                        >
                          Download PNG
                        </button>
                        <button
                          onClick={() => handleDownload('svg')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-b-lg transition-colors"
                          role="menuitem"
                          aria-label="Download as SVG"
                        >
                          Download SVG
                        </button>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleShare()}
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

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowShareModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-modal-title"
        >
          <div
            className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="share-modal-title" className="text-xl font-bold mb-4 text-white">
              Share QR Code
            </h2>
            <div className="space-y-2">
              {isWebShareSupported() && (
                <button
                  onClick={() => handleShare('web')}
                  className="w-full text-left px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors"
                >
                  Share via Device
                </button>
              )}
              <button
                onClick={() => handleShare('copy')}
                className="w-full text-left px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors"
              >
                Copy Link
              </button>
              <button
                onClick={() => handleShare('twitter')}
                className="w-full text-left px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors"
              >
                Share on Twitter
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="w-full text-left px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors"
              >
                Share on Facebook
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="w-full text-left px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors"
              >
                Share on LinkedIn
              </button>
              <button
                onClick={() => handleShare('whatsapp')}
                className="w-full text-left px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors"
              >
                Share on WhatsApp
              </button>
              <button
                onClick={() => handleShare('email')}
                className="w-full text-left px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors"
              >
                Share via Email
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => setShowShareModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
