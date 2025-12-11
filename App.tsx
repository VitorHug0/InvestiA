import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Asset, Dividend, AssetType, Transaction, TransactionType } from './types';
import { Dashboard } from './components/Dashboard';
import { SmartImporter } from './components/SmartImporter';
import { Advisor } from './components/Advisor';
import { AssetList } from './components/AssetList';
import { Dividends } from './components/Dividends';
import { History } from './components/History';
import { fetchLatestPrices } from './services/marketService';
import { LayoutDashboard, Wallet, BrainCircuit, FileInput, Menu, X, DollarSign, History as HistoryIcon } from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);

// Mock Initial Data
const INITIAL_ASSETS: Asset[] = [
  { id: '1', ticker: 'PETR4', name: 'Petrobras', type: AssetType.ACAO, quantity: 100, averagePrice: 32.50, currentPrice: 38.90 },
  { id: '2', ticker: 'HGLG11', name: 'CSHG Logistica', type: AssetType.FII, quantity: 15, averagePrice: 160.00, currentPrice: 165.50 },
  { id: '3', ticker: 'BTC', name: 'Bitcoin', type: AssetType.CRIPTO, quantity: 0.05, averagePrice: 150000, currentPrice: 350000 },
  { id: '4', ticker: 'CDB INTER', name: 'CDB Liquidez Diária', type: AssetType.CAIXA, quantity: 1, averagePrice: 5000, currentPrice: 5050 },
];

const INITIAL_DIVIDENDS: Dividend[] = [
  { id: '1', ticker: 'PETR4', amount: 120.50, date: '2023-11-20', description: 'JCP' },
  { id: '2', ticker: 'HGLG11', amount: 16.50, date: '2023-11-15', description: 'Rendimento' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
    { id: 't1', ticker: 'PETR4', type: TransactionType.BUY, quantity: 100, price: 32.50, total: 3250, date: '2023-01-15' },
    { id: 't2', ticker: 'HGLG11', type: TransactionType.BUY, quantity: 15, price: 160.00, total: 2400, date: '2023-02-10' }
];

const Navigation = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? "bg-slate-700 text-emerald-400 border-r-4 border-emerald-400" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200";

  return (
    <nav className="space-y-2 mt-8">
      <Link to="/" className={`flex items-center space-x-3 px-6 py-3 transition-all ${isActive('/')}`}>
        <LayoutDashboard size={20} />
        <span className="font-medium">Dashboard</span>
      </Link>
      <Link to="/assets" className={`flex items-center space-x-3 px-6 py-3 transition-all ${isActive('/assets')}`}>
        <Wallet size={20} />
        <span className="font-medium">Carteira</span>
      </Link>
      <Link to="/dividends" className={`flex items-center space-x-3 px-6 py-3 transition-all ${isActive('/dividends')}`}>
        <DollarSign size={20} />
        <span className="font-medium">Proventos</span>
      </Link>
      <Link to="/history" className={`flex items-center space-x-3 px-6 py-3 transition-all ${isActive('/history')}`}>
        <HistoryIcon size={20} />
        <span className="font-medium">Histórico</span>
      </Link>
      <Link to="/import" className={`flex items-center space-x-3 px-6 py-3 transition-all ${isActive('/import')}`}>
        <FileInput size={20} />
        <span className="font-medium">Importar</span>
      </Link>
      <Link to="/advisor" className={`flex items-center space-x-3 px-6 py-3 transition-all ${isActive('/advisor')}`}>
        <BrainCircuit size={20} />
        <span className="font-medium">Advisor AI</span>
      </Link>
    </nav>
  );
};

