import { useState, useEffect, useMemo } from 'react';
import { UptimeChart } from './components/UptimeChart';
import { parseCSV } from './utils/csvParser';
import { UptimeData, ChartDataPoint } from './types';

// Import all CSV files from the data folder
const csvFiles = import.meta.glob('./data/*.csv', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

function App() {
  // Extract filenames from the imported files
  const availableFiles = useMemo(() => {
    return Object.keys(csvFiles).map(path => {
      const filename = path.replace('./data/', '').replace('?raw', '');
      const displayName = filename.replace('.csv', '');
      return {
        filename,
        displayName,
        path,
        content: csvFiles[path]
      };
    });
  }, []);

  const [selectedFile, setSelectedFile] = useState<string>('');
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileKey, setFileKey] = useState(0); // Key to force chart reset

  // Set initial file when availableFiles are loaded
  useEffect(() => {
    if (availableFiles.length > 0 && !selectedFile) {
      setSelectedFile(availableFiles[0].filename);
    }
  }, [availableFiles, selectedFile]);

  useEffect(() => {
    const loadData = () => {
      try {
        setLoading(true);
        const selectedFileData = availableFiles.find(f => f.filename === selectedFile);
        
        if (!selectedFileData) {
          throw new Error('Selected file not found');
        }

        const parsedData: UptimeData[] = parseCSV(selectedFileData.content);

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
        setFileKey(prev => prev + 1); // Increment key to reset chart
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (selectedFile && availableFiles.length > 0) {
      loadData();
    }
  }, [selectedFile, availableFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFile(e.target.value);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        Server Uptime Monitor
      </h1>
      
      {availableFiles.length > 0 && (
        <div style={{ 
          marginBottom: '20px', 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px'
        }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>
            Select Data File:
          </label>
          <select
            value={selectedFile}
            onChange={handleFileChange}
            style={{
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '200px'
            }}
          >
            {availableFiles.map(file => (
              <option key={file.filename} value={file.filename}>
                {file.displayName}
              </option>
            ))}
          </select>
        </div>
      )}
      
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
