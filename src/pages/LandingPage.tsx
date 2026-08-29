import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  AlertTriangle,
  FileCheck2,
  Users,
  ShieldAlert,
  ArrowRight,
  Lock,
  ExternalLink,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Bot,
  MessageSquare,
  Briefcase
} from 'lucide-react';
import { RiskGauge } from '../components/RiskGauge';
import { AiDoubtChatBox } from '../components/AiDoubtChatBox';
import { useLanguage } from '../context/LanguageContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [urlInput, setUrlInput] = useState('');

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    navigate(`/scanner?url=${encodeURIComponent(urlInput.trim())}`);
  };

  const sampleTargets = language === 'ta' ? [
    { label: 'அங்கீகரிக்கப்பட்ட கடை (Nike)', url: 'nike.com', safe: true },
    { label: 'நம்பகமான தளம் (Amazon)', url: 'amazon.com', safe: true },
    { label: 'சந்தேகத்திற்குரிய தளம் (.shop)', url: 'mega-discounts-direct88.shop', safe: false },
    { label: 'போலி பிராண்ட் (.xyz)', url: 'official-nike-sale-outlet.xyz', safe: false }
  ] : [
    { label: 'Authentic Retailer (Nike)', url: 'nike.com', safe: true },
    { label: 'Major Marketplace (Amazon)', url: 'amazon.com', safe: true },
    { label: 'Suspicious Cheap Shop (.shop)', url: 'mega-discounts-direct88.shop', safe: false },
    { label: 'Cloned Brand Typosquat (.xyz)', url: 'official-nike-sale-outlet.xyz', safe: false }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-20 md:pt-24 md:pb-28 border-b border-slate-800">
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.18),rgba(255,255,255,0))] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-[0.2em] animate-in fade-in">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>{t('hero.badge')}</span>
          </div>

          {/* Primary Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter leading-tight max-w-4xl mx-auto uppercase">
            {t('hero.title1')}{' '}
            <span className="text-blue-500 underline decoration-blue-500/40 decoration-4">
              {t('hero.title2')}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            {t('hero.desc')}
          </p>

          {/* Main URL Scanner Box */}
          <div className="pt-4 max-w-2xl mx-auto" id="hero-scanner-box">
            <form
              onSubmit={handleScanSubmit}
              className="p-2 rounded-2xl bg-slate-900 border-2 border-slate-700 focus-within:border-blue-500 shadow-2xl backdrop-blur-xl transition-all flex flex-col sm:flex-row gap-2"
            >
              <div className="relative flex-1 flex items-center pl-3">
                <Search className="w-5 h-5 text-slate-400 shrink-0 mr-2.5" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={t('hero.inputPlaceholder')}
                  className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none font-mono font-medium"
                  required
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <span>{t('hero.scanNow')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Target Chips */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                {language === 'ta' ? 'உதாரண தளங்கள்:' : 'Sample Inspections:'}
              </span>
              {sampleTargets.map((target, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setUrlInput(target.url);
                    navigate(`/scanner?url=${encodeURIComponent(target.url)}`);
                  }}
                  className={`px-3 py-1 rounded-lg border text-[11px] font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    target.safe
                      ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-emerald-500 hover:text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-red-500 hover:text-red-400'
                  }`}
                >
                  <span className={target.safe ? 'text-emerald-400' : 'text-red-400'}>●</span>
                  {target.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/gpay-escrow"
              className="px-4 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60 hover:text-emerald-200 text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-emerald-950/40"
            >
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>{t('nav.gpayEscrow')}</span>
            </Link>

            <Link
              to="/social-scanner"
              className="px-4 py-2.5 rounded-xl bg-pink-950/80 border border-pink-500/50 text-pink-300 hover:bg-pink-900/60 hover:text-pink-200 text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-pink-950/40"
            >
              <ShieldAlert className="w-4 h-4 text-pink-400" />
              <span>{t('hero.instaScan')}</span>
            </Link>

            <a
              href="#ai-doubt-chat"
              className="px-4 py-2.5 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-300 hover:bg-purple-900/60 hover:text-purple-200 text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-purple-950/40"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>{t('hero.aiDoubtBtn')}</span>
            </a>
          </div>

          {/* Checklist Badges */}
          <div className="pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-black uppercase tracking-wider text-slate-300">
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{language === 'ta' ? 'ஆபத்து மதிப்பீடு' : 'Risk Analysis'}</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{language === 'ta' ? 'மோசடி புகார் பதிவேடு' : 'Scam Complaints'}</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{language === 'ta' ? 'போலி தளம் தடுப்பு' : 'Typosquat Filter'}</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{language === 'ta' ? '1930 சைபர் உதவி' : '1930 Helpline'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Sample Threat Inspection Showcase */}
      <section className="py-16 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="text-blue-500 text-xs font-black uppercase tracking-[0.2em]">
              {language === 'ta' ? 'தானியங்கி பாதுகாப்பு ஆய்வு' : 'Autonomous Risk Engine'}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
              {language === 'ta' ? 'போலி தளம் vs அசல் தளம் ஒப்பீடு' : 'Live Threat Intelligence'}
            </h2>
            <p className="text-sm text-slate-400">
              {language === 'ta'
                ? 'SafeCart எப்படி போலி தள்ளுபடி வலைத்தளங்களை நொடிகளில் கண்டறிகிறது என்பதை பாருங்கள்.'
                : 'See how SafeCart decomposes suspicious URLs vs legitimate merchants across cryptographic, domain, and consumer vectors.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Example 1: High Risk Result Preview */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-red-500/40 relative flex flex-col justify-between shadow-xl">
              <div className="absolute top-5 right-5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-black uppercase tracking-widest">
                {language === 'ta' ? 'அதிக ஆபத்து' : 'Threat Flagged'}
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  {language === 'ta' ? 'போலி தளம் மாதிரி:' : 'Simulated Target:'}
                </div>
                <div className="text-lg font-black text-red-300 font-mono tracking-tight">mega-discounts-direct88.shop</div>

                <div className="mt-6 flex items-center justify-around py-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <RiskGauge score={88} level="VERY HIGH" confidence="HIGH" size="sm" showDetails={false} />
                  <div className="space-y-1 text-right sm:text-left">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                      {language === 'ta' ? 'ஆபத்து நிலை' : 'Risk Assessment'}
                    </div>
                    <div className="text-3xl font-black text-red-400 tracking-tight font-mono">88 / 100</div>
                    <div className="inline-block px-2.5 py-0.5 rounded bg-red-500/20 text-red-400 text-xs font-black uppercase tracking-wider">
                      {language === 'ta' ? 'கடுமையான ஆபத்து' : 'VERY HIGH RISK'}
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/60 flex items-start gap-2.5 text-red-200">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>
                      {language === 'ta'
                        ? 'புதிய டொமைன் (7 நாட்களுக்கு முன் பதிவு செய்யப்பட்டது) & மறைக்கப்பட்ட WHOIS விவரங்கள்.'
                        : 'Domain registered < 30 days ago with high-risk .shop extension.'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/60 flex items-start gap-2.5 text-red-200">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>
                      {language === 'ta'
                        ? 'போலி 90% தள்ளுபடி கவுண்ட்டவுன் & அசல் நிறுவன தொடர்பு முகவரி இல்லை.'
                        : 'Fake 90% discount urgency timers & missing contact info.'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/60 flex items-start gap-2.5 text-red-200">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>
                      {language === 'ta'
                        ? 'அங்கீகரிக்கப்படாத தனிநபர் UPI பேமெண்ட் மற்றும் அட்வான்ஸ் கூரியர் கட்டணக் கோரிக்கை.'
                        : 'Unverified personal UPI payment and advance courier fee trap detected.'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-red-400 font-medium italic">
                  {language === 'ta' ? 'எச்சரிக்கை: "பணம் செலுத்த வேண்டாம்"' : 'Verdict: "DO NOT TRANSACT"'}
                </span>
                <Link
                  to="/scanner?url=mega-discounts-direct88.shop"
                  className="text-xs text-red-400 font-black uppercase tracking-wider hover:underline flex items-center gap-1"
                >
                  {language === 'ta' ? 'முழு விவரம்' : 'View Dossier'} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Example 2: Verified Low Risk Result Preview */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/40 relative flex flex-col justify-between shadow-xl">
              <div className="absolute top-5 right-5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-widest">
                {language === 'ta' ? 'பாதுகாப்பான கடை' : 'Verified Store'}
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  {language === 'ta' ? 'நம்பகமான தளம் மாதிரி:' : 'Simulated Target:'}
                </div>
                <div className="text-lg font-black text-emerald-300 font-mono tracking-tight">nike.com</div>

                <div className="mt-6 flex items-center justify-around py-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <RiskGauge score={8} level="LOW" confidence="HIGH" size="sm" showDetails={false} />
                  <div className="space-y-1 text-right sm:text-left">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                      {language === 'ta' ? 'ஆபத்து நிலை' : 'Risk Assessment'}
                    </div>
                    <div className="text-3xl font-black text-emerald-400 tracking-tight font-mono">8 / 100</div>
                    <div className="inline-block px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider">
                      {language === 'ta' ? 'குறைந்த ஆபத்து (பாதுகாப்பானது)' : 'LOW RISK'}
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/60 flex items-start gap-2.5 text-emerald-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      {language === 'ta'
                        ? '24+ ஆண்டுகள் பழமையான தளம் & அசல் TLS பாதுகாப்பு சான்றிதழ்.'
                        : 'Established domain age (24+ years) with authentic TLS cryptographic cert.'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/60 flex items-start gap-2.5 text-emerald-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      {language === 'ta'
                        ? 'வெளிப்படையான நிறுவன விவரங்கள், திரும்பப் பெறும் கொள்கை & வாடிக்கையாளர் சேவை.'
                        : 'Transparent corporate disclosures, returns policy, and customer care.'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/60 flex items-start gap-2.5 text-emerald-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      {language === 'ta'
                        ? 'அங்கீகரிக்கப்பட்ட வங்கி நுழைவாயில் & பேமெண்ட் பாதுகாப்பு.'
                        : 'Standard encrypted checkout gateway with zero dispute flags.'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium italic">
                  {language === 'ta' ? 'முடிவு: "நம்பகமான தளம்"' : 'Recommendation: "Standard precautions"'}
                </span>
                <Link
                  to="/scanner?url=nike.com"
                  className="text-xs text-emerald-400 font-black uppercase tracking-wider hover:underline flex items-center gap-1"
                >
                  {language === 'ta' ? 'முழு விவரம்' : 'View Dossier'} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive AI Doubt Solver Section */}
      <section className="py-16 bg-slate-950 border-b border-slate-800 relative overflow-hidden" id="ai-doubt-chat">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-700/60 text-purple-300 text-xs font-black uppercase tracking-[0.2em]">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>{t('doubt.badge')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
              {t('doubt.title')}
            </h2>
            <p className="text-sm text-slate-400">
              {t('doubt.desc')}
            </p>
          </div>

          <AiDoubtChatBox />
        </div>
      </section>

      {/* AI Copilot, GPay Escrow, Social Shield & Job Scam Email Scanner Spotlight */}
      <section className="py-12 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* GPay Escrow Shield Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-800/50 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  Google Pay (GPay) Escrow
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  {language === 'ta' ? 'GPay எஸ்க்ரோ பேமெண்ட்' : 'GPay Escrow Shield'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {language === 'ta'
                    ? 'இன்ஸ்டா விற்பனையாளர்களுக்கு பணம் அனுப்பும்போது எஸ்க்ரோ மூலம் பூட்டி வைக்கவும். பார்சல் வந்ததும் விடுவிக்கலாம், ஏமாற்றினால் 1-கிளிக் ரீஃபண்ட்.'
                    : 'Lock UPI payments in SafeCart Escrow Vault before paying unverified sellers. 1-Click instant auto-refunds back to GPay.'}
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] text-emerald-300">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800/60">
                    🔒 100% Escrow Protection
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800/60">
                    ⚡ 1-Click UPI Refund
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800/60">
                    🔍 VPA Anti-Fraud Scan
                  </span>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-emerald-900/30 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  {language === 'ta' ? 'பாதுகாப்பான UPI முறை' : 'Secure UPI Escrow'}
                </span>
                <Link
                  to="/gpay-escrow"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-950/40 flex items-center gap-1.5"
                >
                  <span>{language === 'ta' ? 'GPay பேமெண்ட்' : 'Open GPay Shield'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* AI Copilot Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-800/50 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950 border border-purple-700/60 text-purple-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  Gemini 3.7 AI Copilot
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  {t('spotlight.aiTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {t('spotlight.aiDesc')}
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] text-purple-300">
                  <span className="px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-800/60">
                    {language === 'ta' ? '💬 நேரடி தமிழ் அரட்டை' : '💬 Interactive Chat'}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-800/60">
                    {language === 'ta' ? '🚨 1930 வழிகாட்டுதல்' : '🚨 1930 Helpline Guide'}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-800/60">
                    {language === 'ta' ? '🔍 போலி மெசேஜ் சோதனை' : '🔍 Message Auditor'}
                  </span>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-purple-900/30 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  {language === 'ta' ? 'சந்தேகங்களை கேளுங்கள்' : 'Ask questions & audit messages'}
                </span>
                <Link
                  to="/ai-assistant"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-purple-600/30 flex items-center gap-1.5"
                >
                  <span>{t('spotlight.aiAction')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Social Shield Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-pink-950/40 via-slate-900 to-slate-950 border border-pink-800/50 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-950 border border-pink-700/60 text-pink-300 text-xs font-bold uppercase tracking-wider">
                  <ShieldAlert className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                  Instagram & WhatsApp Shield
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  {t('spotlight.socialTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {t('spotlight.socialDesc')}
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] text-pink-300">
                  <span className="px-2.5 py-1 rounded-lg bg-pink-950/80 border border-pink-800/60">
                    📸 @Handle Authenticity
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-pink-950/80 border border-pink-800/60">
                    📱 WhatsApp Blacklist
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-pink-950/80 border border-pink-800/60">
                    📦 Fake Courier Alert
                  </span>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-pink-900/30 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  {language === 'ta' ? 'இன்ஸ்டா & வாட்ஸ்அப் சோதனை' : 'Scan handles & phone numbers'}
                </span>
                <Link
                  to="/social-scanner"
                  className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-pink-600/30 flex items-center gap-1.5"
                >
                  <span>{t('spotlight.socialAction')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Job Scam Email Scanner Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-800/50 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-700/60 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                  <Briefcase className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  Job Scam Email Scanner
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  {language === 'ta' ? 'வேலைவாய்ப்பு மின்னஞ்சல் ஆய்வு' : 'Job Scam Scanner'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {language === 'ta'
                    ? 'வேலைவாய்ப்பு மின்னஞ்சல்கள் மற்றும் HR தொடர்புகளை ஆய்வு செய்து முன்பணம் கேட்கும் மோசடிகளை கண்டறியவும்.'
                    : 'Inspect job offer emails, recruitment letters, sender domains, and interview requests for registration fee traps.'}
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] text-cyan-300">
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-800/60">
                    📧 Email & Domain Audit
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-800/60">
                    💰 Advance Fee Detector
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-800/60">
                    🏢 HR Impersonation Shield
                  </span>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-cyan-900/30 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  {language === 'ta' ? 'வேலைவாய்ப்பு சோதனை' : 'Audit job offers'}
                </span>
                <Link
                  to="/job-scam-scanner"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-cyan-600/30 flex items-center gap-1.5"
                >
                  <span>{language === 'ta' ? 'சோதிக்க' : 'Scan Job Email'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Protection Features */}
      <section className="py-16 bg-slate-900/40 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="text-blue-500 text-xs font-black uppercase tracking-[0.2em]">
              {language === 'ta' ? 'பாதுகாப்பு கட்டமைப்பு' : 'Security Architecture'}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
              {t('features.title')}
            </h2>
            <p className="text-sm text-slate-400">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                {t('features.domainAnalysis')}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                {t('features.domainAnalysisDesc')}
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                {t('features.threatDb')}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                {t('features.threatDbDesc')}
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                {t('features.upiDefense')}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                {t('features.upiDefenseDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Bar */}
      <section className="py-14 bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            {language === 'ta'
              ? 'நீங்கள் சோதிக்க விரும்பும் கடை அல்லது இணையதளம் உள்ளதா?'
              : 'Have a store or deal you want to verify?'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            {language === 'ta'
              ? 'SafeCart தளத்தை பயன்படுத்தி சில நொடிகளில் போலி மோசடிகளை கண்டறியுங்கள். இலவசமாகவும், கூடுதல் மென்பொருள் இன்றியும் இயங்கும்.'
              : 'Scan it instantly with SafeCart’s high-speed threat detection engine. Zero browser extension needed.'}
          </p>
          <div className="pt-3 flex flex-wrap justify-center gap-3">
            <Link
              to="/scanner"
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              {language === 'ta' ? 'இணையதள ஸ்கேனரை திறக்க' : 'Open Website Scanner'}
            </Link>
            <Link
              to="/safety-tips"
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm uppercase tracking-wider transition cursor-pointer"
            >
              {language === 'ta' ? 'பாதுகாப்பு குறிப்புகள்' : 'Read Safety Tips'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
