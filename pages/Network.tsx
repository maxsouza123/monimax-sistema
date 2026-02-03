
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { INITIAL_CAMERAS } from '../constants';

const latencyData = [
  { time: '14:00', latency: 45 }, { time: '14:10', latency: 52 },
  { time: '14:20', latency: 48 }, { time: '14:30', latency: 120 },
  { time: '14:40', latency: 42 }, { time: '14:50', latency: 38 }
];

const Network: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in zoom-in-95 duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-white">Infraestrutura de Rede</h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Diagnóstico de Telemetria VMS</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card-dark p-6 rounded-xl border border-border-dark shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white text-xs font-black uppercase tracking-widest">Latência Média Global (ms)</h3>
            <span className="text-green-500 text-[10px] font-bold">● ESTÁVEL</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyData}>
                <defs>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3b8a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1e3b8a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#292e38" vertical={false} />
                <XAxis dataKey="time" stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1c1f26', border: '1px solid #292e38', borderRadius: '8px', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="latency" stroke="#1e3b8a" strokeWidth={3} fill="url(#netGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
           <StatusCard label="Consumo de Banda" value="1.2 GB/s" sub="68% Capacidade" icon="speed" />
           <StatusCard label="Uptime Servidor" value="142d 08h" sub="SLA 99.9%" icon="dns" />
           <StatusCard label="Packet Loss" value="0.02%" sub="Excelente" icon="wifi_off" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {INITIAL_CAMERAS.map(cam => (
          <div key={cam.id} className="bg-card-dark p-4 rounded-xl border border-border-dark flex items-center justify-between group hover:border-primary/50 transition-all">
            <div className="flex items-center gap-3">
              <div className={`size-2 rounded-full ${cam.status === 'online' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              <div>
                <p className="text-white text-xs font-bold uppercase">{cam.name}</p>
                <p className="text-[10px] text-slate-500 font-mono">{cam.ip}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-primary text-[10px] font-black">{cam.latency}ms</p>
              <p className="text-slate-600 text-[9px] font-bold uppercase">4.2 Mbps</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatusCard = ({ label, value, sub, icon }: any) => (
  <div className="bg-card-dark p-5 rounded-xl border border-border-dark flex items-center gap-4 shadow-lg">
    <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
      <span className="material-symbols-outlined">{icon}</span>
    </div>
    <div>
      <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{label}</p>
      <p className="text-white text-xl font-black">{value}</p>
      <p className="text-slate-400 text-[10px] font-medium">{sub}</p>
    </div>
  </div>
);

export default Network;
