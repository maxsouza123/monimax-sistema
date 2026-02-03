import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UserRole } from '../types';

interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  address: string;
  cep: string;
  city: string;
  status: 'ONLINE' | 'OFFLINE';
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'OPERADOR' as UserRole,
    password: '',
    phone: '',
    address: '',
    cep: '',
    city: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;

      const mappedUsers: User[] = (data || []).map(p => ({
        id: p.id,
        name: p.full_name || 'Usuário sem nome',
        role: p.role as UserRole,
        email: p.email || 'N/A',
        phone: p.phone || '',
        address: p.address || '',
        cep: p.cep || '',
        city: p.city || '',
        status: 'OFFLINE'
      }));

      setUsers(mappedUsers);
    } catch (err: any) {
      console.error('Erro ao buscar usuários:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'OPERADOR', password: '', phone: '', address: '', cep: '', city: '' });
    setShowAddForm(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
      phone: user.phone || '',
      address: user.address || '',
      cep: user.cep || '',
      city: user.city || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja remover este usuário?")) {
      try {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) throw error;
        setUsers(users.filter(u => u.id !== id));
      } catch (err: any) {
        alert("Erro ao deletar perfil: " + err.message);
      }
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      alert("Por favor, preencha o nome e o e-mail.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingUser) {
        // Atualização de perfil existente
        const { error } = await supabase.from('profiles').update({
          full_name: formData.name,
          role: formData.role,
          phone: formData.phone,
          address: formData.address,
          cep: formData.cep,
          city: formData.city,
          email: formData.email
        }).eq('id', editingUser.id);

        if (error) throw error;
        alert("Perfil atualizado com sucesso!");
      } else {
        // Criação de novo usuário VIA EDGE FUNCTION
        if (!formData.password) {
          alert("A senha é obrigatória para novos usuários.");
          setIsSaving(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke('create-user', {
          body: {
            email: formData.email,
            password: formData.password,
            fullName: formData.name,
            role: formData.role,
            phone: formData.phone,
            address: formData.address,
            cep: formData.cep,
            city: formData.city
          }
        });

        // Tentar extrair erro da resposta JSON antes do erro de status
        if (data?.error) throw new Error(data.error);
        if (error) throw error;

        alert("Usuário e acesso criados com sucesso!");
      }

      await fetchUsers();
      setShowAddForm(false);
    } catch (err: any) {
      console.error('Erro completo:', err);
      const msg = err.message || "Erro desconhecido";
      if (msg.includes("already exists") || msg.includes("already registered")) {
        alert("ERRO: Este e-mail já está cadastrado no sistema.");
      } else {
        alert("Erro ao processar: " + msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleStyle = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return 'border-primary text-primary bg-primary/5';
      case 'OPERADOR': return 'border-green-500/50 text-green-500 bg-green-500/5';
      case 'TATICO': return 'border-indigo-500/50 text-indigo-400 bg-indigo-500/5';
      case 'CLIENTE': return 'border-slate-700 text-slate-500 bg-slate-500/5';
      default: return 'border-slate-700 text-slate-500';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return 'ADMINISTRADOR';
      case 'OPERADOR': return 'OPERADOR';
      case 'TATICO': return 'TÁTICO';
      case 'CLIENTE': return 'CLIENTE';
      default: return role;
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Usuários do Sistema</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Base Completa de Colaboradores e Clientes</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          Novo Registro
        </button>
      </div>

      <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden shadow-2xl mx-2">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center text-slate-500 animate-pulse font-black uppercase tracking-widest text-xs">Carregando usuários...</div>
          ) : (
            <table className="w-full text-left text-[11px]">
              <thead className="bg-background-dark/50 text-slate-500 uppercase font-black tracking-widest border-b border-border-dark">
                <tr>
                  <th className="px-6 py-5">Identificação</th>
                  <th className="px-6 py-5">E-mail</th>
                  <th className="px-6 py-5">Telefone</th>
                  <th className="px-6 py-5">Localidade</th>
                  <th className="px-6 py-5">CEP</th>
                  <th className="px-6 py-5">Especialização</th>
                  <th className="px-6 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="size-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold border border-primary/20">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card-dark ${user.status === 'ONLINE' ? 'bg-green-500' : 'bg-slate-600'}`}></span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white font-bold">{user.name}</span>
                          <span className="text-[9px] text-slate-500 uppercase font-medium">{user.address || 'Sem endereço'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-medium">{user.email}</td>
                    <td className="px-6 py-4 text-slate-400 font-mono">{user.phone || '-'}</td>
                    <td className="px-6 py-4 text-slate-400">{user.city || '-'}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono tracking-tighter">{user.cep || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-widest ${getRoleStyle(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEdit(user)} className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors" title="Editar">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-red-500 transition-colors" title="Remover">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1c1f26] w-full max-w-2xl rounded-[24px] border border-[#292e38] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-8 border-b border-[#292e38]/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">{editingUser ? 'edit_square' : 'person_add'}</span>
                <h3 className="text-white text-lg font-black uppercase tracking-widest">
                  {editingUser ? 'Editar Registro' : 'Novo Cadastro'}
                </h3>
              </div>
              <button onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-8 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Completo</label>
                  <input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#111621] border-[#292e38] rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="Ex: João da Silva"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail de Acesso</label>
                  <input
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    type="email"
                    className="w-full bg-[#111621] border-[#292e38] rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="joao@monimax.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefone de Contato</label>
                  <input
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#111621] border-[#292e38] rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CEP</label>
                  <input
                    value={formData.cep}
                    onChange={e => setFormData({ ...formData, cep: e.target.value })}
                    className="w-full bg-[#111621] border-[#292e38] rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="00000-000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço Completo</label>
                <input
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-[#111621] border-[#292e38] rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Rua, Número, Bairro"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cidade</label>
                  <input
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-[#111621] border-[#292e38] rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Ex: São Paulo"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Especialização</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full bg-[#111621] border-[#292e38] rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                  >
                    <option value="ADMIN">ADMINISTRADOR</option>
                    <option value="OPERADOR">OPERADOR</option>
                    <option value="TATICO">TÁTICO (PRONTO ATENDIMENTO)</option>
                    <option value="CLIENTE">CLIENTE FINAL</option>
                  </select>
                </div>
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha de Acesso</label>
                  <input
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    type="password"
                    className="w-full bg-[#111621] border-[#292e38] rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="••••••••"
                  />
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full py-5 text-white text-xs font-black uppercase tracking-widest rounded-xl mt-4 shadow-xl transition-all transform active:scale-95 ${isSaving ? 'bg-slate-700 cursor-not-allowed opacity-50' : 'bg-primary shadow-primary/20 hover:bg-primary/80'}`}
              >
                {isSaving ? 'Processando...' : (editingUser ? 'Salvar Alterações' : 'Concluir Cadastro')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
