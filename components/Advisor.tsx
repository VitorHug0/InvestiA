import React from 'react';
import { BookOpen, TrendingUp, ShieldAlert, Target } from 'lucide-react';

interface AdvisorProps {
  assets: any[];
  dividends: any[];
}

export const Advisor: React.FC<AdvisorProps> = () => {
  return (
    <div className="flex flex-col bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden mt-6 animate-in fade-in">
      <div className="bg-slate-900/50 p-6 border-b border-slate-700 flex items-center gap-3">
        <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400">
            <BookOpen size={24} />
        </div>
        <div>
            <h3 className="text-xl font-bold text-white">Educação Financeira</h3>
            <p className="text-sm text-slate-400">Dicas essenciais para manter sua carteira saudável</p>
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <div className="space-y-6">
            <div className="flex gap-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg h-fit text-emerald-400">
                    <TrendingUp size={24} />
                </div>
                <div>
                    <h4 className="text-lg font-bold text-white mb-2">Rebalanceamento Constante</h4>
                    <p className="text-slate-400 leading-relaxed text-sm">
                        O segredo não é acertar a "ação da vez", mas manter sua alocação de risco. 
                        Se ações subiram muito e ocupam uma porcentagem maior que o planejado, 
                        venda o excedente ou aporte nas categorias que ficaram para trás (como Renda Fixa).
                    </p>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="p-2 bg-blue-500/10 rounded-lg h-fit text-blue-400">
                    <Target size={24} />
                </div>
                <div>
                    <h4 className="text-lg font-bold text-white mb-2">O Poder do Longo Prazo</h4>
                    <p className="text-slate-400 leading-relaxed text-sm">
                        Juros compostos precisam de tempo. Evite girar a carteira com frequência. 
                        Menos corretagem e menos impostos significam mais dinheiro rendendo para você no final de 10, 20 anos.
                    </p>
                </div>
            </div>
        </div>

        <div className="space-y-6">
            <div className="flex gap-4">
                <div className="p-2 bg-red-500/10 rounded-lg h-fit text-red-400">
                    <ShieldAlert size={24} />
                </div>
                <div>
                    <h4 className="text-lg font-bold text-white mb-2">Reserva de Emergência</h4>
                    <p className="text-slate-400 leading-relaxed text-sm">
                        Antes de investir em Renda Variável, garanta que você possui de 6 a 12 meses do seu custo de vida 
                        em liquidez diária (CDB, Tesouro Selic). Isso evita que você precise vender ações em momentos de baixa.
                    </p>
                </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-6 border border-slate-700/50">
                <h5 className="font-bold text-indigo-400 mb-2 text-sm uppercase tracking-wide">Regra de Ouro</h5>
                <p className="text-white italic text-lg">
                    "Nunca invista em um negócio que você não consegue entender."
                </p>
                <p className="text-right text-slate-500 text-sm mt-2">— Warren Buffett</p>
            </div>
        </div>

      </div>
    </div>
  );
};