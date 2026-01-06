import React from 'react';
import { Database, Tags, Hash } from 'lucide-react';
import { AnalysisResult } from '../types';

interface SummaryCardsProps {
  stats: AnalysisResult;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Total Rows</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.totalRows.toLocaleString()}</h3>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <Database className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Unique Categories</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.uniqueCategories.toLocaleString()}</h3>
        </div>
        <div className="p-3 bg-indigo-50 rounded-lg">
          <Tags className="w-6 h-6 text-indigo-600" />
        </div>
      </div>
    </div>
  );
};
