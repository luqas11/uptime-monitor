import { useState, useEffect, useRef } from 'react';
import { parseCSV } from '../utils/csvParser';
import { ChartDataPoint } from '../types';

interface FileInfo {
  path: string;
  displayName: string;
}

interface ChartSelectorProps {
  onDataChange: (data: ChartDataPoint[], fileKey: number) => void;
  onLoadingChange: (loading: boolean) => void;
  onErrorChange: (error: string | null) => void;
}

// Get base path from import.meta.env.BASE_URL (set by Vite)
const BASE_URL = import.meta.env.BASE_URL || '/';

export function ChartSelector({ onDataChange, onLoadingChange, onErrorChange }: ChartSelectorProps) {
  const [availableFiles, setAvailableFiles] = useState<FileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const fileKeyRef = useRef(0); // Key to force chart reset

  // Fetch manifest to get list of available files
  useEffect(() => {
    const loadManifest = async () => {
      try {
        onLoadingChange(true);
        const manifestUrl = `${BASE_URL}data/manifest.json`;
        const response = await fetch(manifestUrl);

        if (!response.ok) {
          throw new Error('Failed to load file manifest');
        }

        const manifest = await response.json();
        setAvailableFiles(manifest.files || []);

        // Set initial file
        if (manifest.files && manifest.files.length > 0) {
          setSelectedFile(manifest.files[0].path);
        }
      } catch (err) {
        onErrorChange(err instanceof Error ? err.message : 'Failed to load file list');
      } finally {
        onLoadingChange(false);
      }
    };

    loadManifest();
  }, [onLoadingChange, onErrorChange]);

  // Fetch and parse CSV when selectedFile changes
  useEffect(() => {
    const loadData = async () => {
      if (!selectedFile) return;

      try {
        onLoadingChange(true);

        // Fetch CSV file
        const fileUrl = `${BASE_URL}data/${selectedFile}`;
        const response = await fetch(fileUrl);

        if (!response.ok) {
          throw new Error(`Failed to load file: ${selectedFile}`);
        }

        const csvContent = await response.text();
        const chartData: ChartDataPoint[] = parseCSV(csvContent);

        fileKeyRef.current += 1;
        onDataChange(chartData, fileKeyRef.current);
        onErrorChange(null);
      } catch (err) {
        onErrorChange(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        onLoadingChange(false);
      }
    };

    loadData();
  }, [selectedFile, onDataChange, onLoadingChange, onErrorChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFile(e.target.value);
  };

  if (availableFiles.length === 0) {
    return <p style={{ textAlign: 'center' }}>Loading file list...</p>;
  }

  return (
    <div style={{
      marginBottom: '20px',
      display: 'flex',
      gap: '20px',
      alignItems: 'center',
      flexWrap: 'wrap'
    }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Select Data File:</span>
        <select
          value={selectedFile}
          onChange={handleFileChange}
          style={{
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px',
            minWidth: '200px'
          }}
        >
          {availableFiles.map(file => (
            <option key={file.path} value={file.path}>
              {file.displayName}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}