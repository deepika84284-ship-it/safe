import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  PhoneCall,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  Languages
} from 'lucide-react';
import { apiService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { AiChatMessage } from '../types';

interface AiDoubtChatBoxProps {
  compact?: boolean;
  title?: string;
  subtitle?: string;
}

export const AiDoubtChatBox: React.FC<AiDoubtChatBoxProps> = ({
  compact = false,
  title,
  subtitle
}) => {
  const { language, t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const initialGreeting = language === 'ta'
    ? `வணக்கம்! நான் SafeCart AI ஆலோசகர். 

உங்களுக்கு ஏதேனும் ஆன்லைன் ஷாப்பிங், வாட்ஸ்அப் மெசேஜ், போலி கூரியர் அல்லது UPI பண பரிவர்த்தனை சந்தேகம் இருந்தால் கீழே தாராளமாக கேளுங்கள் (Tamil, Tanglish or English).

உடனடி உதாரண சந்தேகங்கள்:
1. "WhatsApp-ல advance ₹500 கேட்டா அனுப்பலாமா?"
2. "GPay-ல பணம் ஏமாந்துட்டேன் 1930 உதவி எண் எப்படி வேலை செய்யும்?"
3. "QR code scan பண்ணா என் அக்கவுண்ட்டுக்கு பணம் வருமா?"`
    : `Hello! I am your SafeCart AI Fraud Defense Copilot.

Ask me any doubt regarding suspicious online shopping websites, Instagram deals, WhatsApp advance courier fees, QR code scams, or 1930 helpline guidance.

Example questions:
1. "Should I pay ₹500 advance courier fee on WhatsApp?"
2. "How do I report a GPay scam to 1930 Cyber helpline?"
3. "Does scanning a QR code send money to my account?"`;

  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      role: 'assistant',
      content: initialGreeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      verdict: 'INFO',
      threatCategory: 'SafeCart AI Fraud Defense',
      suggestedFollowUps: language === 'ta' ? [
        'WhatsApp Advance Scam',
        '1930 Helpline Complaint',
        'QR Code Refund Trap',
        'Fake DTDC Courier Fee'
      ] : [
        'WhatsApp Advance Scam',
        '1930 Helpline Complaint',
        'QR Code Refund Trap',
        'Fake DTDC Courier Fee'
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Voice speech-to-text recognition
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your doubt in the box.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPrompt((prev) => (prev ? prev + ' ' + transcript : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Text-to-speech
  const toggleSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        const clean = text.replace(/[*_#`[\]()]/g, '');
        const utter = new SpeechSynthesisUtterance(clean);
        utter.rate = 1.0;
        utter.onend = () => setIsSpeaking(false);
        utter.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(utter);
      }
    }
  };

  const copyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSend = async (queryText?: string) => {
    const text = (queryText || prompt).trim();
    if (!text || loading) return;

    const userMessage: AiChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');
    setLoading(true);

    try {
      const history = messages.slice(-5).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await apiService.chatWithAi(text, history);

      if (res.success && res.data) {
        const aiMessage: AiChatMessage = {
          role: 'assistant',
          content: res.data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          verdict: res.data.verdict,
          riskScore: res.data.riskScore,
          threatCategory: res.data.threatCategory,
          recommendedSteps: res.data.recommendedSteps,
          suggestedFollowUps: res.data.suggestedFollowUps
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: language === 'ta'
            ? `⚠️ தற்காலிக தொடர்பு பிழை. முக்கிய பாதுகாப்பு விதி: அறிமுகமில்லாத எண்களுக்கு முன்பணம் அனுப்பாதீர்கள். அவசர பண இழப்பிற்கு உடனே 1930 எண்ணை அழைக்கவும்!`
            : `⚠️ Connection notice: Never pay advance charges or courier fees to unverified sellers. Dial 1930 Cyber helpline immediately if money was deducted.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          verdict: 'DANGEROUS',
          recommendedSteps: ['Call 1930 Cyber Helpline immediately if money was deducted.']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickDoubtPresets = language === 'ta' ? [
    {
      label: 'WhatsApp Advance Scam',
      query: 'WhatsApp-ல ₹500 courier advance கேட்டாங்க. அவங்க போலி கூரியர் ரசீது அனுப்பியிருக்காங்க. இது மோசடியா?'
    },
    {
      label: 'QR Code Refund Trap',
      query: 'பணம் திருப்பி தர்றோம்னு QR Code scan பண்ண சொல்றாங்க. Scan பண்ணா பணம் வருமா?'
    },
    {
      label: 'GPay Fraud / 1930 Helpline',
      query: 'GPay-ல ₹2000 அனுப்பி ஏமாந்துட்டேன். செல்லர் Block பண்ணிட்டார். 1930-ல் எப்படி புகார் செய்வது?'
    },
    {
      label: '90% Discount Offer Legit?',
      query: 'Instagram-ல 90% discount-ல iPhone தர்றோம்னு சொல்றாங்க. இது உண்மையா?'
    }
  ] : [
    {
      label: 'WhatsApp Advance Scam',
      query: 'A seller asked ₹500 courier advance on WhatsApp with a DTDC receipt. Is this a scam?'
    },
    {
      label: 'QR Code Refund Trap',
      query: 'A seller claims they will refund by asking me to scan a QR code. Will I receive money or lose money?'
    },
    {
      label: 'GPay Fraud / 1930 Helpline',
      query: 'I lost ₹2,000 to an Instagram shop on GPay and got blocked. How do I report on 1930 Cyber Helpline?'
    },
    {
      label: '90% Discount Offer Legit?',
      query: 'An Instagram page is selling ₹80,000 phone for ₹3,999. Is this authentic or phishing?'
    }
  ];

  const displayTitle = title || t('doubt.boxTitle');
  const displaySubtitle = subtitle || t('doubt.boxSubtitle');

  return (
    <div className="w-full bg-slate-900/90 border border-blue-900/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-4 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 shrink-0">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                {displayTitle}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-950 border border-blue-700 text-blue-300 text-[10px] font-bold">
                {language === 'ta' ? 'தமிழ் & English' : 'Tamil & English'}
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-xl line-clamp-1 sm:line-clamp-none">
              {displaySubtitle}
            </p>
          </div>
        </div>

        {/* 1930 Helpline Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="tel:1930"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-950/80 border border-red-800/80 text-red-300 hover:bg-red-900/60 transition text-xs font-bold"
          >
            <PhoneCall className="w-3.5 h-3.5 text-red-400 animate-bounce" />
            <span>1930 Cyber Helpline</span>
          </a>
        </div>
      </div>

      {/* Preset Quick Doubt Chips */}
      <div className="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>{t('doubt.quickPresets')}</span>
        </span>
        {quickDoubtPresets.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(preset.query)}
            className="px-3 py-1 rounded-full bg-slate-900 hover:bg-blue-950/70 border border-slate-800 hover:border-blue-700 text-slate-300 hover:text-blue-300 transition shrink-0 text-xs font-medium cursor-pointer"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Chat Conversation Area */}
      <div className={`p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-950/40 ${compact ? 'h-[360px]' : 'h-[440px]'}`}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 space-y-2.5 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20'
                  : 'bg-slate-900 border border-slate-800 rounded-bl-none text-slate-200 shadow-md'
              }`}
            >
              {/* Verdict Header for Assistant */}
              {msg.role === 'assistant' && msg.threatCategory && (
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800 text-[11px]">
                  <span className="font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    {msg.verdict === 'DANGEROUS' ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    ) : msg.verdict === 'SUSPICIOUS' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    {msg.threatCategory}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleSpeech(msg.content)}
                      title="Read aloud"
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-blue-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => copyText(msg.content, index)}
                      title="Copy"
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      {copiedIndex === index ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Message Content */}
              <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>

              {/* Recommended Steps */}
              {msg.recommendedSteps && msg.recommendedSteps.length > 0 && (
                <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 space-y-1.5 mt-2">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{language === 'ta' ? 'தற்காப்பு நடவடிக்கைகள் (Action Steps):' : 'Recommended Action Steps:'}</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    {msg.recommendedSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Follow-ups */}
              {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {language === 'ta' ? 'தொடர்புடைய கேள்விகள்:' : 'Suggested Follow-ups:'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.suggestedFollowUps.map((fu, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(fu)}
                        className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-950 hover:bg-blue-950 border border-slate-800 hover:border-blue-700 text-blue-300 transition text-left cursor-pointer"
                      >
                        {fu}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-[10px] text-slate-500 text-right">
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-slate-400 text-xs">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>{language === 'ta' ? 'AI யோசித்து பதில் அளிக்கிறது... (Analyzing fraud patterns)' : 'AI analyzing scam patterns & generating response...'}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('doubt.placeholder')}
              className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
            />
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              title={isListening ? 'Stop listening' : t('doubt.speakBtn')}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-lg shadow-blue-600/30 cursor-pointer shrink-0"
          >
            <span>{t('doubt.askBtn')}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 px-1">
          <span className="flex items-center gap-1">
            <Languages className="w-3 h-3 text-blue-400" />
            <span>{language === 'ta' ? 'ஆதரவு: தமிழ், Tanglish & English' : 'Supported: Tamil, Tanglish & English'}</span>
          </span>
          <span className="text-slate-500">
            Helpline: <a href="tel:1930" className="text-red-400 hover:underline font-bold">1930</a>
          </span>
        </div>
      </div>
    </div>
  );
};

