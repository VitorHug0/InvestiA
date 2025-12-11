import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowUpRight, ArrowDownLeft, History as HistoryIcon, Search, Trash2 } from 'lucide-react';

interface HistoryProps {
  transactions: Transaction[];
  onRemove: (id: string) => void;
}

export const History: React.FC<HistoryProps> = ({ transactions, onRemove }) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Sort by date desc
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
        <div className="border-b border-slate-700 pb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <HistoryIcon className="text-blue-400" />
                Histórico de Movimentações
            </h2>
            <p className="text-slate-400 mt-1">Registro completo de compras e vendas de ativos.</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-900 text-slate-400 text-sm uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-medium">Data</th>
                            <th className="p-4 font-medium">Operação</th>
                            <th className="p-4 font-medium">Ativo</th>
                            <th className="p-4 font-medium text-right">Quantidade</th>
                            <th className="p-4 font-medium text-right">Preço Unit.</th>
                            <th className="p-4 font-medium text-right">Total</th>
                            <th className="p-4 font-medium text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {sortedTransactions.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-500">Nenhuma movimentação registrada.</td>
                            </tr>
                        ) : (
                            sortedTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="p-4 text-slate-300 font-mono text-sm">
                                        {new Date(tx.date).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase ${
                                            tx.type === TransactionType.BUY 
                                            ? 'bg-emerald-500/20 text-emerald-400' 
                                            : 'bg-red-500/20 text-red-400'
                                        }`}>
                                            {tx.type === TransactionType.BUY ? <ArrowDownLeft size={12}/> : <ArrowUpRight size={12}/>}
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-white">{tx.ticker}</td>
                                    <td className="p-4 text-right text-slate-300">{tx.quantity}</td>
                                    <td className="p-4 text-right text-slate-300">R$ {tx.price.toFixed(2)}</td>
                                    <td className="p-4 text-right font-medium text-white">R$ {tx.total.toFixed(2)}</td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center">
                                            {deleteConfirmId === tx.id ? (
                                                <div className="flex items-center gap-2 animate-in fade-in duration-200">
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => confirmDelete(e, tx.id)}
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
                                                    onClick={(e) => handleDeleteClick(e, tx.id)}
                                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                                    title="Remover Transação"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};