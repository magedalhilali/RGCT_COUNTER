/**
 * Utility functions that the AI can "call" to manipulate data.
 */

// Simple Levenshtein distance for fuzzy matching
const levenshtein = (a: string, b: string): number => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

export const splitColumn = (data: any[], column: string, delimiter: string, newColNames: string[]) => {
  return data.map(row => {
    const val = String(row[column] || '');
    const parts = val.split(delimiter);
    
    const newRow = { ...row };
    // Remove old column? Optional. Let's keep it for safety but typically split replaces or appends.
    // Let's append.
    newColNames.forEach((name, idx) => {
      newRow[name] = parts[idx]?.trim() || '';
    });
    return newRow;
  });
};

export const detectAnomalies = (data: any[], column: string) => {
  // Simple heuristic: Frequency analysis + Type checking
  const values = data.map(d => d[column]);
  
  // Check for numeric column with non-numeric values
  const isMostlyNumeric = values.filter(v => !isNaN(Number(v)) && v !== '').length > (values.length * 0.8);
  
  if (isMostlyNumeric) {
    return data.filter(row => {
      const val = row[column];
      return isNaN(Number(val)) && val !== undefined && val !== '';
    }).map(row => ({ row, reason: 'Non-numeric value in numeric column' }));
  }

  // Check for outliers via length (e.g. "USA" vs "United States of America" in a code column)
  const lengths = values.map(v => String(v).length);
  const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  
  return data.filter(row => {
    const val = String(row[column] || '');
    return Math.abs(val.length - avgLen) > avgLen * 2; // Very rough heuristic
  }).map(row => ({ row, reason: 'Unusual length' }));
};

export const findFuzzyMatches = (data: any[], column: string) => {
  const uniqueValues = Array.from(new Set(data.map(r => String(r[column] || '')))).filter(v => v);
  const matches: { value: string; potentialMatch: string; distance: number }[] = [];

  for (let i = 0; i < uniqueValues.length; i++) {
    for (let j = i + 1; j < uniqueValues.length; j++) {
      const a = uniqueValues[i];
      const b = uniqueValues[j];
      const dist = levenshtein(a.toLowerCase(), b.toLowerCase());
      
      // If distance is small relative to string length
      const maxLength = Math.max(a.length, b.length);
      if (dist > 0 && dist < 3 && maxLength > 3) {
        matches.push({ value: a, potentialMatch: b, distance: dist });
      }
    }
  }
  return matches;
};

export const pivotData = (data: any[], rowKey: string, colKey: string) => {
  const pivot: Record<string, Record<string, number>> = {};
  
  data.forEach(row => {
    const rVal = String(row[rowKey] || 'Unknown');
    const cVal = String(row[colKey] || 'Unknown');
    
    if (!pivot[rVal]) pivot[rVal] = {};
    if (!pivot[rVal][cVal]) pivot[rVal][cVal] = 0;
    
    pivot[rVal][cVal]++;
  });
  
  return pivot;
};
