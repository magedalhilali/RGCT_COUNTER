import React, { useState, useRef, useCallback } from 'react';
import { Download, Search, ArrowUpDown, ArrowUp, ArrowDown, Pin, PinOff, Trash2 } from 'lucide-react';
import { AnalysisResult } from '../types';
import { exportToCSV } from '../utils/processor';

interface DataTableProps {
  data: AnalysisResult['data'];
  originalColumnName: string;
  onDeleteRow?: (originalName: string) => void;
}

type SortKey = 'originalName' | 'count';
type SortDirection = 'asc' | 'desc';

export const DataTable: React.FC<DataTableProps> = ({ data, originalColumnName, onDeleteRow }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSticky, setIsSticky] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'count',
    direction: 'desc'
  });

  // Column Resizing State
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    name: 300,
    count: 150,
    percentage: 150,
    distribution: 400,
    actions: 80
  });
  const resizingRef = useRef<{ header: string; startX: number; startWidth: number } | null>(null);

  // Resizing Logic
  const handleMouseDown = (e: React.MouseEvent, header: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startWidth = columnWidths[header] || 150;
    resizingRef.current = { header, startX: e.clientX, startWidth };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return;
    const { header, startX, startWidth } = resizingRef.current;
    const diff = e.clientX - startX;
    const newWidth = Math.max(60, startWidth + diff); // Minimum width 60px
    setColumnWidths(prev => ({ ...prev, [header]: newWidth }));
  }, []);

  const handleMouseUp = useCallback(() => {
    resizingRef.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
  }, [handleMouseMove]);
  
  // 1. Filter Data
  const filteredData = data.filter(item => 
    item.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 2. Sort Data
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortConfig.key === 'originalName') {
      return sortConfig.direction === 'asc' 
        ? a.originalName.localeCompare(b.originalName)
        : b.originalName.localeCompare(a.originalName);
    } else {
      // Sort by count
      return sortConfig.direction === 'asc'
        ? a.count - b.count
        : b.count - a.count;
    }
  });

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-4 h-4 text-slate-300" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-indigo-600" />
      : <ArrowDown className="w-4 h-4 text-indigo-600" />;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="text-lg font-bold text-slate-900">Detailed Breakdown</h3>
        
        <div className="flex w-full sm:w-auto gap-3">
          <div className="relative flex-grow sm:flex-grow-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Filter items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
            />
          </div>
          
          <button
            onClick={() => exportToCSV(sortedData, originalColumnName)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table Container - Conditional styles for Sticky Mode */}
      <div className={`overflow-x-auto transition-all duration-300 ${isSticky ? 'max-h-[70vh] overflow-y-auto border-b border-slate-200 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100' : ''}`}>
        <table className="min-w-full divide-y divide-slate-200 relative border-collapse table-fixed">
          <thead className="bg-slate-50">
            <tr>
              <th 
                scope="col" 
                style={{ width: columnWidths.name }}
                className={`relative px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none ${isSticky ? 'sticky top-0 z-10 bg-slate-50 shadow-sm' : ''}`}
                onClick={() => handleSort('originalName')}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSticky(!isSticky);
                    }}
                    className={`p-1.5 rounded-md transition-all mr-1 flex-shrink-0 ${isSticky ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-transparent text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
                    title={isSticky ? "Unfreeze Header" : "Freeze Header to scroll"}
                  >
                    {isSticky ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                  </button>
                  <span className="truncate">Name</span>
                  <SortIcon columnKey="originalName" />
                </div>
                {/* Resize Handle */}
                <div 
                  onMouseDown={(e) => handleMouseDown(e, 'name')}
                  className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 group-hover:bg-indigo-200/50 z-20 transition-colors"
                />
              </th>
              
              <th 
                scope="col" 
                style={{ width: columnWidths.count }}
                className={`relative px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none ${isSticky ? 'sticky top-0 z-10 bg-slate-50 shadow-sm' : ''}`}
                onClick={() => handleSort('count')}
              >
                <div className="flex items-center justify-end gap-2 overflow-hidden">
                  <span className="truncate">Count</span>
                  <SortIcon columnKey="count" />
                </div>
                <div 
                  onMouseDown={(e) => handleMouseDown(e, 'count')}
                  className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 group-hover:bg-indigo-200/50 z-20 transition-colors"
                />
              </th>
              
              <th 
                scope="col" 
                style={{ width: columnWidths.percentage }}
                className={`relative px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider group ${isSticky ? 'sticky top-0 z-10 bg-slate-50 shadow-sm' : ''}`}
              >
                <span className="truncate block">% of Total</span>
                <div 
                  onMouseDown={(e) => handleMouseDown(e, 'percentage')}
                  className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 group-hover:bg-indigo-200/50 z-20 transition-colors"
                />
              </th>
              
              <th 
                scope="col" 
                style={{ width: columnWidths.distribution }}
                className={`relative px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider group ${isSticky ? 'sticky top-0 z-10 bg-slate-50 shadow-sm' : ''}`}
              >
                <span className="truncate block">Distribution</span>
                <div 
                  onMouseDown={(e) => handleMouseDown(e, 'distribution')}
                  className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 group-hover:bg-indigo-200/50 z-20 transition-colors"
                />
              </th>
              
              {/* Action Column */}
              <th 
                scope="col" 
                style={{ width: columnWidths.actions }}
                className={`relative px-4 py-3 text-right ${isSticky ? 'sticky top-0 z-10 bg-slate-50 shadow-sm' : ''}`}
              >
                <span className="sr-only">Actions</span>
                 <div 
                  onMouseDown={(e) => handleMouseDown(e, 'actions')}
                  className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 group-hover:bg-indigo-200/50 z-20 transition-colors"
                />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {sortedData.length > 0 ? (
              sortedData.map((item, idx) => (
                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 overflow-hidden text-ellipsis">
                    {item.originalName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-right overflow-hidden text-ellipsis">
                    {item.count.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-right overflow-hidden text-ellipsis">
                    {item.percentage.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap align-middle overflow-hidden">
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full" 
                        style={{ width: `${Math.max(item.percentage, 1)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                     {onDeleteRow && (
                       <button 
                         onClick={() => onDeleteRow(item.originalName)}
                         className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                         title="Remove this row"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                     )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                  No results match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
        <p className="text-xs text-slate-500 text-center sm:text-left">
          Showing {sortedData.length} of {data.length} categories
        </p>
      </div>
    </div>
  );
};