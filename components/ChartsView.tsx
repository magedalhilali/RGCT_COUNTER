import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { GoogleGenAI } from '@google/genai';
import { Sparkles, Loader2, FileText, Send } from 'lucide-react';
import { ChartConfig } from '../types';

interface ChartsViewProps {
  headers: string[];
  apiKey: string | null;
  fileName: string;
  externalChartConfig: ChartConfig | null;
  onRequestApiKey: () => void;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#3b82f6', '#f59e0b', '#0f172a', '#334155', '#94a3b8'];

// --- NEW: Helper to get data context (Copied from ChatInterface) ---
const generateDataPreview = (headers: string[], data: any[]) => {
    const preview: Record<string, any[]> = {};
    if (!data || data.length === 0) return "No data available.";

    // For each column, find up to 20 unique values to show the AI
    // This helps it map "Yemen" -> "YEMEN" or "Mgr" -> "Manager"
    headers.forEach(header => {
        const allValues = data.map(row => row[header]);
        const uniqueValues = Array.from(new Set(allValues.filter(v => v !== null && v !== undefined && v !== '')));
        preview[header] = uniqueValues.slice(0, 20);
    });
    return JSON.stringify(preview);
};

export const ChartsView: React.FC<ChartsViewProps> = ({ headers, apiKey, fileName, externalChartConfig, onRequestApiKey }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (externalChartConfig) {
      setChartConfig(externalChartConfig);
      setPrompt(`Generated from chat: ${externalChartConfig.title}`);
    }
  }, [externalChartConfig]);

  const safeEvaluate = (code: string) => {
    try {
      if (!window.fullDataset) throw new Error("Dataset not loaded.");
      const sandboxFn = new Function('data', code);
      const result = sandboxFn(window.fullDataset);
      return { success: true, result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    if (!apiKey) {
        onRequestApiKey();
        return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // --- INTELLIGENT DATA SCANNING ---
      let dataPreview = "Data unavailable";
      if (window.fullDataset) {
         dataPreview = generateDataPreview(headers, window.fullDataset);
      }

      const systemInstruction = `
        You are an Expert Data Visualization Engineer.
        You have access to a dataset in 'data'. Headers: ${JSON.stringify(headers)}.
        
        ### DATA PREVIEW / VALUE DICTIONARY
        Here are the unique values found in the columns. USE THIS TO MATCH USER TERMS TO ACTUAL DATA VALUES.
        (Example: If user asks for "Egyptian", check this list. If you see "EGYPT", use "EGYPT" in your code).
        
        ${dataPreview}

        Generate a JSON response to render a chart using Recharts.
        
        ### JSON RESPONSE FORMAT
        {
          "title": "Chart Title",
          "description": "Short description of insights",
          "type": "bar" | "line" | "pie" | "area" | "scatter",
          "javascript": "return ...", 
          "xAxisKey": "name", 
          "dataKeys": [ { "key": "value", "color": "#8884d8", "name": "Label" } ]
        }
        
        ### CODING RULES
        1. **Natural Language Matching:** If the user uses a term (e.g. "Egyptian") that doesn't perfectly match the data (e.g. "EGYPT"), ALWAYS check the Data Preview provided above.
        2. **Array Format Only:** NEVER return a plain Object (dictionary). Recharts requires an ARRAY of Objects.
           - **BAD:** \`return { "EGYPT": 10, "INDIA": 5 }\`
           - **GOOD:** \`const counts = ...; return Object.entries(counts).map(([k, v]) => ({ name: k, value: v }));\`
        3. Use keys "name" and "value" for simple bar/pie charts to avoid NaN errors.
      `;

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
            { role: 'user', parts: [{ text: `Create a chart for: ${prompt}` }] }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });

      const cleanJson = (response.text || "{}").replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      const exec = safeEvaluate(parsed.javascript);
      if (!exec.success) {
        throw new Error(`Data processing failed: ${exec.error}`);
      }

      // Safety check: Ensure result is an Array
      if (!Array.isArray(exec.result)) {
        throw new Error("AI generated data in the wrong format (Object instead of Array). Please try again.");
      }

      const config: ChartConfig = {
        title: parsed.title,
        description: parsed.description,
        type: parsed.type,
        data: exec.result,
        xAxisKey: parsed.xAxisKey,
        dataKeys: parsed.dataKeys
      };

      setChartConfig(config);

    } catch (err: any) {
      setError(err.message || "Failed to generate chart");
    } finally {
      setIsGenerating(false);
    }
  };

  // Custom Legend Renderer
  const renderCustomLegend = (data: any[], dataKey: string, nameKey: string) => {
    return (
      <div className="mt-8 border-t border-slate-100 pt-6 w-full">
        <h4 className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Legend</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {data.map((entry: any, index: number) => (
            <div key={`legend-${index}`} className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-100 text-xs">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="truncate font-medium text-slate-700" title={entry[nameKey]}>{entry[nameKey]}</span>
              <span className="text-slate-500 font-mono ml-auto">{Number(entry[dataKey] || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderChart = () => {
    if (!chartConfig) return null;
    
    if (!chartConfig.data || chartConfig.data.length === 0) {
        return <div className="text-center text-slate-400 p-10">No data generated for this chart.</div>;
    }

    const isManyItems = chartConfig.data.length > 8;

    const commonProps = {
      data: chartConfig.data,
      margin: { top: 20, right: 30, left: 20, bottom: isManyItems ? 20 : 5 }
    };

    const standardXAxis = (
      <XAxis 
        dataKey={chartConfig.xAxisKey} 
        fontSize={11} 
        tickLine={false} 
        axisLine={false}
        interval={isManyItems ? 0 : 'preserveStartEnd'}
        angle={isManyItems ? -45 : 0}
        textAnchor={isManyItems ? 'end' : 'middle'}
        height={isManyItems ? 80 : 30}
      />
    );
    const standardYAxis = <YAxis fontSize={12} tickLine={false} axisLine={false} />;

    switch (chartConfig.type) {
      case 'bar':
        return (
          <div className="flex flex-col w-full">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart {...commonProps}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  {standardXAxis}
                  {standardYAxis}
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  {chartConfig.dataKeys.map((k, i) => (
                    <Bar key={k.key} dataKey={k.key} name={k.name} fill={k.color || COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case 'line':
        return (
          <div className="flex flex-col w-full">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart {...commonProps}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  {standardXAxis}
                  {standardYAxis}
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  {chartConfig.dataKeys.map((k, i) => (
                    <Line key={k.key} type="monotone" dataKey={k.key} name={k.name} stroke={k.color || COLORS[i % COLORS.length]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case 'area':
        return (
          <div className="flex flex-col w-full">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart {...commonProps}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  {standardXAxis}
                  {standardYAxis}
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  {chartConfig.dataKeys.map((k, i) => (
                    <Area key={k.key} type="monotone" dataKey={k.key} name={k.name} stackId="1" fill={k.color || COLORS[i % COLORS.length]} stroke={k.color || COLORS[i % COLORS.length]} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case 'pie':
        return (
          <div className="flex flex-col w-full">
            <div className="h-[350px] sm:h-[400px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Pie
                      data={chartConfig.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey={chartConfig.dataKeys[0]?.key || 'value'}
                      nameKey={chartConfig.xAxisKey || 'name'}
                    >
                      {chartConfig.data.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                 </PieChart>
               </ResponsiveContainer>
            </div>
            {renderCustomLegend(chartConfig.data, chartConfig.dataKeys[0]?.key || 'value', chartConfig.xAxisKey || 'name')}
          </div>
        );
      case 'scatter':
        return (
           <div className="flex flex-col w-full">
             <div className="h-[400px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <ScatterChart {...commonProps}>
                   <CartesianGrid />
                   <XAxis type="number" dataKey={chartConfig.xAxisKey} name={chartConfig.xAxisKey} />
                   <YAxis type="number" dataKey={chartConfig.dataKeys[0].key} name={chartConfig.dataKeys[0].name} />
                   <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                   <Legend />
                   <Scatter name={chartConfig.dataKeys[0].name} data={chartConfig.data} fill="#8884d8" />
                 </ScatterChart>
               </ResponsiveContainer>
             </div>
           </div>
        );
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className="flex flex-col animate-fade-in p-2 pb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">AI Chart Generator</h2>
          <div className="flex items-center gap-2 mt-1">
             <FileText className="w-4 h-4 text-slate-400" />
             <span className="text-slate-500 text-sm">File: <span className="font-medium text-slate-700">{fileName}</span></span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <label className="block text-sm font-medium text-slate-700 mb-2">Describe the chart you want</label>
           <div className="relative">
             <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="e.g., Show a bar chart of Salary by Department"
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
             />
             <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
             >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
             </button>
           </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col relative min-h-[400px]">
          {error ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 p-8 text-center">
                <span className="text-4xl mb-2">⚠️</span>
                <p>{error}</p>
             </div>
          ) : !chartConfig ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 opacity-60">
               <Sparkles className="w-12 h-12 mb-4 text-indigo-300" />
               <p>Your chart will appear here</p>
             </div>
          ) : (
            <div className="flex flex-col w-full">
               <div className="p-4 border-b border-slate-100 flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{chartConfig.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-1">{chartConfig.description}</p>
                  </div>
                  <span className="text-xs font-mono uppercase bg-slate-100 text-slate-500 px-2 py-1 rounded whitespace-nowrap ml-2">
                    {chartConfig.type}
                  </span>
               </div>
               <div className="w-full p-2 sm:p-4">
                  {renderChart() || <div />}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
