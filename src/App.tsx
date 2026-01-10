import { useState, useCallback } from 'react';
import { UptimeChart } from './components/UptimeChart';
import { ChartSelector } from './components/ChartSelector';
import { ChartDataPoint } from './types';

function App() {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileKey, setFileKey] = useState(0); // Key to force chart reset

  const handleDataChange = useCallback((newData: ChartDataPoint[], newFileKey: number) => {
    setData(newData);
    setFileKey(newFileKey);
  }, []);

  const handleLoadingChange = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
  }, []);

  const handleErrorChange = useCallback((errorMessage: string | null) => {
    setError(errorMessage);
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        Server Uptime Monitor
      </h1>
      
      <ChartSelector
        onDataChange={handleDataChange}
        onLoadingChange={handleLoadingChange}
        onErrorChange={handleErrorChange}
      />
      
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
        <UptimeChart key={fileKey} data={data} />
      )}
    </div>
  );
}

export default App;
