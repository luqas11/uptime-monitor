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

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-neutral-50, #f9fafb)',
      padding: 'var(--spacing-6) var(--spacing-4)',
      fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
      transition: 'background-color var(--transition-base)'
    }}>
      <div className="container">
        <header style={{
          textAlign: 'center',
          marginBottom: 'var(--spacing-10)',
          paddingBottom: 'var(--spacing-6)',
          borderBottom: '2px solid var(--color-neutral-200)'
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 700,
            margin: 0,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.02em'
          }}>
            Server Uptime Monitor
          </h1>
        </header>

        <ChartSelector
          onDataChange={handleDataChange}
          onLoadingChange={setLoading}
          onErrorChange={setError}
        />

        {loading && (
          <div style={{
            textAlign: 'center',
            padding: 'var(--spacing-8)',
            color: 'var(--color-text-secondary)'
          }}>
            <span style={{ fontSize: '0.95rem' }}>Loading data...</span>
          </div>
        )}

        {error && (
          <div style={{
            marginTop: 'var(--spacing-6)',
            padding: 'var(--spacing-4) var(--spacing-5)',
            backgroundColor: '#fef2f2',
            border: '1px solid var(--color-error)',
            borderRadius: 'var(--radius-md)',
            color: '#991b1b',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              fontWeight: 600,
              marginBottom: 'var(--spacing-1)',
              fontSize: '0.95rem'
            }}>
              Error loading data
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#dc2626'
            }}>
              {error}
            </div>
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: 'var(--spacing-12) var(--spacing-4)',
            color: 'var(--color-text-secondary)'
          }}>
            <div style={{
              fontSize: '1.125rem',
              fontWeight: 500,
              marginBottom: 'var(--spacing-2)'
            }}>
              No data available
            </div>
            <div style={{
              fontSize: '0.875rem'
            }}>
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
