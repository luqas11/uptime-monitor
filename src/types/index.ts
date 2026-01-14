export interface UptimeData {
  timestamp: number;
  success: boolean;
}

export interface ChartDataPoint {
  timestamp: number;
  success: boolean;
}

export interface TargetInfo {
  name: string;
  dates: string[];
}

export interface Manifest {
  targets: TargetInfo[];
}
