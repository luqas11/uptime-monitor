import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartDataPoint } from '../types';

interface UptimeChartProps {
  data: ChartDataPoint[];
}

export function UptimeChart({ data }: UptimeChartProps) {
  // Calculate the date from the first data point and show the full 24-hour period of that day
  const { startPeriod, endPeriod } = useMemo(() => {
    const firstTimestamp = data[0].timestamp;
    const firstDate = new Date(firstTimestamp * 1000);

    // Set start period to midnight (00:00:00) of the selected date
    const start = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate(), 0, 0, 0);

    // Set end period to midnight (00:00:00) of the next day (exclusive, so we get all periods up to 23:50)
    const end = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate() + 1, 0, 0, 0);

    return { startPeriod: start, endPeriod: end };
  }, [data]);

  // Get 10-minute period boundaries (full day: 00:00 to 00:00 next day)
  const firstPeriod = startPeriod;
  const lastPeriod = endPeriod;

  // Group data points by 10-minute periods
  const periodMap = new Map<number, boolean[]>();

  data.forEach((point) => {
    const pointDate = new Date(point.timestamp * 1000);
    const roundedMinutes = Math.floor(pointDate.getMinutes() / 10) * 10;
    const periodKey = new Date(pointDate.getFullYear(), pointDate.getMonth(), pointDate.getDate(),
      pointDate.getHours(), roundedMinutes, 0).getTime();

    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, []);
    }
    periodMap.get(periodKey)!.push(point.success);
  });

  // Create chart data for all 10-minute periods in the range
  const chartData: Array<{
    time: string;
    timestamp: number;
    status: number;
    uptimeStatus: 'online' | 'offline' | 'unstable' | null;
  }> = [];

  // Iterate through each 10-minute period from first to last
  for (let currentPeriod = firstPeriod.getTime(); currentPeriod <= lastPeriod.getTime(); currentPeriod += 600000) {
    const periodDate = new Date(currentPeriod);
    const hours = periodDate.getHours().toString().padStart(2, '0');
    const minutes = periodDate.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;

    const periodData = periodMap.get(currentPeriod);

    if (periodData) {
      // Has data: determine if Online, Offline, or Unstable
      const allOnline = periodData.every(isOnline => isOnline);
      const allOffline = periodData.every(isOnline => !isOnline);
      const uptimeStatus: 'online' | 'offline' | 'unstable' = allOnline ? 'online' : (allOffline ? 'offline' : 'unstable');

      chartData.push({
        time: formattedTime,
        timestamp: Math.floor(currentPeriod / 1000),
        status: 1,
        uptimeStatus: uptimeStatus,
      });
    } else {
      // No data: height 0
      chartData.push({
        time: formattedTime,
        timestamp: Math.floor(currentPeriod / 1000),
        status: 0,
        uptimeStatus: null,
      });
    }
  }

  // Color mapping using CSS variables
  const getBarColor = (entry: typeof chartData[0]) => {
    if (entry.uptimeStatus === 'online') {
      return 'var(--color-success)';
    }
    if (entry.uptimeStatus === 'offline') {
      return 'var(--color-error)';
    }
    if (entry.uptimeStatus === 'unstable') {
      return 'var(--color-warning)';
    }
    return 'var(--color-neutral-400)'; // Gray for no data
  };

  return (
    <div className="card" style={{
      marginTop: 'var(--spacing-6)',
      padding: 'var(--spacing-6)'
    }}>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }} >
          <XAxis
            dataKey="time"
            angle={-45}
            textAnchor="end"
            height={100}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 1]}
            hide={true}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                const date = new Date(data.timestamp * 1000);
                const formattedTime = date.toLocaleString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                });

                const statusColor = data.uptimeStatus === 'online'
                  ? 'var(--color-success)'
                  : data.uptimeStatus === 'offline'
                    ? 'var(--color-error)'
                    : data.uptimeStatus === 'unstable'
                      ? 'var(--color-warning)'
                      : 'var(--color-neutral-400)';

                return (
                  <div style={{
                    backgroundColor: 'var(--tooltip-bg, white)',
                    color: 'var(--color-text-primary)',
                    padding: 'var(--spacing-3) var(--spacing-4)',
                    border: '1px solid var(--color-neutral-300)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    fontSize: '0.875rem'
                  }}>
                    <div style={{
                      marginBottom: 'var(--spacing-2)',
                      fontWeight: 500,
                      color: 'var(--color-text-primary)'
                    }}>
                      {formattedTime}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-2)'
                    }}>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: statusColor
                      }}></div>
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        {data.uptimeStatus === null
                          ? 'No data'
                          : data.uptimeStatus === 'online'
                            ? 'Online'
                            : data.uptimeStatus === 'offline'
                              ? 'Offline'
                              : 'Unstable'}
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="status" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
