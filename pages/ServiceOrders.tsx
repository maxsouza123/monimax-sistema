import React, { useState } from 'react';
import { useSync } from '../DataSynchronizer';
import { supabase } from '../supabaseClient';
import { ServiceOrder } from '../types';

const ServiceOrders: React.FC = () => {
    const { serviceOrders, clients, devices, userProfile, refreshData } = useSync();
    const [showForm, setShowForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        clientId: '',
        deviceId: '',
        priority: 'MEDIUM' as ServiceOrder['priority'],
        status: 'OPEN' as ServiceOrder['status'],
        scheduledDate: '',
        location: ''
    });

    const handleOpenCreate = () => {
        setEditingOrder(null);
        setFormData({
            title: '',
            description: '',
            clientId: '',
            deviceId: '',
            priority: 'MEDIUM',
            status: 'OPEN',
            scheduledDate: '',
            location: ''
        });
        setShowForm(true);
    };

    const handleEdit = (order: ServiceOrder) => {
        setEditingOrder(order);
        setFormData({
            title: order.title,
            description: order.description,
            clientId: order.clientId || '',
            deviceId: order.deviceId || '',
            priority: order.priority,
            status: order.status,
            scheduledDate: order.scheduledDate ? new Date(order.scheduledDate).toISOString().slice(0, 16) : '',
            location: order.location || ''
        });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.description) {
            alert("Título e descrição são obrigatórios.");
            return;
        }

        setIsSaving(true);
        try {
            const orderData = {
                title: formData.title,
                description: formData.description,
                client_id: formData.clientId || null,
                device_id: formData.deviceId || null,
                priority: formData.priority,
                status: formData.status,
                scheduled_date: formData.scheduledDate || null,
                location: formData.location || null
            };

            if (editingOrder) {
                const { error } = await supabase
                    .from('service_orders')
                    .update(orderData)
                    .eq('id', editingOrder.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('service_orders')
                    .insert([orderData]);
                if (error) throw error;
            }

            await refreshData('service_orders');
            setShowForm(false);
        } catch (err: any) {
            alert("Erro ao salvar ordem de serviço: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'HIGH': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'MEDIUM': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-emerald-500/10 text-emerald-500';
            case 'IN_PROGRESS': return 'bg-blue-500/10 text-blue-500';
            case 'COMPLETED': return 'bg-purple-500/10 text-purple-500';
            case 'CANCELLED': return 'bg-red-500/10 text-red-500';
            default: return 'bg-slate-500/10 text-slate-500';
        }
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight">Ordens de Serviço</h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">Gestão de Manutenções e Assistência Técnica</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                    <span className="material-symbols-outlined text-sm">build</span>
                    Nova Ordem
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-2">
                {serviceOrders.map(order => (
                    <div key={order.id} className="bg-card-dark rounded-2xl border border-border-dark p-5 hover:border-primary/50 transition-all group shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase tracking-widest ${getPriorityStyle(order.priority)}`}>
                                {order.priority}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(order)} className="p-1.5 text-slate-500 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                </button>
                            </div>
                        </div>

                        <h3 className="text-white font-bold text-sm uppercase mb-1 line-clamp-1">{order.title}</h3>
                        <p className="text-slate-500 text-[10px] mb-4 line-clamp-2">{order.description}</p>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-[9px] text-slate-400">
                                <span className="material-symbols-outlined text-[14px]">person</span>
                                <span className="font-bold uppercase tracking-tighter">
                                    {clients.find(c => c.id === order.clientId)?.name || 'Cliente não definido'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-[9px] text-slate-400">
                                <span className="material-symbols-outlined text-[14px]">location_on</span>
                                <span className="font-medium tracking-tight truncate">
                                    {order.location || 'Local não informado'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <span className={`text-[9px] font-black uppercase ${getStatusStyle(order.status)}`}>
                                {order.status === 'OPEN' ? 'ABERTA' :
                                    order.status === 'IN_PROGRESS' ? 'EM ANDAMENTO' :
                                        order.status === 'COMPLETED' ? 'CONCLUÍDA' : 'CANCELADA'}
                            </span>
                            <span className="text-[9px] text-slate-600 font-mono">
                                {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                ))}

                {serviceOrders.length === 0 && (
                    <div className="col-span-full py-20 bg-background-dark/30 rounded-3xl border-2 border-dashed border-border-dark flex flex-col items-center justify-center opacity-40">
                        <span className="material-symbols-outlined text-5xl mb-3">engineering</span>
                        <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma ordem de serviço registrada</p>
                    </div>
                )}
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#1c1f26] w-full max-w-2xl rounded-[24px] border border-[#292e38] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-8 border-b border-[#292e38]/50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">engineering</span>
                                <h3 className="text-white text-lg font-black uppercase tracking-widest">
                                    {editingOrder ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
                                </h3>
                            </div>
                            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-8 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título da Ordem</label>
                                <input
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-[#111621] border-[#292e38] rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="Ex: Manutenção Preventiva Cameras Norte"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prioridade</label>
                                    <select
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                                        className="w-full bg-[#111621] border-[#292e38] rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                                    >
                                        <option value="LOW">BAIXA</option>
                                        <option value="MEDIUM">MÉDIA</option>
                                        <option value="HIGH">ALTA</option>
                                        <option value="URGENT">URGENTE</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full bg-[#111621] border-[#292e38] rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                                    >
                                        <option value="OPEN">ABERTA</option>
                                        <option value="IN_PROGRESS">EM ANDAMENTO</option>
                                        <option value="COMPLETED">CONCLUÍDA</option>
                                        <option value="CANCELLED">CANCELADA</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</label>
                                    <select
                                        value={formData.clientId}
                                        onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                                        className="w-full bg-[#111621] border-[#292e38] rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                                    >
                                        <option value="">Selecione um Cliente...</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipamento (Opcional)</label>
                                    <select
                                        value={formData.deviceId}
                                        onChange={e => setFormData({ ...formData, deviceId: e.target.value })}
                                        className="w-full bg-[#111621] border-[#292e38] rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                                    >
                                        <option value="">Selecione um Dispositivo...</option>
                                        {devices.filter(d => d.clientId === formData.clientId || !formData.clientId).map(d => (
                                            <option key={d.id} value={d.id}>{d.name} ({d.type})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Localidade / Endereço</label>
                                <input
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full bg-[#111621] border-[#292e38] rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="Endereco da manutenção"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Agendada</label>
                                <input
                                    type="datetime-local"
                                    value={formData.scheduledDate}
                                    onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                                    className="w-full bg-[#111621] border-[#292e38] rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição do Problema / Atividade</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-[#111621] border-[#292e38] rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-primary outline-none h-24 resize-none"
                                    placeholder="Descreva o que precisa ser feito..."
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`w-full py-5 text-white text-xs font-black uppercase tracking-widest rounded-xl mt-4 shadow-xl transition-all transform active:scale-95 ${isSaving ? 'bg-slate-700 cursor-not-allowed opacity-50' : 'bg-primary shadow-primary/20 hover:bg-primary/80'}`}
                            >
                                {isSaving ? 'Salvando...' : (editingOrder ? 'Salvar Alterações' : 'Criar Ordem de Serviço')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceOrders;
