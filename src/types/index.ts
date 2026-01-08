export interface UptimeData {
  timestamp: number;
  success: boolean;
}

export interface ChartDataPoint {
  timestamp: number;
  success: boolean;
  formattedTime: string;
  date: Date;
}
