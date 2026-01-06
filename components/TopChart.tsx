import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AnalysisResult } from '../types';

interface TopChartProps {
  data: AnalysisResult['data'];
}

export const TopChart: React.FC<TopChartProps> = ({ data }) => {
  const top10 = data.slice(0, 10);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-96 flex flex-col">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Top 10 Most Frequent</h3>
      <div className="flex-grow w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={top10}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
            <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis 
              dataKey="originalName" 
              type="category" 
              width={160} 
              stroke="#64748b" 
              fontSize={12}
              // interval={0} forces all labels to be shown, preventing Recharts from hiding every other label
              interval={0}
              tickFormatter={(value) => value.length > 22 ? `${value.substring(0, 22)}...` : value}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              cursor={{ fill: '#f1f5f9' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="count" fill="#0f172a" radius={[0, 4, 4, 0]} barSize={24}>
              {top10.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index < 3 ? '#0f172a' : '#475569'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};