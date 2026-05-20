'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeForm } from '@/components/qr/QRCodeForm';
import { Card } from '@/components/ui/Card';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

export default function CreateQRCodePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (data: {
    customName?: string;
    targetType: 'url' | 'image';
    targetUrl?: string;
    hostedImageId?: string;
  }) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create QR code');
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create QR code');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <h1 className="font-serif text-2xl font-semibold mb-6 text-foreground">Create QR Code</h1>

          {error && <ErrorMessage message={error} className="mb-4" />}

          <QRCodeForm onSubmit={handleSubmit} loading={loading} />
        </Card>
      </div>
    </div>
  );
}
