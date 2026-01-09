import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pin, PinOff, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface RawDataTableProps {
  data: any[];
  headers: string[];
}

export const RawDataTable: React.FC<RawDataTableProps> = ({ data, headers }) => {
  const [isSticky, setIsSticky] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  
  // Column Resizing State
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const resizingRef = useRef<{ header: string; startX: number; startWidth: number } | null>(null);

  // Initialize default widths
  useEffect(() => {
    if (headers.length > 0) {
      setColumnWidths(prev => {
        // Only initialize keys that don't exist yet
        const next = { ...prev };
        let hasChanges = false;
        headers.forEach(h => {
          if (!next[h]) {
            next[h] = 200; // Default width
            hasChanges = true;
          }
        });
        return hasChanges ? next : prev;
      });
    }
  }, [headers]);

  // Resizing Logic
  const handleMouseDown = (e: React.MouseEvent, header: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startWidth = columnWidths[header] || 200;
    resizingRef.current = { header, startX: e.clientX, startWidth };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return;
    const { header, startX, startWidth } = resizingRef.current;
    
    // Request animation frame for smoother UI updates could be added here, 
    // but React state update is usually fast enough for simple tables.
    const diff = e.clientX - startX;
    const newWidth = Math.max(80, startWidth + diff); // Minimum width 80px
    
    setColumnWidths(prev => ({ ...prev, [header]: newWidth }));
  }, []);

  const handleMouseUp = useCallback(() => {
    resizingRef.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
  }, [handleMouseMove]);


  const totalPages = Math.ceil(data.length / rowsPerPage);
  
  // Calculate display range
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, data.length);
  const displayData = data.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing view size
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50">
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
           <h3 className="font-bold text-slate-800">Data Grid View</h3>
           <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
             {data.length.toLocaleString()} Rows
           </span>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto w-full sm:w-auto justify-between sm:justify-end">
            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
                <button 
                    onClick={() => handlePageChange(1)} 
                    disabled={currentPage === 1}
                    className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors"
                    title="First Page"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    disabled={currentPage === 1}
                    className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors"
                    title="Previous Page"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="text-xs font-medium text-slate-600 px-2 min-w-[60px] text-center whitespace-nowrap">
                   {currentPage} / {totalPages}
                </span>

                <button 
                    onClick={() => handlePageChange(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                    className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors"
                    title="Next Page"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => handlePageChange(totalPages)} 
                    disabled={currentPage === totalPages}
                    className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors"
                    title="Last Page"
                >
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>

            <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block"></div>

            <button 
            onClick={() => setIsSticky(!isSticky)}
            className={`p-1.5 rounded-md transition-all flex items-center gap-2 text-xs font-medium whitespace-nowrap ${isSticky ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-slate-200 text-slate-600'}`}
            >
            {isSticky ? <><PinOff className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Frozen</span></> : <><Pin className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Freeze Header</span></>}
            </button>
        </div>
      </div>

      <div className={`overflow-auto flex-grow ${isSticky ? 'max-h-[70vh]' : ''}`}>
        <table className="divide-y divide-slate-200 border-collapse text-sm table-fixed w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-14 border-r border-slate-200 sticky left-0 bg-slate-50 z-20">
                #
              </th>
              {headers.map((header) => (
                <th 
                  key={header}
                  style={{ width: columnWidths[header] || 200 }}
                  className={`relative px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap border-b border-slate-200 group ${isSticky ? 'sticky top-0 bg-slate-50 z-10 shadow-sm' : ''}`}
                >
                  <span className="truncate block">{header}</span>
                  {/* Resize Handle */}
                  <div 
                    onMouseDown={(e) => handleMouseDown(e, header)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400 group-hover:bg-indigo-200/50 z-20 transition-colors"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {displayData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2 text-xs text-slate-400 border-r border-slate-200 sticky left-0 bg-white">
                    {startIndex + idx + 1}
                </td>
                {headers.map((header) => (
                  <td key={`${idx}-${header}`} className="px-4 py-2 text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis border-b border-slate-50">
                    {String(row[header] !== undefined ? row[header] : '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer Stats & Controls */}
      <div className="p-3 text-xs text-slate-500 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="font-medium text-center sm:text-left">
             Showing rows {startIndex + 1} - {endIndex} of {data.length}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="rowsPerPage" className="text-slate-400">Rows:</label>
            <select
              id="rowsPerPage"
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              className="bg-white border border-slate-200 text-slate-700 text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
            </select>
          </div>
      </div>
    </div>
  );
};