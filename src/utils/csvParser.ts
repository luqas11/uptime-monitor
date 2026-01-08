import { UptimeData } from '../types';

export function parseCSV(csvContent: string): UptimeData[] {
  const lines = csvContent.trim().split('\n');
  const data: UptimeData[] = [];

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const [timestampStr, successStr] = line.split(',');
    
    if (!timestampStr || !successStr) continue;

    const timestamp = parseInt(timestampStr, 10);
    const success = successStr.toLowerCase() === 'true';

    if (!isNaN(timestamp)) {
      data.push({ timestamp, success });
    }
  }

  return data;
}
