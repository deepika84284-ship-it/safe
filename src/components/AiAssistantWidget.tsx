import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Maximize2,
  PhoneCall,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { apiService } from '../services/api';

export const AiAssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'வணக்கம்! ஏதேனும் WhatsApp டீல், போலி கூரியர் அல்லது Instagram பக்கம் பற்றி சந்தேகம் உள்ளதா? என்னிடம் கேளுங்கள்!'
    }
  ]);

  const location = useLocation();
  const navigate = useNavigate();

  // Don't show floating widget if already on /ai-assistant
  if (location.pathname === '/ai-assistant') {
    return null;
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userText = prompt.trim();
    setConversation((prev) => [...prev, { role: 'user', text: userText }]);
    setPrompt('');
    setLoading(true);

    try {
      const history = conversation.slice(-4).map((c) => ({
        role: c.role,
        content: c.text
      }));

      const res = await apiService.chatWithAi(userText, history);
      if (res.success && res.data) {
        setConversation((prev) => [...prev, { role: 'assistant', text: res.data.reply }]);
      } else {
        throw new Error();
      }
    } catch {
      setConversation((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: '⚠️ தகவல்: அறிமுகமில்லாத எண்களுக்கு வாட்ஸ்அப்பில் முன்பணம் அனுப்பாதீர்கள். அவசர உதவிக்கு 1930 எண்ணை அழைக்கவும்!'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-slate-950 border border-blue-900/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>SafeCart AI ஆலோசகர்</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[10px] text-blue-300 font-mono">
                  Tamil & English Copilot
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/ai-assistant');
                }}
                title="Open full page"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Helpline Ribbon */}
          <div className="bg-red-950/60 px-3 py-1.5 border-b border-red-900/50 flex items-center justify-between text-[11px] text-red-300">
            <span className="flex items-center gap-1 font-bold">
              <PhoneCall className="w-3 h-3 text-red-400 animate-pulse" />
              Cyber Fraud Helpline: 1930
            </span>
            <Link
              to="/ai-assistant"
              className="text-blue-400 hover:underline text-[10px] font-bold"
            >
              Full Screen →
            </Link>
          </div>

          {/* Message Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-900/50 text-xs">
            {conversation.map((c, i) => (
              <div
                key={i}
                className={`flex ${c.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl ${
                    c.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                  } whitespace-pre-wrap leading-relaxed`}
                >
                  {c.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <Bot className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span>AI யோசிக்கிறது... (Analyzing)</span>
              </div>
            )}
          </div>

          {/* Quick Suggestions Chips */}
          <div className="p-2 bg-slate-950/80 border-t border-slate-800 flex gap-1.5 overflow-x-auto text-[10px]">
            <button
              onClick={() => {
                setPrompt('WhatsApp-ல ₹500 advance கேக்குறாங்க, scam-ஆ?');
              }}
              className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 shrink-0"
            >
              Advance UPI Scam?
            </button>
            <button
              onClick={() => {
                setPrompt('GPay-ல பணம் ஏமாந்துட்டேன் 1930 புகார் எப்படி?');
              }}
              className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 shrink-0"
            >
              1930 Helpline Steps
            </button>
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-2.5 bg-slate-950 border-t border-slate-800 flex gap-1.5">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask in Tamil / English..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-2xl shadow-blue-600/40 border border-blue-400/30 hover:scale-105 transition-all duration-200 cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-white animate-bounce" />
          </div>
          <span>Ask AI / AI-கிட்ட கேளுங்க</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      )}
    </div>
  );
};
