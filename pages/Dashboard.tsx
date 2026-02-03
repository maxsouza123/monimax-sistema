import React, { useState, useEffect } from 'react';
import ChartSection from '../components/ChartSection';
import { getSecurityInsights } from '../geminiService';
import { useSync } from '../DataSynchronizer';

const Dashboard: React.FC = () => {
  const [aiInsights, setAiInsights] = useState<string>('Gerando análise com IA...');
  const [hasError, setHasError] = useState(false);

  const { events, cameras, devices, kanbanCards, kanbanColumns, suspiciousPlates, isSyncing } = useSync();

  // Consolidar todas as câmeras (tabela cameras + devices tipo CAMERA)
  const allCamerasCount = cameras.length + devices.filter(d => d.type === 'CAMERA').length;
  const onlineCamerasCount = cameras.filter(c => c.status === 'online').length +
    devices.filter(d => d.type === 'CAMERA' && d.status === 'online').length;

  // Estatísticas do Kanban
  const totalKanbanAlerts = kanbanCards.length;
  const criticalKanbanAlerts = kanbanCards.filter(c => c.severity === 'CRÍTICO').length;

  // Combinar atividades IA + Kanban
  const combinedActivities = [
    ...events.map(e => ({
      id: e.id,
      type: e.type,
      location: e.location,
      severity: e.severity,
      time: new Date(e.timestamp),
      source: 'IA'
    })),
    ...kanbanCards.map(c => {
      const col = kanbanColumns.find(col => col.id === c.columnId);
      return {
        id: c.id,
        type: `BOX: ${col?.title || 'KANBAN'}`,
        location: 'OPERACIONAL',
        severity: c.severity === 'CRÍTICO' ? 'CRITICAL' : c.severity === 'ALERTA' ? 'WARNING' : 'INFO',
        time: new Date(c.createdAt),
        source: 'MANUAL'
      };
    })
  ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 6);

  const loadInsights = async () => {
    if (events.length === 0) {
      setAiInsights('Aguardando eventos para análise...');
      return;
    }
    setHasError(false);
    setAiInsights('Gerando análise com IA...');
    const result = await getSecurityInsights(events.slice(0, 10));

    if (result === "QUOTA_EXCEEDED") {
      setHasError(true);
      setAiInsights("O limite de processamento de IA para sua conta foi atingido. Aguarde alguns instantes antes de tentar novamente.");
    } else {
      setAiInsights(result);
    }
  };

  useEffect(() => {
    if (!isSyncing && events.length > 0) {
      loadInsights();
    }
  }, [events.length, isSyncing]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Painel MoniMax</h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">Monitoramento inteligente e análise de risco em tempo real.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="videocam" title="Câmeras Ativas" value={`${onlineCamerasCount}/${allCamerasCount}`} sub="Status Geral" trend="+0%" />
        <StatCard icon="view_kanban" title="Alertas Kanban" value={totalKanbanAlerts.toString()} sub={`${criticalKanbanAlerts} Críticos`} trend="Active" />
        <StatCard icon="settings_input_component" title="Dispositivos" value={devices.length.toString()} sub="Hardware" trend="OK" />
        <StatCard icon="psychology" title="IA Precision" value="98.5%" sub="Reconhecimento" trend="+0.5%" />
      </div>

      <div className={`bg-primary/10 border rounded-2xl p-6 shadow-xl shadow-primary/5 transition-all duration-300 ${hasError ? 'border-red-500/30 bg-red-500/5' : 'border-primary/20'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined ${hasError ? 'text-red-500' : 'text-primary'}`}>
              {hasError ? 'warning' : 'psychology'}
            </span>
            <h2 className="text-lg font-bold text-white uppercase tracking-tight">Análise Preditiva de IA</h2>
          </div>
          {hasError && (
            <button onClick={loadInsights} className="px-4 py-1.5 bg-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">refresh</span> Tentar Novamente
            </button>
          )}
        </div>
        <div className={`text-sm leading-relaxed whitespace-pre-wrap ${hasError ? 'text-slate-400 italic' : 'text-slate-300 font-medium'}`}>
          {aiInsights}
        </div>
      </div>

      <ChartSection />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atividade Recente (IA + Kanban) */}
        <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden flex flex-col shadow-xl">
          <div className="p-5 border-b border-border-dark flex justify-between items-center bg-background-dark/30">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">history</span>
              <h2 className="text-white font-bold text-sm uppercase tracking-widest">Fluxo de Atividade Recente</h2>
            </div>
            <button onClick={() => window.location.hash = '/events'} className="text-[10px] font-black text-primary hover:underline uppercase">Ver Log Completo</button>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-500/5 text-slate-500 uppercase text-[9px] font-black tracking-widest">
                <tr>
                  <th className="px-5 py-3">Tipo / Origem</th>
                  <th className="px-5 py-3 text-center">Severidade</th>
                  <th className="px-5 py-3 text-right">Horário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark/50">
                {combinedActivities.map(activity => (
                  <tr key={activity.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white uppercase">{activity.type}</div>
                      <div className="text-[9px] text-slate-500 font-medium uppercase">{activity.location}</div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest ${activity.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        activity.severity === 'WARNING' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                          'bg-primary/10 text-primary border border-primary/20'
                        }`}>
                        {activity.severity}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-slate-500 font-mono text-[10px]">
                      {activity.time.toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
                {combinedActivities.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-600 italic uppercase font-black text-[10px] tracking-widest">
                      Nenhuma atividade registrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Placas Suspeitas Grid */}
        <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden flex flex-col shadow-xl">
          <div className="p-5 border-b border-border-dark flex justify-between items-center bg-background-dark/30">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500 text-lg">minor_crash</span>
              <h2 className="text-white font-bold text-sm uppercase tracking-widest">Monitoramento de Blacklist (LPR)</h2>
            </div>
            <button onClick={() => window.location.hash = '/plates'} className="text-[10px] font-black text-primary hover:underline uppercase">Gerenciar Lista</button>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-500/5 text-slate-500 uppercase text-[9px] font-black tracking-widest">
                <tr>
                  <th className="px-5 py-3">Placa</th>
                  <th className="px-5 py-3 text-center">Motivo</th>
                  <th className="px-5 py-3 text-right">Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark/50">
                {suspiciousPlates.slice(0, 5).map(plate => (
                  <tr key={plate.id} className="hover:bg-red-500/[0.02] transition-colors border-l-2 border-transparent hover:border-red-500">
                    <td className="px-5 py-4">
                      <div className="bg-slate-800 text-white px-2 py-1 rounded font-mono font-black border border-slate-700 inline-block tracking-tighter text-xs">
                        {plate.plate}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-red-400 font-bold uppercase text-[9px] tracking-tight">{plate.observations || 'SEM OBSERVAÇÃO'}</span>
                    </td>
                    <td className="px-5 py-4 text-right text-slate-500 font-bold text-[9px] uppercase">
                      Sistema IA
                    </td>
                  </tr>
                ))}
                {suspiciousPlates.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-600 italic uppercase font-black text-[10px] tracking-widest">
                      Nenhum veículo em blacklist
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, sub, trend, trendUp = true }: any) => (
  <div className="bg-card-dark p-6 rounded-2xl border border-border-dark hover:border-primary/50 transition-all group shadow-lg">
    <div className="flex justify-between items-start mb-4">
      <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <span className={`text-[10px] font-bold ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
        {trend} {trendUp ? '↑' : '↓'}
      </span>
    </div>
    <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{title}</h3>
    <div className="flex items-baseline gap-2 mt-1">
      <span className="text-white text-2xl font-black">{value}</span>
      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{sub}</span>
    </div>
  </div>
);

export default Dashboard;
