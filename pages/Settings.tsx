import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSync } from '../DataSynchronizer';
import { supabase } from '../supabaseClient';
import { SupabaseMapper } from '../supabaseMapper';
import { UserRole, ModulePermission } from '../types';

const Settings: React.FC = () => {
  const { userProfile, permissions: dbPermissions, systemSettings, refreshData } = useSync();
  const [localPermissions, setLocalPermissions] = useState<ModulePermission[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [brandingData, setBrandingData] = useState({
    brandName: '',
    brandTagline: '',
    logoUrl: ''
  });

  useEffect(() => {
    setLocalPermissions(dbPermissions);
  }, [dbPermissions]);

  useEffect(() => {
    if (systemSettings && !isSaving) {
      setBrandingData({
        brandName: systemSettings.brandName,
        brandTagline: systemSettings.brandTagline,
        logoUrl: systemSettings.logoUrl || ''
      });
    }
  }, [systemSettings]);

  const isAdmin = userProfile?.role === 'ADMIN';

  const togglePermission = (moduleId: string, role: UserRole) => {
    if (!isAdmin) {
      alert("ACESSO NEGADO: Apenas administradores podem configurar privilégios de acesso.");
      return;
    }
    setLocalPermissions(prev => prev.map(p =>
      p.id === moduleId
        ? { ...p, roles: { ...p.roles, [role]: !p.roles[role] } }
        : p
    ));
  };

  const handleSaveBranding = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 'branding',
          brand_name: brandingData.brandName,
          brand_tagline: brandingData.brandTagline,
          logo_url: brandingData.logoUrl
        });

      if (error) throw error;
      await refreshData();
      alert("Identidade visual personalizada com sucesso!");
    } catch (err: any) {
      alert(`Erro ao salvar marca: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    try {
      for (const perm of localPermissions) {
        const { error } = await supabase
          .from('module_permissions')
          .update({ roles: perm.roles })
          .eq('id', perm.id);
        if (error) throw error;
      }
      await refreshData();
      alert("Configurações de acesso salvas com sucesso!");
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-4 md:px-0">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Configurações de Sistema</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Painel de Controle e Parâmetros Operacionais</p>
        </div>

        <div className="bg-card-dark border border-border-dark p-2 rounded-xl flex items-center gap-3">
          <span className="text-[9px] font-black text-slate-500 uppercase px-2">Perfil Atual:</span>
          <span className="bg-background-dark py-1 px-3 text-[10px] font-black text-primary uppercase rounded border border-primary/20">
            {userProfile?.role || 'CARREGANDO...'}
          </span>
        </div>
      </div>

      {!isAdmin && (
        <div className="mx-4 md:mx-0 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-4 animate-pulse">
          <span className="material-symbols-outlined text-yellow-500">lock</span>
          <div>
            <p className="text-yellow-500 text-[10px] font-black uppercase tracking-widest">Modo de Somente Leitura Ativo</p>
            <p className="text-slate-400 text-[10px] font-medium leading-tight">Você está logado como <span className="text-white font-bold">{userProfile?.role}</span>. Alterações na matriz de privilégios são restritas a administradores.</p>
          </div>
        </div>
      )}

      <div className="space-y-6 px-4 md:px-0">
        {/* PRIVILEGIOS SECTION */}
        <section className={`bg-card-dark rounded-2xl border border-border-dark overflow-hidden shadow-2xl transition-all ${!isAdmin ? 'opacity-90' : ''}`}>
          <div className="p-5 bg-background-dark/30 border-b border-border-dark flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined ${isAdmin ? 'text-primary' : 'text-slate-500'}`}>security</span>
              <h3 className="text-white text-xs font-black uppercase tracking-widest">Privilégios & Acessos</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-background-dark/20 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Módulo do Sistema</th>
                  <th className="px-4 py-4 text-center">Admin</th>
                  <th className="px-4 py-4 text-center">Operador</th>
                  <th className="px-4 py-4 text-center">Tático</th>
                  <th className="px-4 py-4 text-center">Cliente</th>
                  <th className="px-4 py-4 text-center">Assist. Técnica</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark/50">
                {localPermissions.map((p) => (
                  <tr key={p.id} className={`transition-colors group ${isAdmin ? 'hover:bg-white/[0.02]' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-lg transition-colors ${isAdmin ? 'text-slate-500 group-hover:text-primary' : 'text-slate-600'}`}>{p.icon}</span>
                        <span className={`text-xs font-bold ${isAdmin ? 'text-slate-200' : 'text-slate-500'}`}>{p.module}</span>
                      </div>
                    </td>
                    {(['ADMIN', 'OPERADOR', 'TATICO', 'CLIENTE', 'ASSISTENCIA_TECNICA'] as UserRole[]).map((role) => (
                      <td key={role} className="px-4 py-4 text-center">
                        <button
                          disabled={!isAdmin}
                          onClick={() => togglePermission(p.id, role)}
                          className={`size-6 rounded-md border transition-all flex items-center justify-center ${p.roles[role]
                            ? (isAdmin ? 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_10px_rgba(30,59,138,0.2)]' : 'bg-slate-700/30 border-slate-700 text-slate-500')
                            : (isAdmin ? 'bg-background-dark border-border-dark text-slate-700 hover:border-slate-500' : 'bg-background-dark/50 border-border-dark/30 text-slate-800')
                            } ${!isAdmin ? 'cursor-not-allowed' : 'cursor-pointer active:scale-90'}`}
                        >
                          <span className="material-symbols-outlined text-sm font-bold">
                            {p.roles[role] ? 'check' : 'close'}
                          </span>
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* IA SECTION */}
        <section className="bg-card-dark rounded-xl border border-border-dark overflow-hidden shadow-xl">
          <div className="p-4 bg-background-dark/30 border-b border-border-dark flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">id_card</span>
            <h3 className="text-white text-xs font-black uppercase tracking-widest">Identidade Visual (Branding)</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${!isAdmin ? 'opacity-50' : ''}`}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome da Central / Empresa</label>
                  <input
                    disabled={!isAdmin}
                    value={brandingData.brandName}
                    onChange={e => setBrandingData(prev => ({ ...prev, brandName: e.target.value }))}
                    placeholder="Ex: MoniMax"
                    className="w-full bg-background-dark border border-border-dark rounded-lg text-xs text-white p-3 outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Slogan ou Subtítulo</label>
                  <input
                    disabled={!isAdmin}
                    value={brandingData.brandTagline}
                    onChange={e => setBrandingData(prev => ({ ...prev, brandTagline: e.target.value }))}
                    placeholder="Ex: Security AI"
                    className="w-full bg-background-dark border border-border-dark rounded-lg text-xs text-white p-3 outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logotipo da Central</label>
                <div className="flex items-start gap-4">
                  <div className="size-24 bg-background-dark border-2 border-dashed border-border-dark rounded-xl flex items-center justify-center overflow-hidden relative group">
                    {brandingData.logoUrl ? (
                      <>
                        <img src={brandingData.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                        {isAdmin && (
                          <button
                            onClick={() => setBrandingData(prev => ({ ...prev, logoUrl: '' }))}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <span className="material-symbols-outlined text-white">delete</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="material-symbols-outlined text-slate-600 text-3xl">image</span>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex-1 space-y-3">
                      <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">
                        Recomendado: 512x512px (PNG ou SVG transparente). O logo aparecerá no topo do menu lateral.
                      </p>
                      <label className="inline-block">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const fileExt = file.name.split('.').pop();
                                const fileName = `logo_${Date.now()}.${fileExt}`;
                                const { data, error } = await supabase.storage
                                  .from('images')
                                  .upload(fileName, file);

                                if (error) throw error;

                                const { data: { publicUrl } } = supabase.storage
                                  .from('images')
                                  .getPublicUrl(fileName);

                                console.log("URL Gerada:", publicUrl);
                                setBrandingData(prev => ({ ...prev, logoUrl: publicUrl }));
                              } catch (err: any) {
                                alert("Erro no upload: " + err.message);
                              }
                            }
                          }}
                        />
                        <span className="cursor-pointer px-4 py-2 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary/20 transition-all flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">cloud_upload</span>
                          Escolher Arquivo
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-border-dark/30">
              <button
                disabled={!isAdmin || isSaving}
                onClick={handleSaveBranding}
                className="px-6 py-2 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                {isSaving ? 'SALVANDO...' : 'ATUALIZAR MARCA'}
              </button>
            </div>
          </div>
        </section>

        {/* IA SECTION */}
        <section className="bg-card-dark rounded-xl border border-border-dark overflow-hidden shadow-xl">
          <div className="p-4 bg-background-dark/30 border-b border-border-dark flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">psychology</span>
            <h3 className="text-white text-xs font-black uppercase tracking-widest">Módulo de IA & Reconhecimento</h3>
          </div>
          <div className="p-6 space-y-6">
            <ToggleRow label="Reconhecimento Facial Ativo" description="Processamento biométrico em tempo real em todas as câmeras." checked={true} disabled={!isAdmin} />
            <div className={`space-y-4 ${!isAdmin ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-white">Detecção LPR (Placas)</p>
                    <Link to="/plates" className="text-[10px] font-black text-primary hover:underline flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                      <span className="material-symbols-outlined text-xs">list_alt</span>
                      Gerenciar Lista de Placas
                    </Link>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Ativa leitura automática de caracteres em portões de acesso.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={true} className="sr-only peer" />
                  <div className="w-10 h-5 bg-background-dark border border-border-dark peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-600 after:border-slate-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary/50 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                </label>
              </div>
            </div>
            <div className={`space-y-2 ${!isAdmin ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300">Sensibilidade de Movimento</span>
                <span className="text-primary text-xs font-black">85%</span>
              </div>
              <input type="range" className="w-full h-1.5 bg-background-dark rounded-lg appearance-none cursor-pointer accent-primary" defaultValue={85} />
            </div>
          </div>
        </section>

        {/* NOTIFICATIONS SECTION */}
        <section className="bg-card-dark rounded-xl border border-border-dark overflow-hidden shadow-xl">
          <div className="p-4 bg-background-dark/30 border-b border-border-dark flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">notifications_active</span>
            <h3 className="text-white text-xs font-black uppercase tracking-widest">Alertas & Notificações</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${!isAdmin ? 'opacity-50' : ''}`}>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-mail de Emergência</label>
                <input disabled={!isAdmin} type="email" placeholder="operacional@monimax.com" className="w-full bg-background-dark border border-border-dark rounded-lg text-xs text-white p-3 outline-none focus:border-primary transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nível Mínimo de Alerta</label>
                <select disabled={!isAdmin} className="w-full bg-background-dark border border-border-dark rounded-lg text-xs text-white p-3 outline-none focus:border-primary transition-colors">
                  <option>WARNING</option>
                  <option>CRITICAL</option>
                  <option>INFO</option>
                </select>
              </div>
            </div>
            <ToggleRow label="Notificações Push" description="Enviar alertas instantâneos para dispositivos móveis autorizados." checked={false} disabled={!isAdmin} />
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-4">
          <button onClick={() => setLocalPermissions(dbPermissions)} className="px-6 py-2.5 bg-background-dark border border-border-dark text-slate-400 text-xs font-black uppercase tracking-widest rounded-lg hover:text-white transition-all">Descartar</button>
          <button
            disabled={!isAdmin || isSaving}
            onClick={handleSaveAll}
            className={`px-8 py-2.5 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg transition-all ${isAdmin
              ? 'bg-primary shadow-primary/20 hover:scale-105 active:scale-95'
              : 'bg-slate-800 text-slate-600 shadow-none cursor-not-allowed opacity-50'
              }`}
          >
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ToggleRow = ({ label, description, checked, disabled }: any) => (
  <div className={`flex items-center justify-between gap-10 ${disabled ? 'opacity-50' : ''}`}>
    <div className="space-y-0.5">
      <p className="text-sm font-bold text-white">{label}</p>
      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{description}</p>
    </div>
    <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      <input type="checkbox" defaultChecked={checked} className="sr-only peer" disabled={disabled} />
      <div className="w-10 h-5 bg-background-dark border border-border-dark peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-600 after:border-slate-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary/50 peer-checked:after:bg-white peer-checked:after:border-white"></div>
    </label>
  </div>
);

export default Settings;
