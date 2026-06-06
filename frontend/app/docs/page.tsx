import { StripeStyleDocs } from '@/components/docs/StripeStyleDocs';
import { getBackendUrl } from '@/lib/utils/url';

export const metadata = {
  title: 'API Docs | QR Host',
  description: 'Interactive API documentation for QR Host platform APIs.',
};

export default function DocsPage() {
  return <StripeStyleDocs backendUrl={getBackendUrl()} />;
}
