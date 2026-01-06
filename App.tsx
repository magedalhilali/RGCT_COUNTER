import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { FileUpload } from './components/FileUpload';
import { ColumnSelector } from './components/ColumnSelector';
import { Dashboard } from './components/Dashboard';
import { analyzeData } from './utils/processor';
import { AppStep, AnalysisResult } from './types';

function App() {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [rawData, setRawData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [results, setResults] = useState<AnalysisResult | null>(null);

  const handleDataLoaded = (data: any[], detectedHeaders: string[], name: string) => {
    setRawData(data);
    setHeaders(detectedHeaders);
    setFileName(name);
    setStep(AppStep.SELECT_COLUMN);
  };

  const handleColumnSelect = (column: string) => {
    const analysis = analyzeData(rawData, column);
    setSelectedColumn(column);
    setResults(analysis);
    setStep(AppStep.DASHBOARD);
  };

  const handleReset = () => {
    setStep(AppStep.UPLOAD);
    setRawData([]);
    setHeaders([]);
    setFileName('');
    setSelectedColumn('');
    setResults(null);
  };

  const handleBackToUpload = () => {
    setStep(AppStep.UPLOAD);
    setRawData([]);
  };

  return (
    <Layout>
      {step === AppStep.UPLOAD && (
        <FileUpload onDataLoaded={handleDataLoaded} />
      )}

      {step === AppStep.SELECT_COLUMN && (
        <ColumnSelector 
          headers={headers} 
          fileName={fileName}
          onSelect={handleColumnSelect}
          onBack={handleBackToUpload}
        />
      )}

      {step === AppStep.DASHBOARD && results && (
        <Dashboard 
          results={results} 
          selectedColumn={selectedColumn} 
          fileName={fileName}
          onReset={handleReset}
        />
      )}
    </Layout>
  );
}

export default App;
