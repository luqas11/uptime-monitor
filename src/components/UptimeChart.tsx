import { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartDataPoint } from '../types';

interface UptimeChartProps {
  data: ChartDataPoint[];
}

// Helper function to format date for datetime-local input
const formatDateTimeLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Helper function to parse datetime-local input to Date
const parseDateTimeLocal = (value: string): Date => {
  return new Date(value);
};

export function UptimeChart({ data }: UptimeChartProps) {
  if (data.length === 0) {
    return <div>No data available</div>;
  }

  // Calculate default end period: last 10-minute period from data
  const defaultEndPeriod = useMemo(() => {
    const lastTimestamp = data[data.length - 1].timestamp;
    const lastDate = new Date(lastTimestamp * 1000);
    const roundedMinutes = Math.floor(lastDate.getMinutes() / 10) * 10;
    return new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate(), 
                   lastDate.getHours(), roundedMinutes, 0);
  }, [data]);

  // Calculate min time: 0 hour (midnight) of the day of the first data point
  const minTime = useMemo(() => {
    const firstTimestamp = data[0].timestamp;
    const firstDate = new Date(firstTimestamp * 1000);
    // Set to midnight (0 hours) of the same day
    return new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate(), 0, 0, 0);
  }, [data]);

  // State for selected end time
  const [endPeriod, setEndPeriod] = useState<Date>(defaultEndPeriod);

  // Update state when data changes
  useEffect(() => {
    setEndPeriod(defaultEndPeriod);
  }, [defaultEndPeriod]);

  // Calculate start period as exactly 24 hours before end period
  const startPeriod = useMemo(() => {
    const period24HoursBefore = new Date(endPeriod.getTime() - 24 * 60 * 60 * 1000);
    const roundedMinutes = Math.floor(period24HoursBefore.getMinutes() / 10) * 10;
    return new Date(period24HoursBefore.getFullYear(), period24HoursBefore.getMonth(), 
                   period24HoursBefore.getDate(), period24HoursBefore.getHours(), roundedMinutes, 0);
  }, [endPeriod]);

  // Get 10-minute period boundaries (always exactly 24 hours)
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
    hasData: boolean;
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
        hasData: true,
      });
    } else {
      // No data: height 0
      chartData.push({
        time: formattedTime,
        timestamp: Math.floor(currentPeriod / 1000),
        status: 0,
        uptimeStatus: null,
        hasData: false,
      });
    }
  }

  // Color mapping
  const getBarColor = (entry: typeof chartData[0]) => {
    if (!entry.hasData) {
      return '#9ca3af'; // Gray for no data
    }
    if (entry.uptimeStatus === 'online') {
      return '#22c55e'; // Green for Online
    }
    if (entry.uptimeStatus === 'offline') {
      return '#ef4444'; // Red for Offline
    }
    return '#eab308'; // Yellow for Unstable (both online and offline)
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = parseDateTimeLocal(e.target.value);
    // Round down to 10-minute boundary
    const roundedMinutes = Math.floor(newDate.getMinutes() / 10) * 10;
    const roundedDate = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(),
                                 newDate.getHours(), roundedMinutes, 0);
    setEndPeriod(roundedDate);
  };

  return (
    <div>
      <div style={{ 
        marginBottom: '20px', 
        display: 'flex', 
        gap: '20px', 
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>End Time (24-hour window):</span>
          <input
            type="datetime-local"
            value={formatDateTimeLocal(endPeriod)}
            onChange={handleEndChange}
            min={formatDateTimeLocal(minTime)}
            max={formatDateTimeLocal(defaultEndPeriod)}
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </label>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const formattedTime = `${day}/${month}/${year} ${hours}:${minutes}`;
                return (
                  <div style={{
                    backgroundColor: 'white',
                    color: '#213547',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}>
                    <p style={{ margin: '4px 0' }}>{`Time: ${formattedTime}`}</p>
                    <p style={{ margin: '4px 0' }}>
                      {data.hasData 
                        ? `Status: ${data.uptimeStatus === 'online' ? 'Online' : data.uptimeStatus === 'offline' ? 'Offline' : 'Unstable'}`
                        : 'No data'}
                    </p>
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
