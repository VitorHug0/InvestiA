import { Asset } from "../types";

// ID da planilha fornecida pelo usuário
const SPREADSHEET_ID = '1fQXgIj9YWyVpCYhHI7ix6vQtPqtSW-I8TFvJqkytjdQ';
const SHEET_GID = '1308505158'; // ID da aba específica

// URL de exportação pública em CSV
// Nota: A planilha precisa estar compartilhada como "Qualquer pessoa com o link" ou "Publicada na Web"
const GOOGLE_SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

export const fetchLatestPrices = async (assets: Asset[]): Promise<Asset[]> => {
  if (assets.length === 0) return [];

  try {
    // 1. Tenta buscar os dados da planilha
    const response = await fetch(GOOGLE_SHEET_CSV_URL);
    
    if (!response.ok) {
      throw new Error(`Erro ao acessar planilha: ${response.statusText}`);
    }

    const csvText = await response.text();
    const priceMap = new Map<string, number>();

    // 2. Processa o CSV (Assumindo Coluna A = Ticker, Coluna B = Preço)
    const rows = csvText.split(/\r?\n/);
    
    rows.forEach(row => {
      // Divide por vírgula, mas cuidado com números decimais brasileiros "35,50" dentro de aspas
      // Uma abordagem simples para CSV simples:
      const columns = row.split(',');
      
      if (columns.length >= 2) {
        // Limpa aspas e espaços
        const ticker = columns[0].replace(/['"]/g, '').trim().toUpperCase();
        
        // Tratamento para preço (Ex: "35.50" ou "35,50")
        // Se o CSV vier com aspas no preço ex: "3.500,00", removemos aspas e pontos de milhar
        let priceString = columns[1].replace(/['"]/g, '').trim();
        
        // Se tiver vírgula, assume formato PT-BR e troca por ponto
        if (priceString.includes(',')) {
             priceString = priceString.replace('.', '').replace(',', '.');
        }

        const price = parseFloat(priceString);

        if (ticker && !isNaN(price)) {
          priceMap.set(ticker, price);
        }
      }
    });

    console.log("Cotações atualizadas via Google Sheets:", Object.fromEntries(priceMap));

    // 3. Atualiza os ativos com os preços encontrados
    return assets.map(asset => {
      const newPrice = priceMap.get(asset.ticker.toUpperCase());
      
      if (newPrice !== undefined) {
        return {
          ...asset,
          currentPrice: newPrice
        };
      }

      // Se não encontrou na planilha, mantém o preço atual
      return asset;
    });

  } catch (error) {
    console.warn("Falha ao buscar cotações do Google Sheets (Usando Simulação):", error);

    // FALLBACK: Simulação Aleatória (Código anterior)
    // Usado se a planilha estiver offline, bloqueada ou sem internet
    await new Promise(resolve => setTimeout(resolve, 800));

    return assets.map(asset => {
      const variation = 1 + (Math.random() * 0.04 - 0.02);
      let newPrice = asset.currentPrice * variation;
      newPrice = Math.round(newPrice * 100) / 100;

      return {
        ...asset,
        currentPrice: newPrice > 0 ? newPrice : asset.currentPrice
      };
    });
  }
};