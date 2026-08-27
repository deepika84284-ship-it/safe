import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import {
  ShieldCheck,
  Search,
  AlertTriangle,
  Lock,
  Globe,
  FileText,
  CreditCard,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  RefreshCcw,
  Instagram,
  Phone
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { error } = useToast();
  const { language } = useLanguage();

  const [urlInput, setUrlInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);

  const scanSteps = language === 'ta' ? [
    { title: 'URL சரிபார்ப்பு மற்றும் SSRF பாதுகாப்பு வடிகட்டி', icon: Lock },
    { title: 'TLS / SSL சான்றிதழ் மற்றும் குறியாக்கம் ஆய்வு', icon: Globe },
    { title: 'வணிகத் தகவல்கள் & திரும்பப் பெறும் பாலிசி சோதனை', icon: FileText },
    { title: 'சமூக மோசடி புகார்கள் & போலி டொமைன் ஒப்பீடு', icon: Users },
    { title: 'பாதுகாப்பு அல்காரிதம் மூலம் இறுதி மதிப்பீடு கணக்கீடு', icon: ShieldCheck }
  ] : [
    { title: 'Normalizing URL & Running SSRF Security Filters', icon: Lock },
    { title: 'Evaluating TLS / SSL Cryptographic Certificates', icon: Globe },
    { title: 'Parsing Merchant Disclosures & Refund Policies', icon: FileText },
    { title: 'Cross-referencing Community Fraud Reports & TypoSquatting', icon: Users },
    { title: 'Computing Weighted Deterministic Risk Score', icon: ShieldCheck }
  ];

  const executeScan = async (targetUrl: string) => {
    if (!targetUrl.trim()) {
      setScanError(language === 'ta' ? 'தயவுசெய்து சோதிக்க வேண்டிய இணையதள முகவரியை உள்ளிடவும்.' : 'Please enter a website URL to scan.');
      return;
    }

    const trimmed = targetUrl.trim().toLowerCase();

    // Check if user input is an Instagram handle or WhatsApp number
    if (trimmed.startsWith('@') || trimmed.includes('instagram.com/')) {
      navigate(`/social-scanner?handle=${encodeURIComponent(targetUrl.trim())}`);
      return;
    }
    if (trimmed.includes('wa.me/') || trimmed.startsWith('+91') || (/^\d{10}$/.test(trimmed.replace(/\s+/g, '')))) {
      navigate(`/social-scanner?phone=${encodeURIComponent(targetUrl.trim())}`);
      return;
    }

    if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('file:')) {
      setScanError(language === 'ta' ? 'தவறான முகவரி. HTTP மற்றும் HTTPS மட்டுமே அனுமதிக்கப்படும்.' : 'Invalid protocol. Only HTTP and HTTPS URLs are permitted.');
      return;
    }

    if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1')) {
      setScanError('Scanning localhost or private IP addresses is blocked by SSRF protection.');
      return;
    }

    setScanError(null);
    setIsScanning(true);
    setScanStep(0);

    // Step simulation
    const interval = setInterval(() => {
      setScanStep((prev) => (prev < scanSteps.length - 1 ? prev + 1 : prev));
    }, 450);

    try {
      const res = await api.scanWebsite(targetUrl);
      clearInterval(interval);
      if (res.success && res.scan) {
        navigate(`/scan/${res.scan.id}`);
      } else {
        setScanError(res.message || 'Scan failed.');
        setIsScanning(false);
      }
    } catch (err: any) {
      clearInterval(interval);
      const msg = err.response?.data?.message || (language === 'ta' ? 'இணையதளத்தை சோதிக்க முடியவில்லை. URL-ஐ சரிபார்க்கவும்.' : 'Unable to scan this website right now. Please check the URL.');
      setScanError(msg);
      error(language === 'ta' ? 'சோதனை தோல்வியடைந்தது' : 'Scan Failed', msg);
      setIsScanning(false);
    }
  };

  useEffect(() => {
    const urlFromParam = searchParams.get('url');
    if (urlFromParam) {
      setUrlInput(urlFromParam);
      executeScan(urlFromParam);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeScan(urlInput);
  };

  const sampleTargets = language === 'ta' ? [
    { name: 'Amazon (அங்கீகரிக்கப்பட்ட சந்தை)', url: 'amazon.com' },
    { name: 'Nike (அதிகாரப்பூர்வ கடை)', url: 'nike.com' },
    { name: 'Mega Discounts Outlet (சந்தேகத்திற்குரிய .shop)', url: 'mega-discounts-direct88.shop' },
    { name: 'Official Nike Outlet (போலி குளோன் தளம் .xyz)', url: 'official-nike-sale-outlet.xyz' },
    { name: 'Luxury Watches Clearance (.top மோசடி தளம்)', url: 'luxury-watches-clearance.top' },
    { name: 'Artisan Crafts Studio (சுயாதீன பூட்டிக் கடை)', url: 'artisan-crafts-studio.net' }
  ] : [
    { name: 'Amazon (Authentic Marketplace)', url: 'amazon.com' },
    { name: 'Nike (Official Store)', url: 'nike.com' },
    { name: 'Mega Discounts Outlet (Suspicious .shop)', url: 'mega-discounts-direct88.shop' },
    { name: 'Official Nike Outlet (Deceptive Cloned .xyz)', url: 'official-nike-sale-outlet.xyz' },
    { name: 'Luxury Watches Clearance (.top Scam)', url: 'luxury-watches-clearance.top' },
    { name: 'Artisan Crafts Studio (Independent Boutique)', url: 'artisan-crafts-studio.net' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-[0.2em]">
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'இணையதள பாதுகாப்பு பகுப்பாய்வு' : 'URL Safety Analysis Engine'}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
            {language === 'ta' ? 'இணையதள கடை பாதுகாப்பு ஸ்கேனர்' : 'Store Safety Scanner'}
          </h1>
          <p className="text-sm text-slate-300 max-w-xl mx-auto font-medium">
            {language === 'ta'
              ? 'எந்தவொரு ஆன்லைன் ஷாப்பிங் தளம் அல்லது தயாரிப்பு இணைப்பையும் உள்ளிட்டு அதன் உண்மைத்தன்மை மற்றும் ஆபத்து அளவை உடனே சோதிக்கவும்.'
              : 'Enter any e-commerce domain or product checkout link to inspect risk indicators, verified fraud reports, and merchant safety signals.'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <button
              type="button"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 text-white shadow-lg shadow-blue-600/30"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'இணையதள டொமைன் ஸ்கேன்' : 'Website Domain Scan'}</span>
            </button>
            <Link
              to="/social-scanner"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-pink-400 hover:text-pink-300 hover:bg-pink-950/40 transition"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'Instagram / WhatsApp ஷீல்டு' : 'Instagram / WhatsApp Shield'}</span>
            </Link>
          </div>
        </div>

        {/* Scanner Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-200 uppercase tracking-widest mb-2">
                {language === 'ta' ? 'இணையதள முகவரி அல்லது டொமைன்' : 'Website Domain or Product URL'}
              </label>
              <div className="relative flex items-center">
                <Search className="w-5 h-5 text-slate-400 absolute left-4" />
                <input
                  type="text"
                  value={urlInput}
                  disabled={isScanning}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={language === 'ta' ? 'https://example-shopping-site.com அல்லது store.com' : 'https://example-shopping-site.com'}
                  className="w-full pl-12 pr-36 py-4 rounded-2xl bg-slate-950 border-2 border-slate-700 text-white placeholder-slate-500 font-mono font-medium text-sm focus:outline-none focus:border-blue-500 transition disabled:opacity-50"
                  required
                />
                <button
                  type="submit"
                  disabled={isScanning}
                  className="absolute right-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
                >
                  {isScanning ? (
                    <>
                      <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>{language === 'ta' ? 'சோதிக்கிறது...' : 'Scanning...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{language === 'ta' ? 'ஸ்கேன்' : 'Scan'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {scanError && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5 animate-in fade-in font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{scanError}</span>
              </div>
            )}
          </form>

          {/* Active Scanning Animation Steps */}
          {isScanning && (
            <div className="mt-8 pt-6 border-t border-slate-800 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  {language === 'ta' ? 'வலைத்தள பாதுகாப்பு காரணிகள் ஆய்வு செய்யப்படுகின்றன...' : 'Analyzing website characteristics...'}
                </div>
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                  {language === 'ta' ? `படி ${scanStep + 1} / ${scanSteps.length}` : `Step ${scanStep + 1} of ${scanSteps.length}`}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${((scanStep + 1) / scanSteps.length) * 100}%` }}
                />
              </div>

              {/* Step list */}
              <div className="grid grid-cols-1 gap-2 pt-2">
                {scanSteps.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isDone = idx < scanStep;
                  const isCurrent = idx === scanStep;
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs flex items-center gap-3 transition-all ${
                        isDone
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                          : isCurrent
                          ? 'bg-blue-950/40 border-blue-500/50 text-blue-200 shadow-md font-semibold'
                          : 'bg-slate-950/40 border-slate-800 text-slate-500'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : isCurrent ? (
                        <RefreshCcw className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                      ) : (
                        <StepIcon className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      <span className="font-semibold">{step.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quick Sample Websites Grid */}
        <div className="space-y-3">
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
            {language === 'ta' ? 'உதாரண சோதனைகள்:' : 'Sample Store Inspections:'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {sampleTargets.map((item, idx) => (
              <button
                key={idx}
                disabled={isScanning}
                onClick={() => {
                  setUrlInput(item.url);
                  executeScan(item.url);
                }}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-left transition hover:bg-slate-800/80 group cursor-pointer"
              >
                <div className="font-mono text-xs font-bold text-slate-200 group-hover:text-blue-400 truncate">
                  {item.url}
                </div>
                <div className="text-[11px] font-medium text-slate-400 truncate mt-0.5">{item.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Pre-Scan Security Tips */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-2">
          <div className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-400" />
            <span>{language === 'ta' ? 'பாதுகாப்பு மற்றும் தனிநபர் தரவு பாதுகாப்பு' : 'Security & Privacy Protocols'}</span>
          </div>
          <p className="text-slate-400 leading-relaxed font-medium">
            {language === 'ta'
              ? 'SafeCart பாதுகாப்பான சர்வர் பக்க SSRF-பாதுகாக்கப்பட்ட ஸ்கேனரை பயன்படுத்துகிறது. உங்கள் IP முகவரியோ அல்லது தனிப்பட்ட விவரங்களோ இலக்கு வலைத்தளத்துடன் பகிரப்படாது.'
              : 'SafeCart uses a strict server-side SSRF-protected scanner. Scanning does not notify the merchant, nor does it share your IP address or identity with the target domain.'}
          </p>
        </div>
      </div>
    </div>
  );
};
