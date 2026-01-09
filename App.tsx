import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { FileUpload } from './components/FileUpload';
import { ColumnSelector } from './components/ColumnSelector';
import { Dashboard } from './components/Dashboard';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ChatInterface } from './components/ChatInterface';
import { RawDataTable } from './components/RawDataTable';
import { ChartsView } from './components/ChartsView';
import { analyzeData } from './utils/processor';
import { AppStep, AnalysisResult, ViewMode, ChartConfig } from './types';
import { Table, BarChart3, PieChart, X, Layers, Key } from 'lucide-react';

// Extend window interface to satisfy TypeScript
declare global {
  interface Window {
    fullDataset: any[]; // The currently active sheet data
    allSheets: Record<string, any[]>; // All sheets: { "Sheet1": [...], "Sheet2": [...] }
  }
}

function App() {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  
  // Data State
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheetName, setActiveSheetName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]); // Headers for the ACTIVE sheet
  const [fileName, setFileName] = useState<string>('');
  
  // Analysis State
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [results, setResults] = useState<AnalysisResult | null>(null);
  
  // Chart State
  const [generatedChart, setGeneratedChart] = useState<ChartConfig | null>(null);
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('RAW');
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Load API Key
  useEffect(() => {
    const stored = sessionStorage.getItem('gemini_api_key');
    if (stored) setApiKey(stored);
    
    // Initialize global dataset
    window.fullDataset = [];
    window.allSheets = {};
  }, []);

  const handleSaveKey = (key: string) => {
    sessionStorage.setItem('gemini_api_key', key);
    setApiKey(key);
    setShowKeyModal(false);
  };

  const extractHeaders = (data: any[]) => {
      if (!data || data.length === 0) return [];
      return Object.keys(data[0]);
  };

  const handleDataLoaded = (sheetsData: Record<string, any[]>, name: string) => {
    const sheets = Object.keys(sheetsData);
    if (sheets.length === 0) return;

    // 1. Store Global State
    window.allSheets = sheetsData;
    
    // 2. Default to first sheet
    const firstSheet = sheets[0];
    window.fullDataset = sheetsData[firstSheet];
    
    // 3. React State
    setSheetNames(sheets);
    setActiveSheetName(firstSheet);
    setHeaders(extractHeaders(sheetsData[firstSheet]));
    setFileName(name);
    setStep(AppStep.WORKSPACE);
    
    if (!apiKey) setShowKeyModal(true);
  };

  const handleSwitchSheet = (newSheetName: string) => {
      if (!window.allSheets[newSheetName]) return;

      // Update Global Active Data
      window.fullDataset = window.allSheets[newSheetName];
      
      // Update State
      setActiveSheetName(newSheetName);
      setHeaders(extractHeaders(window.fullDataset));
      
      // Reset Analysis for the new sheet
      setSelectedColumn('');
      setResults(null);
      setGeneratedChart(null);
      setViewMode('RAW'); // Go back to grid view to see new data
  };

  const handleColumnAnalyze = (column: string) => {
    const analysis = analyzeData(window.fullDataset, column);
    setSelectedColumn(column);
    setResults(analysis);
    setViewMode('ANALYSIS');
  };

  const handleUpdateData = (newData: any[], newHeaders: string[]) => {
    // When Chat updates data, it updates the ACTIVE sheet
    window.fullDataset = newData;
    window.allSheets[activeSheetName] = newData; // Sync back to allSheets
    
    setHeaders(newHeaders);
    if (selectedColumn && viewMode === 'ANALYSIS') {
      const analysis = analyzeData(newData, selectedColumn);
      setResults(analysis);
    }
  };
  
  const handleChartGeneratedFromChat = (config: ChartConfig) => {
    setGeneratedChart(config);
  };

  const handleReset = () => {
    setStep(AppStep.UPLOAD);
    window.fullDataset = [];
    window.allSheets = {};
    setHeaders([]);
    setFileName('');
    setSheetNames([]);
    setActiveSheetName('');
    setSelectedColumn('');
    setResults(null);
    setGeneratedChart(null);
    setViewMode('RAW');
  };

  return (
    <Layout>
      <ApiKeyModal 
        isOpen={showKeyModal} 
        onSave={handleSaveKey} 
        onSkip={() => setShowKeyModal(false)}
      />

      {step === AppStep.UPLOAD && (
        <FileUpload onDataLoaded={handleDataLoaded} />
      )}

      {step === AppStep.WORKSPACE && (
        <div className="flex flex-col lg:flex-row gap-6 w-full lg:h-[calc(100vh-8rem)] relative">
          
          {/* Main Workspace */}
          <div className={`flex flex-col flex-grow transition-all duration-500 ease-in-out lg:h-full ${isChatOpen ? 'lg:w-2/3 lg:pr-4' : 'w-full'}`}>
            
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3 sm:gap-0 flex-shrink-0">
              <div className="bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-white/40 flex gap-1 shadow-sm w-full sm:w-auto overflow-x-auto">
                <button 
                  onClick={() => setViewMode('RAW')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${viewMode === 'RAW' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:bg-white/50'}`}
                >
                  <Table className="w-4 h-4" />
                  Grid
                </button>
                <button 
                  onClick={() => setViewMode('ANALYSIS')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${viewMode === 'ANALYSIS' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:bg-white/50'}`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Analysis
                </button>
                <button 
                  onClick={() => setViewMode('CHARTS')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${viewMode === 'CHARTS' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:bg-white/50'}`}
                >
                  <PieChart className="w-4 h-4" />
                  Charts
                </button>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                 {/* File & Sheet Info */}
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg max-w-full sm:max-w-[400px]">
                    <span className="text-xs font-bold text-indigo-800 truncate max-w-[100px]">{fileName}</span>
                    <span className="text-indigo-300">|</span>
                    
                    {/* Sheet Selector */}
                    <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                        <select 
                            value={activeSheetName}
                            onChange={(e) => handleSwitchSheet(e.target.value)}
                            className="bg-transparent text-xs font-medium text-indigo-700 outline-none cursor-pointer hover:text-indigo-900 max-w-[120px]"
                        >
                            {sheetNames.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <button 
                      onClick={handleReset}
                      className="ml-2 text-indigo-400 hover:text-red-500 hover:bg-indigo-100 rounded p-1 transition-colors"
                      title="Remove File"
                    >
                      <X className="w-4 h-4" />
                    </button>
                 </div>

                 <button 
                    onClick={() => setShowKeyModal(true)} 
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 border ${apiKey ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-slate-900 border-transparent text-white hover:bg-slate-800'}`}
                 >
                    <Key className="w-3.5 h-3.5" />
                    {apiKey ? 'Change Key' : 'Add API Key'}
                 </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="h-[75vh] lg:h-auto lg:flex-grow lg:min-h-0 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative">
               {viewMode === 'RAW' && (
                  <RawDataTable data={window.fullDataset} headers={headers} />
               )}

               {viewMode === 'ANALYSIS' && (
                 <div className="h-full overflow-y-auto p-4 custom-scrollbar">
                   {!selectedColumn ? (
                     <ColumnSelector 
                        headers={headers} 
                        fileName={fileName} 
                        onSelect={handleColumnAnalyze} 
                        onBack={() => setViewMode('RAW')} 
                     />
                   ) : (
                     <Dashboard 
                       results={results!} 
                       selectedColumn={selectedColumn} 
                       fileName={activeSheetName} 
                       onReset={() => {
                         setSelectedColumn('');
                         setResults(null);
                       }} 
                     />
                   )}
                 </div>
               )}
               
               {viewMode === 'CHARTS' && (
                 <div className="h-full overflow-y-auto p-4 custom-scrollbar">
                    <ChartsView 
                      headers={headers} 
                      apiKey={apiKey} 
                      fileName={activeSheetName}
                      externalChartConfig={generatedChart}
                      onRequestApiKey={() => setShowKeyModal(true)}
                    />
                 </div>
               )}
            </div>
          </div>

          {/* Chat Interface */}
          <ChatInterface 
            apiKey={apiKey}
            activeSheetName={activeSheetName}
            headers={headers}
            onUpdateData={handleUpdateData}
            onChartGenerated={handleChartGeneratedFromChat}
            isOpen={isChatOpen}
            toggleOpen={() => setIsChatOpen(!isChatOpen)}
            onRequestApiKey={() => setShowKeyModal(true)}
          />
        </div>
      )}
    </Layout>
  );
}

export default App;