import { useState, useEffect, useRef } from 'react';
import { parseCSV } from '../utils/csvParser';
import { UptimeData, TargetInfo, Manifest } from '../types';

interface ChartSelectorProps {
  onDataChange: (data: UptimeData[], fileKey: number) => void;
  onLoadingChange: (loading: boolean) => void;
  onErrorChange: (error: string | null) => void;
}

// GitHub raw content base URL
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/luqas11/uptime-monitor/refs/heads/main/data';

export function ChartSelector({ onDataChange, onLoadingChange, onErrorChange }: ChartSelectorProps) {
  const [targets, setTargets] = useState<TargetInfo[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const fileKeyRef = useRef(0); // Key to force chart reset

  // Fetch manifest to get list of available targets
  useEffect(() => {
    const loadManifest = async () => {
      try {
        onLoadingChange(true);
        const manifestUrl = `${GITHUB_RAW_BASE}/manifest.json`;
        const response = await fetch(manifestUrl);

        if (!response.ok) {
          throw new Error('Failed to load file manifest');
        }

        const manifest: Manifest = await response.json();
        setTargets(manifest.targets || []);
      } catch (err) {
        onErrorChange(err instanceof Error ? err.message : 'Failed to load file list');
      } finally {
        onLoadingChange(false);
      }
    };

    loadManifest();
  }, [onLoadingChange, onErrorChange]);

  // Fetch and parse CSV when both target and date are selected
  useEffect(() => {
    const loadData = async () => {
      if (!selectedTarget || !selectedDate) return;

      try {
        onLoadingChange(true);

        // Fetch CSV file
        const fileUrl = `${GITHUB_RAW_BASE}/${selectedTarget}/${selectedDate}.csv`;
        const response = await fetch(fileUrl);

        if (!response.ok) {
          throw new Error(`Failed to load file: ${selectedTarget}/${selectedDate}.csv`);
        }

        const csvContent = await response.text();
        const chartData: UptimeData[] = parseCSV(csvContent);

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
  }, [selectedTarget, selectedDate, onDataChange, onLoadingChange, onErrorChange]);

  const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTarget(e.target.value);
    setSelectedDate('');
    fileKeyRef.current += 1;
    onDataChange([], fileKeyRef.current);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDate(e.target.value);
  };

  const selectedTargetInfo = targets.find(t => t.name === selectedTarget);
  const availableDates = selectedTargetInfo?.dates || [];

  if (targets.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: 'var(--spacing-6)',
        color: 'var(--color-text-secondary)'
      }}>
        <span style={{ fontSize: '0.95rem' }}>Loading targets...</span>
      </div>
    );
  }

  return (
    <div className="card" style={{
      marginBottom: 'var(--spacing-6)',
      display: 'flex',
      gap: 'var(--spacing-5)',
      alignItems: 'flex-end',
      flexWrap: 'wrap',
      padding: 'var(--spacing-5)'
    }}>
      <label style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-2)',
        flex: '1 1 240px',
        minWidth: '200px'
      }}>
        <span style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          letterSpacing: '0.01em'
        }}>
          Select Target
        </span>
        <select
          value={selectedTarget}
          onChange={handleTargetChange}
          style={{
            padding: 'var(--spacing-3) var(--spacing-3)',
            border: '1px solid var(--color-neutral-300)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9375rem',
            fontFamily: 'inherit',
            backgroundColor: 'white',
            color: selectedTarget ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            transition: 'all var(--transition-base)',
            outline: 'none',
            width: '100%'
          }}
        >
          <option value="" disabled>
            Select a target...
          </option>
          {targets.map(target => (
            <option key={target.name} value={target.name}>
              {target.name}
            </option>
          ))}
        </select>
      </label>

      <label style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-2)',
        flex: '1 1 240px',
        minWidth: '200px'
      }}>
        <span style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          letterSpacing: '0.01em'
        }}>
          Select Date
        </span>
        <select
          value={selectedDate}
          onChange={handleDateChange}
          disabled={!selectedTarget || availableDates.length === 0}
          style={{
            padding: 'var(--spacing-3) var(--spacing-3)',
            border: '1px solid var(--color-neutral-300)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9375rem',
            fontFamily: 'inherit',
            backgroundColor: (!selectedTarget || availableDates.length === 0) ? 'var(--color-neutral-100)' : 'white',
            color: (!selectedTarget || availableDates.length === 0) ? 'var(--color-neutral-500)' : (selectedDate ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'),
            cursor: (!selectedTarget || availableDates.length === 0) ? 'not-allowed' : 'pointer',
            transition: 'all var(--transition-base)',
            outline: 'none',
            width: '100%'
          }}
        >
          <option value="" disabled>
            {!selectedTarget ? 'Select a target first...' : 'Select a date...'}
          </option>
          {availableDates.map(date => (
            <option key={date} value={date}>
              {date}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}