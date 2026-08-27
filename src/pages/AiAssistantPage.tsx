import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Bot,
  Send,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileSearch,
  MessageSquare,
  HelpCircle,
  Copy,
  Check,
  PhoneCall,
  ExternalLink,
  Volume2,
  VolumeX,
  RotateCcw,
  Languages,
  Zap,
  ArrowRight,
  Shield
} from 'lucide-react';
import { apiService } from '../services/api';
import { AiChatMessage, SuspiciousMessageAnalysis } from '../types';

export const AiAssistantPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [activeTab, setActiveTab] = useState<'chat' | 'message-auditor'>('chat');
  const [inputPrompt, setInputPrompt] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      role: 'assistant',
      content: `வணக்கம்! நான் SafeCart AI சைபர் பாதுகாப்பு ஆலோசகர் (AI Fraud Defense Specialist).

நான் உங்களுக்கு பின்வரும் விஷயங்களில் உடனடி விளக்கம் மற்றும் உதவி செய்வேன்:
• 📸 **இன்ஸ்டாகிராம் & வாட்ஸ்அப் மோசடிகள்** (Fake store, advance UPI payment traps)
• 📦 **போலி கூரியர் ரசீது & சுங்கக் கட்டண மிரட்டல்** (Fake DTDC / Customs charges)
• 💳 **GPay / PhonePe / Paytm பண இழப்பு & உடனடி மீட்பு** (1930 Helpline & Bank Chargeback)
• 🌐 **சந்தேகத்திற்குரிய இணையதளங்கள் & போலி ஆஃபர்கள்** (Fake website checks)

நீங்க சந்தேகப்படும் மெசேஜ் அல்லது கேள்வியை தமிழில் அல்லது ஆங்கிலத்தில் கீழே கேட்கலாம்!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      verdict: 'INFO',
      threatCategory: 'SafeCart AI Fraud Defense',
      suggestedFollowUps: [
        'WhatsApp-ல முன்பணம் (Advance) கட்ட சொன்னாங்க, நம்பலாமா?',
        'GPay-ல பணம் ஏமாந்துட்டேன், 1930-ல் புகார் செய்வது எப்படி?',
        'Instagram-ல 90% discount iPhone உண்மை தானா?',
        'How to verify fake DTDC tracking slip?'
      ]
    }
  ]);

  // Suspicious Message Auditor state
  const [rawMessageInput, setRawMessageInput] = useState('');
  const [analyzingMessage, setAnalyzingMessage] = useState(false);
  const [messageAnalysis, setMessageAnalysis] = useState<SuspiciousMessageAnalysis | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSendMessage(initialQuery.trim());
    }
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || loading) return;

    const userMsg: AiChatMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-5).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await apiService.chatWithAi(query, historyPayload);

      if (res.success && res.data) {
        const aiMsg: AiChatMessage = {
          role: 'assistant',
          content: res.data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          verdict: res.data.verdict,
          riskScore: res.data.riskScore,
          threatCategory: res.data.threatCategory,
          recommendedSteps: res.data.recommendedSteps,
          suggestedFollowUps: res.data.suggestedFollowUps
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error('No response from AI');
      }
    } catch (err: any) {
      const errorMsg: AiChatMessage = {
        role: 'assistant',
        content: `⚠️ தற்காலிக தொடர்பு பிழை. ஆனால் பொதுவான பாதுகாப்பு விதி: வாட்ஸ்அப் அல்லது அறிமுகமில்லாத எண்களுக்கு முன்பணம் அனுப்பாதீர்கள். அவசர பண இழப்பிற்கு உடனே 1930 எண்ணை அழைக்கவும்!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        verdict: 'DANGEROUS',
        recommendedSteps: [
          'Call 1930 immediately if money was deducted.',
          'Do not share OTP or scan QR codes.'
        ]
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleAuditMessage = async (sampleText?: string) => {
    const text = (sampleText || rawMessageInput).trim();
    if (!text) return;

    if (sampleText) {
      setRawMessageInput(sampleText);
    }

    setAnalyzingMessage(true);
    setMessageAnalysis(null);

    try {
      const res = await apiService.analyzeSuspiciousMessage(text);
      if (res.success && res.analysis) {
        setMessageAnalysis(res.analysis);
      }
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setAnalyzingMessage(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        const cleanText = text.replace(/[*_#`[\]()]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const sampleQuestions = [
    {
      title: 'WhatsApp Advance UPI Scam',
      query: 'WhatsApp-ல ₹500 courier advance கேட்டாங்க. அவங்க போலி கூரியர் ரசீது அனுப்பியிருக்காங்க. இது மோசடியா?'
    },
    {
      title: 'Lost Money on GPay / Cybercrime 1930',
      query: 'GPay-ல ₹2500 அனுப்பி ஏமாந்துட்டேன். செல்லர் என்னை Block பண்ணிட்டார். என்ன பண்றது?'
    },
    {
      title: 'QR Code Refund Trap',
      query: 'பணம் திருப்பி தர்றோம்னு QR Code scan பண்ண சொல்றாங்க. Scan பண்ணா பணம் வருமா?'
    },
    {
      title: 'DTDC Customs Clearance Fee',
      query: 'DTDC Courier-ல parcel மாட்டிருச்சு ₹1999 customs கட்டணும்னு சொல்றாங்க. Real-ஆ?'
    }
  ];

  const sampleSuspiciousMessages = [
    {
      label: 'Instagram Direct WhatsApp Deal',
      text: 'Dear customer, your Nike Air Jordan order is booked! Please pay ₹450 shipping advance on GPay: nikedeals@okaxis. Balance ₹999 on Cash on Delivery. Offer valid for 15 mins only!'
    },
    {
      label: 'Fake Customs Clearance SMS',
      text: 'URGENT: Your international DTDC parcel #IN9847291 is on hold at airport hub due to pending clearance. Pay ₹1,499 immediately to release parcel or legal notice will be issued. Link: http://dtdc-hub-clearance.top/pay'
    },
    {
      label: 'QR Code Receive Payment Trap',
      text: 'Sir I am sending ₹3,000 for your OLX item. Please scan this PhonePe QR code and enter your UPI PIN to accept the credit into your bank account immediately.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-900/50 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-700/60 text-blue-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                Gemini 3.7 AI Scam Defense Specialist
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                <span>SafeCart AI ஆலோசகர்</span>
                <span className="text-sm font-mono font-normal text-blue-400 bg-blue-950/80 px-2.5 py-1 rounded-lg border border-blue-800/60">
                  Tamil & English Copilot
                </span>
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                மோசடி சந்தேகங்கள், போலி வாட்ஸ்அப் மெசேஜ்கள், இன்ஸ்டாகிராம் டீல்கள் மற்றும் சைபர் குற்ற மீட்பு (1930) பற்றிய உடனடி AI ஆலோசனை.
              </p>
            </div>

            {/* Quick Cyber Helpline Card */}
            <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-4 shrink-0 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <PhoneCall className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-red-300 uppercase tracking-wider">
                  Emergency Cyber Helpline
                </div>
                <div className="text-xl font-black text-white tracking-wider flex items-center gap-2">
                  <span>1930</span>
                  <span className="text-xs font-normal text-slate-400">(Toll-Free)</span>
                </div>
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1 mt-0.5"
                >
                  cybercrime.gov.in <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-800/80">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>AI Chat Assistant (AI-கிட்ட கேளுங்க)</span>
            </button>
            <button
              onClick={() => setActiveTab('message-auditor')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'message-auditor'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileSearch className="w-4 h-4" />
              <span>Message & Chat Auditor (மெசேஜ் பரிசோதனை)</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Conversational AI Fraud Copilot */}
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left Sidebar: Quick Prompts & Safety Guidelines */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Quick Questions / உடனடி கேள்விகள்</span>
                </div>
                <div className="space-y-2">
                  {sampleQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q.query)}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-950/60 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-700/50 text-xs text-slate-300 hover:text-blue-300 transition group cursor-pointer"
                    >
                      <div className="font-bold text-white group-hover:text-blue-400 flex items-center justify-between">
                        <span>{q.title}</span>
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                        {q.query}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Instant Safety Rules */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs text-slate-300">
                <div className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Golden Safety Rules</span>
                </div>
                <ul className="space-y-2 text-[11px] text-slate-400 list-disc list-inside">
                  <li><strong className="text-slate-200">QR Code:</strong> Never enter UPI PIN to receive money. PIN is only for sending.</li>
                  <li><strong className="text-slate-200">Courier Advance:</strong> Don't pay shipping charges on WhatsApp for COD orders.</li>
                  <li><strong className="text-slate-200">1930 Helpline:</strong> Report within 2 hours of payment for highest recovery rate.</li>
                </ul>
              </div>
            </div>

            {/* Main Chat Interface */}
            <div className="lg:col-span-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col h-[650px] overflow-hidden shadow-xl">
              
              {/* Chat Messages Log */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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
                      className={`max-w-[85%] rounded-2xl p-4 space-y-3 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20'
                          : 'bg-slate-950 border border-slate-800/80 rounded-bl-none text-slate-200 shadow-md'
                      }`}
                    >
                      {/* Assistant Header Tag */}
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
                              {isSpeaking ? (
                                <VolumeX className="w-3.5 h-3.5 text-blue-400" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => copyToClipboard(msg.content, index)}
                              title="Copy text"
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            >
                              {copiedIndex === index ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Main Message Text */}
                      <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed space-y-2">
                        {msg.content}
                      </div>

                      {/* Recommended Steps Box */}
                      {msg.recommendedSteps && msg.recommendedSteps.length > 0 && (
                        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1.5 mt-2">
                          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            <span>Action Checklist:</span>
                          </div>
                          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                            {msg.recommendedSteps.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Suggested Followups */}
                      {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Suggested Next Questions:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.suggestedFollowUps.map((fu, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSendMessage(fu)}
                                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-blue-950/60 border border-slate-800 hover:border-blue-700/50 text-blue-300 transition text-left cursor-pointer"
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
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                      <span>SafeCart AI is analyzing threat indicators & compiling advice...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-4 bg-slate-950 border-t border-slate-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    placeholder="Ask about suspicious WhatsApp deals, fake courier slips, UPI recovery in Tamil/English..."
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
                  />
                  <button
                    type="submit"
                    disabled={loading || !inputPrompt.trim()}
                    className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-lg shadow-blue-600/30 cursor-pointer"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
                  <span>Supported: Tamil, Tanglish, & English</span>
                  <Link to="/social-scanner" className="text-pink-400 hover:underline">
                    Scan Instagram Profile & WhatsApp Number →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Suspicious Message & Offer Text Auditor */}
        {activeTab === 'message-auditor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Input Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <FileSearch className="w-4 h-4 text-purple-400" />
                    <span>Paste Suspicious Message / WhatsApp Chat</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    உங்களுக்கு வந்த SMS, WhatsApp ஆஃபர், அல்லது Instagram DM மெசேஜை இங்கே பேஸ்ட் செய்து உடனடியாக பரிசோதிக்கவும்.
                  </p>
                </div>

                <textarea
                  value={rawMessageInput}
                  onChange={(e) => setRawMessageInput(e.target.value)}
                  rows={6}
                  placeholder="Paste raw SMS text, WhatsApp chat, courier clearance request, or deal message here..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition"
                />

                <button
                  onClick={() => handleAuditMessage()}
                  disabled={analyzingMessage || !rawMessageInput.trim()}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  {analyzingMessage ? (
                    <>
                      <Bot className="w-4 h-4 animate-spin" />
                      <span>Auditing Threat Signals...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Run Deep AI Message Audit</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sample Presets to try */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Test with Sample Scam Messages:
                </div>
                <div className="space-y-2">
                  {sampleSuspiciousMessages.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAuditMessage(sample.text)}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-950/60 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-700/50 text-xs transition group cursor-pointer"
                    >
                      <div className="font-bold text-purple-300 group-hover:text-purple-200">
                        {sample.label}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-mono">
                        "{sample.text}"
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Output Column: Structured Audit Results */}
            <div className="lg:col-span-7">
              {messageAnalysis ? (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
                  
                  {/* Score & Verdict Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Threat Classification
                      </div>
                      <div className="text-xl font-black text-white mt-0.5 flex items-center gap-2">
                        {messageAnalysis.isLikelyScam ? (
                          <ShieldAlert className="w-6 h-6 text-red-500" />
                        ) : (
                          <ShieldCheck className="w-6 h-6 text-emerald-500" />
                        )}
                        <span>{messageAnalysis.scamCategory}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Risk Score
                        </div>
                        <div
                          className={`text-2xl font-black ${
                            messageAnalysis.riskScore >= 70
                              ? 'text-red-400'
                              : messageAnalysis.riskScore >= 40
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {messageAnalysis.riskScore}/100
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider border ${
                          messageAnalysis.threatLevel === 'VERY HIGH' || messageAnalysis.threatLevel === 'HIGH'
                            ? 'bg-red-950/80 text-red-300 border-red-800'
                            : messageAnalysis.threatLevel === 'MEDIUM'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                            : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        }`}
                      >
                        {messageAnalysis.threatLevel} RISK
                      </div>
                    </div>
                  </div>

                  {/* Dual Language Verdicts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
                      <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5" />
                        <span>தமிழ் தீர்ப்பு (Tamil Verdict)</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-medium">
                        {messageAnalysis.verdictTamil}
                      </p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
                      <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5" />
                        <span>English Assessment</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-medium">
                        {messageAnalysis.verdictEnglish}
                      </p>
                    </div>
                  </div>

                  {/* Detected Red Flags */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Detected Scam Signals & Red Flags ({messageAnalysis.redFlags.length})</span>
                    </div>
                    <div className="space-y-2">
                      {messageAnalysis.redFlags.map((flag, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/30 border border-red-900/50 text-xs text-red-200"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                          <span>{flag}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Indicator Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    <div
                      className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                        messageAnalysis.detectedIndicators.fakeUrgency
                          ? 'bg-red-950/40 border-red-800/80 text-red-300'
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current" />
                      <span>Fake Urgency Pressure</span>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                        messageAnalysis.detectedIndicators.advancePaymentDemand
                          ? 'bg-red-950/40 border-red-800/80 text-red-300'
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current" />
                      <span>Advance UPI Demand</span>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                        messageAnalysis.detectedIndicators.offPlatformRedirection
                          ? 'bg-red-950/40 border-red-800/80 text-red-300'
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current" />
                      <span>Off-Platform Redirection</span>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                        messageAnalysis.detectedIndicators.fakeCourierOrCustoms
                          ? 'bg-red-950/40 border-red-800/80 text-red-300'
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current" />
                      <span>Customs / Holding Charge</span>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                        messageAnalysis.detectedIndicators.unrealisticDiscount
                          ? 'bg-red-950/40 border-red-800/80 text-red-300'
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current" />
                      <span>Unrealistic 90% Discount</span>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                        messageAnalysis.detectedIndicators.phishingLink
                          ? 'bg-red-950/40 border-red-800/80 text-red-300'
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current" />
                      <span>Suspicious / Phishing Link</span>
                    </div>
                  </div>

                  {/* Immediate Safety Checklist */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Recommended Safety Steps</span>
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                      {messageAnalysis.recommendedActions.map((action, idx) => (
                        <li key={idx}>{action}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Report action */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-slate-400">
                      Did you experience financial loss from this message?
                    </div>
                    <Link
                      to="/report"
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-md shadow-red-600/30"
                    >
                      Submit Community Report
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-3 h-full flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-purple-950/60 border border-purple-800/50 flex items-center justify-center text-purple-400">
                    <FileSearch className="w-8 h-8" />
                  </div>
                  <div className="text-base font-bold text-white">
                    No Message Audited Yet
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Paste any suspicious text, SMS, or WhatsApp deal on the left or choose a sample to inspect the fraud risk score and warning signals.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
