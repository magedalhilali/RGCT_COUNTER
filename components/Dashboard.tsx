import React, { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, FileText, Undo2, Redo2, RotateCcw } from 'lucide-react';
import { AnalysisResult, FrequencyItem } from '../types';
import { SummaryCards } from './SummaryCards';
import { DistributionChart } from './DistributionChart';
import { DataTable } from './DataTable';

interface DashboardProps {
  results: AnalysisResult;
  selectedColumn: string;
  fileName: string;
  onReset: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ results, selectedColumn, fileName, onReset }) => {
  // History State for Undo/Redo
  // history is an array of data arrays (FrequencyItem[])
  // Initialize with a shallow copy of the data array to prevent reference mutation issues
  const [history, setHistory] = useState<FrequencyItem[][]>([[...results.data]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Initialize/Reset history when the analysis source changes
  useEffect(() => {
    setHistory([[...results.data]]);
    setHistoryIndex(0);
  }, [results]);

  // Derived active data
  const currentData = history[historyIndex];

  // Recalculate stats based on current data
  const currentStats: AnalysisResult = useMemo(() => {
    return {
      totalRows: currentData.reduce((sum, item) => sum + item.count, 0),
      uniqueCategories: currentData.length,
      data: currentData,
    };
  }, [currentData]);

  // Actions
  const handleDeleteRow = (originalName: string) => {
    // 1. Filter out the deleted item
    const filteredData = currentData.filter(item => item.originalName !== originalName);
    
    // 2. Recalculate percentages for the remaining items based on the new total
    const newTotal = filteredData.reduce((sum, item) => sum + item.count, 0);
    
    const newData = filteredData.map(item => ({
      ...item,
      percentage: newTotal > 0 ? (item.count / newTotal) * 100 : 0
    }));

    // 3. Create new history path
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newData);
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to reset all changes?")) {
      // Reset to the very first entry in history (original data)
      // Use a copy of the original data to ensure state integrity
      const originalData = [...history[0]];
      setHistory([originalData]);
      setHistoryIndex(0);
    }
  };

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button 
            onClick={onReset}
            className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Analyze another column
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-900">Analysis Dashboard</h2>
            
            {/* History Controls */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm self-start sm:self-auto">
               <button 
                 onClick={handleUndo} 
                 disabled={historyIndex === 0}
                 className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-30 transition-colors"
                 title="Undo"
               >
                 <Undo2 className="w-4 h-4" />
               </button>
               <button 
                 onClick={handleRedo} 
                 disabled={historyIndex === history.length - 1}
                 className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-30 transition-colors"
                 title="Redo"
               >
                 <Redo2 className="w-4 h-4" />
               </button>
               <div className="w-px h-4 bg-slate-200 mx-1"></div>
               <button 
                 onClick={handleResetData}
                 disabled={historyIndex === 0 && history.length === 1}
                 className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-30 transition-colors"
                 title="Reset Data"
               >
                 <RotateCcw className="w-4 h-4" />
               </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
             <FileText className="w-4 h-4 text-slate-400" />
             <span className="text-slate-500 text-sm">File: <span className="font-medium text-slate-700">{fileName}</span></span>
             <span className="text-slate-300">|</span>
             <span className="text-slate-500 text-sm">Column: <span className="font-medium text-slate-700">{selectedColumn}</span></span>
          </div>
        </div>
      </div>

      <SummaryCards stats={currentStats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Charts */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <DistributionChart data={currentStats.data} />
        </div>
        
        {/* Right Column: Data Table */}
        <div className="lg:col-span-2">
          <DataTable 
            data={currentStats.data} 
            originalColumnName={selectedColumn} 
            onDeleteRow={handleDeleteRow}
          />
        </div>
      </div>
    </div>
  );
};