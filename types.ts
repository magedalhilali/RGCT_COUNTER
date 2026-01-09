
export interface FrequencyItem {
  name: string;
  originalName: string; // The display version (e.g. first occurrence)
  count: number;
  percentage: number;
}

export interface AnalysisResult {
  totalRows: number;
  uniqueCategories: number;
  data: FrequencyItem[];
}

export enum AppStep {
  UPLOAD = 'UPLOAD',
  WORKSPACE = 'WORKSPACE'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: Date;
  isThinking?: boolean;
  toolResult?: any; // If the message displays a chart or data result
}

export interface DataColumn {
  key: string;
  type: 'string' | 'number' | 'date';
}

export type ViewMode = 'RAW' | 'ANALYSIS' | 'CHARTS';

export interface ChartConfig {
  title: string;
  description: string;
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  data: any[];
  xAxisKey: string;
  dataKeys: { key: string; color: string; name?: string }[];
}
