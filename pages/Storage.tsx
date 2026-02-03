import React, { useState } from 'react';
import { StorageConfig } from '../types';
import { useSync } from '../DataSynchronizer';
import { supabase } from '../supabaseClient';
import { SupabaseMapper } from '../supabaseMapper';

const Storage: React.FC = () => {
    const { storageConfigs, isSyncing, refreshData } = useSync();
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState<Partial<StorageConfig>>({
        name: '',
        type: 'CLOUD',
        provider: 'AWS S3',
        endpoint: '',
        accessKey: '',
        secretKey: '',
        bucketName: '',
        localPath: '',
        status: 'active'
    });

    const handleSave = async () => {
        if (!formData.name) {
            alert("Nome é obrigatório.");
            return;
        }

        setIsSaving(true);
        try {
            const configToSave = SupabaseMapper.fromStorageConfig(formData);

            if (editingConfigId) {
                const { error } = await supabase
                    .from('storage_configs')
                    .update(configToSave)
                    .eq('id', editingConfigId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('storage_configs').insert([configToSave]);
                if (error) throw error;
            }

            // Forçar atualização local como backup do Realtime
            await refreshData();
            closeModal();
        } catch (err: any) {
            alert(`Erro ao salvar configuração: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (config: StorageConfig) => {
        setFormData(config);
        setEditingConfigId(config.id);
        setShowAddForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente remover esta configuração de armazenamento?')) return;
        try {
            const { error } = await supabase.from('storage_configs').delete().eq('id', id);
            if (error) throw error;

            // Forçar atualização local como backup do Realtime
            await refreshData();
        } catch (err: any) {
            alert(`Erro ao deletar: ${err.message}`);
        }
    };


    const closeModal = () => {
        setShowAddForm(false);
        setEditingConfigId(null);
        setFormData({
            name: '',
            type: 'CLOUD',
            provider: 'AWS S3',
            endpoint: '',
            accessKey: '',
            secretKey: '',
            bucketName: '',
            localPath: '',
            status: 'active'
        });
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white">Armazenamento</h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Configuração de Servidores de Gravação Cloud e Local</p>
                </div>

                <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    Novo Servidor
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {storageConfigs.map(config => (
                    <div key={config.id} className="bg-card-dark rounded-xl border border-border-dark overflow-hidden group hover:border-primary/50 transition-all shadow-xl">
                        <div className="p-4 bg-background-dark/30 border-b border-border-dark flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className={`material-symbols-outlined ${config.type === 'CLOUD' ? 'text-blue-400' : 'text-purple-400'}`}>
                                    {config.type === 'CLOUD' ? 'cloud' : 'dns'}
                                </span>
                                <div>
                                    <h3 className="text-white text-sm font-bold truncate">{config.name}</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{config.type}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${config.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {config.status}
                            </span>
                        </div>

                        <div className="p-5 space-y-4">
                            {config.type === 'CLOUD' ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-500 font-bold uppercase">Provedor</span>
                                        <span className="text-white font-mono">{config.provider}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-500 font-bold uppercase">Bucket</span>
                                        <span className="text-white font-mono">{config.bucketName}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="text-[10px]">
                                        <p className="text-slate-500 font-bold uppercase mb-1">Caminho Local / Rede</p>
                                        <p className="text-white font-mono bg-background-dark/50 p-2 rounded truncate">{config.localPath}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => handleEdit(config)}
                                    className="flex-1 py-2 bg-background-dark border border-border-dark text-slate-400 text-[10px] font-bold uppercase rounded-lg hover:text-white hover:border-primary/50 transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-xs">edit</span>
                                    Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(config.id)}
                                    className="px-3 py-2 bg-background-dark border border-border-dark text-slate-400 hover:text-red-500 hover:border-red-500/50 transition-all rounded-lg flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {storageConfigs.length === 0 && !isSyncing && (
                    <div className="col-span-full py-20 bg-card-dark/20 border border-dashed border-border-dark rounded-3xl flex flex-col items-center justify-center text-center">
                        <div className="size-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-slate-500 text-4xl">cloud_off</span>
                        </div>
                        <h4 className="text-white font-bold uppercase tracking-tight">Nenhum servidor configurado</h4>
                        <p className="text-slate-500 text-xs mt-1">Configure um storage Cloud ou Local para armazenar suas gravações.</p>
                    </div>
                )}
            </div>

            {showAddForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#1c1f26] w-full max-w-lg rounded-[24px] border border-[#292e38] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-[#292e38]/50 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-white text-lg font-black uppercase tracking-widest leading-none">
                                    {editingConfigId ? 'Editar Servidor' : 'Novo Servidor de Storage'}
                                </h3>
                                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Configuração de Backup e Gravação</p>
                            </div>
                            <button onClick={closeModal} className="text-slate-500 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Configuração</label>
                                <input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-[#111621] border border-[#292e38] rounded-xl text-sm text-white p-4 focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="Ex: Google Cloud SP / Servidor NAS Local"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Armazenamento</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setFormData({ ...formData, type: 'CLOUD' })}
                                        className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${formData.type === 'CLOUD' ? 'bg-primary/20 border-primary text-white' : 'bg-background-dark border-border-dark text-slate-500 hover:border-slate-700'}`}
                                    >
                                        <span className="material-symbols-outlined">cloud</span>
                                        <span className="text-xs font-bold uppercase">Cloud</span>
                                    </button>
                                    <button
                                        onClick={() => setFormData({ ...formData, type: 'LOCAL' })}
                                        className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${formData.type === 'LOCAL' ? 'bg-primary/20 border-primary text-white' : 'bg-background-dark border-border-dark text-slate-500 hover:border-slate-700'}`}
                                    >
                                        <span className="material-symbols-outlined">dns</span>
                                        <span className="text-xs font-bold uppercase">Local</span>
                                    </button>
                                </div>
                            </div>

                            {formData.type === 'CLOUD' ? (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Provedor</label>
                                        <select
                                            value={formData.provider}
                                            onChange={e => setFormData({ ...formData, provider: e.target.value })}
                                            className="w-full bg-[#111621] border border-[#292e38] rounded-xl text-sm text-white p-4 focus:ring-2 focus:ring-primary outline-none appearance-none"
                                        >
                                            <option value="AWS S3">AWS S3</option>
                                            <option value="Google Cloud Storage">Google Cloud Storage</option>
                                            <option value="Azure Blob">Azure Blob</option>
                                            <option value="DigitalOcean Spaces">DigitalOcean Spaces</option>
                                            <option value="Backblaze B2">Backblaze B2</option>
                                            <option value="Custom S3">Custom S3 (Minio/Wasabi)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endpoint / Bucket</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input
                                                value={formData.endpoint}
                                                onChange={e => setFormData({ ...formData, endpoint: e.target.value })}
                                                className="bg-[#111621] border border-[#292e38] rounded-xl text-sm text-white p-4 focus:ring-2 focus:ring-primary outline-none"
                                                placeholder="Endpoint URL"
                                            />
                                            <input
                                                value={formData.bucketName}
                                                onChange={e => setFormData({ ...formData, bucketName: e.target.value })}
                                                className="bg-[#111621] border border-[#292e38] rounded-xl text-sm text-white p-4 focus:ring-2 focus:ring-primary outline-none"
                                                placeholder="Bucket Name"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credenciais (Access & Secret)</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input
                                                value={formData.accessKey}
                                                onChange={e => setFormData({ ...formData, accessKey: e.target.value })}
                                                className="bg-[#111621] border border-[#292e38] rounded-xl text-sm text-white p-4 focus:ring-2 focus:ring-primary outline-none"
                                                placeholder="Access Key"
                                            />
                                            <input
                                                value={formData.secretKey}
                                                onChange={e => setFormData({ ...formData, secretKey: e.target.value })}
                                                type="password"
                                                className="bg-[#111621] border border-[#292e38] rounded-xl text-sm text-white p-4 focus:ring-2 focus:ring-primary outline-none"
                                                placeholder="Secret Key"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Caminho do Diretório (Local/SMB/NFS)</label>
                                        <input
                                            value={formData.localPath}
                                            onChange={e => setFormData({ ...formData, localPath: e.target.value })}
                                            className="w-full bg-[#111621] border border-[#292e38] rounded-xl text-sm text-white p-4 focus:ring-2 focus:ring-primary outline-none font-mono"
                                            placeholder="Ex: /mnt/storage/cam01 ou \\SERVER\Recordings"
                                        />
                                        <p className="text-[8px] text-slate-500 font-bold uppercase">Certifique-se que o usuário do sistema tem permissão de escrita.</p>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full py-5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl mt-4 shadow-xl shadow-primary/20 hover:bg-primary/80 transition-all flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (editingConfigId ? 'Atualizar Configuração' : 'Ativar Servidor')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Storage;
