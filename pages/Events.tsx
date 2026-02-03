import React, { useState } from 'react';
import { useSync } from '../DataSynchronizer';
import { AlertSeverity } from '../types';

const Events: React.FC = () => {
  const { events, kanbanCards, kanbanColumns, isSyncing } = useSync();
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Mesclar eventos reais com os cards do Kanban para ter um log unificado
  const combinedLogs = [
    ...events.map(e => ({
      id: e.id,
      timestamp: new Date(e.timestamp).toLocaleTimeString(),
      fullDate: new Date(e.timestamp),
      severity: e.severity,
      type: e.type,
      location: e.location,
      description: e.description,
      source: 'SISTEMA'
    })),
    ...kanbanCards.map(c => {
      const col = kanbanColumns.find(col => col.id === c.columnId);
      return {
        id: c.id,
        timestamp: new Date(c.createdAt).toLocaleTimeString(),
        fullDate: new Date(c.createdAt),
        severity: c.severity === 'CRÍTICO' ? 'CRITICAL' : c.severity === 'ALERTA' ? 'WARNING' : 'INFO',
        type: `KANBAN - ${col?.title || 'BOX'}`,
        location: 'QUADRO OPERACIONAL',
        description: c.title + (c.description ? `: ${c.description}` : ''),
        source: 'MANUAL'
      };
    })
  ].sort((a, b) => b.fullDate.getTime() - a.fullDate.getTime());

  const filteredLogs = combinedLogs.filter(e => {
    const matchesFilter = filter === 'ALL' || e.severity === filter;
    const matchesSearch = e.type.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    const headers = ["Horário", "Severidade", "Tipo", "Localização", "Descrição", "Fonte"];
    const rows = filteredLogs.map(log => [
      log.timestamp,
      log.severity,
      log.type,
      log.location,
      log.description.replace(/,/g, ';'), // Evitar quebra de colunas
      log.source
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `monimax_logs_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Log de Eventos</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">Histórico Unificado de Operação e Segurança</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-green-500/20 transition-all"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Exportar Excel
          </button>

          <div className="bg-card-dark border border-border-dark rounded-lg flex p-1 shadow-lg">
            {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-1.5 rounded-md text-[10px] font-black transition-all ${filter === s ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="BUSCAR LOGS..."
              className="bg-card-dark border border-border-dark rounded-lg pl-9 pr-4 py-2.5 text-[10px] text-white focus:ring-2 focus:ring-primary outline-none w-56 font-bold uppercase tracking-widest transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-background-dark/80 backdrop-blur-sm text-slate-500 uppercase font-black tracking-widest text-[9px] border-b border-border-dark">
              <tr>
                <th className="px-6 py-5">Horário</th>
                <th className="px-6 py-5">Severidade</th>
                <th className="px-6 py-5">Origem / Tipo</th>
                <th className="px-6 py-5">Local/Setor</th>
                <th className="px-6 py-5">Detalhes do Incidente</th>
                <th className="px-6 py-5 text-right">Fonte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark/50">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 font-mono text-slate-400 text-[10px]">{log.timestamp}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[8px] font-black tracking-widest ${log.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                      log.severity === 'WARNING' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                        'bg-primary/10 text-primary border border-primary/20'
                      }`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-white uppercase text-[10px] tracking-tight">{log.type}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-[10px] uppercase font-medium">{log.location}</td>
                  <td className="px-6 py-4 text-slate-500 text-[10px] leading-relaxed max-w-md">
                    {log.description}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-md ${log.source === 'MANUAL' ? 'bg-purple-500/10 text-purple-400' : 'bg-green-500/10 text-green-400'}`}>
                      {log.source === 'MANUAL' ? 'OPERAÇÃO' : 'IA-SYSTEM'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && !isSyncing && (
          <div className="p-24 text-center">
            <div className="size-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
              <span className="material-symbols-outlined text-3xl text-slate-600">history_toggle_off</span>
            </div>
            <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Nenhum registro encontrado no histórico</p>
          </div>
        )}

        {isSyncing && filteredLogs.length === 0 && (
          <div className="p-24 text-center animate-pulse">
            <p className="text-primary font-black uppercase tracking-widest text-[10px]">Sincronizando logs...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
