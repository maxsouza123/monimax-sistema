import React, { useState, useRef } from 'react';
import { SuspiciousPlate } from '../types';
import { useSync } from '../DataSynchronizer';
import { supabase } from '../supabaseClient';
import { SupabaseMapper } from '../supabaseMapper';

const SuspiciousPlates: React.FC = () => {
    const { suspiciousPlates, isSyncing, refreshData } = useSync();
    const [showForm, setShowForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<Partial<SuspiciousPlate>>({
        plate: '',
        vehicleType: 'Carro',
        model: '',
        ownerName: '',
        city: '',
        zipCode: '',
        observations: '',
        imageUrl: ''
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `plates/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            setFormData({ ...formData, imageUrl: publicUrl });
        } catch (err: any) {
            alert(`Erro no upload: ${err.message}`);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSave = async () => {
        if (!formData.plate) {
            alert("A placa é obrigatória.");
            return;
        }

        setIsSaving(true);
        try {
            const dataToSave = SupabaseMapper.fromSuspiciousPlate(formData);

            if (editingId) {
                const { error } = await supabase
                    .from('suspicious_plates')
                    .update(dataToSave)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('suspicious_plates').insert([dataToSave]);
                if (error) throw error;
            }

            await refreshData();
            closeModal();
        } catch (err: any) {
            alert(`Erro: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja remover este veículo da lista de suspeitos?')) return;
        try {
            const { error } = await supabase.from('suspicious_plates').delete().eq('id', id);
            if (error) throw error;
            await refreshData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleEdit = (plate: SuspiciousPlate) => {
        setFormData(plate);
        setEditingId(plate.id);
        setShowForm(true);
    };

    const closeModal = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({
            plate: '',
            vehicleType: 'Carro',
            model: '',
            ownerName: '',
            city: '',
            zipCode: '',
            observations: '',
            imageUrl: ''
        });
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight">Veículos Suspeitos (LPR)</h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">Base de Dados para Alertas de Placas</p>
                </div>

                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-red-600/20 hover:scale-105 transition-all"
                >
                    <span className="material-symbols-outlined text-sm">add_alert</span>
                    Cadastrar Placa
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suspiciousPlates.map(v => (
                    <div key={v.id} className="bg-card-dark rounded-xl border border-red-900/30 overflow-hidden group hover:border-red-500/50 transition-all shadow-xl flex flex-col">
                        {v.imageUrl && (
                            <div className="h-40 w-full overflow-hidden border-b border-red-900/20 relative">
                                <img src={v.imageUrl} alt="Veículo" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-card-dark to-transparent opacity-60"></div>
                            </div>
                        )}
                        <div className="p-4 bg-red-500/5 border-b border-red-900/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-red-500">directions_car</span>
                                <div>
                                    <h3 className="text-white text-sm font-black tracking-tighter uppercase font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{v.plate}</h3>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{v.vehicleType} • {v.model}</p>
                                </div>
                            </div>
                            <div className="size-2 bg-red-500 rounded-full animate-pulse"></div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-500 font-bold uppercase tracking-tight">Proprietário</span>
                                    <span className="text-white font-medium uppercase">{v.ownerName || 'NÃO INFORMADO'}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-500 font-bold uppercase tracking-tight">Origem</span>
                                    <span className="text-white font-medium uppercase">{v.city || 'N/A'} - {v.zipCode || 'N/A'}</span>
                                </div>
                            </div>

                            {v.observations && (
                                <div className="bg-background-dark/50 p-3 rounded-lg border border-border-dark/30">
                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Observações</p>
                                    <p className="text-[10px] text-slate-300 italic">"{v.observations}"</p>
                                </div>
                            )}

                            <div className="flex gap-2 pt-2 mt-auto">
                                <button onClick={() => handleEdit(v)} className="flex-1 py-2 bg-background-dark border border-border-dark text-slate-400 text-[10px] font-bold uppercase rounded-lg hover:text-white hover:border-primary/50 transition-all flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-xs">edit</span>
                                    Editar
                                </button>
                                <button onClick={() => handleDelete(v.id)} className="px-3 py-2 bg-background-dark border border-border-dark text-slate-400 hover:text-red-500 hover:border-red-500/50 transition-all rounded-lg flex items-center justify-center">
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {suspiciousPlates.length === 0 && !isSyncing && (
                    <div className="col-span-full py-20 bg-card-dark/20 border border-dashed border-border-dark rounded-3xl flex flex-col items-center justify-center text-center">
                        <div className="size-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-slate-500 text-4xl">minor_crash</span>
                        </div>
                        <h4 className="text-white font-bold uppercase tracking-tight">Lista de Suspeitos Vazia</h4>
                        <p className="text-slate-500 text-xs mt-1">Nenhum veículo cadastrado na base de monitoramento LPR.</p>
                    </div>
                )}
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#1c1f26] w-full max-w-2xl rounded-[24px] border border-red-900/50 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[95vh]">
                        <div className="p-6 border-b border-border-dark/50 flex justify-between items-center bg-red-500/5">
                            <div>
                                <h3 className="text-white text-lg font-black uppercase tracking-widest">Cadastro de Alerta (LPR)</h3>
                                <p className="text-[9px] text-red-500/70 font-bold uppercase mt-1 italic">Identificação de Veículo Suspeito</p>
                            </div>
                            <button onClick={closeModal} className="text-slate-500 hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Upload Section */}
                                <div className="w-full md:w-1/2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Foto do Veículo</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-video w-full bg-[#111621] border-2 border-dashed border-border-dark rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-red-500/50 transition-all overflow-hidden relative group"
                                    >
                                        {formData.imageUrl ? (
                                            <>
                                                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <span className="material-symbols-outlined text-white">cloud_upload</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-slate-700 text-3xl mb-2">image</span>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase">Clique para Upload</p>
                                                {uploadingImage && (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                        <div className="size-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                    </div>
                                </div>

                                <div className="w-full md:w-1/2 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Placa do Veículo</label>
                                        <input
                                            value={formData.plate}
                                            onChange={e => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                                            className="w-full bg-[#111621] border border-red-900/40 rounded-xl text-xl font-black font-mono text-white p-4 focus:ring-2 focus:ring-red-500 outline-none text-center tracking-widest"
                                            placeholder="ABC-1D23"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Veículo</label>
                                        <select
                                            value={formData.vehicleType}
                                            onChange={e => setFormData({ ...formData, vehicleType: e.target.value })}
                                            className="w-full h-[60px] bg-[#111621] border border-border-dark rounded-xl text-sm text-white px-4 focus:ring-2 focus:ring-red-500 outline-none"
                                        >
                                            <option>Carro</option>
                                            <option>Moto</option>
                                            <option>Caminhão</option>
                                            <option>Utilitário</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marca / Modelo</label>
                                    <input value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} className="w-full bg-[#111621] border border-border-dark rounded-xl text-sm text-white p-4 outline-none focus:border-red-500/50" placeholder="Ex: VW Gol G5 Branco" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proprietário</label>
                                    <input value={formData.ownerName} onChange={e => setFormData({ ...formData, ownerName: e.target.value })} className="w-full bg-[#111621] border border-border-dark rounded-xl text-sm text-white p-4 outline-none focus:border-red-500/50" placeholder="Nome completo" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cidade</label>
                                    <input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full bg-[#111621] border border-border-dark rounded-xl text-sm text-white p-4 outline-none focus:border-red-500/50" placeholder="São Paulo - SP" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CEP</label>
                                    <input value={formData.zipCode} onChange={e => setFormData({ ...formData, zipCode: e.target.value })} className="w-full bg-[#111621] border border-border-dark rounded-xl text-sm text-white p-4 outline-none focus:border-red-500/50" placeholder="00000-000" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações Operacionais</label>
                                <textarea
                                    value={formData.observations}
                                    onChange={e => setFormData({ ...formData, observations: e.target.value })}
                                    rows={3}
                                    className="w-full bg-[#111621] border border-border-dark rounded-xl text-sm text-white p-4 outline-none resize-none focus:border-red-500/50"
                                    placeholder="Descreva o motivo do alerta ou histórico do veículo..."
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isSaving || uploadingImage}
                                className="w-full py-5 bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-xl shadow-red-600/30 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {isSaving ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Confirmar Cadastro de Alerta'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuspiciousPlates;
