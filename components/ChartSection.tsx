
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const dataLine = [
  { name: '00h', val: 400 }, { name: '04h', val: 300 }, { name: '08h', val: 900 },
  { name: '12h', val: 1200 }, { name: '16h', val: 1500 }, { name: '20h', val: 800 },
  { name: '23h', val: 600 }
];

const dataBar = [
  { name: 'Cam 01', alerts: 45 }, { name: 'Cam 02', alerts: 12 },
  { name: 'Cam 03', alerts: 88 }, { name: 'Cam 04', alerts: 32 },
  { name: 'Cam 05', alerts: 21 }
];

const ChartSection: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-card-dark p-6 rounded-xl border border-border-dark">
        <h3 className="text-white text-sm font-bold mb-4">Detecções de Placas por Hora</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataLine}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e3b8a" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#1e3b8a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#292e38" vertical={false} />
              <XAxis dataKey="name" stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1c1f26', border: '1px solid #292e38', borderRadius: '8px' }}
                itemStyle={{ color: '#fff', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="val" stroke="#1e3b8a" fillOpacity={1} fill="url(#colorVal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card-dark p-6 rounded-xl border border-border-dark">
        <h3 className="text-white text-sm font-bold mb-4">Alertas por Câmera</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataBar}>
              <CartesianGrid strokeDasharray="3 3" stroke="#292e38" vertical={false} />
              <XAxis dataKey="name" stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1c1f26', border: '1px solid #292e38', borderRadius: '8px' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="alerts" radius={[4, 4, 0, 0]}>
                {dataBar.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.alerts > 50 ? '#ef4444' : '#1e3b8a'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ChartSection;
