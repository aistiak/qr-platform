'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

interface QRCodeFormProps {
  onSubmit: (data: {
    customName?: string;
    targetType: 'url' | 'image';
    targetUrl?: string;
    hostedImageId?: string;
  }) => Promise<void>;
  loading?: boolean;
}

export function QRCodeForm({ onSubmit, loading = false }: QRCodeFormProps) {
  const [targetType, setTargetType] = useState<'url' | 'image'>('url');
  const [customName, setCustomName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [hostedImageId, setHostedImageId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Revoke object URL when it changes or component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (targetType === 'url' && !targetUrl) {
      setError('Please provide a URL');
      return;
    }

    if (targetType === 'image' && !hostedImageId) {
      setError('Please upload an image');
      return;
    }

    await onSubmit({
      customName: customName.trim() ? customName.trim() : undefined,
      targetType,
      targetUrl: targetType === 'url' ? targetUrl : undefined,
      hostedImageId: targetType === 'image' ? (hostedImageId || undefined) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorMessage message={error} />}

      <Input
        id="customName"
        label="Custom Name (optional)"
        value={customName}
        onChange={(e) => setCustomName(e.target.value)}
        maxLength={100}
        placeholder="My QR Code"
      />

      <div>
        <label className="block text-sm font-medium text-muted mb-2">
          Target Type
        </label>
        <div className="flex gap-4">
          <label className="flex items-center text-muted">
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
          <label className="flex items-center text-muted">
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
      </div>

      {targetType === 'url' && (
        <Input
          id="targetUrl"
          label="Target URL"
          type="url"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          required
          placeholder="https://example.com"
        />
      )}

      {targetType === 'image' && (
        <div>
          <label className="block text-sm font-medium text-muted mb-2">
            Upload Image (JPEG or PNG, max 2MB)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-accent-foreground hover:file:bg-accent/90"
            disabled={uploadingImage}
          />
          {uploadingImage && <p className="mt-2 text-sm text-muted">Uploading...</p>}
          {selectedFile && hostedImageId && (
            <p className="mt-2 text-sm text-accent">Image uploaded successfully</p>
          )}
          {(previewUrl || hostedImageId) && !uploadingImage && (
            <div className="mt-3">
              <p className="text-sm font-medium text-muted mb-2">Preview</p>
              <img
                src={previewUrl || `/api/images/${hostedImageId}`}
                alt="Upload preview"
                className="max-h-48 w-auto rounded-lg border border-border object-contain bg-white/5"
              />
            </div>
          )}
        </div>
      )}

      <Button type="submit" loading={loading || uploadingImage} className="w-full">
        Create QR Code
      </Button>
    </form>
  );
}
