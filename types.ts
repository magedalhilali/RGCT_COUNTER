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
  SELECT_COLUMN = 'SELECT_COLUMN',
  DASHBOARD = 'DASHBOARD'
}
