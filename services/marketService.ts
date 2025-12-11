import { GoogleGenAI } from "@google/genai";
import { Asset } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchLatestPrices = async (assets: Asset[]): Promise<Asset[]> => {
  if (assets.length === 0) return [];
  if (!process.env.API_KEY) {
      console.warn("API Key missing, skipping price update");
      return assets;
  }

  const tickers = assets.map(a => a.ticker).join(", ");
  
  // Prompt engineered to get structured data despite Grounding limitation on responseSchema
  const prompt = `
    Find the latest market price in BRL (Brazilian Real) for these tickers: ${tickers}.
    
    IMPORTANT:
    1. Use Google Search to find the real-time or delayed price.
    2. Return ONLY a valid JSON object where keys are tickers and values are numbers.
    3. Do not include any markdown formatting, explanations, or citations in the output text.
    4. If a price is not found, omit the key or set to 0.
    
    Example output format:
    {
      "PETR4": 38.50,
      "HGLG11": 165.20,
      "BTC": 350000.00
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType and responseSchema are NOT allowed with googleSearch
      },
    });

    let text = response.text || "";
    
    // Cleanup code blocks if present
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // Find the JSON object in the text (in case there's preamble)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        text = jsonMatch[0];
    }

    const priceMap: Record<string, number> = JSON.parse(text);

    return assets.map(asset => {
      // Try to find the price using exact ticker or potential variations if needed
      const newPrice = priceMap[asset.ticker] || priceMap[asset.ticker.toUpperCase()];
      
      if (typeof newPrice === 'number' && newPrice > 0) {
        return {
          ...asset,
          currentPrice: newPrice
        };
      }
      return asset;
    });

  } catch (error) {
    console.error("Failed to fetch prices via Gemini:", error);
    // Return original assets on error without changes
    return assets;
  }
};
