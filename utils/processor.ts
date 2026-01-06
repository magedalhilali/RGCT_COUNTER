import { FrequencyItem, AnalysisResult } from '../types';

/**
 * Normalizes a value for case-insensitive, whitespace-ignoring comparison.
 */
const normalizeKey = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val).trim().toLowerCase();
};

/**
 * Analyzes the raw data array based on the selected column.
 */
export const analyzeData = (data: any[], column: string): AnalysisResult => {
  const frequencyMap = new Map<string, { count: number; display: string }>();
  let totalRows = 0;

  data.forEach((row) => {
    // Skip if row doesn't have the column or it's effectively empty
    if (!Object.prototype.hasOwnProperty.call(row, column)) return;
    
    const rawValue = row[column];
    const key = normalizeKey(rawValue);

    if (key === '') return; // Skip empty strings/nulls

    totalRows++;

    if (frequencyMap.has(key)) {
      const entry = frequencyMap.get(key)!;
      entry.count++;
    } else {
      // Store the first encountered "display" version (trimmed)
      frequencyMap.set(key, { 
        count: 1, 
        display: String(rawValue).trim() 
      });
    }
  });

  // Convert map to array
  const sortedData: FrequencyItem[] = Array.from(frequencyMap.entries()).map(([key, value]) => ({
    name: key, // normalized key for internal use if needed
    originalName: value.display,
    count: value.count,
    percentage: totalRows > 0 ? (value.count / totalRows) * 100 : 0,
  }));

  // Sort by Count (High to Low), then alphabetical as tiebreaker
  sortedData.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.originalName.localeCompare(b.originalName);
  });

  return {
    totalRows,
    uniqueCategories: sortedData.length,
    data: sortedData,
  };
};

/**
 * Exports the analysis result to CSV.
 */
export const exportToCSV = (results: FrequencyItem[], originalColumnName: string) => {
  const headers = ['Value', 'Count', 'Percentage'];
  const rows = results.map(item => [
    `"${item.originalName.replace(/"/g, '""')}"`, // Escape quotes
    item.count,
    `${item.percentage.toFixed(2)}%`
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `ramah_analysis_${originalColumnName}_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
