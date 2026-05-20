'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export interface AnalyticsDataPoint {
  date: string;
  count: number;
}

interface AnalyticsChartProps {
  data: AnalyticsDataPoint[];
  period: 'day' | 'week' | 'month';
}

export function AnalyticsChart({ data, period }: AnalyticsChartProps) {
  // Format date labels based on period
  const formatDateLabel = (dateStr: string) => {
    if (period === 'day') {
      // Format as "Jan 15"
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (period === 'week') {
      // Format as "Week 3"
      const match = dateStr.match(/W(\d+)/);
      return match ? `Week ${match[1]}` : dateStr;
    } else {
      // Format as "Jan 2024"
      const [year, month] = dateStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  };

  // Use bar chart for day/week, line chart for month
  const useBarChart = period === 'day' || period === 'week';

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      {useBarChart ? (
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateLabel}
            stroke="#a3a3a3"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="#a3a3a3" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0a0a0a',
              border: '1px solid #262626',
              borderRadius: '8px',
              color: '#fff',
            }}
            labelFormatter={(label) => formatDateLabel(label)}
            formatter={(value: number) => [value, 'Accesses']}
          />
          <Bar dataKey="count" fill="#b3f246" radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : (
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateLabel}
            stroke="#a3a3a3"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="#a3a3a3" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0a0a0a',
              border: '1px solid #262626',
              borderRadius: '8px',
              color: '#fff',
            }}
            labelFormatter={(label) => formatDateLabel(label)}
            formatter={(value: number) => [value, 'Accesses']}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#b3f246"
            strokeWidth={2}
            dot={{ fill: '#b3f246', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}
