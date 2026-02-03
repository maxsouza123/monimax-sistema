
import React, { useState, useEffect } from 'react';
import { useSync } from '../DataSynchronizer';
import { supabase } from '../supabaseClient';
import { SupabaseMapper } from '../supabaseMapper';

const Profile: React.FC = () => {
  const { user, userProfile, refreshData } = useSync();
  const [isSaving, setIsSaving] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [passData, setPassData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [formData, setFormData] = useState({
    fullName: '',
    department: '',
    avatarUrl: ''
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        fullName: userProfile.fullName || '',
        department: userProfile.department || '',
        avatarUrl: userProfile.avatarUrl || ''
      });
    }
  }, [userProfile]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) {
      alert("As senhas não coincidem!");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passData.new
      });
      if (error) throw error;

      alert("Senha atualizada com sucesso.");
      setShowPassModal(false);
      setPassData({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      alert(`Erro ao atualizar senha: ${err.message}`);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsSaving(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));

      // Update directly to avoid losing it
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      await refreshData();
    } catch (err: any) {
      alert("Erro ao enviar foto: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          department: formData.department
        })
        .eq('id', user.id);

      if (error) throw error;
      await refreshData();
      alert("Perfil atualizado com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar perfil: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const userName = formData.fullName || user?.email?.split('@')[0] || 'Usuário';
  const userRole = userProfile?.role || 'Operador';
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 font-sans">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">Perfil do Usuário</h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Gerenciamento de Identidade e Acesso</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card de Identidade */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card-dark p-8 rounded-3xl border border-border-dark flex flex-col items-center text-center shadow-xl">
            <div className="relative mb-4 group">
              <div className="size-24 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/40 p-1 overflow-hidden">
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="Avatar" className="size-full object-cover rounded-full" />
                ) : (
                  <div className="size-full bg-primary rounded-full flex items-center justify-center text-white text-3xl font-black">
                    {userInitials}
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 size-8 bg-background-dark border border-border-dark rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors shadow-lg cursor-pointer">
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isSaving} />
                <span className="material-symbols-outlined text-sm">{isSaving ? 'sync' : 'photo_camera'}</span>
              </label>
            </div>
            <div>
              <h2 className="text-white text-lg font-black uppercase">{userName}</h2>
              <p className="text-primary text-[10px] font-black uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full mt-2 inline-block">
                {userRole}
              </p>
            </div>

            <div className="w-full pt-6 mt-6 border-t border-border-dark space-y-4">
              <div className="text-left">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">E-mail Corporativo</p>
                <p className="text-xs text-slate-300 font-bold">{user?.email}</p>
              </div>
              <div className="text-left">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ID de Registro</p>
                <p className="text-[10px] text-slate-300 font-mono truncate">{user?.id}</p>
              </div>
            </div>
          </div>

          <div className="bg-card-dark p-6 rounded-2xl border border-border-dark shadow-lg">
            <h3 className="text-white text-[10px] font-black uppercase tracking-widest mb-4">Status de Conexão</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 uppercase font-black">Último Login</span>
                <span className="text-white font-mono">
                  {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Recentemente'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 uppercase font-black">Sessão</span>
                <span className="text-green-500 font-bold">ATIVA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detalhes e Configurações */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden shadow-xl">
            <div className="p-5 bg-background-dark/30 border-b border-border-dark flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">badge</span>
              <h3 className="text-white text-xs font-black uppercase tracking-widest">Dados Cadastrais</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nome Completo</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                  className="w-full bg-background-dark border border-border-dark rounded-xl text-xs text-white p-3.5 outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">E-mail de Acesso</label>
                <input type="text" value={user?.email || ''} disabled className="w-full bg-background-dark/50 border border-border-dark/50 rounded-xl text-xs text-slate-500 p-3.5 outline-none" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Localização/Departamento de Atuação</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={e => setFormData(p => ({ ...p, department: e.target.value }))}
                  placeholder="Ex: Setor de Monitoramento Inteligente"
                  className="w-full bg-background-dark border border-border-dark rounded-xl text-xs text-white p-3.5 outline-none focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden shadow-xl">
            <div className="p-5 bg-background-dark/30 border-b border-border-dark flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">security</span>
              <h3 className="text-white text-xs font-black uppercase tracking-widest">Segurança da Conta</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between gap-10">
                <div>
                  <p className="text-xs font-bold text-white uppercase">Autenticação em Duas Etapas (2FA)</p>
                  <p className="text-[10px] text-slate-500 font-medium">Recomendado para administradores master.</p>
                </div>
                <button className="px-4 py-2 bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg border border-primary/30 hover:bg-primary/30 transition-all">Configurar</button>
              </div>
              <div className="flex items-center justify-between gap-10">
                <div>
                  <p className="text-xs font-bold text-white uppercase">Alterar Senha de Acesso</p>
                  <p className="text-[10px] text-slate-500 font-medium">Troque sua senha periodicamente.</p>
                </div>
                <button
                  onClick={() => setShowPassModal(true)}
                  className="px-4 py-2 bg-background-dark border border-border-dark text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:text-white transition-all shadow-sm active:scale-95"
                >
                  Alterar
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="px-8 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-center"
            >
              {isSaving ? 'PROCESSANDO...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Redefinição de Senha */}
      {showPassModal && (
        <div className="fixed inset-0 bg-background-dark/95 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-card-dark w-full max-w-md rounded-[28px] border border-border-dark shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-8 border-b border-border-dark/50 flex justify-between items-center bg-background-dark/30">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">lock_reset</span>
                <h3 className="text-white text-md font-black uppercase tracking-widest">Redefinir Senha</h3>
              </div>
              <button onClick={() => setShowPassModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdatePassword} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">lock</span>
                  <input
                    required
                    type="password"
                    value={passData.new}
                    onChange={e => setPassData({ ...passData, new: e.target.value })}
                    className="w-full bg-background-dark border border-border-dark rounded-2xl text-sm text-white pl-12 pr-4 py-4 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    placeholder="Defina a nova senha"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">verified_user</span>
                  <input
                    required
                    type="password"
                    value={passData.confirm}
                    onChange={e => setPassData({ ...passData, confirm: e.target.value })}
                    className={`w-full bg-background-dark border rounded-2xl text-sm text-white pl-12 pr-4 py-4 focus:ring-2 outline-none transition-all ${passData.confirm && passData.new !== passData.confirm ? 'border-red-500/50 focus:ring-red-500' : 'border-border-dark focus:ring-primary'
                      }`}
                    placeholder="Repita a nova senha"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPassModal(false)}
                  className="flex-1 py-4 bg-background-dark border border-border-dark text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Atualizar Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
