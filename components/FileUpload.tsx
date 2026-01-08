import React, { useCallback, useState } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onDataLoaded: (sheets: Record<string, any[]>, fileName: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper: Process a single sheet
  const parseSheet = (sheet: XLSX.WorkSheet, sheetName: string): { data: any[], headers: string[] } | null => {
    // 1. Read as array of arrays
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
    if (!rawData || rawData.length === 0) return null;

    // 2. Smart Header Detection
    let headerIndex = -1;
    let maxFilledCells = 0;
    const scanDepth = Math.min(rawData.length, 100);

    for (let i = 0; i < scanDepth; i++) {
      const row = rawData[i];
      if (!row || !Array.isArray(row)) continue;
      
      const filledCellsCount = row.filter(cell => 
        cell !== null && 
        cell !== undefined && 
        String(cell).trim() !== ''
      ).length;

      if (filledCellsCount > maxFilledCells) {
        maxFilledCells = filledCellsCount;
        headerIndex = i;
      }
    }

    // Fallback
    if (headerIndex === -1) {
       headerIndex = rawData.findIndex(row => row && row.some(c => c !== null && c !== undefined && String(c).trim() !== ''));
    }

    if (headerIndex === -1) return null;

    // 3. Process Headers
    const originalHeaders = rawData[headerIndex].map(cell => String(cell || '').trim());
    const headerMap: { [index: number]: string } = {}; 
    const cleanHeaders: string[] = [];

    originalHeaders.forEach((h, idx) => {
        if (h) {
            headerMap[idx] = h;
            cleanHeaders.push(h);
        }
    });

    if (cleanHeaders.length === 0) return null;

    // 4. Extract Data Rows
    const formattedData: any[] = [];
    for (let i = headerIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        const rowObj: any = {};
        let hasRowData = false;
        
        Object.keys(headerMap).forEach((colIdx) => {
            const idx = Number(colIdx);
            const val = row[idx];
            if (val !== undefined && val !== null && String(val).trim() !== '') {
                hasRowData = true;
            }
            rowObj[headerMap[idx]] = val;
        });
        
        if (hasRowData) {
            formattedData.push(rowObj);
        }
    }

    return formattedData.length > 0 ? { data: formattedData, headers: cleanHeaders } : null;
  };

  const processFile = (file: File) => {
    setIsProcessing(true);
    setError(null);

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // Use 'array' type for better encoding support
        const workbook = XLSX.read(data, { type: 'array' });
        
        const allSheetsData: Record<string, any[]> = {};
        let validSheetsCount = 0;

        // Iterate through all sheets
        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const result = parseSheet(sheet, sheetName);
            
            if (result) {
                allSheetsData[sheetName] = result.data;
                validSheetsCount++;
            }
        });

        if (validSheetsCount === 0) {
            throw new Error("No valid data found in any sheet. Please check the file content.");
        }

        onDataLoaded(allSheetsData, file.name);

      } catch (err: any) {
        console.error(err);
        setError("Failed to parse file. Please ensure it is a valid Excel or CSV.");
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setError("Error reading file.");
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-grow min-h-[50vh] animate-fade-in p-4 sm:p-0">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Upload Data File</h2>
        <p className="text-slate-500 max-w-md mx-auto text-sm sm:text-base">
          Upload your Excel (.xlsx, .xls) or CSV file. We detect multiple sheets automatically.
        </p>
      </div>

      <div
        className={`
          relative w-full max-w-2xl p-6 sm:p-12 rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out
          flex flex-col items-center justify-center cursor-pointer group
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50 shadow-lg scale-[1.01]' 
            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50 shadow-sm'
          }
        `}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <input
          type="file"
          id="fileInput"
          className="hidden"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={onFileInput}
        />

        <div className={`
          p-4 sm:p-5 rounded-full mb-6 transition-colors duration-300
          ${isDragging ? 'bg-indigo-100' : 'bg-slate-100 group-hover:bg-slate-200'}
        `}>
          {isProcessing ? (
             <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-indigo-600"></div>
          ) : (
            <UploadCloud className={`w-8 h-8 sm:w-10 sm:h-10 ${isDragging ? 'text-indigo-600' : 'text-slate-500'}`} />
          )}
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-1 text-center">
          {isProcessing ? 'Processing Sheets...' : 'Click or Drag & Drop'}
        </h3>
        <p className="text-slate-400 text-sm mb-6 text-center">
          Supported formats: .xlsx, .xls, .csv
        </p>

        {error && (
          <div className="absolute -bottom-16 left-0 right-0 mx-auto w-full max-w-md p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm animate-shake z-10">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-4 mt-2">
           <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded text-xs font-medium text-slate-500">
             <FileSpreadsheet className="w-3.5 h-3.5" />
             Multiple Sheets Supported
           </div>
        </div>
      </div>
    </div>
  );
};