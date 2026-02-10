'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeViewer } from '@/components/qr/QRCodeViewer';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getScanUrl } from '@/lib/utils/url';

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

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
  const id = params.id as string;

  const [qrCode, setQrCode] = useState<QRCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [customName, setCustomName] = useState('');
  const [targetType, setTargetType] = useState<'url' | 'image'>('url');
  const [targetUrl, setTargetUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [hostedImageId, setHostedImageId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [savingTarget, setSavingTarget] = useState(false);

  useEffect(() => {
    fetchQRCode();
  }, [id]);

  // Revoke object URL when it changes or component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
      setTargetType(data.targetType);
      setTargetUrl(data.targetUrl || '');
      setHostedImageId(data.hostedImageId?.id || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!qrCode) return;

    setSaving(true);
    setError('');
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
      toast.success('QR code name updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update QR code');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError('File size must be 2MB or less');
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only JPEG and PNG images are allowed');
      return;
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
    setSelectedFile(file);
    setError('');
    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/images', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload image');
      }

      const data = await response.json();
      setHostedImageId(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      setSelectedFile(null);
      setPreviewUrl(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveTarget = async () => {
    if (!qrCode) return;

    setSavingTarget(true);
    setError('');

    try {
      // Validate based on target type
      if (targetType === 'url' && !targetUrl) {
        setError('Please provide a URL');
        setSavingTarget(false);
        return;
      }

      if (targetType === 'image' && !hostedImageId) {
        setError('Please upload an image');
        setSavingTarget(false);
        return;
      }

      const updateData: any = {
        targetType,
      };

      if (targetType === 'url') {
        updateData.targetUrl = targetUrl;
      } else {
        updateData.hostedImageId = hostedImageId;
      }

      const response = await fetch(`/api/qr/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update QR code target');
      }

      const data = await response.json();
      setQrCode(data);
      setTargetUrl(data.targetUrl || '');
      setHostedImageId(data.hostedImageId?.id || null);
      setSelectedFile(null);
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      toast.success('QR code target updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update QR code target');
    } finally {
      setSavingTarget(false);
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

  const scanUrl = getScanUrl(id);

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

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Type
                  </label>
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center text-gray-300">
                      <input
                        type="radio"
                        name="targetType"
                        value="url"
                        checked={targetType === 'url'}
                        onChange={() => {
                          setTargetType('url');
                          setHostedImageId(null);
                          setSelectedFile(null);
                          if (previewUrl && previewUrl.startsWith('blob:')) {
                            URL.revokeObjectURL(previewUrl);
                          }
                          setPreviewUrl(null);
                        }}
                        className="mr-2"
                      />
                      URL
                    </label>
                    <label className="flex items-center text-gray-300">
                      <input
                        type="radio"
                        name="targetType"
                        value="image"
                        checked={targetType === 'image'}
                        onChange={() => {
                          setTargetType('image');
                          setTargetUrl('');
                        }}
                        className="mr-2"
                      />
                      Image
                    </label>
                  </div>

                  {targetType === 'url' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Target URL
                      </label>
                      <div className="flex gap-2">
                        <Input
                          id="targetUrl"
                          type="url"
                          value={targetUrl}
                          onChange={(e) => setTargetUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  )}

                  {targetType === 'image' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Upload Image (JPEG or PNG, max 2MB)
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 mb-2"
                        disabled={uploadingImage}
                      />
                      {uploadingImage && <p className="text-sm text-gray-300">Uploading...</p>}
                      {selectedFile && hostedImageId && (
                        <p className="text-sm text-green-400">Image uploaded successfully</p>
                      )}
                      {hostedImageId && !selectedFile && (
                        <p className="text-sm text-gray-400">Current image is set</p>
                      )}
                      {(previewUrl || hostedImageId) && !uploadingImage && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-300 mb-2">Preview</p>
                          <img
                            src={previewUrl || `/api/images/${hostedImageId}`}
                            alt="Upload preview"
                            className="max-h-48 w-auto rounded-lg border border-gray-600 object-contain bg-gray-800"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={handleSaveTarget}
                    loading={savingTarget || uploadingImage}
                    size="sm"
                    className="mb-4"
                  >
                    Save Target
                  </Button>
                </div>

                       <div className="space-y-2 text-sm text-gray-300">
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
                         <div className="flex items-center gap-2">
                           <p>
                             <span className="font-medium text-white">Total Scans:</span> {qrCode.accessCount}
                           </p>
                           <Link href={`/dashboard/qr/${id}/analytics`}>
                             <Button variant="secondary" size="sm">
                               View Analytics
                             </Button>
                           </Link>
                         </div>
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
