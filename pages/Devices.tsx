import React, { useState, useEffect } from 'react';
import { Device, DeviceType, StorageConfig } from '../types';
import { useSync } from '../DataSynchronizer';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { SupabaseMapper } from '../supabaseMapper';
import WebRTCPlayer from '../components/WebRTCPlayer';

const DEVICE_BRANDS = [
  "ONVIF",
  "RTSP (STREAM DIRETO)",
  "Hikvision",
  "Dahua Technology",
  "Intelbras",
  "Axis Communications",
  "Bosch Security Systems",
  "Hanwha Vision",
  "TP-Link",
  "Eufy",
  "Reolink",
  "Avigilon",
  "Uniview",
  "Vivotek",
  "Pelco",
  "Honeywell",
  "EZVIZ",
  "Lorex",
  "Mobotix",
  "Arlo",
  "Ring",
  "Hilook"
];

const Devices: React.FC = () => {
  const { devices, isSyncing, refreshData, clients: syncClients, storageConfigs } = useSync();
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'CAMERA' | 'RECORDER'>('ALL');
  const [activeTab, setActiveTab] = useState<'form' | 'scan'>('form');
  const [scanMode, setScanMode] = useState<'local' | 'remote'>('local');
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);

  // Form State
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const [previewStream, setPreviewStream] = useState<string | null>(null);
  const [remoteAddress, setRemoteAddress] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'CAMERA' as DeviceType,
    protocol: 'ONVIF',
    host: '',
    port: '',
    user: '',
    pass: '',
    client: '',
    recordingEnabled: false,
    storageConfigId: '',
    recordingMode: 'CONTINUOUS' as 'CONTINUOUS' | 'MOTION' | 'SCHEDULED',
    retentionDays: 7,
    streamQuality: 'HIGH' as 'HIGH' | 'MEDIUM' | 'LOW',
    scheduleStart: '08:00',
    scheduleEnd: '18:00'
  });

  // Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [foundDevices, setFoundDevices] = useState<{ ip: string, name: string, brand: string, port: number, type?: string }[]>([]);

  const generateRtspUrl = (channelOverride?: number) => {
    const { host, port, user, pass, protocol } = formData;
    const ch = channelOverride || 1;

    // Se o host já for uma URL completa
    if (host.startsWith('rtsp://')) {
      // Se for dual lens e modo direto, tentamos substituir /ch1 por /ch2 ou similar
      if (channelOverride && channelOverride > 1) {
        if (host.includes('/ch1')) return host.replace('/ch1', `/ch${ch}`);
        if (host.includes('channel=1')) return host.replace('channel=1', `channel=${ch}`);
        if (host.includes('/101')) return host.replace('/101', `/${ch}01`);
        if (host.includes('/stream1')) return host.replace('/stream1', `/stream${ch}`);
      }
      return host;
    }

    // Se for apenas o nome de um stream interno do go2rtc
    if (!host.includes('.') && !host.includes(':')) {
      return host;
    }

    const auth = user && pass ? `${user}:${pass}@` : '';
    const p = port ? `:${port}` : '';

    switch (protocol) {
      case 'INTELBRAS':
      case 'DAHUA TECHNOLOGY':
        return `rtsp://${auth}${host}${p}/cam/realmonitor?channel=${ch}&subtype=0`;
      case 'HIKVISION':
      case 'HILOOK':
        return `rtsp://${auth}${host}${p}/Streaming/Channels/${ch}01`;
      case 'TP-LINK':
        return `rtsp://${auth}${host}${p}/stream${ch}`;
      case 'RTSP (STREAM DIRETO)':
        // Tenta um padrão comum se for dual, senão usa o host puro
        return ch > 1 ? `rtsp://${auth}${host}${p}/ch${ch}` : `rtsp://${auth}${host}${p}/stream`;
      default:
        // Padrão ONVIF genérico variado
        return `rtsp://${auth}${host}${p}/live/ch${ch}`;
    }
  };

  const testConnection = async () => {
    if (!formData.host) {
      alert("IP/Host é obrigatório para testar.");
      return;
    }

    setIsTesting(true);
    setTestSuccess(null);
    setPreviewStream(null);

    const rtspUrl = generateRtspUrl(1);
    const streamName = `test_${Date.now()}`;
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    const go2rtcUrl = 'http://127.0.0.1:1984';


    try {
      // Registrar stream temporário no go2rtc para teste
      const response = await fetch(`${go2rtcUrl}/api/streams?name=${streamName}&src=${encodeURIComponent(rtspUrl)}`, {
        method: 'PUT'
      });

      if (response.ok) {
        setTestSuccess(true);
        setPreviewStream(streamName);
      } else {
        throw new Error('Falha ao comunicar com o servidor go2rtc');
      }
    } catch (err) {
      console.error('Erro no teste:', err);
      setTestSuccess(false);
    } finally {
      setIsTesting(false);
    }
  };

  const filteredDevices = devices.filter(d => {
    if (filter === 'ALL') return true;
    if (filter === 'CAMERA') return d.type === 'CAMERA';
    if (filter === 'RECORDER') return d.type === 'NVR' || d.type === 'DVR';
    return true;
  });

  const handleSave = async () => {
    if (!formData.name || !formData.host) {
      alert("Nome e IP/Host são obrigatórios.");
      return;
    }

    setIsSaving(true);
    try {
      const deviceToSave = SupabaseMapper.fromDevice({
        name: formData.name,
        type: formData.type,
        status: 'online',
        ip: formData.host,
        port: parseInt(formData.port) || 80,
        protocol: formData.protocol,
        username: formData.user,
        password: formData.pass,
        clientId: formData.client,
        model: formData.protocol,
        firmware: 'N/A',
        recordingEnabled: formData.recordingEnabled,
        storageConfigId: formData.storageConfigId || null,
        recordingMode: formData.recordingMode,
        retentionDays: formData.retentionDays,
        streamQuality: formData.streamQuality,
        scheduleStart: formData.scheduleStart,
        scheduleEnd: formData.scheduleEnd
      });

      if (editingDeviceId) {
        const { error } = await supabase
          .from('devices')
          .update(deviceToSave)
          .eq('id', editingDeviceId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('devices').insert([deviceToSave]);
        if (error) throw error;
      }

      // Se for câmera, registrar permanentemente no go2rtc
      if (formData.type === 'CAMERA') {
        const isDual = formData.name.toUpperCase().includes('DUAL') || formData.protocol.toUpperCase().includes('DUAL');
        const baseStreamName = formData.name.toLowerCase().replace(/\s+/g, '_');
        const go2rtcUrl = 'http://127.0.0.1:1984';

        // Obter configuração de storage para gravação
        const storageConfig = storageConfigs.find(c => c.id === formData.storageConfigId);
        const isLocalRecording = formData.recordingEnabled && storageConfig?.type === 'LOCAL';
        const rawLocalPath = storageConfig?.localPath || '';
        // Normalizar caminho para o FFmpeg (usar forward slashes para evitar problemas de escape)
        const localPath = rawLocalPath.replace(/\\/g, '/');

        const registerStream = async (name: string, rtsp: string) => {
          // go2rtc API aceita múltiplos parâmetros 'src'
          const url = new URL(`${go2rtcUrl}/api/streams`);
          url.searchParams.append('name', name);
          if (isLocalRecording && localPath) {
            // Usamos caminho curto (8.3) SEM ASPAS para o script, evitando qualquer erro de parsing
            // C:\Users\Usuário\Documents\Aplicação MoniMax\MoniMax sistema -> C:\Users\USURIO~2\DOCUME~1\APLICA~2\MONIMA~2
            const scriptPath = "C:\\Users\\USURIO~2\\DOCUME~1\\APLICA~2\\MONIMA~2\\record_stream.bat";

            // Construção do caminho de saída SAFE (Curto)
            // Substituímos a parte problemática do caminho do usuário por short path
            let safeLocalPath = localPath;
            if (localPath.toLowerCase().includes('users') && localPath.toLowerCase().includes('usuário')) {
              safeLocalPath = localPath.replace(/C:[\\\/]Users[\\\/]Usuário[\\\/]Documents/gi, 'C:\\Users\\USURIO~2\\DOCUME~1');
            }
            // Garante backslashes
            safeLocalPath = safeLocalPath.replace(/\//g, '\\');

            // Argumentos do arquivo
            const outputPattern = `${safeLocalPath}\\${name}_%Y-%m-%d_%H-%M-%S.mp4`;

            // Comando FINAL, Otimizado e Blindado:
            // exec:cmd /C SCRIPT RTSP OUTPUT
            // Sem aspas extras no script path porque ele não tem espaços (é short path)
            const recordCmd = `exec:cmd /C ${scriptPath} "${rtsp}" "${outputPattern}"`;

            url.searchParams.append('src', recordCmd);
            console.log(`Configurando gravação (NO-QUOTES Script): ${recordCmd}`);

          } else {
            // Se não estiver gravando, usamos o RTSP direto como fonte
            url.searchParams.append('src', rtsp);
            console.log(`Configurando stream direto: ${rtsp}`);
          }

          await fetch(url.toString(), { method: 'PUT' })
            .catch(e => console.warn(`Falha no registro go2rtc ${name}:`, e));
        };

        if (isDual) {
          await registerStream(`${baseStreamName}_1`, generateRtspUrl(1));
          await registerStream(`${baseStreamName}_2`, generateRtspUrl(2));
        } else {
          await registerStream(baseStreamName, generateRtspUrl(1));
        }
      }


      await refreshData();
      closeModal();
    } catch (err: any) {
      console.error('Erro ao salvar dispositivo:', err);
      alert(`Erro ao salvar dispositivo: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (device: Device) => {
    setFormData({
      name: device.name,
      type: device.type,
      protocol: device.protocol || 'ONVIF',
      host: device.ip,
      port: device.port?.toString() || '80',
      user: device.username || '',
      pass: device.password || '',
      client: device.clientId || '',
      recordingEnabled: device.recordingEnabled || false,
      storageConfigId: device.storageConfigId || '',
      recordingMode: device.recordingMode || 'CONTINUOUS',
      retentionDays: device.retentionDays || 7,
      streamQuality: device.streamQuality || 'HIGH',
      scheduleStart: device.scheduleStart || '08:00',
      scheduleEnd: device.scheduleEnd || '18:00'
    });
    setEditingDeviceId(device.id);
    setActiveTab('form');
    setShowAddForm(true);
  };


  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este dispositivo?')) return;

    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Forçar atualização local via refreshData como backup do Realtime
      await refreshData();
    } catch (err: any) {
      alert(`Erro ao deletar: ${err.message}`);
    }
  };

  const closeModal = () => {
    setShowAddForm(false);
    setEditingDeviceId(null);
    setRemoteAddress('');
    setTestSuccess(null);
    setPreviewStream(null);
    setFormData({
      name: '',
      type: 'CAMERA',
      protocol: 'ONVIF',
      host: '',
      port: '',
      user: '',
      pass: '',
      client: '',
      recordingEnabled: false,
      storageConfigId: '',
      recordingMode: 'CONTINUOUS',
      retentionDays: 7,
      streamQuality: 'HIGH',
      scheduleStart: '08:00',
      scheduleEnd: '18:00'
    });
  };

  const startNetworkScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setFoundDevices([]);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setIsScanning(false);

        if (scanMode === 'local') {
          setFoundDevices([
            { ip: '192.168.1.15', name: 'IP Camera 001', brand: 'Intelbras', port: 8080 },
            { ip: '192.168.1.22', name: 'NVR Backend', brand: 'Hikvision', port: 8000 },
            { ip: '192.168.1.55', name: 'WiFi Cam Office', brand: 'ONVIF', port: 80 }
          ]);
        } else {
          // Simular descoberta remota via probes em portas conhecidas
          const addr = remoteAddress || 'remote-device.ddns.net';
          setFoundDevices([
            { ip: addr, name: 'Dispositivo Remoto Identificado', brand: 'Hikvision', port: 8000, type: 'NVR' }
          ]);
        }
      }
      setScanProgress(progress);
    }, 400);
  };

  const selectFoundDevice = (dev: any) => {
    setFormData({
      ...formData,
      name: dev.name,
      type: (dev.type as DeviceType) || formData.type,
      host: dev.ip,
      port: dev.port.toString(),
      protocol: dev.brand.toUpperCase()
    });
    setActiveTab('form');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Gestão de Dispositivos</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Inventário de Hardware e Conectividade</p>
        </div>

        <button
          onClick={() => {
            closeModal();
            setShowAddForm(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-primary/20 hover:scale-105 transition-all"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          Adicionar Dispositivo
        </button>
      </div>

      <div className="flex gap-2 mb-4 bg-card-dark/50 p-1 rounded-lg w-fit border border-border-dark">
        {['ALL', 'RECORDER', 'CAMERA'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-1.5 rounded-md text-[10px] font-black transition-all ${filter === f ? 'bg-primary text-white' : 'text-slate-500 hover:text-white'}`}
          >
            {f === 'RECORDER' ? 'GRAVADORES (NVR/DVR)' : f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDevices.map(device => (
          <div key={device.id} className="bg-card-dark rounded-xl border border-border-dark overflow-hidden group hover:border-primary/50 transition-all shadow-xl">
            <div className="p-4 bg-background-dark/30 border-b border-border-dark flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined ${device.type === 'CAMERA' ? 'text-primary' : 'text-yellow-500'}`}>
                  {device.type === 'CAMERA' ? 'videocam' : 'storage'}
                </span>
                <div>
                  <h3 className="text-white text-sm font-bold truncate">{device.name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{device.type} • {device.model}</p>
                </div>
              </div>
              <span className={`size-2 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-red-500'} animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]`}></span>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Endereço IP / Porta</p>
                  <p className="text-xs text-white font-mono">{device.ip}:{device.port}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Marca / Protocolo</p>
                  <p className="text-xs text-white font-mono uppercase">{device.protocol}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 bg-background-dark/50 p-2 rounded border border-border-dark/30">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-500 text-xs">business</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{device.clientId || 'Sem Cliente'}</span>
                </div>
                {device.recordingEnabled && (
                  <div className="flex items-center gap-1 bg-red-500/10 text-red-500 px-2 py-0.5 rounded border border-red-500/20">
                    <span className="size-1.5 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="text-[8px] font-black uppercase">REC</span>
                  </div>
                )}
              </div>

              {device.channels && (
                <div className="pt-3 border-t border-border-dark/50">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Canais Utilizados</p>
                    <p className="text-[10px] text-white font-bold">12 / {device.channels}</p>
                  </div>
                  <div className="w-full h-1 bg-background-dark rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '75%' }}></div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleEdit(device)}
                  className="flex-1 py-2 bg-background-dark border border-border-dark text-slate-400 text-[10px] font-bold uppercase rounded-lg hover:text-white hover:border-primary/50 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-xs">edit</span>
                  Configurar
                </button>
                <button
                  onClick={() => handleDelete(device.id)}
                  className="px-3 py-2 bg-background-dark border border-border-dark text-slate-400 hover:text-red-500 hover:border-red-500/50 transition-all rounded-lg flex items-center justify-center"
                  title="Remover Dispositivo"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
                <button className="px-3 py-2 bg-background-dark border border-border-dark text-slate-400 hover:text-primary transition-colors rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredDevices.length === 0 && !isSyncing && (
          <div className="col-span-full py-20 bg-card-dark/20 border border-dashed border-border-dark rounded-3xl flex flex-col items-center justify-center text-center">
            <div className="size-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-slate-500 text-4xl">devices_off</span>
            </div>
            <h4 className="text-white font-bold uppercase tracking-tight">Nenhum dispositivo encontrado</h4>
            <p className="text-slate-500 text-xs mt-1">Experimente mudar o filtro ou adicionar um novo hardware.</p>
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1c1f26] w-full max-w-lg rounded-[24px] border border-[#292e38] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#292e38]/50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-white text-lg font-black uppercase tracking-widest leading-none">
                  {editingDeviceId ? 'Editar Dispositivo' : 'Novo Dispositivo'}
                </h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Configuração de Hardware</p>
              </div>
              <button onClick={closeModal} className="text-slate-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#292e38]/30 px-6 shrink-0 bg-background-dark/20">
              <button
                onClick={() => setActiveTab('form')}
                className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'form' ? 'text-primary' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Cadastro Manual
                {activeTab === 'form' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
              </button>
              <button
                onClick={() => setActiveTab('scan')}
                className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'scan' ? 'text-primary' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Busca na Rede (Scan)
                {activeTab === 'scan' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              {activeTab === 'form' ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Dispositivo</label>
                    <input
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#111621] border border-[#292e38] rounded-xl text-sm text-white p-4 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                      placeholder="Ex: NVR Receção Principal"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</label>
                      <select
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value as DeviceType })}
                        className="w-full bg-[#111621] border border-[#292e38] rounded-xl text-sm text-white p-4 focus:ring-2 focus:ring-primary outline-none appearance-none"
                      >
                        <option value="CAMERA">CAMERA IP</option>
                        <option value="NVR">NVR</option>
                        <option value="DVR">DVR</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marca / Protocolo</label>
                      <select
                        value={formData.protocol}
                        onChange={e => setFormData({ ...formData, protocol: e.target.value })}
                        className="w-full bg-[#111621] border border-[#292e38] rounded-xl text-sm text-white p-4 focus:ring-2 focus:ring-primary outline-none appearance-none"
                      >
                        {DEVICE_BRANDS.map(brand => (
                          <option key={brand} value={brand.toUpperCase()}>{brand.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço IP / Host</label>
                      <input
                        value={formData.host}
                        onChange={e => setFormData({ ...formData, host: e.target.value })}
                        className="w-full bg-[#111621] border border-[#292e38] rounded-xl text-sm text-white p-4 focus:ring-2 focus:ring-primary outline-none"
                        placeholder="192.168.1.10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Porta</label>
                      <input
                        value={formData.port}
                        onChange={e => setFormData({ ...formData, port: e.target.value })}
                        type="number"
                        className="w-full bg-[#111621] border border-[#292e38] rounded-xl text-sm text-white p-4 focus:ring-2 focus:ring-primary outline-none"
                        placeholder="8000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</label>
                      <input
                        value={formData.user}
                        onChange={e => setFormData({ ...formData, user: e.target.value })}
                        className="w-full bg-[#111621] border border-[#292e38] rounded-xl text-sm text-white p-4 focus:ring-2 focus:ring-primary outline-none"
                        placeholder="admin"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha</label>
                      <input
                        value={formData.pass}
                        onChange={e => setFormData({ ...formData, pass: e.target.value })}
                        type="password"
                        className="w-full bg-[#111621] border border-[#292e38] rounded-xl text-sm text-white p-4 focus:ring-2 focus:ring-primary outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vincular Cliente</label>
                    <select
                      value={formData.client}
                      onChange={e => setFormData({ ...formData, client: e.target.value })}
                      className="w-full bg-[#111621] border border-[#292e38] rounded-xl text-sm text-white p-4 focus:ring-2 focus:ring-primary outline-none appearance-none"
                    >
                      <option value="">SELECIONE UM CLIENTE</option>
                      {syncClients.map(client => (
                        <option key={client.id} value={client.name}>{client.name.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined ${formData.recordingEnabled ? 'text-red-500' : 'text-slate-500'}`}>
                          {formData.recordingEnabled ? 'fiber_manual_record' : 'videocam_off'}
                        </span>
                        <div>
                          <p className="text-[10px] font-black text-white uppercase tracking-widest">Gravação de Imagens</p>
                          <p className="text-[8px] text-slate-500 font-bold uppercase">Ativar backup em storage</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setFormData({ ...formData, recordingEnabled: !formData.recordingEnabled })}
                        className={`w-12 h-6 rounded-full transition-all relative ${formData.recordingEnabled ? 'bg-red-500' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 size-4 bg-white rounded-full transition-all ${formData.recordingEnabled ? 'left-7' : 'left-1'}`}></div>
                      </button>
                    </div>

                    {formData.recordingEnabled && (
                      <div className="space-y-3 pt-2 border-t border-primary/10 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex justify-between items-center">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Servidor de Storage</label>
                          <Link to="/storage" className="text-[8px] font-bold text-primary hover:underline uppercase">Configurar Armazenamento</Link>
                        </div>
                        <select
                          value={formData.storageConfigId}
                          onChange={e => setFormData({ ...formData, storageConfigId: e.target.value })}
                          className="w-full bg-[#111621] border border-[#292e38] rounded-lg text-xs text-white p-3 focus:ring-1 focus:ring-primary outline-none appearance-none"
                        >
                          <option value="">SELECIONE UM STORAGE</option>
                          {storageConfigs.map(config => (
                            <option key={config.id} value={config.id}>{config.name.toUpperCase()} ({config.type})</option>
                          ))}
                        </select>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Modo de Gravação</label>
                            <select
                              value={formData.recordingMode}
                              onChange={e => setFormData({ ...formData, recordingMode: e.target.value as any })}
                              className="w-full bg-[#111621] border border-border-dark/50 rounded-lg text-[10px] text-white p-2.5 focus:ring-1 focus:ring-primary outline-none"
                            >
                              <option value="CONTINUOUS">24/7 (CONTÍNUA)</option>
                              <option value="MOTION">POR MOVIMENTO</option>
                              <option value="SCHEDULED">AGENDADA</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Qualidade do Stream</label>
                            <select
                              value={formData.streamQuality}
                              onChange={e => setFormData({ ...formData, streamQuality: e.target.value as any })}
                              className="w-full bg-[#111621] border border-border-dark/50 rounded-lg text-[10px] text-white p-2.5 focus:ring-1 focus:ring-primary outline-none"
                            >
                              <option value="HIGH">MAIN STREAM (HD)</option>
                              <option value="MEDIUM">SUB STREAM (SD)</option>
                              <option value="LOW">MOBILE STREAM</option>
                            </select>
                          </div>
                        </div>

                        {formData.recordingMode === 'SCHEDULED' && (
                          <div className="grid grid-cols-2 gap-4 mt-2 p-2 bg-background-dark/30 rounded-lg border border-border-dark/50">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Início (HH:mm)</label>
                              <input
                                type="time"
                                value={formData.scheduleStart}
                                onChange={e => setFormData({ ...formData, scheduleStart: e.target.value })}
                                className="w-full bg-[#111621] border border-border-dark/50 rounded-lg text-xs text-white p-2 outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fim (HH:mm)</label>
                              <input
                                type="time"
                                value={formData.scheduleEnd}
                                onChange={e => setFormData({ ...formData, scheduleEnd: e.target.value })}
                                className="w-full bg-[#111621] border border-border-dark/50 rounded-lg text-xs text-white p-2 outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-1 mt-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tempo de Retenção (Dias)</label>
                            <span className="text-primary font-bold text-[10px]">{formData.retentionDays} dias</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="60"
                            value={formData.retentionDays}
                            onChange={e => setFormData({ ...formData, retentionDays: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-background-dark rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 mt-2">
                    {previewStream && (
                      <div className="space-y-2 animate-in fade-in duration-500">
                        <label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                          <span className="size-1.5 bg-primary rounded-full animate-pulse"></span>
                          Visualização ao Vivo (Teste)
                        </label>
                        <div className="aspect-video w-full rounded-xl overflow-hidden border border-primary/30 shadow-lg shadow-primary/10">
                          <WebRTCPlayer streamUrl={previewStream} className="w-full h-full" />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={testConnection}
                      disabled={isTesting || !formData.host}
                      className={`w-full py-3 border border-border-dark text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${testSuccess === true ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                        testSuccess === false ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                          'bg-background-dark text-slate-400 hover:text-white hover:border-slate-600'
                        }`}
                    >
                      {isTesting ? (
                        <div className="size-3 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <span className="material-symbols-outlined text-sm">
                          {testSuccess === true ? 'cloud_done' : testSuccess === false ? 'cloud_off' : 'barcode_scanner'}
                        </span>
                      )}
                      {testSuccess === true ? 'Conexão Estabelecida - Verificando Stream' :
                        testSuccess === false ? 'Falha na Comunicação' :
                          'Testar Conexão e Ativar Câmera'}
                    </button>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full py-5 bg-[#1e3b8a] text-white text-xs font-black uppercase tracking-widest rounded-xl mt-4 shadow-xl shadow-[#1e3b8a]/20 hover:bg-[#2547a3] transition-all transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (editingDeviceId ? 'Salvar Alterações' : 'Cadastrar Dispositivo')}
                  </button>
                </div>
              ) : (
                <div className="space-y-6 flex flex-col py-4">
                  {/* Scan Mode Switcher */}
                  {!isScanning && foundDevices.length === 0 && (
                    <div className="flex bg-[#111621] p-1 rounded-xl border border-[#292e38] mx-auto w-fit mb-4">
                      <button
                        onClick={() => setScanMode('local')}
                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${scanMode === 'local' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Rede Local (LAN)
                      </button>
                      <button
                        onClick={() => setScanMode('remote')}
                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${scanMode === 'remote' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Endereço Externo (WAN)
                      </button>
                    </div>
                  )}

                  {!isScanning && foundDevices.length === 0 ? (
                    <div className="text-center space-y-4">
                      <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <span className="material-symbols-outlined text-primary text-4xl">
                          {scanMode === 'local' ? 'travel_explore' : 'public'}
                        </span>
                      </div>

                      {scanMode === 'remote' ? (
                        <div className="space-y-4 max-w-sm mx-auto">
                          <h4 className="text-white font-bold text-sm uppercase">Identificar Dispositivo Remoto</h4>
                          <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                            Informe o IP externo ou DDNS para o MoniMax escanear portas e identificar o modelo.
                          </p>
                          <input
                            value={remoteAddress}
                            onChange={e => setRemoteAddress(e.target.value)}
                            className="w-full bg-[#111621] border border-[#292e38] rounded-xl text-sm text-white p-4 focus:ring-2 focus:ring-primary outline-none text-center"
                            placeholder="ex: monimax.dyndns.org"
                          />
                          <button
                            onClick={startNetworkScan}
                            className="w-full py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                          >
                            Verificar Conexão e Identificar
                          </button>
                        </div>
                      ) : (
                        <>
                          <h4 className="text-white font-bold text-sm uppercase">Buscar dispositivos na rede</h4>
                          <p className="text-slate-500 text-[10px] max-w-xs mx-auto leading-relaxed uppercase tracking-wider font-bold">
                            O MoniMax irá escanear o segmento de rede local em busca de câmeras IP e gravadores (ONVIF/RTSP).
                          </p>
                          <button
                            onClick={startNetworkScan}
                            className="px-8 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                          >
                            Iniciar Busca (Scan)
                          </button>
                        </>
                      )}
                    </div>
                  ) : isScanning ? (
                    <div className="w-full space-y-6 text-center">
                      <div className="relative size-32 mx-auto">
                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white font-black text-xl">{Math.round(scanProgress)}%</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-xs uppercase tracking-widest animate-pulse">Escaner Ativo...</h4>
                        <p className="text-slate-500 text-[9px] mt-1 font-mono uppercase">Verificando portas 80, 8080, 554, 37777...</p>
                      </div>
                      <div className="w-full h-1 bg-background-dark/50 rounded-full overflow-hidden max-w-xs mx-auto">
                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center justify-between px-2">
                        <h4 className="text-white text-[10px] font-black uppercase tracking-widest">{foundDevices.length} Dispositivos Encontrados</h4>
                        <button onClick={startNetworkScan} className="text-primary text-[9px] font-black uppercase hover:underline">Reiniciar Scan</button>
                      </div>
                      <div className="space-y-2">
                        {foundDevices.map((dev, idx) => (
                          <div
                            key={idx}
                            onClick={() => selectFoundDevice(dev)}
                            className="bg-background-dark/50 border border-border-dark p-4 rounded-xl flex items-center justify-between group hover:border-primary/50 cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                <span className="material-symbols-outlined text-lg">videocam</span>
                              </div>
                              <div>
                                <p className="text-white text-xs font-bold uppercase">{dev.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono italic">{dev.ip}:{dev.port} • {dev.brand.toUpperCase()}</p>
                              </div>
                            </div>
                            <span className="material-symbols-outlined text-primary text-xl opacity-0 group-hover:opacity-100 transition-opacity">add_circle</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 bg-background-dark/30 border-t border-[#292e38]/50 flex justify-center shrink-0">
              <p className="text-[8px] text-slate-600 font-bold uppercase tracking-[0.2em]">Criptografia ponta-a-ponta ativada • Protocolo Seguro HTTPS</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Devices;
