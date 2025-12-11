import React, { useState, useRef } from 'react';
import { parseImportData, FileInput } from '../services/geminiService';
import { Asset, Dividend, Transaction } from '../types';
import { FileSpreadsheet, Wand2, ArrowRight, Loader2, CheckCircle, UploadCloud, FileText, Image as ImageIcon, X, Layers } from 'lucide-react';

interface SmartImporterProps {
  onImport: (assets: Partial<Asset>[], dividends: Partial<Dividend>[], transactions: Partial<Transaction>[]) => void;
}

export const SmartImporter: React.FC<SmartImporterProps> = ({ onImport }) => {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ file: File, preview?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Create preview if image
      let previewUrl = undefined;
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }

      setSelectedFile({ file, preview: previewUrl });
      setInputText(''); // Clear text if file is selected
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove "data:*/*;base64," prefix for API
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleProcess = async () => {
    if (!inputText.trim() && !selectedFile) return;
    
    setIsLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      let inputData: string | FileInput;

      if (selectedFile) {
        // Process File
        if (selectedFile.file.type.startsWith('image/')) {
          const base64Data = await readFileAsBase64(selectedFile.file);
          inputData = {
            mimeType: selectedFile.file.type,
            data: base64Data
          };
        } else {
          // Assume text/csv
          const textData = await readFileAsText(selectedFile.file);
          inputData = textData;
        }
      } else {
        // Process Text Area
        inputData = inputText;
      }

      const result = await parseImportData(inputData);
      
      const assetCount = result.assets?.length || 0;
      const divCount = result.dividends?.length || 0;
      const txCount = result.transactions?.length || 0;

      if (assetCount === 0 && divCount === 0 && txCount === 0) {
        setErrorMsg("A IA não conseguiu identificar dados financeiros válidos.");
      } else {
        onImport(result.assets || [], result.dividends || [], result.transactions || []);
        setSuccessMsg(`Sucesso! Importados: ${assetCount} ativos, ${divCount} dividendos e ${txCount} transações.`);
        setInputText('');
        clearFile();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Erro ao processar. Verifique o arquivo ou tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg max-w-3xl mx-auto mt-8 animate-in fade-in duration-500">
      <div className="mb-6 border-b border-slate-700 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="text-emerald-400" />
          Importação Geral (Multimodal)
        </h2>
        <p className="text-slate-400 mt-2 text-sm">
          A IA consegue ler abas misturadas. Cole o conteúdo de <strong>Todas as Abas</strong> (Histórico, Posição, Proventos) de uma vez só ou envie o arquivo/print.
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
            accept=".csv,.txt,image/*"
            onChange={handleFileChange}
          />
          
          {selectedFile ? (
            <div className="flex flex-col items-center">
              {selectedFile.preview ? (
                <img src={selectedFile.preview} alt="Preview" className="h-32 object-contain mb-4 rounded-lg border border-slate-600" />
              ) : (
                <FileText size={48} className="text-emerald-400 mb-4" />
              )}
              <p className="text-white font-medium mb-2">{selectedFile.file.name}</p>
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
              <h3 className="text-lg font-medium text-white">Clique para selecionar CSV ou Imagem</h3>
              <p className="text-sm text-slate-400 mt-2">Suporta planilhas exportadas (CSV/TXT) ou Prints de tela.</p>
            </div>
          )}
        </div>

        <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">OU COLE O TEXTO BRUTO</span>
            <div className="flex-grow border-t border-slate-700"></div>
        </div>

        <textarea
          className="w-full h-40 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-xs disabled:opacity-50"
          placeholder={`Cole aqui o conteúdo de TODAS as abas.\n\nExemplo:\n\n-- ABA NEGOCIAÇÕES --\nCompra PETR4 100 32.50 10/01/2024\nVenda VALE3 50 60.00 12/01/2024\n\n-- ABA PROVENTOS --\nPETR4 JCP 15.00 15/01/2024\n\n-- ABA CARTEIRA --\nPETR4 500 ações PM 30.00`}
          value={inputText}
          onChange={(e) => {
             setInputText(e.target.value);
             if (e.target.value) clearFile();
          }}
          disabled={!!selectedFile}
        />

        <div className="flex items-center justify-between pt-2">
            <div className="text-sm">
                {isLoading && <span className="text-emerald-400 flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Analisando dados complexos...</span>}
                {successMsg && <span className="text-emerald-400 flex items-center gap-2"><CheckCircle size={16}/> {successMsg}</span>}
                {errorMsg && <span className="text-red-400 flex items-center gap-2">⚠️ {errorMsg}</span>}
            </div>

            <button
              onClick={handleProcess}
              disabled={isLoading || (!inputText.trim() && !selectedFile)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/20"
            >
              <Wand2 size={18} />
              Importar Tudo
              <ArrowRight size={18} />
            </button>
        </div>
      </div>
      
      {/* Tips Section */}
      <div className="mt-8 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <FileSpreadsheet size={14} />
            Como importar abas múltiplas?
          </h4>
          <ul className="text-sm text-slate-400 list-disc list-inside space-y-1">
              <li>Se for Google Sheets: Selecione todas as abas relevantes (Ctrl+Click nas abas), vá em Arquivo &gt; Fazer Download &gt; PDF (exporta tudo) ou copie e cole o conteúdo de cada aba aqui.</li>
              <li>A IA é capaz de identificar datas e separar o que é <strong>Dividendos</strong> do que é <strong>Histórico de Negociações</strong>.</li>
          </ul>
      </div>
    </div>
  );
};