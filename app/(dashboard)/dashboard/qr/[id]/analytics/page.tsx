'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AnalyticsChart } from '@/components/qr/AnalyticsChart';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import Link from 'next/link';
import { TimePeriod } from '@/lib/utils/analytics';

interface AnalyticsDataPoint {
  date: string;
  count: number;
}

interface AnalyticsData {
  total: number;
  period: TimePeriod;
  dataPoints: AnalyticsDataPoint[];
  startDate: string;
  endDate: string;
}

export default function QRCodeAnalyticsPage() {
  const params = useParams();
  const id = params.id as string;

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<TimePeriod>('day');

  useEffect(() => {
    fetchAnalytics();
  }, [id, period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/qr/${id}/analytics?period=${period}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analytics');
      }

      setAnalytics(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-4 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <ErrorMessage message={error} />
            <Link href={`/dashboard/qr/${id}`}>
              <Button variant="secondary" className="mt-4">
                Back to QR Code
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <ErrorMessage message="No analytics data available" />
            <Link href={`/dashboard/qr/${id}`}>
              <Button variant="secondary" className="mt-4">
                Back to QR Code
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Link href={`/dashboard/qr/${id}`}>
            <Button variant="secondary" size="sm">
              ← Back to QR Code
            </Button>
          </Link>
        </div>

        <Card className="mb-6">
          <h1 className="text-2xl font-bold mb-6 text-white">QR Code Analytics</h1>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold text-white">{analytics.total}</p>
                <p className="text-gray-400">Total Accesses</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={period === 'day' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setPeriod('day')}
                >
                  Day
                </Button>
                <Button
                  variant={period === 'week' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setPeriod('week')}
                >
                  Week
                </Button>
                <Button
                  variant={period === 'month' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setPeriod('month')}
                >
                  Month
                </Button>
              </div>
            </div>
          </div>

          {analytics.total === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-4">No accesses yet</p>
              <p className="text-gray-500 text-sm">
                This QR code hasn&apos;t been scanned yet. Share it to start tracking analytics!
              </p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <AnalyticsChart data={analytics.dataPoints} period={analytics.period} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
