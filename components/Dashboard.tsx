import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, FileText, RotateCcw, Undo2 } from 'lucide-react';
import { AnalysisResult, FrequencyItem } from '../types';
import { SummaryCards } from './SummaryCards';
import { TopChart } from './TopChart';
import { DistributionChart } from './DistributionChart';
import { DataTable } from './DataTable';

interface DashboardProps {
  results: AnalysisResult;
  selectedColumn: string;
  fileName: string;
  onReset: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ results: initialResults, selectedColumn, fileName, onReset }) => {
  // State for the current (potentially modified) data
  const [activeResults, setActiveResults] = useState<AnalysisResult>(initialResults);
  
  // History stack for Undo functionality
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Update state if the prop changes (e.g. new file analysis)
  useEffect(() => {
    setActiveResults(initialResults);
    setHistory([]);
  }, [initialResults]);

  // --- Logic: Delete Row & Recalculate ---
  const handleDeleteRow = useCallback((itemName: string) => {
    // 1. Save current state to history before changing it
    setHistory(prev => [...prev, activeResults]);

    // 2. Filter out the deleted item
    const newData = activeResults.data.filter(item => item.originalName !== itemName);

    // 3. Recalculate Totals
    const newTotalRows = newData.reduce((sum, item) => sum + item.count, 0);

    // 4. Recalculate Percentages for remaining items
    // (This ensures if you delete "White", "Hilux" jumps to 100%)
    const recalculatedData: FrequencyItem[] = newData.map(item => ({
      ...item,
      percentage: newTotalRows > 0 ? (item.count / newTotalRows) * 100 : 0
    }));

    // 5. Update State
    setActiveResults({
      totalRows: newTotalRows,
      uniqueCategories: recalculatedData.length,
      data: recalculatedData
    });
  }, [activeResults]);

  // --- Logic: Undo ---
  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setActiveResults(previousState);
    setHistory(prev => prev.slice(0, -1)); // Remove last entry
  };

  // --- Logic: Reset to Original ---
  const handleResetData = () => {
    if (history.length === 0) return; // Already at start
    setActiveResults(initialResults);
    setHistory([]);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button 
            onClick={onReset}
            className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Analyze another file
          </button>
          <h2 className="text-2xl font-bold text-slate-900">Analysis Dashboard</h2>
          <div className="flex items-center gap-2 mt-1">
             <FileText className="w-4 h-4 text-slate-400" />
             <span className="text-slate-500 text-sm">File: <span className="font-medium text-slate-700">{fileName}</span></span>
             <span className="text-slate-300">|</span>
             <span className="text-slate-500 text-sm">Column: <span className="font-medium text-slate-700">{selectedColumn}</span></span>
          </div>
        </div>

        {/* Data Controls (Undo / Reset) */}
        <div className="flex items-center gap-2">
            <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all
                    ${history.length > 0 
                        ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
                <Undo2 className="w-4 h-4" />
                Undo
            </button>
            <button
                onClick={handleResetData}
                disabled={history.length === 0}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all
                    ${history.length > 0 
                        ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
                <RotateCcw className="w-4 h-4" />
                Reset
            </button>
        </div>
      </div>

      {/* Pass activeResults (dynamic) instead of initial results */}
      <SummaryCards stats={activeResults} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Charts */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <TopChart data={activeResults.data} />
          <DistributionChart data={activeResults.data} />
        </div>
        
        {/* Right Column: Data Table */}
        <div className="lg:col-span-2">
          <DataTable 
            data={activeResults.data} 
            originalColumnName={selectedColumn} 
            onDeleteRow={handleDeleteRow} // Pass the delete function
          />
        </div>
      </div>
    </div>
  );
};
