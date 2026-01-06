import React, { useState } from 'react';
import { ChevronRight, LayoutList, ArrowLeft, ChevronDown } from 'lucide-react';

interface ColumnSelectorProps {
  headers: string[];
  fileName: string;
  onSelect: (column: string) => void;
  onBack: () => void;
}

export const ColumnSelector: React.FC<ColumnSelectorProps> = ({ headers, fileName, onSelect, onBack }) => {
  const [selected, setSelected] = useState<string>(headers[0] || '');

  return (
    <div className="flex flex-col items-center justify-center flex-grow animate-fade-in max-w-2xl mx-auto w-full">
      <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="mb-6 border-b border-slate-100 pb-6">
          <button 
            onClick={onBack}
            className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Upload
          </button>
          <h2 className="text-2xl font-bold text-slate-900">Select Column</h2>
          <p className="text-slate-500 mt-1">
            File: <span className="font-medium text-slate-700">{fileName}</span>
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="column-select" className="block text-sm font-medium text-slate-700 mb-2">
              Column to Analyze
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <LayoutList className="h-5 w-5 text-slate-500" />
              </div>
              
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
                <ChevronDown className="h-5 w-5 text-slate-400" />
              </div>

              <select
                id="column-select"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 text-base bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg transition-shadow appearance-none"
              >
                {headers.map((header) => (
                  <option key={header} value={header} className="bg-white text-slate-900 py-1">
                    {header}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              The application will count the frequency of unique values in this column.
            </p>
          </div>

          <button
            onClick={() => onSelect(selected)}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
          >
            Analyze Data
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};