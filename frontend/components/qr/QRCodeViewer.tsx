'use client';

import { useEffect, useState } from 'react';
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
              @media print {
                @page {
                  margin: 20mm;
                  size: A4;
                }
                body {
                  margin: 0;
                  padding: 0;
                }
              }
              body {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
                background: white;
              }
              .qr-container {
                text-align: center;
                page-break-inside: avoid;
              }
              img {
                max-width: 100%;
                height: auto;
                border: 2px solid #000;
                padding: 20px;
                background: white;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              }
              @media print {
                img {
                  box-shadow: none;
                  border: 1px solid #000;
                }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <img src="${qrCodeDataUrl}" alt="QR Code" />
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      // Wait for image to load before printing
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img
        src={qrCodeDataUrl}
        alt="QR Code"
        className="max-w-full h-auto"
        style={{ width: `${size}px`, height: `${size}px` }}
        loading="lazy"
        decoding="async"
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
