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

  // Calculate default last 10-minute period from data
  const defaultLastPeriod = useMemo(() => {
    const lastTimestamp = data[data.length - 1].timestamp;
    const lastDate = new Date(lastTimestamp * 1000);
    const roundedMinutes = Math.floor(lastDate.getMinutes() / 10) * 10;
    return new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate(), 
                   lastDate.getHours(), roundedMinutes, 0);
  }, [data]);

  // Calculate default first period: if interval > 24 hours, use 24 hours before last; otherwise use first data point
  const defaultFirstPeriod = useMemo(() => {
    const firstTimestamp = data[0].timestamp;
    const firstDate = new Date(firstTimestamp * 1000);
    const firstRoundedMinutes = Math.floor(firstDate.getMinutes() / 10) * 10;
    const firstPeriod = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate(), 
                                 firstDate.getHours(), firstRoundedMinutes, 0);
    
    const lastPeriod = defaultLastPeriod;
    const intervalHours = (lastPeriod.getTime() - firstPeriod.getTime()) / (1000 * 60 * 60);
    
    // If interval > 24 hours, use 24 hours before last; otherwise use first period
    if (intervalHours > 24) {
      const period24HoursBefore = new Date(lastPeriod.getTime() - 24 * 60 * 60 * 1000);
      const roundedMinutes = Math.floor(period24HoursBefore.getMinutes() / 10) * 10;
      return new Date(period24HoursBefore.getFullYear(), period24HoursBefore.getMonth(), 
                     period24HoursBefore.getDate(), period24HoursBefore.getHours(), roundedMinutes, 0);
    } else {
      return firstPeriod;
    }
  }, [data, defaultLastPeriod]);

  // State for selected interval
  const [startPeriod, setStartPeriod] = useState<Date>(defaultFirstPeriod);
  const [endPeriod, setEndPeriod] = useState<Date>(defaultLastPeriod);

  // Update state when data changes
  useEffect(() => {
    setStartPeriod(defaultFirstPeriod);
    setEndPeriod(defaultLastPeriod);
  }, [defaultFirstPeriod, defaultLastPeriod]);

  // Get 10-minute period boundaries from selected interval
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
    success: boolean | null;
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
      // Has data: check if any point is false
      const hasFailure = periodData.some(success => !success);
      chartData.push({
        time: formattedTime,
        timestamp: Math.floor(currentPeriod / 1000),
        status: 1,
        success: !hasFailure, // true if all are true, false if any is false
        hasData: true,
      });
    } else {
      // No data: height 0
      chartData.push({
        time: formattedTime,
        timestamp: Math.floor(currentPeriod / 1000),
        status: 0,
        success: null,
        hasData: false,
      });
    }
  }

  // Color mapping
  const getBarColor = (entry: typeof chartData[0]) => {
    if (!entry.hasData) {
      return '#9ca3af'; // Gray for no data
    }
    return entry.success ? '#22c55e' : '#ef4444'; // Green for all true, red if any false
  };

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = parseDateTimeLocal(e.target.value);
    // Round down to 10-minute boundary
    const roundedMinutes = Math.floor(newDate.getMinutes() / 10) * 10;
    const roundedDate = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(),
                                 newDate.getHours(), roundedMinutes, 0);
    // Check: start must be <= end
    if (roundedDate <= endPeriod) {
      setStartPeriod(roundedDate);
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = parseDateTimeLocal(e.target.value);
    // Round down to 10-minute boundary
    const roundedMinutes = Math.floor(newDate.getMinutes() / 10) * 10;
    const roundedDate = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(),
                                 newDate.getHours(), roundedMinutes, 0);
    // Check: end must be >= start
    if (roundedDate >= startPeriod) {
      setEndPeriod(roundedDate);
    }
  };

  // Check if interval exceeds 24 hours
  const intervalHours = (lastPeriod.getTime() - firstPeriod.getTime()) / (1000 * 60 * 60);
  const exceeds24Hours = intervalHours > 24;

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
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Start Time:</span>
          <input
            type="datetime-local"
            value={formatDateTimeLocal(startPeriod)}
            onChange={handleStartChange}
            max={formatDateTimeLocal(endPeriod)}
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>End Time:</span>
          <input
            type="datetime-local"
            value={formatDateTimeLocal(endPeriod)}
            onChange={handleEndChange}
            min={formatDateTimeLocal(startPeriod)}
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </label>
      </div>
      {exceeds24Hours ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          color: '#991b1b'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>
            Interval Too Long
          </h3>
          <p style={{ margin: '0', fontSize: '14px' }}>
            The selected time interval exceeds 24 hours. Please select an interval of 24 hours or less.
          </p>
          <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#7f1d1d' }}>
            Current interval: {intervalHours.toFixed(2)} hours
          </p>
        </div>
      ) : (
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
                return (
                  <div style={{
                    backgroundColor: 'white',
                    color: '#213547',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}>
                    <p style={{ margin: '4px 0' }}>{`Time: ${new Date(data.timestamp * 1000).toLocaleString('en-US', { hour12: false })}`}</p>
                    <p style={{ margin: '4px 0' }}>
                      {data.hasData 
                        ? `Status: ${data.success ? 'Online' : 'Offline'}`
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
      )}
    </div>
  );
}
