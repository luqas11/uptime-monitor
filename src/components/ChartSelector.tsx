import { useState, useEffect, useMemo, useRef } from 'react';
import { parseCSV } from '../utils/csvParser';
import { ChartDataPoint } from '../types';

// Import all CSV files from the data folder
const csvFiles = import.meta.glob('../data/*.csv', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

interface FileInfo {
  filename: string;
  displayName: string;
  path: string;
  content: string;
}

interface ChartSelectorProps {
  onDataChange: (data: ChartDataPoint[], fileKey: number) => void;
  onLoadingChange: (loading: boolean) => void;
  onErrorChange: (error: string | null) => void;
}

export function ChartSelector({ onDataChange, onLoadingChange, onErrorChange }: ChartSelectorProps) {
  // Extract filenames from the imported files
  const availableFiles = useMemo(() => {
    return Object.keys(csvFiles).map(path => {
      const filename = path.replace('../data/', '').replace('?raw', '');
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
  const fileKeyRef = useRef(0); // Key to force chart reset

  // Set initial file when availableFiles are loaded
  useEffect(() => {
    if (availableFiles.length > 0 && !selectedFile) {
      setSelectedFile(availableFiles[0].filename);
    }
  }, [availableFiles, selectedFile]);

  // Parse and transform data when selectedFile changes
  useEffect(() => {
    const loadData = () => {
      try {
        onLoadingChange(true);
        const selectedFileData = availableFiles.find(f => f.filename === selectedFile);
        
        if (!selectedFileData) {
          throw new Error('Selected file not found');
        }

        const chartData: ChartDataPoint[] = parseCSV(selectedFileData.content);

        // Increment fileKey and pass to parent
        fileKeyRef.current += 1;
        onDataChange(chartData, fileKeyRef.current);
        onErrorChange(null);
      } catch (err) {
        onErrorChange(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        onLoadingChange(false);
      }
    };

    if (selectedFile && availableFiles.length > 0) {
      loadData();
    }
  }, [selectedFile, availableFiles, onDataChange, onLoadingChange, onErrorChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFile(e.target.value);
  };

  if (availableFiles.length === 0) {
    return null;
  }

  return (
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
  );
}