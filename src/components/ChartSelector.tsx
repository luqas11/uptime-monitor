import { useState, useEffect, useRef } from 'react';
import { parseCSV } from '../utils/csvParser';
import { ChartDataPoint, TargetInfo, Manifest } from '../types';

interface ChartSelectorProps {
  onDataChange: (data: ChartDataPoint[], fileKey: number) => void;
  onLoadingChange: (loading: boolean) => void;
  onErrorChange: (error: string | null) => void;
}

// Get base path from import.meta.env.BASE_URL (set by Vite)
const BASE_URL = import.meta.env.BASE_URL || '/';

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
        const manifestUrl = `${BASE_URL}data/manifest.json`;
        const response = await fetch(manifestUrl);

        if (!response.ok) {
          throw new Error('Failed to load file manifest');
        }

        const manifest: Manifest = await response.json();
        setTargets(manifest.targets || []);

        // Set initial target and date
        if (manifest.targets && manifest.targets.length > 0) {
          const firstTarget = manifest.targets[0];
          setSelectedTarget(firstTarget.name);
          if (firstTarget.dates && firstTarget.dates.length > 0) {
            // Select the most recent date (last in sorted array)
            setSelectedDate(firstTarget.dates[firstTarget.dates.length - 1]);
          }
        }
      } catch (err) {
        onErrorChange(err instanceof Error ? err.message : 'Failed to load file list');
      } finally {
        onLoadingChange(false);
      }
    };

    loadManifest();
  }, [onLoadingChange, onErrorChange]);

  // Reset date selection when target changes
  useEffect(() => {
    if (!selectedTarget) return;

    const target = targets.find(t => t.name === selectedTarget);
    if (target && target.dates && target.dates.length > 0) {
      // Select the most recent date (last in sorted array)
      setSelectedDate(target.dates[target.dates.length - 1]);
    } else {
      setSelectedDate('');
    }
  }, [selectedTarget, targets]);

  // Fetch and parse CSV when both target and date are selected
  useEffect(() => {
    const loadData = async () => {
      if (!selectedTarget || !selectedDate) return;

      try {
        onLoadingChange(true);

        // Fetch CSV file
        const fileUrl = `${BASE_URL}data/${selectedTarget}/${selectedDate}.csv`;
        const response = await fetch(fileUrl);

        if (!response.ok) {
          throw new Error(`Failed to load file: ${selectedTarget}/${selectedDate}.csv`);
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
  }, [selectedTarget, selectedDate, onDataChange, onLoadingChange, onErrorChange]);

  const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTarget(e.target.value);
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
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            transition: 'all var(--transition-base)',
            outline: 'none',
            width: '100%'
          }}
        >
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
          disabled={availableDates.length === 0}
          style={{
            padding: 'var(--spacing-3) var(--spacing-3)',
            border: '1px solid var(--color-neutral-300)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9375rem',
            fontFamily: 'inherit',
            backgroundColor: availableDates.length === 0 ? 'var(--color-neutral-100)' : 'white',
            color: availableDates.length === 0 ? 'var(--color-neutral-500)' : 'var(--color-text-primary)',
            cursor: availableDates.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'all var(--transition-base)',
            outline: 'none',
            width: '100%'
          }}
        >
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