import React, { useEffect } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { AnalysisResult } from '../types';
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

export const Dashboard: React.FC<DashboardProps> = ({ results, selectedColumn, fileName, onReset }) => {
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
      </div>

      <SummaryCards stats={results} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Charts */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <TopChart data={results.data} />
          <DistributionChart data={results.data} />
        </div>
        
        {/* Right Column: Data Table */}
        <div className="lg:col-span-2">
          <DataTable data={results.data} originalColumnName={selectedColumn} />
        </div>
      </div>
    </div>
  );
};