export default function App() {
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [dividends, setDividends] = useState<Dividend[]>(INITIAL_DIVIDENDS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);

  // Import Handler (from Sheet/Image)
  const handleImport = (
    newAssets: Partial<Asset>[], 
    newDividends: Partial<Dividend>[], 
    newTransactions: Partial<Transaction>[]
  ) => {
    
    // 1. Process Transactions History
    const processedTransactions = newTransactions.map(t => ({
      id: generateId(),
      ticker: t.ticker || 'UNKNOWN',
      type: (t.type as TransactionType) || TransactionType.BUY,
      quantity: t.quantity || 0,
      price: t.price || 0,
      total: (t.quantity || 0) * (t.price || 0),
      date: t.date || new Date().toISOString().split('T')[0],
      assetId: 'temp' // Will be linked conceptually by ticker
    }));
    
    if (processedTransactions.length > 0) {
        setTransactions(prev => [...prev, ...processedTransactions]);
    }

    // 2. Process Dividends
    const processedDividends = newDividends.map(d => ({
      id: generateId(),
      ticker: d.ticker || 'UNKNOWN',
      amount: d.amount || 0,
      date: d.date || new Date().toISOString().split('T')[0],
      description: d.description || 'Importado via Planilha'
    }));
    
    if (processedDividends.length > 0) {
        setDividends(prev => [...prev, ...processedDividends]);
    }

    // 3. Process Assets (Current Position)
    // If the import contains explicit Assets snapshot, we update the portfolio.
    if (newAssets.length > 0) {
        const updatedAssets = [...assets];
        
        newAssets.forEach(imported => {
            const existingIndex = updatedAssets.findIndex(a => a.ticker === imported.ticker);
            if (existingIndex >= 0) {
                // Update existing
                updatedAssets[existingIndex] = {
                    ...updatedAssets[existingIndex],
                    quantity: imported.quantity !== undefined ? imported.quantity : updatedAssets[existingIndex].quantity,
                    averagePrice: imported.averagePrice !== undefined ? imported.averagePrice : updatedAssets[existingIndex].averagePrice
                };
            } else {
                // Add new
                updatedAssets.push({
                    id: generateId(),
                    ticker: imported.ticker || 'UNKNOWN',
                    name: imported.name || imported.ticker || 'Unknown',
                    type: (imported.type as AssetType) || AssetType.OUTRO,
                    quantity: imported.quantity || 0,
                    averagePrice: imported.averagePrice || 0,
                    currentPrice: imported.averagePrice || 0 // Default to avg price until update
                });
            }
        });
        setAssets(updatedAssets);
    }
  };

  const removeAsset = (id: string) => {
    // Confirmation handled in UI component
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const removeDividend = (id: string) => {
    // Confirmation handled in UI component
    setDividends(prev => prev.filter(d => d.id !== id));
  };

  const removeTransaction = (id: string) => {
    // Confirmation handled in UI component
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const updatePrices = async () => {
    setIsUpdatingPrices(true);
    try {
        const updated = await fetchLatestPrices(assets);
        setAssets(updated);
    } catch (error) {
        console.error("Failed to update prices", error);
    } finally {
        setIsUpdatingPrices(false);
    }
  };

  const handleTrade = (asset: Asset, type: TransactionType, quantity: number, price: number, date: string) => {
    const total = quantity * price;

    // 1. Record Transaction
    const newTransaction: Transaction = {
        id: generateId(),
        assetId: asset.id,
        ticker: asset.ticker,
        type,
        quantity,
        price,
        total,
        date
    };
    setTransactions(prev => [...prev, newTransaction]);

    // 2. Update Asset Position
    setAssets(prevAssets => prevAssets.map(a => {
        if (a.id !== asset.id) return a;

        if (type === TransactionType.BUY) {
            // Calculate Weighted Average Price (Preço Médio)
            const oldTotal = a.quantity * a.averagePrice;
            const tradeTotal = quantity * price;
            const newQty = a.quantity + quantity;
            const newAvg = (oldTotal + tradeTotal) / newQty;

            return {
                ...a,
                quantity: newQty,
                averagePrice: newAvg,
            };
        } else {
            // SELL
            return {
                ...a,
                quantity: Math.max(0, a.quantity - quantity)
            };
        }
    }));
  };

  // Helper for manual edit
  const handleEditAsset = (asset: Asset) => {
     // For future implementation: Open modal to edit Average Price manually
     console.log("Edit requested", asset);
  };

  return (
    <Router>
      <div className="flex h-screen bg-slate-900 text-slate-200 overflow-hidden font-inter">
        
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed md:relative z-30 w-64 h-full bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col`}>
          <div className="p-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
              Investi.AI
            </h1>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400">
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Navigation />
          </div>
          
          <div className="p-6 border-t border-slate-800">
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 backdrop-blur-sm">
               <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Patrimônio Total</p>
               <p className="font-bold text-xl text-emerald-400">
                 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                   assets.reduce((acc, a) => acc + (a.quantity * a.currentPrice), 0)
                 )}
               </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden w-full flex flex-col bg-slate-900">
          {/* Mobile Header */}
          <header className="md:hidden p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
            <h1 className="text-xl font-bold text-white">Investi.AI</h1>
            <button onClick={() => setSidebarOpen(true)} className="text-slate-200">
              <Menu size={24} />
            </button>
          </header>

          <div className="flex-1 overflow-auto p-4 md:p-8 scroll-smooth">
            <div className="max-w-7xl mx-auto pb-12">
                <Routes>
                <Route path="/" element={<Dashboard assets={assets} dividends={dividends} />} />
                <Route path="/assets" element={
                    <AssetList 
                        assets={assets} 
                        onRemove={removeAsset} 
                        onUpdatePrice={updatePrices} 
                        isUpdating={isUpdatingPrices}
                        onTrade={handleTrade}
                        onEdit={handleEditAsset}
                    />
                } />
                <Route path="/dividends" element={<Dividends dividends={dividends} onRemove={removeDividend} />} />
                <Route path="/history" element={<History transactions={transactions} onRemove={removeTransaction} />} />
                <Route path="/import" element={<SmartImporter onImport={handleImport} />} />
                <Route path="/advisor" element={<Advisor assets={assets} dividends={dividends} />} />
                </Routes>
            </div>
          </div>
        </main>
      </div>
    </Router>
  );
}