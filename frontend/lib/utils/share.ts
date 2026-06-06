/**
 * Share utility functions for QR codes
 */

import { getScanUrl } from './url';

export interface ShareOptions {
  title: string;
  text: string;
  url?: string;
  files?: File[];
}

export type ShareImageResult = 'shared' | 'copied' | 'failed';

/**
 * Generate a shareable link for a QR code
 */
export function generateShareLink(qrCodeId: string, baseUrl?: string, request?: Request): string {
  if (baseUrl) {
    return `${baseUrl}/c/${qrCodeId}`;
  }
  return getScanUrl(qrCodeId, request);
}

/**
 * Generate social media share URLs
 */
export function generateSocialShareUrls(
  url: string,
  title: string,
  text?: string
): {
  twitter: string;
  facebook: string;
  linkedin: string;
  whatsapp: string;
  email: string;
} {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(text || title);

  return {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedText}%20${encodedUrl}`,
  };
}

/**
 * Check if Web Share API is available
 */
export function isWebShareSupported(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

/**
 * Share using Web Share API with fallback
 */
export function getQRCodeImageFilename(customName: string): string {
  return `qr-code-${customName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
}

export async function fetchQRCodeImageBlob(qrCodeId: string): Promise<Blob> {
  const response = await fetch(`/api/app/qr/${qrCodeId}/download?format=png`);
  if (!response.ok) {
    throw new Error('Failed to fetch QR code image');
  }
  return response.blob();
}

export async function fetchQRCodeImageFile(qrCodeId: string, filename: string): Promise<File> {
  const blob = await fetchQRCodeImageBlob(qrCodeId);
  return new File([blob], filename, { type: blob.type || 'image/png' });
}

export function isWebShareFilesSupported(files: File[]): boolean {
  return (
    isWebShareSupported() &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files })
  );
}

export async function shareContent(options: ShareOptions): Promise<boolean> {
  if (isWebShareSupported()) {
    try {
      const shareData: ShareData = {
        title: options.title,
        text: options.text,
      };

      if (options.files && isWebShareFilesSupported(options.files)) {
        shareData.files = options.files;
      } else if (options.url) {
        shareData.url = options.url;
      }

      await navigator.share(shareData);
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Web Share API error:', error);
      }
      return false;
    }
  }
  return false;
}

export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (navigator.clipboard?.write) {
      const type = blob.type || 'image/png';
      await navigator.clipboard.write([
        new ClipboardItem({
          [type]: blob,
        }),
      ]);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Copy image to clipboard error:', error);
    return false;
  }
}

export async function copyQRCodeImageToClipboard(qrCodeId: string): Promise<boolean> {
  const blob = await fetchQRCodeImageBlob(qrCodeId);
  return copyImageToClipboard(blob);
}

export async function shareQRCodeImage(
  qrCodeId: string,
  filename: string,
  options: { title: string; text: string }
): Promise<ShareImageResult> {
  const file = await fetchQRCodeImageFile(qrCodeId, filename);

  if (isWebShareFilesSupported([file])) {
    const shared = await shareContent({
      title: options.title,
      text: options.text,
      files: [file],
    });
    if (shared) {
      return 'shared';
    }
  }

  const copied = await copyImageToClipboard(file);
  return copied ? 'copied' : 'failed';
}

export function generateEmailShareUrl(title: string, text: string): string {
  return `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Copy to clipboard error:', error);
    return false;
  }
}
