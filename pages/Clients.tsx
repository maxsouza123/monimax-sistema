
import React, { useState } from 'react';
import { useSync } from '../DataSynchronizer';
import { supabase } from '../supabaseClient';
import { SupabaseMapper } from '../supabaseMapper';
import { Client } from '../types';

const Clients: React.FC = () => {
    const { clients, isSyncing, refreshData } = useSync();
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        document: '',
        status: 'active' as 'active' | 'inactive'
    });

    const handleOpenCreate = () => {
        setEditingClient(null);
        setFormData({ name: '', email: '', phone: '', address: '', document: '', status: 'active' });
        setShowAddForm(true);
    };

    const handleEdit = (client: Client) => {
        setEditingClient(client);
        setFormData({
            name: client.name,
            email: client.email || '',
            phone: client.phone || '',
            address: client.address || '',
            document: client.document || '',
            status: client.status
        });
        setShowAddForm(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Tem certeza que deseja remover este cliente?")) {
            try {
                const { error } = await supabase.from('clients').delete().eq('id', id);
                if (error) throw error;
                await refreshData();
            } catch (err: any) {
                alert("Erro ao deletar cliente: " + err.message);
            }
        }
    };

    const handleSave = async () => {
        if (!formData.name) {
            alert("Por favor, preencha o nome do cliente.");
            return;
        }

        setIsSaving(true);
        try {
            if (editingClient) {
                const { error } = await supabase
                    .from('clients')
                    .update(SupabaseMapper.fromClient(formData))
                    .eq('id', editingClient.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('clients')
                    .insert([SupabaseMapper.fromClient(formData)]);
                if (error) throw error;
            }

            await refreshData();
            setShowAddForm(false);
            setEditingClient(null);
            setFormData({ name: '', email: '', phone: '', address: '', document: '', status: 'active' });
        } catch (err: any) {
            alert("Erro ao salvar cliente: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight">Gestão de Clientes</h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Base de Clientes e Contratos</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                    <span className="material-symbols-outlined text-sm">add_business</span>
                    Novo Cliente
                </button>
            </div>

            <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden shadow-2xl mx-2">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                        <thead className="bg-background-dark/50 text-slate-500 uppercase font-black tracking-widest border-b border-border-dark">
                            <tr>
                                <th className="px-6 py-5">Razão Social / Nome</th>
                                <th className="px-6 py-5">E-mail</th>
                                <th className="px-6 py-5">Telefone</th>
                                <th className="px-6 py-5">CPF / CNPJ</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark">
                            {clients.map(client => (
                                <tr key={client.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold border border-primary/20">
                                                {client.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold">{client.name}</span>
                                                <span className="text-[9px] text-slate-500 uppercase font-medium">{client.address || 'Endereço não informado'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 font-medium">{client.email || '-'}</td>
                                    <td className="px-6 py-4 text-slate-400 font-mono">{client.phone || '-'}</td>
                                    <td className="px-6 py-4 text-slate-400">{client.document || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-widest ${client.status === 'active' ? 'border-green-500/50 text-green-500 bg-green-500/5' : 'border-red-500/50 text-red-500 bg-red-500/5'}`}>
                                            {client.status === 'active' ? 'ATIVO' : 'INATIVO'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => handleEdit(client)} className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors" title="Editar">
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </button>
                                            <button onClick={() => handleDelete(client.id)} className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-red-500 transition-colors" title="Remover">
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {clients.length === 0 && !isSyncing && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500 italic uppercase font-black tracking-widest">Nenhum cliente cadastrado</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showAddForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#1c1f26] w-full max-w-2xl rounded-[24px] border border-[#292e38] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-8 border-b border-[#292e38]/50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">{editingClient ? 'edit_note' : 'add_business'}</span>
                                <h3 className="text-white text-lg font-black uppercase tracking-widest">
                                    {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                                </h3>
                            </div>
                            <button onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-8 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Completo / Razão Social</label>
                                <input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-[#111621] border-[#292e38] rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                    placeholder="Ex: Condomínio Solar das Palmeiras"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail</label>
                                    <input
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        type="email"
                                        className="w-full bg-[#111621] border-[#292e38] rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="financeiro@cliente.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefone</label>
                                    <input
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-[#111621] border-[#292e38] rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="(11) 99999-9999"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CPF / CNPJ</label>
                                    <input
                                        value={formData.document}
                                        onChange={e => setFormData({ ...formData, document: e.target.value })}
                                        className="w-full bg-[#111621] border-[#292e38] rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="00.000.000/0001-00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full bg-[#111621] border-[#292e38] rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                                    >
                                        <option value="active">ATIVO</option>
                                        <option value="inactive">INATIVO</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço de Instalação</label>
                                <input
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full bg-[#111621] border-[#292e38] rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="Rua das Palmeiras, 100 - Centro"
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full py-5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl mt-4 shadow-xl shadow-primary/20 hover:bg-primary/80 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isSaving && <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clients;
