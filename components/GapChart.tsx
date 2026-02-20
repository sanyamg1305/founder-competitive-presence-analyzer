
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ACCENT_COLOR } from '../constants';

interface GapChartProps {
  userAvg: number;
  compAvg: number;
}

export const GapChart: React.FC<GapChartProps> = ({ userAvg, compAvg }) => {
  const data = [
    { name: 'You', value: userAvg },
    { name: 'Competitor Avg', value: compAvg },
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" vertical={false} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#888888', fontSize: 12 }} 
          />
          <YAxis hide />
          <Tooltip 
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            contentStyle={{ backgroundColor: '#111111', border: '1px solid #333', borderRadius: '8px' }}
            itemStyle={{ color: '#fff' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={60}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.name === 'You' ? ACCENT_COLOR : '#333333'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
