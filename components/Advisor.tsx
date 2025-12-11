import React, { useState, useRef, useEffect } from 'react';
import { chatWithAdvisor } from '../services/geminiService';
import { Asset, Dividend } from '../types';
import { Send, Bot, User } from 'lucide-react';

interface AdvisorProps {
  assets: Asset[];
  dividends: Dividend[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const Advisor: React.FC<AdvisorProps> = ({ assets, dividends }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou o analista da sua carteira. Posso ajudar a entender seus dividendos, sugerir rebalanceamentos ou explicar conceitos. O que deseja saber?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const response = await chatWithAdvisor(userMsg, { assets, dividends });
      setMessages(prev => [...prev, { role: 'assistant', content: response || "Sem resposta." }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Erro ao conectar com a IA." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[800px] bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden mt-6">
      <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex items-center gap-3">
        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
            <Bot size={24} />
        </div>
        <div>
            <h3 className="text-lg font-bold text-white">Advisor AI</h3>
            <p className="text-xs text-slate-400">Consultoria baseada na sua carteira real</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-br-none' 
                : 'bg-slate-700 text-slate-200 rounded-bl-none'
            }`}>
              {msg.role === 'assistant' ? (
                // Simple markdown-ish rendering for line breaks
                <div className="prose prose-invert prose-sm whitespace-pre-wrap">
                  {msg.content}
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
             <div className="bg-slate-700 p-4 rounded-2xl rounded-bl-none flex items-center gap-2">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms'}}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms'}}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms'}}></span>
             </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="Ex: Qual setor está dominando minha carteira?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
