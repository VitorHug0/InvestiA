import React, { useMemo, useState } from 'react';
import { Asset, Dividend, AssetType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DollarSign, TrendingUp, Wallet, PieChart as PieChartIcon, BarChart3, Calendar, Filter } from 'lucide-react';

interface DashboardProps {
  assets: Asset[];
  dividends: Dividend[];
}

// Fixed color mapping for consistency
const TYPE_COLORS: Record<string, string> = {
  [AssetType.ACAO]: '#3b82f6',       // Blue-500
  [AssetType.FII]: '#f59e0b',        // Amber-500
  [AssetType.CRIPTO]: '#10b981',     // Emerald-500
  [AssetType.CAIXA]: '#06b6d4',      // Cyan-500
  [AssetType.TESOURO]: '#8b5cf6',    // Violet-500
  [AssetType.OUTRO]: '#64748b',      // Slate-500
};

// Fallback colors for individual assets
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];

// Helper for currency formatting
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// Helper for percentage formatting
const formatPercent = (value: number) => {
  return `${value.toFixed(2)}%`;
};

// Custom Tooltip Component
const CustomPieTooltip = ({ active, payload, total }: { active?: boolean; payload?: any[]; total: number }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const value = data.value as number;
    const percent = total > 0 ? (value / total) * 100 : 0;

    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
        <p className="font-bold text-white mb-1">{data.name}</p>
        <p className="text-emerald-400 text-sm font-mono">{formatCurrency(value)}</p>
        <p className="text-slate-400 text-xs mt-1">Representatividade: <span className="text-white font-bold">{formatPercent(percent)}</span></p>
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC<DashboardProps> = ({ assets, dividends }) => {
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [assetFilter, setAssetFilter] = useState<string>('ALL');
  
  // Calculate totals
  const totalBalance = useMemo(() => {
    return assets.reduce((acc, asset) => acc + (asset.quantity * asset.currentPrice), 0);
  }, [assets]);

  const totalDividends = useMemo(() => {
    return dividends.reduce((acc, div) => acc + div.amount, 0);
  }, [dividends]);

  // Prepare data for Allocation Pie Chart (By Type)
  const allocationByType = useMemo(() => {
    const map = new Map<string, number>();
    assets.forEach(asset => {
      const val = asset.quantity * asset.currentPrice;
      map.set(asset.type, (map.get(asset.type) || 0) + val);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [assets]);

  // Prepare data for Allocation Pie Chart (By Asset) with Filter
  const { data: allocationByAsset, total: filteredTotal } = useMemo(() => {
    let filteredAssets = assets;
    
    if (assetFilter !== 'ALL') {
        filteredAssets = assets.filter(a => a.type === assetFilter);
    }

    const data = filteredAssets.map(asset => ({
        name: asset.ticker,
        value: asset.quantity * asset.currentPrice
    })).sort((a, b) => b.value - a.value);

    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    return { data, total };
  }, [assets, assetFilter]);

  // Mock evolution data calculation
  const evolutionData = useMemo(() => {
    const data = [];
    const currentValue = totalBalance > 0 ? totalBalance : 10000;
    
    if (viewMode === 'monthly') {
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const currentMonthIndex = new Date().getMonth();
        
        // We create an array of 12 items for Jan-Dec
        const yearValues = new Array(12).fill(0);

        // 1. Set current month to actual balance
        yearValues[currentMonthIndex] = currentValue;

        // 2. Simulate History (Jan to Current Month - 1)
        let val = currentValue;
        for (let i = currentMonthIndex - 1; i >= 0; i--) {
             // Go backwards: divide by growth factor to make past values smaller
             const fluctuation = 1 + (Math.random() * 0.08 - 0.02); 
             val = val / fluctuation;
             yearValues[i] = val;
        }

        // 3. Simulate Projection (Current Month + 1 to Dec)
        val = currentValue;
        for (let i = currentMonthIndex + 1; i < 12; i++) {
             // Go forwards: multiply by conservative growth factor
             const fluctuation = 1 + (Math.random() * 0.03); 
             val = val * fluctuation;
             yearValues[i] = val;
        }

        // 4. Push to data array with correct sorting order
        yearValues.forEach((v, i) => {
             data.push({
                name: monthNames[i],
                value: Math.round(v),
                order: 11 - i 
             });
        });

    } else {
        // Yearly logic (Last 5 years)
        const currentYear = new Date().getFullYear();
        let previousValue = currentValue;

        for (let i = 0; i < 5; i++) {
            // Random fluctuation between -5% and +15% per year
            const fluctuation = 1 + (Math.random() * 0.20 - 0.05);

            data.push({
                name: (currentYear - i).toString(),
                value: Math.round(i === 0 ? currentValue : previousValue),
                order: i 
            });

            previousValue = previousValue / fluctuation;
        }
    }

    return data.sort((a, b) => b.order - a.order);
  }, [totalBalance, viewMode]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/20 rounded-full text-emerald-400">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Patrimônio Total</p>
              <h3 className="text-2xl font-bold text-white">
                {formatCurrency(totalBalance)}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/20 rounded-full text-blue-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Proventos Recebidos</p>
              <h3 className="text-2xl font-bold text-white">
                {formatCurrency(totalDividends)}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-500/20 rounded-full text-purple-400">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total de Ativos</p>
              <h3 className="text-2xl font-bold text-white">{assets.length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Evolution Chart */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h4 className="text-lg font-semibold text-white flex items-center">
                <TrendingUp size={18} className="mr-2 text-emerald-400" />
                Evolução Patrimonial (Simulada)
              </h4>
              
              <div className="bg-slate-900 p-1 rounded-lg flex text-sm font-medium border border-slate-700">
                  <button 
                    onClick={() => setViewMode('monthly')}
                    className={`px-4 py-1.5 rounded-md transition-all flex items-center gap-2 ${
                        viewMode === 'monthly' 
                        ? 'bg-slate-700 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Calendar size={14} />
                    Jan - Dez
                  </button>
                  <button 
                    onClick={() => setViewMode('yearly')}
                    className={`px-4 py-1.5 rounded-md transition-all flex items-center gap-2 ${
                        viewMode === 'yearly' 
                        ? 'bg-slate-700 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Calendar size={14} />
                    Anual
                  </button>
              </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#e2e8f0' }} />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fill: '#e2e8f0' }} 
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  width={60}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                  formatter={(value: number) => [formatCurrency(value), 'Valor']}
                />
                <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      {/* Allocation Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Allocation by Type */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
            <PieChartIcon size={18} className="mr-2 text-blue-400" />
            Alocação por Tipo
          </h4>
          <div className="h-72">
            {allocationByType.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {allocationByType.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={TYPE_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomPieTooltip total={totalBalance} />} />
                  <Legend wrapperStyle={{ color: '#e2e8f0', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                Sem dados para exibir
              </div>
            )}
          </div>
        </div>

        {/* Allocation by Asset (With Filter) */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-white flex items-center">
                <BarChart3 size={18} className="mr-2 text-purple-400" />
                Composição {assetFilter === 'ALL' ? 'da Carteira' : assetFilter}
              </h4>
              
              <div className="relative group">
                <Filter size={16} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
                <select
                    value={assetFilter}
                    onChange={(e) => setAssetFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 block pl-8 pr-3 py-2 outline-none appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
                >
                    <option value="ALL">Todos os Ativos</option>
                    {Object.values(AssetType).map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
              </div>
          </div>

          <div className="h-72">
            {allocationByAsset.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationByAsset}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  >
                    {allocationByAsset.map((entry, index) => (
                      <Cell key={`cell-asset-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  {/* Tooltip now receives filteredTotal to calculate correct relative percentage */}
                  <RechartsTooltip content={<CustomPieTooltip total={filteredTotal} />} />
                  <Legend 
                    wrapperStyle={{ color: '#e2e8f0', paddingTop: '10px' }} 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    formatter={(value, entry: any) => {
                       const { payload } = entry;
                       // Calculate % relative to the CURRENT VIEW (Filtered Total)
                       const percent = filteredTotal > 0 ? (payload.value / filteredTotal) * 100 : 0;
                       return `${value} (${percent.toFixed(1)}%)`;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                <BarChart3 size={24} className="opacity-50" />
                <span className="text-sm">Sem ativos deste tipo</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};