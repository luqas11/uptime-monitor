import { useState, useCallback } from 'react';
import { UptimeChart } from './components/UptimeChart';
import { ChartSelector } from './components/ChartSelector';
import { UptimeData } from './types';

function App() {
  const [data, setData] = useState<UptimeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileKey, setFileKey] = useState(0); // Key to force chart reset

  const handleDataChange = useCallback((newData: UptimeData[], newFileKey: number) => {
    setData(newData);
    setFileKey(newFileKey);
  }, []);

  return (
    <div className="app-root">
      <div className="container">
        <header className="app-header">
          <h1 className="app-title">
            Server Uptime Monitor
          </h1>
        </header>

        <ChartSelector
          onDataChange={handleDataChange}
          onLoadingChange={setLoading}
          onErrorChange={setError}
        />

        {loading && (
          <div className="app-loading">
            <span style={{ fontSize: '0.95rem' }}>Loading data...</span>
          </div>
        )}

        {error && (
          <div className="app-error">
            <div className="app-error-title">
              Error loading data
            </div>
            <div className="app-error-message">
              {error}
            </div>
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="app-empty">
            <div className="app-empty-title">
              No data available
            </div>
            <div className="app-empty-message">
              Select a target and date to view uptime data
            </div>
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <UptimeChart key={fileKey} data={data} />
        )}
      </div>
    </div>
  );
}

export default App;
