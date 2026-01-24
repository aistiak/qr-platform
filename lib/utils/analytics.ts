/**
 * Analytics utility functions for QR code access data aggregation
 */

import QRCodeAccess from '@/lib/models/QRCodeAccess';
import mongoose from 'mongoose';

export type TimePeriod = 'day' | 'week' | 'month';

export interface AnalyticsDataPoint {
  date: string;
  count: number;
}

export interface AnalyticsSummary {
  total: number;
  period: TimePeriod;
  dataPoints: AnalyticsDataPoint[];
  startDate: Date;
  endDate: Date;
}

/**
 * Get start date for a given time period
 */
function getStartDate(period: TimePeriod): Date {
  const now = new Date();
  const start = new Date(now);

  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
  }

  return start;
}

/**
 * Get end date (now)
 */
function getEndDate(): Date {
  return new Date();
}

/**
 * Format date for grouping
 */
function formatDateForGrouping(date: Date, period: TimePeriod): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (period) {
    case 'day':
      return `${year}-${month}-${day}`;
    case 'week':
      // Get week number
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return `${year}-W${Math.ceil((weekStart.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
    case 'month':
      return `${year}-${month}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * Generate all data points for a period (including zeros for missing dates)
 */
function generateDataPoints(
  period: TimePeriod,
  startDate: Date,
  endDate: Date,
  aggregatedData: Map<string, number>
): AnalyticsDataPoint[] {
  const dataPoints: AnalyticsDataPoint[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const key = formatDateForGrouping(current, period);
    dataPoints.push({
      date: key,
      count: aggregatedData.get(key) || 0,
    });

    // Increment based on period
    switch (period) {
      case 'day':
        current.setDate(current.getDate() + 1);
        break;
      case 'week':
        current.setDate(current.getDate() + 7);
        break;
      case 'month':
        current.setMonth(current.getMonth() + 1);
        break;
    }
  }

  return dataPoints;
}

/**
 * Aggregate QR code access data by time period
 */
export async function aggregateQRCodeAccess(
  qrCodeId: string,
  period: TimePeriod = 'day'
): Promise<AnalyticsSummary> {
  const startDate = getStartDate(period);
  const endDate = getEndDate();

  // Query access records within the period
  const accesses = await QRCodeAccess.find({
    qrCodeId: new mongoose.Types.ObjectId(qrCodeId),
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ timestamp: 1 });

  // Aggregate by period
  const aggregatedData = new Map<string, number>();

  accesses.forEach((access) => {
    const key = formatDateForGrouping(access.timestamp, period);
    aggregatedData.set(key, (aggregatedData.get(key) || 0) + 1);
  });

  // Generate data points with zeros for missing dates
  const dataPoints = generateDataPoints(period, startDate, endDate, aggregatedData);

  return {
    total: accesses.length,
    period,
    dataPoints,
    startDate,
    endDate,
  };
}

/**
 * Get total access count for a QR code
 */
export async function getTotalAccessCount(qrCodeId: string): Promise<number> {
  try {
    return await QRCodeAccess.countDocuments({
      qrCodeId: new mongoose.Types.ObjectId(qrCodeId),
    });
  } catch (error) {
    // If ObjectId is invalid, return 0
    console.error('Error counting QR code accesses:', error);
    return 0;
  }
}
