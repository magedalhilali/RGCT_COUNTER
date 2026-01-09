import React, { useState } from 'react';
import { Key, Lock, ExternalLink, X } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (key: string) => void;
  onSkip: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave, onSkip }) => {
  const [inputKey, setInputKey] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-indigo-600">
            <div className="p-2 bg-indigo-50 rounded-lg">
                <Key className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Enter Gemini API Key</h2>
            </div>
            <button onClick={onSkip} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>
        
        <p className="text-slate-600 text-sm mb-4">
          To enable the AI Data Consultant features, please enter your Google Gemini API key.
        </p>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 mb-6">
          <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            Your key is stored in <strong>session memory only</strong>. It is never sent to our servers and is wiped when you close this tab.
          </p>
        </div>

        <input
          type="password"
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          placeholder="AIzaSy..."
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-4 outline-none"
        />

        <div className="flex justify-between items-center gap-3">
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mr-auto"
          >
            Get a key <ExternalLink className="w-3 h-3" />
          </a>
          
          <button
            onClick={onSkip}
            className="px-4 py-2 text-slate-500 font-medium rounded-lg hover:bg-slate-100 transition-colors"
          >
            Skip for now
          </button>

          <button
            onClick={() => onSave(inputKey)}
            disabled={!inputKey}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Start Session
          </button>
        </div>
      </div>
    </div>
  );
};