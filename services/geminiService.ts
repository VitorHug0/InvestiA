import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Asset, AssetType, Dividend, Transaction, TransactionType } from "../types";

// Helper to get today's date for context
const getTodayDate = () => new Date().toISOString().split('T')[0];

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface FileInput {
  mimeType: string;
  data: string; // base64 string
}

/**
 * Uses Gemini to parse raw text or image (multimodal) into structured JSON.
 */
export const parseImportData = async (input: string | FileInput): Promise<{ dividends: Partial<Dividend>[], assets: Partial<Asset>[], transactions: Partial<Transaction>[] }> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }

  const promptText = `
    Analise os dados financeiros fornecidos. Eles podem vir de múltiplas abas de uma planilha ou extratos misturados.
    
    Sua missão é extrair e CATEGORIZAR os dados em 3 grupos distintos:
    
    1. **ASSETS (Carteira Atual)**: Procure por "Posição", "Custódia", "Saldo Atual" ou "Carteira". 
       - Se houver apenas histórico de compras/vendas, TENTE calcular a posição atual somando as compras e subtraindo as vendas.
       - Extraia: Ticker, Tipo, Quantidade Atual, Preço Médio.

    2. **TRANSACTIONS (Histórico/Movimentações)**: Procure por "Nota de Corretagem", "Extrato", "Movimentações", "Compras", "Vendas".
       - Extraia: Ticker, Tipo (Compra ou Venda), Data, Quantidade, Preço Unitário.
       - Nota: Se a linha diz "Crédito" ou "Débito" referente a um ativo, deduza se foi Venda ou Compra.

    3. **DIVIDENDS (Proventos)**: Procure por "Proventos", "Dividendos", "JCP", "Rendimentos Recebidos".
       - Extraia: Ticker, Valor, Data de Pagamento.

    Data de hoje para referência: ${getTodayDate()}
    
    Regras de Inferência para Tipos:
    - CDB, Tesouro Direto, Selic, LCI, LCA ou Saldo em Conta -> Categorize como "Caixa / Renda Fixa" (Enum: ${AssetType.CAIXA}).
    - Final 3, 4 -> Ação.
    - Final 11 -> Geralmente FII, mas verifique se não é Unit ou ETF.
    - BTC, ETH, USDT -> Criptomoeda.
    
    Regras Gerais:
    - Ignore cabeçalhos repetidos.
    - Normalize valores numéricos (troque vírgula por ponto se necessário).
  `;

  // Define schema for structured output
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      dividends: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            ticker: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING, description: "YYYY-MM-DD format" },
            description: { type: Type.STRING }
          }
        }
      },
      assets: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            ticker: { type: Type.STRING },
            type: { type: Type.STRING, enum: Object.values(AssetType) },
            quantity: { type: Type.NUMBER },
            averagePrice: { type: Type.NUMBER },
            name: { type: Type.STRING }
          }
        }
      },
      transactions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            ticker: { type: Type.STRING },
            type: { type: Type.STRING, enum: [TransactionType.BUY, TransactionType.SELL] },
            quantity: { type: Type.NUMBER },
            price: { type: Type.NUMBER },
            date: { type: Type.STRING, description: "YYYY-MM-DD format" }
          }
        }
      }
    }
  };

  try {
    let contents;

    if (typeof input === 'string') {
      // Text-only input
      contents = {
        parts: [
          { text: promptText },
          { text: `DADOS DO USUÁRIO:\n"""\n${input}\n"""` }
        ]
      };
    } else {
      // Multimodal input (Image/File)
      contents = {
        parts: [
          { text: promptText },
          { 
            inlineData: {
              mimeType: input.mimeType,
              data: input.data
            } 
          }
        ]
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const jsonText = response.text;
    if (!jsonText) return { dividends: [], assets: [], transactions: [] };
    
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error parsing with Gemini:", error);
    throw error;
  }
};

/**
 * Chat with Gemini about the portfolio
 */
export const chatWithAdvisor = async (
  message: string, 
  portfolioContext: { assets: Asset[], dividends: Dividend[] }
) => {
  if (!process.env.API_KEY) {
    return "Erro: Chave de API não configurada.";
  }

  const contextPrompt = `
    Você é um consultor financeiro especialista e amigável do app "Investi.AI".
    
    Resumo da Carteira do Usuário:
    - Total investido em ${portfolioContext.assets.length} ativos.
    - Ativos: ${JSON.stringify(portfolioContext.assets.map(a => `${a.ticker} (${a.type})`))}
    - Últimos dividendos: ${JSON.stringify(portfolioContext.dividends.slice(0, 5))}
    
    Responda a pergunta do usuário com base nesses dados. Seja conciso e use formatação Markdown se necessário.
    Não dê conselhos de compra/venda específicos legais, apenas análise educativa.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `System: ${contextPrompt}\nUser: ${message}`,
      config: {
        systemInstruction: "Você é um assistente financeiro útil."
      }
    });

    return response.text;
  } catch (error) {
    console.error("Chat error:", error);
    return "Desculpe, tive um problema ao analisar sua pergunta.";
  }
};