'use client';

import { useEffect, useState } from 'react';
import { generateQRCodeDataURL } from '@/lib/qr/generator';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface QRCodeViewerProps {
  data: string;
  size?: number;
  className?: string;
}

export function QRCodeViewer({ data, size = 256, className = '' }: QRCodeViewerProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function generateQR() {
      try {
        setLoading(true);
        // Dynamic import to avoid SSR issues
        const { generateQRCodeDataURL } = await import('@/lib/qr/generator');
        const dataUrl = await generateQRCodeDataURL(data, { size });
        setQrCodeDataUrl(dataUrl);
        setError(null);
      } catch (err) {
        setError('Failed to generate QR code');
        console.error('QR code generation error:', err);
      } finally {
        setLoading(false);
      }
    }

    if (data) {
      generateQR();
    }
  }, [data, size]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-600 text-center ${className}`}>
        {error}
      </div>
    );
  }

  if (!qrCodeDataUrl) {
    return null;
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && qrCodeDataUrl) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - Print</title>
            <style>
              body {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
              }
              img {
                max-width: 100%;
                height: auto;
              }
            </style>
          </head>
          <body>
            <img src="${qrCodeDataUrl}" alt="QR Code" />
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img
        src={qrCodeDataUrl}
        alt="QR Code"
        className="max-w-full h-auto"
        style={{ width: `${size}px`, height: `${size}px` }}
      />
      <button
        onClick={handlePrint}
        className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm"
      >
        Print
      </button>
    </div>
  );
}
