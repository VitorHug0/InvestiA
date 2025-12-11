export enum AssetType {
  ACAO = 'Ação',
  FII = 'FII',
  TESOURO = 'Tesouro Direto',
  CAIXA = 'Caixa / Renda Fixa',
  CRIPTO = 'Criptomoeda',
  OUTRO = 'Outro'
}

export interface Asset {
  id: string;
  ticker: string;
  name: string;
  type: AssetType;
  quantity: number;
  averagePrice: number;
  currentPrice: number; 
}

export interface Dividend {
  id: string;
  ticker: string;
  amount: number;
  date: string; // ISO Date string YYYY-MM-DD
  description?: string;
}

export enum TransactionType {
  BUY = 'Compra',
  SELL = 'Venda'
}

export interface Transaction {
  id: string;
  assetId?: string;
  ticker: string;
  type: TransactionType;
  quantity: number;
  price: number;
  total: number;
  date: string;
}

export interface PortfolioHistory {
  date: string;
  totalValue: number;
}

export interface ImportResult {
  dividends: Dividend[];
  assets: Asset[];
  transactions: Transaction[];
}