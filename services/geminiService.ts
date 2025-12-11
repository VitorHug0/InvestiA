// ESTE ARQUIVO FOI DESATIVADO POIS A DEPENDÊNCIA DE IA FOI REMOVIDA.
// Mantenha-o apenas se planejar reintegrar a IA futuramente.

/*
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Asset, AssetType, Dividend, Transaction, TransactionType } from "../types";

const getTodayDate = () => new Date().toISOString().split('T')[0];
// ... restante do código comentado ...
*/

export const parseImportData = async (input: any) => {
  console.warn("IA removida. Use a importação manual.");
  return { dividends: [], assets: [], transactions: [] };
};

export const chatWithAdvisor = async (message: string, context: any) => {
  return "O módulo de IA foi desativado nesta versão.";
};
