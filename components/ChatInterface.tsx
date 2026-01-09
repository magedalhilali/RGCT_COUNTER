import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, ChevronRight, Loader2, Code2, Bot, Terminal, Trash2, X, PieChart, Database, Layers } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage, ChartConfig } from '../types';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  apiKey: string | null;
  activeSheetName: string;
  headers: string[];
  onUpdateData: (newData: any[], newHeaders: string[]) => void;
  onChartGenerated: (config: ChartConfig) => void;
  isOpen: boolean;
  toggleOpen: () => void;
  onRequestApiKey: () => void;
}

// --- Logic Helpers ---

const safeEvaluate = (code: string, context: 'active' | 'all') => {
  try {
    if (context === 'active') {
        if (!window.fullDataset) throw new Error("Dataset not loaded.");
        const sandboxFn = new Function('data', code);
        const result = sandboxFn(window.fullDataset);
        return { success: true, result };
    } else {
        if (!window.allSheets) throw new Error("Sheets not loaded.");
        const sandboxFn = new Function('data', code);
        const result = sandboxFn(window.allSheets);
        return { success: true, result };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

const formatResult = (result: any): string => {
  if (typeof result === 'number') return `**Result:** ${result.toLocaleString()}`;
  if (typeof result === 'boolean') return result ? "**Yes**" : "**No**";
  
  if (Array.isArray(result)) {
    if (result.length === 0) return "*No matches found.*";
    if (result.length <= 100) {
      return `**Found ${result.length} items:**\n\n` + result.map(i => `- ${typeof i === 'object' ? JSON.stringify(i) : String(i)}`).join('\n');
    }
    const preview = result.slice(0, 10).map(i => `- ${typeof i === 'object' ? JSON.stringify(i) : String(i)}`).join('\n');
    return `**Found ${result.length.toLocaleString()} items.**\n\nHere are the top 10:\n${preview}\n\n*...and ${(result.length - 10).toLocaleString()} more.*`;
  }
  
  if (typeof result === 'object' && result !== null) {
    return "```json\n" + JSON.stringify(result, null, 2) + "\n```";
  }
  
  return String(result);
};

// --- NEW: Helper to get data context ---
const generateDataPreview = (headers: string[], data: any[]) => {
    const preview: Record<string, any[]> = {};
    if (!data || data.length === 0) return "No data available.";

    // For each column, find up to 20 unique values to show the AI
    headers.forEach(header => {
        // Get all values for this column
        const allValues = data.map(row => row[header]);
        // Filter out nulls/undefined and get unique ones
        const uniqueValues = Array.from(new Set(allValues.filter(v => v !== null && v !== undefined && v !== '')));
        // Take the top 20
        preview[header] = uniqueValues.slice(0, 20);
    });
    return JSON.stringify(preview);
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  apiKey, 
  activeSheetName,
  headers, 
  onChartGenerated,
  isOpen, 
  toggleOpen,
  onRequestApiKey
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCodeForId, setShowCodeForId] = useState<string | null>(null);
  const [dataContext, setDataContext] = useState<'active' | 'all'>('active');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleClearChat = () => {
    if (messages.length > 0 && window.confirm("Are you sure you want to clear the chat history?")) {
      setMessages([]);
      setInputValue('');
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    if (!apiKey) {
        onRequestApiKey();
        return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsProcessing(true);

    try {
      const isMultiSheet = dataContext === 'all';
      
      let dataDescription = "";
      
      if (isMultiSheet) {
          const sheetNames = Object.keys(window.allSheets || {});
          dataDescription = `
            You have access to the ENTIRE WORKBOOK in the variable \`data\`.
            \`data\` is an OBJECT where keys are Sheet Names and values are Arrays of rows.
            Available Sheet Names: ${JSON.stringify(sheetNames)}.
          `;
      } else {
          // --- INTELLIGENT DATA SCANNING ---
          // We generate a preview of the actual values so the AI knows "Egyptian" matches "EGYPT"
          let dataPreview = "Data unavailable";
          if (window.fullDataset) {
             dataPreview = generateDataPreview(headers, window.fullDataset);
          }

          dataDescription = `
            You have access to the ACTIVE SHEET in the variable \`data\`.
            \`data\` is an ARRAY of objects (rows).
            Current Sheet Name: "${activeSheetName}".
            Headers: ${JSON.stringify(headers)}.

            ### DATA PREVIEW / VALUE DICTIONARY
            Here are the unique values found in the first few columns. USE THIS TO MATCH USER TERMS TO ACTUAL DATA VALUES.
            (Example: If user asks for "Egyptian", check this list. If you see "EGYPT", use "EGYPT" in your code).
            
            ${dataPreview}
          `;
      }

      const systemInstruction = `
      You are an expert Data Analyst Logic Engine. 
      
      ${dataDescription}
      
      ### RESPONSE PROTOCOL (JSON ONLY)
      You must return a valid JSON object. No Markdown outside the JSON.
      
      **Type 1: Text Response**
      { "type": "text", "text": "..." }
      
      **Type 2: Code Calculation**
      {
        "type": "code",
        "javascript": "return ...", 
        "explanation": "..."
      }
      
      **Type 3: Chart Generation**
      {
        "type": "chart_generation",
        "title": "...",
        "chartType": "bar",
        "javascript": "return ...", 
        "xAxisKey": "name", 
        "dataKeys": [{"key": "value", "color": "#8884d8", "name": "Count"}]
      }

      ### CODING RULES
      1. **Natural Language Matching:** If the user uses a term (e.g. "Egyptian") that doesn't perfectly match the data (e.g. "EGYPT"), ALWAYS check the Data Preview provided above. Use the exact value found in the data. If the exact value isn't obvious, use \`.toLowerCase().includes('term')\` for fuzzy matching.
      
      2. **Chart Data Format:** - NEVER return a plain Object (dictionary) for charts. Recharts requires an ARRAY of Objects.
         - **BAD:** \`return { "EGYPT": 10, "INDIA": 5 }\`
         - **GOOD:** \`const counts = ...; return Object.entries(counts).map(([k, v]) => ({ name: k, value: v }));\`
         - Always use keys "name" and "value" for bar/pie charts.
      `;

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
            ...messages.map(m => ({
                role: m.role === 'model' ? 'model' : 'user',
                parts: [{ text: m.content }] 
            })),
            { role: 'user', parts: [{ text }] }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });

      const responseRaw = response.text || "{}";
      const cleanJson = responseRaw.replace(/```json/g, "").replace(/```/g, "").trim();
      let parsed: any = {};
      
      try {
        parsed = JSON.parse(cleanJson);
      } catch (e) {
        parsed = { type: "text", text: responseRaw }; 
      }

      let finalContent = "";
      let toolResult = null;

      if (parsed.type === 'code') {
        const exec = safeEvaluate(parsed.javascript, dataContext);
        if (exec.success) {
          const displayResult = formatResult(exec.result);
          finalContent = `${parsed.explanation}\n\n${displayResult}`;
          toolResult = { type: 'code_execution', code: parsed.javascript, result: exec.result };
        } else {
          finalContent = `I tried to calculate that, but the code failed.\n\nError: \`${exec.error}\``;
          toolResult = { type: 'error', code: parsed.javascript, error: exec.error };
        }
      } 
      else if (parsed.type === 'chart_generation') {
        const exec = safeEvaluate(parsed.javascript, dataContext);
        if (exec.success) {
            if (!Array.isArray(exec.result)) {
                finalContent = "I generated data, but it was in the wrong format (Object instead of Array). Please ask me to 'list' it instead.";
                toolResult = { type: 'error', code: parsed.javascript, error: "Result was not an array." };
            } else {
                const config: ChartConfig = {
                    title: parsed.title,
                    description: parsed.description,
                    type: parsed.chartType,
                    data: exec.result,
                    xAxisKey: parsed.xAxisKey,
                    dataKeys: parsed.dataKeys
                };
                onChartGenerated(config);
                finalContent = parsed.message || "Chart generated. Please switch to the Charts tab to view it.";
                toolResult = { type: 'chart_success', code: parsed.javascript };
            }
        } else {
            finalContent = "I tried to generate the chart, but processing the data failed.";
            toolResult = { type: 'error', code: parsed.javascript, error: exec.error };
        }
      }
      else {
        finalContent = parsed.text || parsed.message || "I didn't understand.";
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: finalContent,
        timestamp: new Date(),
        toolResult
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: "System Error: Unable to connect to AI service.",
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={toggleOpen}
        className="fixed right-4 bottom-4 sm:right-8 sm:bottom-8 bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-600 transition-all z-50 animate-fade-in hover:scale-110 active:scale-95"
      >
        <Sparkles className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 lg:static lg:z-auto lg:w-[450px] lg:flex-shrink-0 flex flex-col h-full transition-all duration-300">
      
      <div className="absolute inset-0 bg-slate-900/50 lg:hidden backdrop-blur-sm" onClick={toggleOpen} aria-hidden="true" />

      <div className="relative flex flex-col h-full w-full bg-white lg:bg-white/70 lg:backdrop-blur-xl lg:border lg:border-white/50 lg:rounded-2xl lg:shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden shadow-2xl animate-slide-up lg:animate-none">
        
        {/* Header */}
        <div className="p-4 border-b border-black/5 flex flex-col gap-3 bg-white/40 backdrop-blur-md flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
                <Bot className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                <h3 className="font-semibold text-slate-800 text-sm">Maged's Data Assistant</h3>
                <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${apiKey ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{apiKey ? 'Online' : 'Offline'}</span>
                </div>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button 
                onClick={handleClearChat} 
                className="p-2 hover:bg-red-50 hover:text-red-600 rounded-full text-slate-400 transition-colors"
                title="Clear Chat History"
                >
                <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={toggleOpen} className="p-2 hover:bg-black/5 rounded-full text-slate-400 transition-colors">
                <X className="w-5 h-5 lg:hidden" />
                <ChevronRight className="w-5 h-5 hidden lg:block" />
                </button>
            </div>
          </div>

          {/* Context Selector */}
          <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-lg border border-slate-200/50">
             <button
               onClick={() => setDataContext('active')}
               className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${dataContext === 'active' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <Layers className="w-3 h-3" />
               Current Sheet
             </button>
             <button
               onClick={() => setDataContext('all')}
               className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${dataContext === 'all' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <Database className="w-3 h-3" />
               All Sheets
             </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-grow overflow-y-auto p-5 space-y-6 custom-scrollbar bg-slate-50/50 lg:bg-transparent">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center mb-4 border border-white">
                <Sparkles className="w-8 h-8 text-indigo-400" />
              </div>
              <h4 className="font-semibold text-slate-700">Ask me anything</h4>
              <p className="text-xs text-slate-500 mt-2 max-w-[200px]">
                {dataContext === 'active' 
                   ? `Focused on: ${activeSheetName}`
                   : "Focused on: Entire Workbook"
                }
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              
              {/* Message Bubble */}
              <div className={`max-w-[90%] rounded-2xl p-4 text-sm shadow-sm relative group ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-br-sm' 
                  : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm'
              }`}>
                {msg.role === 'model' ? (
                  <div className="prose prose-sm max-w-none prose-p:text-slate-600 prose-headings:text-slate-800 prose-strong:text-slate-800">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}

                {msg.toolResult && (msg.toolResult.type === 'code_execution' || msg.toolResult.type === 'chart_success') && (
                  <button 
                    onClick={() => setShowCodeForId(showCodeForId === msg.id ? null : msg.id)}
                    className="mt-2 text-[10px] text-slate-400 flex items-center gap-1 hover:text-indigo-600 transition-colors"
                  >
                    {msg.toolResult.type === 'chart_success' ? <PieChart className="w-3 h-3"/> : <Code2 className="w-3 h-3" />}
                    {showCodeForId === msg.id ? 'Hide Logic' : (msg.toolResult.type === 'chart_success' ? 'View Chart Logic' : 'View Logic')}
                  </button>
                )}
              </div>

              {msg.toolResult && showCodeForId === msg.id && (
                <div className="w-full mt-2 animate-fade-in max-w-[90%]">
                  <div className="bg-slate-900 rounded-lg p-3 text-xs font-mono text-indigo-200 overflow-x-auto border border-slate-700 shadow-inner">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700 text-slate-400">
                        <Terminal className="w-3 h-3" />
                        <span>Executed JavaScript ({dataContext === 'active' ? 'Active Sheet' : 'All Sheets'})</span>
                    </div>
                    <pre className="whitespace-pre-wrap">{msg.toolResult.code}</pre>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-start gap-3">
               <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                 <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
               </div>
               <div className="bg-white/50 px-4 py-2 rounded-full text-xs text-slate-500 font-medium">
                 Thinking...
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/60 backdrop-blur-md border-t border-white/50 pb-safe flex-shrink-0">
          <div className="relative group">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
              placeholder="Ask a data question..."
              disabled={isProcessing}
              className="w-full pl-5 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm group-hover:shadow-md"
            />
            <button 
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue || isProcessing}
              className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center mt-2 hidden sm:block">
             <p className="text-[10px] text-slate-400">AI can make mistakes. Verify important data.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
