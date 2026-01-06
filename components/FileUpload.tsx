import React, { useCallback, useState } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onDataLoaded: (data: any[], headers: string[], fileName: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = (file: File) => {
    setIsProcessing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0]; // Take first sheet
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        if (jsonData.length === 0) {
          throw new Error("The file appears to be empty.");
        }

        // Extract headers from the first row
        // Note: sheet_to_json uses first row as keys by default
        const headers = Object.keys(jsonData[0] as object);

        if (headers.length === 0) {
          throw new Error("Could not detect any columns.");
        }

        onDataLoaded(jsonData, headers, file.name);
      } catch (err) {
        console.error(err);
        setError("Failed to parse file. Please ensure it is a valid Excel or CSV file.");
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setError("Error reading file.");
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
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
    <div className="flex flex-col items-center justify-center flex-grow min-h-[50vh] animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Upload Data File</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          Upload your Excel (.xlsx, .xls) or CSV file to analyze frequency distributions.
        </p>
      </div>

      <div
        className={`
          relative w-full max-w-2xl p-12 rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out
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
          p-5 rounded-full mb-6 transition-colors duration-300
          ${isDragging ? 'bg-indigo-100' : 'bg-slate-100 group-hover:bg-slate-200'}
        `}>
          {isProcessing ? (
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          ) : (
            <UploadCloud className={`w-10 h-10 ${isDragging ? 'text-indigo-600' : 'text-slate-500'}`} />
          )}
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-1">
          {isProcessing ? 'Processing...' : 'Click or Drag & Drop'}
        </h3>
        <p className="text-slate-400 text-sm mb-6">
          Supported formats: .xlsx, .xls, .csv
        </p>

        {error && (
          <div className="absolute -bottom-16 left-0 right-0 mx-auto w-full max-w-md p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-4 mt-2">
           <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded text-xs font-medium text-slate-500">
             <FileSpreadsheet className="w-3.5 h-3.5" />
             Excel
           </div>
           <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded text-xs font-medium text-slate-500">
             <span className="font-bold text-[10px] border border-slate-400 px-0.5 rounded-sm leading-none">CSV</span>
             CSV
           </div>
        </div>
      </div>
    </div>
  );
};
