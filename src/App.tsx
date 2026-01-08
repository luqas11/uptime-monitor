import { useState, useEffect } from 'react';
import { UptimeChart } from './components/UptimeChart';
import { parseCSV } from './utils/csvParser';
import { UptimeData, ChartDataPoint } from './types';
import csvContent from './data/data.csv?raw';

function App() {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = () => {
      try {
        setLoading(true);
        const parsedData: UptimeData[] = parseCSV(csvContent);

        // Transform data for chart display
        const chartData: ChartDataPoint[] = parsedData.map((item) => {
          const date = new Date(item.timestamp * 1000);
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          const seconds = date.getSeconds().toString().padStart(2, '0');
          const formattedTime = `${hours}:${minutes}:${seconds}`;

          return {
            timestamp: item.timestamp,
            success: item.success,
            formattedTime,
            date,
          };
        });

        setData(chartData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        Server Uptime Monitor
      </h1>
      
      {loading && <p style={{ textAlign: 'center' }}>Loading data...</p>}
      
      {error && (
        <p style={{ textAlign: 'center', color: 'red' }}>
          Error: {error}
        </p>
      )}
      
      {!loading && !error && data.length === 0 && (
        <p style={{ textAlign: 'center' }}>No data available</p>
      )}
      
      {!loading && !error && data.length > 0 && (
        <UptimeChart data={data} />
      )}
    </div>
  );
}

export default App;
