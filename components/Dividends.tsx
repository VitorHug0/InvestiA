import React, { useMemo, useState } from 'react';
import { Dividend } from '../types';
import { TrendingUp, Calendar, Download, DollarSign, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DividendsProps {
  dividends: Dividend[];
  onRemove: (id: string) => void;
}

export const Dividends: React.FC<DividendsProps> = ({ dividends, onRemove }) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Group by Month
  const groupedDividends = useMemo(() => {
    const groups: { [key: string]: { total: number, items: Dividend[] } } = {};
    
    // Sort descending by date
    const sorted = [...dividends].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sorted.forEach(div => {
      const date = new Date(div.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      
      if (!groups[monthKey]) {
        groups[monthKey] = { total: 0, items: [] };
      }
      
      groups[monthKey].items.push(div);
      groups[monthKey].total += div.amount;
    });

    return groups;
  }, [dividends]);

  const monthKeys = Object.keys(groupedDividends).sort().reverse();

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(id);
    setDeleteConfirmId(null);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <DollarSign className="text-emerald-400" />
                    Proventos Recebidos
                </h2>
                <p className="text-slate-400 mt-1">Gerencie seus dividendos, JCP e rendimentos.</p>
            </div>
            
            <Link to="/import" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-lg shadow-emerald-900/20 transition-all">
                <Download size={18} />
                Importar Planilha
            </Link>
        </div>

        {monthKeys.length === 0 ? (
            <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700 border-dashed">
                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                    <Calendar size={32} />
                </div>
                <h3 className="text-lg font-medium text-white">Nenhum provento registrado</h3>
                <p className="text-slate-400 mt-2 max-w-md mx-auto">
                    Importe sua planilha do Google Sheets ou adicione manualmente seus investimentos para ver a projeção de dividendos.
                </p>
            </div>
        ) : (
            <div className="grid gap-6">
                {monthKeys.map(month => {
                    const [year, m] = month.split('-');
                    const monthName = new Date(parseInt(year), parseInt(m) - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
                    const data = groupedDividends[month];

                    return (
                        <div key={month} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
                            <div className="bg-slate-900/50 p-4 flex justify-between items-center border-b border-slate-700">
                                <h3 className="text-lg font-bold text-white capitalize flex items-center gap-2">
                                    <Calendar size={18} className="text-slate-400" />
                                    {monthName}
                                </h3>
                                <div className="text-emerald-400 font-bold text-lg bg-emerald-500/10 px-3 py-1 rounded-lg">
                                    R$ {data.total.toFixed(2)}
                                </div>
                            </div>
                            <div className="divide-y divide-slate-700/50">
                                {data.items.map(div => (
                                    <div key={div.id} className="p-4 flex justify-between items-center hover:bg-slate-700/30 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                                                {div.ticker.substring(0, 4)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{div.ticker}</p>
                                                <p className="text-xs text-slate-400">{new Date(div.date).toLocaleDateString('pt-BR')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-white font-medium">R$ {div.amount.toFixed(2)}</p>
                                                <p className="text-xs text-slate-500">{div.description || 'Provento'}</p>
                                            </div>
                                            
                                            <div className="w-20 flex justify-end">
                                              {deleteConfirmId === div.id ? (
                                                <div className="flex items-center gap-2 animate-in fade-in duration-200">
                                                  <button 
                                                    type="button"
                                                    onClick={(e) => confirmDelete(e, div.id)}
                                                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded shadow"
                                                  >
                                                    Sim
                                                  </button>
                                                  <button 
                                                    type="button"
                                                    onClick={cancelDelete}
                                                    className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs font-bold rounded shadow"
                                                  >
                                                    Não
                                                  </button>
                                                </div>
                                              ) : (
                                                <button 
                                                  type="button"
                                                  onClick={(e) => handleDeleteClick(e, div.id)}
                                                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                                  title="Remover Provento"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                              )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
};