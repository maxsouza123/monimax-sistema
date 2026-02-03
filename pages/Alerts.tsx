import React, { useState } from 'react';
import { useSync } from '../DataSynchronizer';
import { supabase } from '../supabaseClient';
import { KanbanColumn, KanbanCard } from '../types';

const Alerts: React.FC = () => {
  const { kanbanColumns: columns, kanbanCards: cards, refreshData } = useSync();

  // States para criação/edição de Colunas
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [columnTitle, setColumnTitle] = useState('');

  // States para criação/edição de Cards
  const [isAddingCard, setIsAddingCard] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [cardData, setCardData] = useState({ title: '', description: '', severity: 'INFO' });

  // --- Column Actions ---
  const handleSaveColumn = async () => {
    if (!columnTitle.trim()) return;
    try {
      if (editingColumn) {
        const { error } = await supabase.from('kanban_columns')
          .update({ title: columnTitle.toUpperCase() })
          .eq('id', editingColumn.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('kanban_columns').insert({
          title: columnTitle.toUpperCase(),
          position: columns.length,
          color: '#3b82f6'
        });
        if (error) throw error;
      }
      setColumnTitle('');
      setIsAddingColumn(false);
      setEditingColumn(null);
      await refreshData();
    } catch (err: any) {
      alert("Erro ao salvar coluna: " + err.message);
    }
  };

  const handleDeleteColumn = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir esta coluna e todos os seus cards?")) return;
    try {
      const { error } = await supabase.from('kanban_columns').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
    } catch (err: any) {
      alert("Erro ao deletar coluna: " + err.message);
    }
  };

  const startEditColumn = (col: KanbanColumn) => {
    setEditingColumn(col);
    setColumnTitle(col.title);
    setIsAddingColumn(true);
  };

  // --- Card Actions ---
  const handleSaveCard = async (columnId?: string) => {
    if (!cardData.title.trim()) return;
    try {
      if (editingCard) {
        const { error } = await supabase.from('kanban_cards')
          .update({
            title: cardData.title,
            description: cardData.description,
            severity: cardData.severity
          })
          .eq('id', editingCard.id);
        if (error) throw error;
      } else if (columnId) {
        const columnCards = cards.filter(c => c.columnId === columnId);
        const { error } = await supabase.from('kanban_cards').insert({
          column_id: columnId,
          title: cardData.title,
          description: cardData.description,
          severity: cardData.severity,
          position: columnCards.length
        });
        if (error) throw error;
      }
      setCardData({ title: '', description: '', severity: 'INFO' });
      setIsAddingCard(null);
      setEditingCard(null);
      await refreshData();
    } catch (err: any) {
      alert("Erro ao salvar card: " + err.message);
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!window.confirm("Excluir este card?")) return;
    try {
      const { error } = await supabase.from('kanban_cards').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
    } catch (err: any) {
      alert("Erro ao deletar card: " + err.message);
    }
  };

  const startEditCard = (card: KanbanCard) => {
    setEditingCard(card);
    setCardData({
      title: card.title,
      description: card.description || '',
      severity: card.severity
    });
    setIsAddingCard(card.columnId);
  };

  // --- Drag and Drop Logic ---
  const onDragStart = (e: React.DragEvent, cardId: string) => {
    e.dataTransfer.setData("cardId", cardId);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = async (e: React.DragEvent, targetColumnId: string) => {
    const cardId = e.dataTransfer.getData("cardId");
    const card = cards.find(c => c.id === cardId);

    if (card && card.columnId !== targetColumnId) {
      try {
        const { error } = await supabase
          .from('kanban_cards')
          .update({ column_id: targetColumnId })
          .eq('id', cardId);

        if (error) throw error;
        await refreshData();
      } catch (err: any) {
        console.error("Erro ao mover card:", err.message);
      }
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Quadro KanBan de Alertas</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">Gestão de Incidências e Fluxo de Atendimento</p>
        </div>

        <div className="flex items-center gap-3">
          {isAddingColumn ? (
            <div className="flex items-center gap-2 bg-card-dark p-1 rounded-xl border border-primary/30 animate-in zoom-in-95 duration-200">
              <input
                value={columnTitle}
                onChange={e => setColumnTitle(e.target.value)}
                placeholder="Nome da Coluna..."
                className="bg-transparent text-white text-[10px] font-bold px-3 py-2 outline-none w-40"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSaveColumn()}
              />
              <button onClick={handleSaveColumn} className="p-2 bg-primary text-white rounded-lg hover:bg-primary/80">
                <span className="material-symbols-outlined text-sm">check</span>
              </button>
              <button onClick={() => { setIsAddingColumn(false); setEditingColumn(null); setColumnTitle(''); }} className="p-2 text-slate-500">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingColumn(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
            >
              <span className="material-symbols-outlined text-sm text-primary">add_column</span>
              Nova Coluna
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 overflow-x-auto pb-6 flex gap-6 custom-scrollbar px-2 min-h-[600px] items-start">
        {columns.map(col => (
          <div
            key={col.id}
            className="w-80 shrink-0 flex flex-col bg-background-dark/40 rounded-2xl border border-border-dark/50 overflow-hidden"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, col.id)}
          >
            {/* Column Header */}
            <div className="p-4 flex items-center justify-between bg-card-dark/30 border-b border-border-dark/50 group/colhead">
              <div className="flex items-center gap-2">
                <div className="w-2 h-4 rounded-full" style={{ backgroundColor: col.color || '#3b82f6' }}></div>
                <h3 className="text-white text-[10px] font-black uppercase tracking-widest">{col.title}</h3>
                <div className="px-2 py-0.5 bg-white/5 rounded text-[9px] text-slate-500 font-bold">
                  {cards.filter(c => c.columnId === col.id).length}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover/colhead:opacity-100 transition-opacity">
                <button
                  onClick={() => startEditColumn(col)}
                  className="p-1.5 text-slate-500 hover:text-white transition-colors"
                  title="Editar Coluna"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button
                  onClick={() => handleDeleteColumn(col.id)}
                  className="p-1.5 text-slate-500 hover:text-red-500 transition-colors"
                  title="Excluir Coluna"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>

            {/* Cards List */}
            <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] custom-scrollbar">
              {cards.filter(c => c.columnId === col.id).map(card => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, card.id)}
                  className="bg-card-dark border border-border-dark p-4 rounded-xl shadow-lg hover:border-primary/40 transition-all cursor-grab active:cursor-grabbing group/card"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-1.5 flex-wrap">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${card.severity === 'CRÍTICO' ? 'bg-red-500/10 text-red-500' :
                        card.severity === 'ALERTA' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-primary/10 text-primary'
                        }`}>
                        {card.severity}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditCard(card)}
                        className="p-1 text-slate-500 hover:text-primary transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-1 text-slate-500 hover:text-red-500 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  </div>
                  <h4 className="text-white text-xs font-bold leading-tight uppercase tracking-tight mb-1">{card.title}</h4>
                  {card.description && (
                    <p className="text-slate-500 text-[10px] line-clamp-2 mt-1">{card.description}</p>
                  )}
                  <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center text-[8px] text-slate-600 font-bold uppercase tracking-widest font-mono">
                    <span>#{card.id.slice(0, 4)}</span>
                    <span>{new Date(card.createdAt).toLocaleDateString()} {new Date(card.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}

              {/* Add/Edit Card Form inline */}
              {isAddingCard === col.id ? (
                <div className="bg-card-dark border border-primary/30 p-4 rounded-xl animate-in slide-in-from-top-2 space-y-3">
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Título</label>
                    <input
                      autoFocus
                      value={cardData.title}
                      onChange={e => setCardData({ ...cardData, title: e.target.value })}
                      placeholder="Título do Alerta..."
                      className="w-full bg-[#111621] text-white text-xs p-2.5 rounded-lg border border-border-dark outline-none focus:border-primary/50"
                    />
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Severidade</label>
                    <div className="flex gap-2">
                      {['INFO', 'ALERTA', 'CRÍTICO'].map(s => (
                        <button
                          key={s}
                          onClick={() => setCardData({ ...cardData, severity: s })}
                          className={`flex-1 py-1.5 rounded-lg text-[8px] font-bold border transition-all ${cardData.severity === s
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'bg-white/5 border-border-dark text-slate-500'
                            }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Detalhes (Opcional)</label>
                    <textarea
                      value={cardData.description}
                      onChange={e => setCardData({ ...cardData, description: e.target.value })}
                      placeholder="Descreve o incidente..."
                      className="w-full bg-[#111621] text-white text-[10px] p-2.5 rounded-lg border border-border-dark outline-none focus:border-primary/50 resize-none h-16"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { setIsAddingCard(null); setEditingCard(null); setCardData({ title: '', description: '', severity: 'INFO' }); }}
                      className="flex-1 py-2 text-[9px] text-slate-500 font-bold hover:text-white transition-colors"
                    >
                      CANCELAR
                    </button>
                    <button
                      onClick={() => handleSaveCard(col.id)}
                      className="flex-1 bg-primary text-white text-[9px] font-black py-2 rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/80"
                    >
                      {editingCard ? 'ATUALIZAR' : 'SALVAR'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingCard(col.id)}
                  className="w-full py-3 border border-dashed border-border-dark rounded-xl text-slate-500 hover:text-white hover:border-slate-600 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Adicionar Card</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {columns.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 border-2 border-dashed border-border-dark rounded-3xl opacity-40">
            <span className="material-symbols-outlined text-6xl mb-4">view_kanban</span>
            <p className="text-[10px] font-black uppercase tracking-widest">Crie uma coluna para começar o fluxo</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
