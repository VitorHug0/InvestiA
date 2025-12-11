import React, { useState } from 'react';
import { Asset, AssetType, TransactionType } from '../types';
import { Trash2, RefreshCw, PlusCircle, MinusCircle, X, Check } from 'lucide-react';

interface AssetListProps {
  assets: Asset[];
  onRemove: (id: string) => void;
  onUpdatePrice: () => void;
  isUpdating: boolean;
  onTrade: (asset: Asset, type: TransactionType, quantity: number, price: number, date: string) => void;
  onEdit: (asset: Asset) => void;
}

export const AssetList: React.FC<AssetListProps> = ({ assets, onRemove, onUpdatePrice, isUpdating, onTrade, onEdit }) => {
  const [tradeModal, setTradeModal] = useState<{ asset: Asset, type: TransactionType } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Trade Form State
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const openTrade = (asset: Asset, type: TransactionType) => {
    setTradeModal({ asset, type });
    setQuantity('');
    setPrice(type === TransactionType.BUY ? asset.currentPrice.toString() : asset.currentPrice.toString());
    setDate(new Date().toISOString().split('T')[0]);
  };

  const submitTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradeModal) return;
    
    const qtyNum = parseFloat(quantity);
    const priceNum = parseFloat(price);

    if (qtyNum > 0 && priceNum > 0) {
      onTrade(tradeModal.asset, tradeModal.type, qtyNum, priceNum, date);
      setTradeModal(null);
    }
  };

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
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg mt-8 animate-in fade-in">
      <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h3 className="text-xl font-bold text-white">Minha Carteira</h3>
           <span className="text-sm text-slate-400">{assets.length} ativos monitorados</span>
        </div>
        
        <button 
          onClick={onUpdatePrice}
          disabled={isUpdating}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw size={16} className={isUpdating ? "animate-spin" : ""} />
          {isUpdating ? 'Atualizando...' : 'Atualizar Cotações'}
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-slate-400 text-sm uppercase tracking-wider">
            <tr>
              <th className="p-4 font-medium">Ativo</th>
              <th className="p-4 font-medium text-right">Qtd</th>
              <th className="p-4 font-medium text-right">Preço Médio</th>
              <th className="p-4 font-medium text-right">Cotação Atual</th>
              <th className="p-4 font-medium text-right">Total</th>
              <th className="p-4 font-medium text-right">Rentabilidade</th>
              <th className="p-4 font-medium text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {assets.length === 0 ? (
                <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Nenhum ativo encontrado. Comece importando uma planilha ou adicione manualmente.
                    </td>
                </tr>
            ) : (
                assets.map((asset) => {
                const total = asset.quantity * asset.currentPrice;
                const profitPercent = ((asset.currentPrice - asset.averagePrice) / asset.averagePrice) * 100;
                const profitValue = total - (asset.quantity * asset.averagePrice);
                
                return (
                    <tr key={asset.id} className="hover:bg-slate-700/30 transition-colors group">
                    <td className="p-4">
                        <div className="font-bold text-white">{asset.ticker}</div>
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${
                        asset.type === AssetType.ACAO ? 'border-blue-500/30 text-blue-400' :
                        asset.type === AssetType.FII ? 'border-yellow-500/30 text-yellow-400' :
                        asset.type === AssetType.CRIPTO ? 'border-orange-500/30 text-orange-400' :
                        asset.type === AssetType.CAIXA ? 'border-cyan-500/30 text-cyan-400' :
                        asset.type === AssetType.TESOURO ? 'border-cyan-500/30 text-cyan-400' :
                        'border-slate-500/30 text-slate-400'
                        }`}>
                        {asset.type}
                        </span>
                    </td>
                    <td className="p-4 text-right text-slate-300 font-mono">{asset.quantity}</td>
                    <td className="p-4 text-right text-slate-300 font-mono">R$ {asset.averagePrice.toFixed(2)}</td>
                    <td className="p-4 text-right font-mono text-white">R$ {asset.currentPrice.toFixed(2)}</td>
                    <td className="p-4 text-right font-semibold text-emerald-400 font-mono">R$ {total.toFixed(2)}</td>
                    <td className="p-4 text-right">
                        <div className={`text-sm font-bold ${profitPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                           {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                        </div>
                        <div className={`text-xs ${profitValue >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                           {profitValue >= 0 ? '+' : ''}R$ {profitValue.toFixed(2)}
                        </div>
                    </td>
                    <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                           {deleteConfirmId === asset.id ? (
                             <div className="flex items-center gap-2 animate-in fade-in duration-200">
                               <button 
                                 type="button"
                                 onClick={(e) => confirmDelete(e, asset.id)}
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
                             <>
                              <button title="Comprar (Aportar)" onClick={() => openTrade(asset, TransactionType.BUY)} className="p-1.5 hover:bg-emerald-500/20 text-emerald-400 rounded transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"><PlusCircle size={18} /></button>
                              <button title="Vender" onClick={() => openTrade(asset, TransactionType.SELL)} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"><MinusCircle size={18} /></button>
                              <button 
                                type="button"
                                title="Remover" 
                                onClick={(e) => handleDeleteClick(e, asset.id)} 
                                className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded transition-colors cursor-pointer relative z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                              >
                                <Trash2 size={16} />
                              </button>
                             </>
                           )}
                        </div>
                    </td>
                    </tr>
                );
                })
            )}
          </tbody>
        </table>
      </div>

      {/* Trade Modal */}
      {tradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {tradeModal.type === TransactionType.BUY ? (
                            <PlusCircle className="text-emerald-400" />
                        ) : (
                            <MinusCircle className="text-red-400" />
                        )}
                        {tradeModal.type === TransactionType.BUY ? 'Registrar Aporte' : 'Registrar Venda'}
                        <span className="ml-2 text-slate-500 text-base font-normal">{tradeModal.asset.ticker}</span>
                    </h3>
                    <button onClick={() => setTradeModal(null)} className="text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={submitTrade} className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Data da Operação</label>
                        <input 
                            type="date" 
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Quantidade</label>
                            <input 
                                type="number" 
                                required
                                step="any"
                                min="0.0000001"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Preço Unitário (R$)</label>
                            <input 
                                type="number" 
                                required
                                step="0.01"
                                min="0"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="0,00"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-lg flex justify-between items-center">
                        <span className="text-slate-400">Valor Total</span>
                        <span className="text-xl font-bold text-white">
                            R$ {((parseFloat(quantity) || 0) * (parseFloat(price) || 0)).toFixed(2)}
                        </span>
                    </div>

                    <button 
                        type="submit"
                        className={`w-full py-3 rounded-lg font-bold text-white transition-all shadow-lg ${
                            tradeModal.type === TransactionType.BUY 
                            ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' 
                            : 'bg-red-600 hover:bg-red-500 shadow-red-900/20'
                        }`}
                    >
                        Confirmar {tradeModal.type}
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};