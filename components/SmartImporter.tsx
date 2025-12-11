import React, { useState, useRef } from 'react';
import { Asset, Dividend, Transaction, AssetType } from '../types';
import { FileSpreadsheet, Wand2, ArrowRight, Loader2, CheckCircle, UploadCloud, FileText, X, Layers, AlertCircle } from 'lucide-react';

interface SmartImporterProps {
  onImport: (assets: Partial<Asset>[], dividends: Partial<Dividend>[], transactions: Partial<Transaction>[]) => void;
}

export const SmartImporter: React.FC<SmartImporterProps> = ({ onImport }) => {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setInputText(''); 
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Parser lógico simples para CSV/Texto
  const parseCSV = (text: string) => {
    const assets: Partial<Asset>[] = [];
    
    // Normaliza quebras de linha
    const lines = text.split(/\r?\n/);
    
    lines.forEach(line => {
        if (!line.trim() || line.startsWith('#') || line.startsWith('Ticker')) return;

        // Tenta separar por vírgula ou ponto e vírgula
        const parts = line.split(/[;,]/).map(p => p.trim());
        
        // Esperado: TICKER, TIPO, QTD, PRECO
        if (parts.length >= 4) {
            const ticker = parts[0].toUpperCase();
            const typeStr = parts[1];
            const qty = parseFloat(parts[2]);
            const price = parseFloat(parts[3]);

            if (ticker && !isNaN(qty) && !isNaN(price)) {
                // Tenta mapear o tipo
                let type = AssetType.OUTRO;
                const upperType = typeStr.toUpperCase();
                if (upperType.includes('ACAO') || upperType.includes('AÇÃO')) type = AssetType.ACAO;
                else if (upperType.includes('FII')) type = AssetType.FII;
                else if (upperType.includes('TESOURO') || upperType.includes('FIXA')) type = AssetType.TESOURO;
                else if (upperType.includes('CRIPTO')) type = AssetType.CRIPTO;
                else if (upperType.includes('CAIXA')) type = AssetType.CAIXA;

                assets.push({
                    ticker,
                    type,
                    quantity: qty,
                    averagePrice: price,
                    name: ticker // Fallback name
                });
            }
        }
    });

    return { assets, dividends: [], transactions: [] };
  };

  const handleProcess = async () => {
    if (!inputText.trim() && !selectedFile) return;
    
    setIsLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      let content = inputText;

      if (selectedFile) {
         content = await readFileAsText(selectedFile);
      }

      const result = parseCSV(content);
      
      const assetCount = result.assets.length;

      if (assetCount === 0) {
        setErrorMsg("Não foi possível ler os dados. Verifique se o formato está correto: TICKER; TIPO; QTD; PREÇO");
      } else {
        onImport(result.assets, [], []);
        setSuccessMsg(`Sucesso! ${assetCount} ativos identificados e importados.`);
        setInputText('');
        clearFile();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao processar arquivo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg max-w-3xl mx-auto mt-8 animate-in fade-in duration-500">
      <div className="mb-6 border-b border-slate-700 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="text-emerald-400" />
          Importação em Massa (CSV)
        </h2>
        <p className="text-slate-400 mt-2 text-sm">
          Importe seus ativos colando o texto ou enviando um arquivo <strong>.csv</strong> ou <strong>.txt</strong>.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* File Upload Area */}
        <div 
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            selectedFile ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 hover:border-emerald-400 hover:bg-slate-700/50'
          }`}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            accept=".csv,.txt"
            onChange={handleFileChange}
          />
          
          {selectedFile ? (
            <div className="flex flex-col items-center">
              <FileText size={48} className="text-emerald-400 mb-4" />
              <p className="text-white font-medium mb-2">{selectedFile.name}</p>
              <button 
                onClick={(e) => { e.stopPropagation(); clearFile(); }}
                className="text-red-400 text-sm hover:underline flex items-center gap-1"
              >
                <X size={14} /> Remover arquivo
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <UploadCloud size={48} className="text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-white">Clique para selecionar arquivo</h3>
              <p className="text-sm text-slate-400 mt-2">Arquivos .csv ou .txt simples</p>
            </div>
          )}
        </div>

        <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">OU COLE O TEXTO NO FORMATO</span>
            <div className="flex-grow border-t border-slate-700"></div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-400 font-mono mb-2">
            <p className="font-bold text-slate-300 mb-1">Formato aceito (separado por vírgula ou ponto e vírgula):</p>
            TICKER; TIPO; QUANTIDADE; PREÇO_MEDIO<br/>
            PETR4; ACAO; 100; 32.50<br/>
            HGLG11; FII; 10; 160.00
        </div>

        <textarea
          className="w-full h-40 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-sm disabled:opacity-50"
          placeholder={`PETR4; ACAO; 100; 32.50\nIVVB11; ETF; 50; 280.00\nBTC; CRIPTO; 0.05; 350000`}
          value={inputText}
          onChange={(e) => {
             setInputText(e.target.value);
             if (e.target.value) clearFile();
          }}
          disabled={!!selectedFile}
        />

        <div className="flex items-center justify-between pt-2">
            <div className="text-sm">
                {isLoading && <span className="text-emerald-400 flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Processando...</span>}
                {successMsg && <span className="text-emerald-400 flex items-center gap-2"><CheckCircle size={16}/> {successMsg}</span>}
                {errorMsg && <span className="text-red-400 flex items-center gap-2"><AlertCircle size={16}/> {errorMsg}</span>}
            </div>

            <button
              onClick={handleProcess}
              disabled={isLoading || (!inputText.trim() && !selectedFile)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/20"
            >
              <Wand2 size={18} />
              Processar Ativos
              <ArrowRight size={18} />
            </button>
        </div>
      </div>
    </div>
  );
};