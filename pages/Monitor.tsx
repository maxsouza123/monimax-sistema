import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import CameraCard from '../components/CameraCard';
import EventItem from '../components/EventItem';
import { useSync } from '../DataSynchronizer';
import { SecurityEvent, ChatMessage, Camera } from '../types';
import { summarizeIncident } from '../geminiService';
import { supabase } from '../supabaseClient';
import { SupabaseMapper } from '../supabaseMapper';

const Monitor: React.FC = () => {
  const { clientId } = useParams<{ clientId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    cameras,
    devices,
    events: syncEvents,
    clients: syncClients,
    kanbanCards,
    kanbanColumns,
    chatMessages: syncChatMessages,
    userProfile,
    isSyncing
  } = useSync();

  // Filtrar os cards do Kanban que estão pendentes (Backlog, To Do, Em Atendimento)
  const pendingKanbanEvents = useMemo(() => {
    return kanbanCards
      .filter(card => {
        const col = kanbanColumns.find(c => c.id === card.columnId);
        if (!col) return false;
        const title = col.title.toUpperCase();
        return title.includes('BACKLOG') || title.includes('TO DO') || title.includes('ATENDIMENTO');
      })
      .map(card => {
        const col = kanbanColumns.find(c => c.id === card.columnId);
        return {
          id: card.id,
          type: `KANBAN: ${col?.title || 'PENDENTE'}`,
          severity: card.severity === 'CRÍTICO' ? 'CRITICAL' : card.severity === 'ALERTA' ? 'WARNING' : 'INFO',
          timestamp: new Date(card.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: 'QUADRO OPERACIONAL',
          description: card.title + (card.description ? `: ${card.description}` : ''),
          source: 'MANUAL'
        } as unknown as SecurityEvent;
      });
  }, [kanbanCards, kanbanColumns]);

  // Mesclar eventos de sistema com eventos do Kanban
  const allPendingEvents = useMemo(() => {
    return [...syncEvents, ...pendingKanbanEvents].sort((a, b) => b.id.localeCompare(a.id));
  }, [syncEvents, pendingKanbanEvents]);

  const isSoloMode = new URLSearchParams(location.search).get('solo') === 'true';

  const [activeEvent, setActiveEvent] = useState<SecurityEvent | null>(null);
  const [inputText, setInputText] = useState('');
  const [eventSummary, setEventSummary] = useState('');
  const [summaryError, setSummaryError] = useState(false);

  const [cameraCount, setCameraCount] = useState<number>(isSoloMode ? 64 : 16);
  const [selectedClient, setSelectedClient] = useState<string>(clientId || 'all');
  const [isExpanded, setIsExpanded] = useState<boolean>(isSoloMode);

  const chatRef = useRef<HTMLDivElement>(null);

  // Sync active event
  useEffect(() => {
    if (allPendingEvents.length > 0 && !activeEvent) {
      setActiveEvent(allPendingEvents[0]);
    }
  }, [allPendingEvents]);

  const allMonitorableCameras = useMemo(() => {
    const directCameras = cameras;
    const deviceCameras: Camera[] = devices
      .filter(d => d.type === 'CAMERA')
      .flatMap(d => {
        const isDual = d.model.toUpperCase().includes('DUAL') || d.name.toUpperCase().includes('DUAL');
        const baseCam = {
          id: d.id,
          name: d.name,
          status: d.status,
          brand: d.protocol || 'Generic',
          latency: Math.floor(Math.random() * 50) + 10,
          ip: d.ip,
          client: d.clientId,
          streamName: d.name.toLowerCase().replace(/\s+/g, '_')
        };

        if (isDual) {
          return [
            { ...baseCam, id: `${d.id}_lens1`, name: `${d.name} (Lente 1)`, streamName: `${baseCam.streamName}_1` },
            { ...baseCam, id: `${d.id}_lens2`, name: `${d.name} (Lente 2)`, streamName: `${baseCam.streamName}_2` }
          ];
        }

        return [baseCam];
      });

    const combined = [...directCameras, ...deviceCameras];
    const unique = Array.from(new Map(combined.map(c => [c.id, c])).values());
    return unique;
  }, [cameras, devices]);

  const clientsList = useMemo(() => {
    const registeredNames = syncClients.map(c => c.name);
    const cameraClientNames = allMonitorableCameras.map(c => c.client).filter(Boolean) as string[];
    const uniqueClients = Array.from(new Set([...registeredNames, ...cameraClientNames]));
    return uniqueClients.sort();
  }, [allMonitorableCameras, syncClients]);

  useEffect(() => {
    if (clientId) setSelectedClient(clientId);
  }, [clientId]);

  const displayedCameras = useMemo(() => {
    const baseList = selectedClient === 'all'
      ? allMonitorableCameras
      : allMonitorableCameras.filter(c => c.client === selectedClient);

    if (baseList.length === 0) return [];

    if (isSoloMode) {
      const list: Camera[] = [];
      for (let i = 0; i < cameraCount; i++) {
        const baseCam = baseList[i % baseList.length];
        list.push({
          ...baseCam,
          id: `solo-cam-${i}-${baseCam.id}`,
          name: i < baseList.length ? baseCam.name : `CAM ${i + 1} (${baseCam.name})`
        });
      }
      return list;
    }

    return baseList;
  }, [allMonitorableCameras, cameraCount, selectedClient, isSoloMode]);

  const fetchSummary = async (event: SecurityEvent) => {
    setSummaryError(false);
    setEventSummary('Analisando evento...');
    const result = await summarizeIncident(event);
    if (result === "LIMITE_COTA") {
      setSummaryError(true);
      setEventSummary("Limite de cota de IA atingido. Não foi possível gerar o resumo automático.");
    } else {
      setEventSummary(result);
    }
  };

  useEffect(() => {
    if (activeEvent && !isSoloMode) {
      fetchSummary(activeEvent);
    }
  }, [activeEvent, isSoloMode]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [syncChatMessages]);

  const openPopout = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const clientPath = selectedClient === 'all' ? '' : `/${selectedClient}`;
    const url = `${baseUrl}#/monitor${clientPath}?solo=true`;
    window.open(url, `monitor_${selectedClient}`, 'width=1280,height=720,menubar=no,status=no,toolbar=no');
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      const newMessage = {
        sender_id: user?.id || null,
        sender_name: userProfile?.fullName || user?.email || 'Operador',
        sender_role: userProfile?.role || 'OPERADOR',
        text: inputText.trim(),
      };

      const { error } = await supabase.from('chat_messages').insert([newMessage]);

      if (error) throw error;

      setInputText('');
      // O DataSynchronizer deve pegar a mudança via Realtime, 
      // mas podemos forçar um refresh local se necessário.
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error.message);
      alert('Falha ao enviar mensagem: ' + error.message);
    }
  };

  const getGridCols = () => {
    if (cameraCount === 1) return 'grid-cols-1';
    if (cameraCount <= 4) return 'grid-cols-2';
    if (cameraCount <= 9) return 'grid-cols-3';
    if (cameraCount <= 16) return 'grid-cols-4';
    if (cameraCount <= 25) return 'grid-cols-5';
    if (cameraCount <= 36) return 'grid-cols-6';
    if (cameraCount <= 49) return 'grid-cols-7';
    if (cameraCount <= 64) return 'grid-cols-8';
    if (cameraCount <= 81) return 'grid-cols-9';
    return 'grid-cols-10';
  };

  return (
    <div className={`h-full flex flex-col lg:flex-row gap-6 transition-all duration-500 ${isExpanded ? 'p-0' : ''} ${isSoloMode ? 'bg-background-dark p-4' : ''}`}>
      {!isExpanded && !isSoloMode && (
        <section className="w-full lg:w-72 flex flex-col shrink-0 gap-4 animate-in slide-in-from-left duration-300">
          <div className="flex flex-col gap-1 px-1">
            <h3 className="text-white text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Alertas Pendentes</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
            {allPendingEvents.map(ev => (
              <EventItem
                key={ev.id}
                event={ev}
                active={activeEvent?.id === ev.id}
                onClick={setActiveEvent}
              />
            ))}
          </div>
        </section>
      )}

      <section className="flex-1 flex flex-col gap-4 min-w-0 h-full">
        <div className="bg-card-dark/50 backdrop-blur-md p-2 rounded-xl border border-border-dark flex flex-wrap items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            {!isSoloMode && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`size-9 flex items-center justify-center rounded-lg transition-all ${isExpanded ? 'bg-primary text-white' : 'bg-background-dark text-slate-500 hover:text-white border border-border-dark'}`}
                title="Expandir Mosaico"
              >
                <span className="material-symbols-outlined text-[20px]">{isExpanded ? 'fullscreen_exit' : 'fullscreen'}</span>
              </button>
            )}

            <div className="flex flex-col min-w-[150px]">
              <select
                value={selectedClient}
                onChange={(e) => {
                  setSelectedClient(e.target.value);
                  if (!isSoloMode) navigate(`/monitor/${e.target.value === 'all' ? '' : e.target.value}`);
                }}
                className="bg-transparent border-none text-white text-xs font-bold p-0 focus:ring-0 cursor-pointer hover:text-primary transition-colors appearance-none uppercase tracking-wider"
              >
                <option value="all" className="bg-card-dark">TODOS OS CLIENTES</option>
                {clientsList.map(c => (
                  <option key={c} value={c} className="bg-card-dark">{c.toUpperCase()}</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-500 font-bold tracking-widest">{cameraCount} FLUXOS</span>
                {isSoloMode && <span className="text-[8px] bg-primary/20 text-primary px-1 rounded">MODO JANELA</span>}
              </div>
            </div>

            <button
              onClick={openPopout}
              className="size-9 flex items-center justify-center rounded-lg bg-background-dark text-slate-500 hover:text-primary border border-border-dark transition-all"
              title="Abrir em Nova Janela"
            >
              <span className="material-symbols-outlined text-[20px]">open_in_new</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 4, 16, 36, 64, 100].map(n => (
              <button
                key={n}
                onClick={() => setCameraCount(n)}
                className={`w-10 h-7 rounded-md text-[9px] font-black transition-all border ${cameraCount === n
                  ? 'bg-primary border-primary text-white shadow-lg'
                  : 'bg-background-dark border-border-dark text-slate-500 hover:text-white'
                  }`}
              >
                {n === 1 ? '1x1' : n}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
          <div className={`grid gap-1.5 ${getGridCols()} transition-all duration-700 h-fit pb-10`}>
            {displayedCameras.map((cam) => (
              <CameraCard key={cam.id} camera={cam} />
            ))}
          </div>
        </div>
      </section>

      {!isExpanded && !isSoloMode && (
        <section className="w-full lg:w-80 flex flex-col gap-6 shrink-0 animate-in slide-in-from-right duration-300">
          <div className={`bg-card-dark rounded-xl border transition-all duration-300 overflow-hidden shadow-xl ${summaryError ? 'border-red-500/30' : 'border-border-dark'}`}>
            <div className="p-3 bg-background-dark/30 border-b border-border-dark flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-sm ${summaryError ? 'text-red-500' : 'text-primary'}`}>
                  {summaryError ? 'warning' : 'psychology'}
                </span>
                <h3 className="text-white text-[10px] font-black uppercase tracking-widest">IA Insight</h3>
              </div>
              {summaryError && activeEvent && (
                <button
                  onClick={() => fetchSummary(activeEvent)}
                  className="text-red-500 hover:text-red-400 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                </button>
              )}
            </div>
            <div className="p-4 space-y-4">
              <p className={`text-[11px] leading-relaxed border-l-2 pl-3 ${summaryError ? 'text-slate-500 italic border-red-500/30' : 'text-slate-300 italic border-primary/30'}`}>
                "{eventSummary}"
              </p>
            </div>
          </div>

          <div className="flex-1 bg-card-dark rounded-xl border border-border-dark flex flex-col overflow-hidden shadow-xl min-h-[300px]">
            <div className="p-3 bg-background-dark/30 border-b border-border-dark flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">forum</span>
              <h3 className="text-white text-[10px] font-black uppercase tracking-widest">Chat Operacional</h3>
            </div>

            <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {syncChatMessages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                      {msg.senderName} • {msg.senderRole}
                    </span>
                  </div>
                  <div className={`max-w-[90%] px-3 py-2 rounded-xl text-[11px] shadow-sm relative group ${msg.isMe
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-background-dark border border-border-dark text-slate-300 rounded-tl-none'
                    }`}>
                    {msg.text}
                    <div className={`absolute -bottom-4 right-0 text-[7px] font-bold text-slate-600 uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}
              {syncChatMessages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center p-10">
                  <span className="material-symbols-outlined text-4xl mb-2">chat_bubble</span>
                  <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma mensagem registrada</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-background-dark/30 border-t border-border-dark">
              <div className="flex items-center gap-2 bg-background-dark border border-border-dark rounded-lg p-1.5 focus-within:border-primary/50 transition-colors">
                <input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="DIGITAR MENSAGEM..."
                  className="flex-1 bg-transparent border-none text-[10px] text-white focus:ring-0 placeholder:text-slate-600 font-bold uppercase"
                />
                <button
                  onClick={handleSendMessage}
                  className="size-7 bg-primary rounded-md flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Monitor;
