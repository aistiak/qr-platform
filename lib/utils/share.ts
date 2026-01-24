/**
 * Share utility functions for QR codes
 */

export interface ShareOptions {
  title: string;
  text: string;
  url: string;
  files?: File[];
}

import { getScanUrl } from './url';

/**
 * Generate a shareable link for a QR code
 */
export function generateShareLink(qrCodeId: string, baseUrl?: string, request?: Request): string {
  if (baseUrl) {
    return `${baseUrl}/api/scan/${qrCodeId}`;
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
export async function shareContent(options: ShareOptions): Promise<boolean> {
  if (isWebShareSupported()) {
    try {
      const shareData: ShareData = {
        title: options.title,
        text: options.text,
        url: options.url,
      };

      if (options.files && navigator.canShare && navigator.canShare({ files: options.files })) {
        shareData.files = options.files;
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
