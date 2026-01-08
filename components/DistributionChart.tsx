import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { AnalysisResult } from '../types';

interface DistributionChartProps {
  data: AnalysisResult['data'];
}

// Expanded color palette to handle 11 distinct sections
const COLORS = [
  '#0f172a', // Slate 900
  '#1e293b', // Slate 800
  '#334155', // Slate 700
  '#475569', // Slate 600
  '#1e1b4b', // Indigo 950
  '#312e81', // Indigo 900
  '#3730a3', // Indigo 800
  '#4338ca', // Indigo 700
  '#4f46e5', // Indigo 600
  '#6366f1', // Indigo 500
  '#cbd5e1', // Slate 300 (Others)
];

export const DistributionChart: React.FC<DistributionChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    // If we have 11 or fewer items, show them all.
    // Otherwise, show top 10 and sum the rest as "Others" to make 11 sections total.
    if (data.length <= 11) {
      return data;
    }

    const top10 = data.slice(0, 10);
    const others = data.slice(10);
    
    const otherCount = others.reduce((sum, item) => sum + item.count, 0);
    const totalCount = data.reduce((sum, item) => sum + item.count, 0);
    const otherPercentage = totalCount > 0 ? (otherCount / totalCount) * 100 : 0;
    
    const otherItem = {
      name: 'other',
      originalName: 'Other Categories',
      count: otherCount,
      percentage: otherPercentage
    };

    return [...top10, otherItem];
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Overall Distribution</h3>
      
      {/* Chart Container - Fixed height for the circle itself */}
      <div className="h-64 w-full flex-shrink-0 relative z-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="count"
              nameKey="originalName"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string, props: any) => [
                `${value.toLocaleString()} (${props.payload.percentage.toFixed(1)}%)`, 
                name
              ]}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', zIndex: 50 }}
              itemStyle={{ color: '#1e293b', fontWeight: 500 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend - Responsive Grid (Vertical stack on mobile) */}
      <div className="mt-6 border-t border-slate-100 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {chartData.map((entry, index) => (
            <div key={index} className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 transition-colors hover:bg-slate-100">
              <div className="flex items-center gap-2 overflow-hidden">
                 <div 
                   className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                   style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                 />
                 <span className="font-medium truncate" title={entry.originalName}>
                   {entry.originalName}
                 </span>
              </div>
              <span className="text-slate-400 font-mono ml-2 border-l border-slate-200 pl-2">
                {entry.percentage.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};