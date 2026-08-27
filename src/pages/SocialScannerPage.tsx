import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  InstagramAnalysisResult,
  WhatsAppAnalysisResult,
  CrossPlatformAnalysisResult
} from '../types';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Instagram,
  Phone,
  Layers,
  ExternalLink,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  RefreshCcw,
  QrCode,
  AlertCircle,
  Database,
  Clock,
  Info
} from 'lucide-react';

export const SocialScannerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'INSTAGRAM' | 'WHATSAPP' | 'CROSS_PLATFORM'>('INSTAGRAM');
  const [query, setQuery] = useState('');
  const [whatsappQuery, setWhatsappQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const [instaResult, setInstaResult] = useState<InstagramAnalysisResult | null>(null);
  const [waResult, setWaResult] = useState<WhatsAppAnalysisResult | null>(null);
  const [crossResult, setCrossResult] = useState<CrossPlatformAnalysisResult | null>(null);

  const [threats, setThreats] = useState<{
    instagramThreats: any[];
    whatsAppThreats: any[];
  }>({
    instagramThreats: [],
    whatsAppThreats: []
  });

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    platform: 'INSTAGRAM' as 'INSTAGRAM' | 'WHATSAPP' | 'CROSS_PLATFORM',
    identifier: '',
    whatsAppNumber: '',
    upiId: '',
    financialLossAmount: '',
    evidenceText: '',
    reporterName: '',
    reporterEmail: ''
  });
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    loadThreats();
    const handleParam = searchParams.get('handle') || searchParams.get('insta');
    const waParam = searchParams.get('phone') || searchParams.get('wa');

    if (handleParam && waParam) {
      setActiveTab('CROSS_PLATFORM');
      setQuery(handleParam);
      setWhatsappQuery(waParam);
      runCrossPlatformScan(handleParam, waParam);
    } else if (handleParam) {
      setActiveTab('INSTAGRAM');
      setQuery(handleParam);
      runInstagramScan(handleParam);
    } else if (waParam) {
      setActiveTab('WHATSAPP');
      setQuery(waParam);
      runWhatsAppScan(waParam);
    }
  }, [searchParams]);

  const loadThreats = async () => {
    try {
      const res = await api.getSocialThreats();
      if (res.success) {
        setThreats(res.threats);
      }
    } catch {
      // quiet fallback
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'CROSS_PLATFORM') {
      if (!query.trim() || !whatsappQuery.trim()) {
        error('Missing Input', 'Please provide both Instagram username and WhatsApp number.');
        return;
      }
      await runCrossPlatformScan(query.trim(), whatsappQuery.trim());
    } else if (activeTab === 'INSTAGRAM') {
      if (!query.trim()) return;
      await runInstagramScan(query.trim());
    } else {
      if (!query.trim()) return;
      await runWhatsAppScan(query.trim());
    }
  };

  const runInstagramScan = async (target: string) => {
    setLoading(true);
    setInstaResult(null);
    setCrossResult(null);
    try {
      const res = await api.scanInstagram(target);
      if (res.success) {
        setInstaResult(res.analysis);
        success('Instagram Audit Completed', `Analyzed profile: @${res.analysis.handle}`);
      }
    } catch (err: any) {
      error('Scan Failed', err.response?.data?.message || 'Failed to scan Instagram profile.');
    } finally {
      setLoading(false);
    }
  };

  const runWhatsAppScan = async (target: string) => {
    setLoading(true);
    setWaResult(null);
    setCrossResult(null);
    try {
      const res = await api.scanWhatsApp(target);
      if (res.success) {
        setWaResult(res.analysis);
        success('WhatsApp Threat Audit Complete', `Scanned phone number: ${res.analysis.formattedNumber}`);
      }
    } catch (err: any) {
      error('Scan Failed', err.response?.data?.message || 'Failed to scan WhatsApp number.');
    } finally {
      setLoading(false);
    }
  };

  const runCrossPlatformScan = async (instagram: string, whatsapp: string) => {
    setLoading(true);
    setInstaResult(null);
    setWaResult(null);
    setCrossResult(null);
    try {
      const res = await api.scanCrossPlatform(instagram, whatsapp);
      if (res.success) {
        setCrossResult(res.analysis);
        success('Cross-Platform Correlation Complete', `Audited @${instagram} & ${whatsapp}`);
      }
    } catch (err: any) {
      error('Scan Failed', err.response?.data?.message || 'Failed to perform cross-platform audit.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTest = (type: 'INSTAGRAM' | 'WHATSAPP', val: string) => {
    setActiveTab(type);
    setQuery(val);
    if (type === 'INSTAGRAM') {
      runInstagramScan(val);
    } else {
      runWhatsAppScan(val);
    }
  };

  const handleSubmitSocialReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.identifier || !reportForm.evidenceText) {
      error('Missing Info', 'Please provide the account ID/number and incident details.');
      return;
    }

    setSubmittingReport(true);
    try {
      const res = await api.reportSocialScam({
        platform: reportForm.platform,
        identifier: reportForm.identifier,
        whatsAppNumber: reportForm.whatsAppNumber || undefined,
        upiId: reportForm.upiId || undefined,
        financialLossAmount: reportForm.financialLossAmount ? Number(reportForm.financialLossAmount) : undefined,
        evidenceText: reportForm.evidenceText,
        reporterName: reportForm.reporterName || undefined,
        reporterEmail: reportForm.reporterEmail || undefined
      });

      if (res.success) {
        success('Report Registered', 'Thank you! Threat added to community threat registry.');
        setShowReportModal(false);
        setReportForm({
          platform: 'INSTAGRAM',
          identifier: '',
          whatsAppNumber: '',
          upiId: '',
          financialLossAmount: '',
          evidenceText: '',
          reporterName: '',
          reporterEmail: ''
        });
        loadThreats();
      }
    } catch (err: any) {
      error('Report Failed', err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED_SAFE':
        return {
          bg: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400',
          dot: 'bg-emerald-400',
          label: '🟢 VERIFIED SAFE (Official Brand)',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />
        };
      case 'LOW_RISK':
      case 'LOW':
        return {
          bg: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400',
          dot: 'bg-emerald-400',
          label: '🟢 LOW RISK',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />
        };
      case 'MEDIUM_RISK':
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-950/80 border-yellow-500/40 text-yellow-400',
          dot: 'bg-yellow-400',
          label: '🟡 MEDIUM RISK (Caution)',
          icon: <AlertTriangle className="w-4 h-4 text-yellow-400" />
        };
      case 'HIGH_RISK':
      case 'HIGH':
        return {
          bg: 'bg-orange-950/80 border-orange-500/40 text-orange-400',
          dot: 'bg-orange-400',
          label: '🟠 HIGH RISK (Suspicious Patterns)',
          icon: <AlertCircle className="w-4 h-4 text-orange-400" />
        };
      case 'CONFIRMED_FRAUD':
      case 'CONFIRMED_SCAM':
      case 'VERY HIGH':
        return {
          bg: 'bg-red-950/80 border-red-500/40 text-red-400',
          dot: 'bg-red-400',
          label: '🔴 CONFIRMED FRAUD (Blacklisted)',
          icon: <ShieldAlert className="w-4 h-4 text-red-400" />
        };
      case 'UNABLE_TO_VERIFY':
      default:
        return {
          bg: 'bg-slate-900 border-slate-700 text-slate-300',
          dot: 'bg-slate-400',
          label: '⚪ UNABLE TO VERIFY (No Fraud Reports)',
          icon: <HelpCircle className="w-4 h-4 text-slate-400" />
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Title */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-pink-950/80 via-purple-950/80 to-emerald-950/80 border border-pink-500/30 text-[11px] font-black uppercase tracking-widest text-pink-300">
            <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            Social Shopping & WhatsApp Fraud Intelligence
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            Instagram Fake Store & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-emerald-400">
              WhatsApp Scam Detector
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 font-medium leading-relaxed">
            Verify whether an Instagram storefront or WhatsApp seller contact is verified safe, unverified, or a confirmed fraud threat. Deterministic classification based strictly on verified records and transparent heuristics.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl max-w-full overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab('INSTAGRAM');
                setQuery('');
                setInstaResult(null);
                setWaResult(null);
                setCrossResult(null);
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition shrink-0 ${
                activeTab === 'INSTAGRAM'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Instagram className="w-4 h-4" />
              <span>Verify Instagram Store</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('WHATSAPP');
                setQuery('');
                setInstaResult(null);
                setWaResult(null);
                setCrossResult(null);
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition shrink-0 ${
                activeTab === 'WHATSAPP'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Verify WhatsApp Number</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('CROSS_PLATFORM');
                setQuery('');
                setWhatsappQuery('');
                setInstaResult(null);
                setWaResult(null);
                setCrossResult(null);
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition shrink-0 ${
                activeTab === 'CROSS_PLATFORM'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Cross-Platform (Insta + WA)</span>
            </button>
          </div>
        </div>

        {/* Search Scanner Input Box */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl max-w-3xl mx-auto">
          <form onSubmit={handleScan} className="space-y-4">
            {activeTab === 'CROSS_PLATFORM' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
                    1. Instagram Username / Store URL
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g. @myntra, @shop_deals or instagram.com/store"
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
                    2. WhatsApp Seller Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400">
                      <Phone className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={whatsappQuery}
                      onChange={(e) => setWhatsappQuery(e.target.value)}
                      placeholder="e.g. +91 93766 35646 or +91 79770 79770"
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !query.trim() || !whatsappQuery.trim()}
                  className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider text-white flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-xl shadow-indigo-600/30"
                >
                  {loading ? (
                    <>
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      <span>Auditing Cross-Platform Linkage...</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4" />
                      <span>Analyze Cross-Platform Identity Link</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
                  {activeTab === 'INSTAGRAM'
                    ? 'Enter Instagram Username or Profile Link'
                    : 'Enter WhatsApp Phone Number or Contact Link'}
                </label>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    {activeTab === 'INSTAGRAM' ? (
                      <Instagram className="w-5 h-5 text-pink-400" />
                    ) : (
                      <Phone className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>

                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      activeTab === 'INSTAGRAM'
                        ? 'e.g. @myntra, @gifthampers65, @nike_india_outlet_sale'
                        : 'e.g. +91 93766 35646, +91 79770 79770, +91 98765 43210'
                    }
                    className="w-full pl-12 pr-32 py-4 rounded-2xl bg-slate-950 border border-slate-800 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition"
                  />

                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white flex items-center gap-2 transition disabled:opacity-50 cursor-pointer ${
                      activeTab === 'INSTAGRAM'
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-lg shadow-pink-600/30'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30'
                    }`}
                  >
                    {loading ? (
                      <>
                        <RefreshCcw className="w-4 h-4 animate-spin" />
                        <span>Auditing...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Analyze</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Quick Test Chips */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Test Benchmark Profiles:</span>
              {activeTab === 'INSTAGRAM' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickTest('INSTAGRAM', '@myntra')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] transition cursor-pointer"
                  >
                    @myntra (Verified Brand)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTest('INSTAGRAM', '@gifthampers65')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-[11px] transition cursor-pointer"
                  >
                    @gifthampers65 (Unlisted)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTest('INSTAGRAM', '@nike_india_outlet_sale')}
                    className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 font-mono text-[11px] transition cursor-pointer"
                  >
                    @nike_india_outlet_sale (Blacklisted)
                  </button>
                </>
              ) : activeTab === 'WHATSAPP' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickTest('WHATSAPP', '+91 93766 35646')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-[11px] transition cursor-pointer"
                  >
                    +91 93766 35646 (Unlisted)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTest('WHATSAPP', '+91 79770 79770')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] transition cursor-pointer"
                  >
                    +91 79770 79770 (JioMart Verified)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTest('WHATSAPP', '+91 98765 43210')}
                    className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 font-mono text-[11px] transition cursor-pointer"
                  >
                    +91 98765 43210 (Blacklisted)
                  </button>
                </>
              ) : null}
            </div>
          </form>
        </div>

        {/* --- LEGAL & HEURISTIC DISCLAIMER BANNER --- */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p>
            <strong>SafeCart Trust & Safety Notice:</strong> SafeCart audits inputs against verified threat registries and transparent threat heuristics. It does not access private accounts or declare an unlisted entity as fraudulent without verified dispute evidence.
          </p>
        </div>

        {/* --- RESULTS SECTION --- */}

        {/* INSTAGRAM RESULT */}
        {instaResult && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-8 animate-in fade-in duration-300">
            {/* Header Badge */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                  {getStatusBadge(instaResult.authenticityStatus).icon}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white font-mono">
                      @{instaResult.handle}
                    </h2>
                    {instaResult.isVerifiedBadge && (
                      <span className="p-1 rounded-full bg-blue-600 text-white" title="Official Verified Badge">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <a
                    href={instaResult.fullUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <span>{instaResult.fullUrl}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Status Pill */}
              <div className="text-right">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider border ${
                    getStatusBadge(instaResult.authenticityStatus).bg
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${getStatusBadge(instaResult.authenticityStatus).dot} animate-pulse`} />
                  <span>{getStatusBadge(instaResult.authenticityStatus).label}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  Threat Risk Score: <strong className="text-white">{instaResult.riskScore}/100</strong> • Confidence: <strong className="text-slate-300">{instaResult.confidenceLevel}</strong>
                </div>
              </div>
            </div>

            {/* Evidence & Status Overview Card */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>Verification Verdict & Evidence Overview</span>
              </span>
              <p className="text-sm font-semibold text-slate-200">
                {instaResult.verificationStatus}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {instaResult.evidenceSummary}
              </p>
              <div className="pt-2 text-[11px] text-slate-500 font-mono">
                Primary Intelligence Source: <span className="text-slate-300 font-semibold">{instaResult.primarySource}</span>
              </div>
            </div>

            {/* Metrics & Report Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Verified Victim Reports</span>
                <div className="text-sm font-black font-mono">
                  {instaResult.reportedScamCount > 0 ? (
                    <span className="text-red-400">{instaResult.reportedScamCount} Reports on Record</span>
                  ) : (
                    <span className="text-emerald-400">0 Reports Found</span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Threat Assessment</span>
                <div className="text-sm font-black text-slate-200">
                  {instaResult.authenticityStatus.replace('_', ' ')}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Confidence Level</span>
                <div className="text-sm font-black text-slate-200 font-mono">
                  {instaResult.confidenceLevel}
                </div>
              </div>
            </div>

            {/* Data Sources Checked Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-400" />
                <span>Verification Data Sources Audited</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {instaResult.dataSourcesChecked.map((ds, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{ds.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          ds.status === 'CHECKED_CLEAN'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                            : ds.status === 'FLAGGED'
                            ? 'bg-red-950 text-red-400 border border-red-500/30'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {ds.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{ds.details}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Detected Risk Signals */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                Detected Fraud & Risk Signals Breakdown
              </h3>
              <div className="space-y-2">
                {instaResult.riskSignals.map((sig, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-white flex items-center gap-2">
                        {sig.severity === 'CRITICAL' || sig.severity === 'HIGH' ? (
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        ) : sig.severity === 'MEDIUM' ? (
                          <HelpCircle className="w-4 h-4 text-yellow-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <span>{sig.title}</span>
                      </div>
                      <p className="text-slate-400">{sig.description}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          sig.severity === 'CRITICAL'
                            ? 'bg-red-950 text-red-400 border border-red-500/30'
                            : sig.severity === 'HIGH'
                            ? 'bg-orange-950 text-orange-400 border border-orange-500/30'
                            : sig.severity === 'MEDIUM'
                            ? 'bg-yellow-950 text-yellow-400 border border-yellow-500/30'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {sig.severity}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                        {sig.evidenceType.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Recommendations */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Protective Recommendations for Online Buyers</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {instaResult.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer metadata & Report CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Last Audited: {new Date(instaResult.lastCheckedTimestamp).toLocaleString()}</span>
              </div>

              <button
                onClick={() => {
                  setReportForm({
                    ...reportForm,
                    platform: 'INSTAGRAM',
                    identifier: instaResult.handle,
                    whatsAppNumber: ''
                  });
                  setShowReportModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Report this Account</span>
              </button>
            </div>
          </div>
        )}

        {/* WHATSAPP RESULT */}
        {waResult && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                  {getStatusBadge(waResult.riskLevel).icon}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white font-mono">
                    {waResult.formattedNumber}
                  </h2>
                  <div className="text-xs text-slate-400">
                    Business / Channel: <strong className="text-slate-200">{waResult.associatedBusinessName}</strong> • {waResult.telecomCircle || waResult.country}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider border ${
                    getStatusBadge(waResult.riskLevel).bg
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${getStatusBadge(waResult.riskLevel).dot} animate-pulse`} />
                  <span>{getStatusBadge(waResult.riskLevel).label}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  Threat Risk Score: <strong className="text-white">{waResult.riskScore}/100</strong> • Confidence: <strong className="text-slate-300">{waResult.confidenceLevel}</strong>
                </div>
              </div>
            </div>

            {/* Evidence & Status Overview Card */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>Verification Verdict & Registry Status</span>
              </span>
              <p className="text-sm font-semibold text-slate-200">
                {waResult.verificationStatus}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {waResult.evidenceSummary}
              </p>
              <div className="pt-2 text-[11px] text-slate-500 font-mono">
                Primary Intelligence Source: <span className="text-slate-300 font-semibold">{waResult.primarySource}</span>
              </div>
            </div>

            {/* Metrics Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Verified Victim Reports</span>
                <div className="text-sm font-black font-mono">
                  {waResult.reportedScamCount > 0 ? (
                    <span className="text-red-400">{waResult.reportedScamCount} Reports on Record</span>
                  ) : (
                    <span className="text-emerald-400">0 Reports Found</span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Risk Classification</span>
                <div className="text-sm font-black text-slate-200">
                  {waResult.riskLevel.replace('_', ' ')}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Confidence Level</span>
                <div className="text-sm font-black text-slate-200 font-mono">
                  {waResult.confidenceLevel}
                </div>
              </div>
            </div>

            {/* Reported UPI Handles */}
            {waResult.reportedUpiIds.length > 0 && (
              <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/40 space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-red-300 flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  <span>Blacklisted Malicious UPI IDs / Payment Handles:</span>
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {waResult.reportedUpiIds.map((upi, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-xl bg-slate-950 border border-red-500/50 text-xs font-mono font-bold text-red-300"
                    >
                      {upi}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Data Sources Checked Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-400" />
                <span>Verification Data Sources Audited</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {waResult.dataSourcesChecked.map((ds, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{ds.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          ds.status === 'CHECKED_CLEAN'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                            : ds.status === 'FLAGGED'
                            ? 'bg-red-950 text-red-400 border border-red-500/30'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {ds.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{ds.details}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Checklist */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>WhatsApp Commerce Safety Checklist</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {waResult.safetyChecklist.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Last Audited: {new Date(waResult.lastCheckedTimestamp).toLocaleString()}</span>
              </div>

              <button
                onClick={() => {
                  setReportForm({
                    ...reportForm,
                    platform: 'WHATSAPP',
                    identifier: waResult.phoneNumber,
                    whatsAppNumber: waResult.phoneNumber,
                    upiId: waResult.reportedUpiIds[0] || ''
                  });
                  setShowReportModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Report this Number</span>
              </button>
            </div>
          </div>
        )}

        {/* CROSS-PLATFORM RESULT */}
        {crossResult && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                  <Layers className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white font-mono flex items-center gap-2">
                    <span>@{crossResult.instagramHandle}</span>
                    <span className="text-slate-500 font-sans text-sm">+</span>
                    <span>{crossResult.whatsAppNumber}</span>
                  </h2>
                  <div className="text-xs text-slate-400">
                    Identity Link Status: <strong className="text-indigo-300">{crossResult.linkStatus.replace('_', ' ')}</strong>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider border ${
                    getStatusBadge(crossResult.compositeRiskLevel).bg
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${getStatusBadge(crossResult.compositeRiskLevel).dot} animate-pulse`} />
                  <span>{getStatusBadge(crossResult.compositeRiskLevel).label}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  Composite Risk: <strong className="text-white">{crossResult.compositeRiskScore}/100</strong> • Confidence: <strong className="text-slate-300">{crossResult.confidenceLevel}</strong>
                </div>
              </div>
            </div>

            {/* Link Evidence Banner */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cross-Platform Correlation Evidence</span>
              </span>
              <p className="text-sm font-semibold text-slate-200">
                {crossResult.linkEvidence}
              </p>
            </div>

            {/* Joint Risk Factors */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                Correlated Risk Factors
              </h3>
              <div className="space-y-2">
                {crossResult.jointRiskFactors.map((factor, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs text-slate-300">
                    <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Channel Mini Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
                    <Instagram className="w-4 h-4" />
                    <span>Instagram Profile Status</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    Score: {crossResult.instagramAnalysis.riskScore}/100
                  </span>
                </div>
                <p className="text-xs text-slate-300">{crossResult.instagramAnalysis.verificationStatus}</p>
                <p className="text-[11px] text-slate-400">{crossResult.instagramAnalysis.evidenceSummary}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Phone className="w-4 h-4" />
                    <span>WhatsApp Channel Status</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    Score: {crossResult.whatsAppAnalysis.riskScore}/100
                  </span>
                </div>
                <p className="text-xs text-slate-300">{crossResult.whatsAppAnalysis.verificationStatus}</p>
                <p className="text-[11px] text-slate-400">{crossResult.whatsAppAnalysis.evidenceSummary}</p>
              </div>
            </div>

            {/* Recommendations */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Cross-Platform Safety Recommendations</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {crossResult.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* --- LIVE COMMUNITY THREAT REGISTRY FEED --- */}
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black uppercase tracking-wide text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <span>Verified Threat Intelligence Registry</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Active scam operations identified and blacklisted by SafeCart community reports
              </p>
            </div>

            <button
              onClick={() => {
                setReportForm({
                  platform: 'INSTAGRAM',
                  identifier: '',
                  whatsAppNumber: '',
                  upiId: '',
                  financialLossAmount: '',
                  evidenceText: '',
                  reporterName: '',
                  reporterEmail: ''
                });
                setShowReportModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Submit Scam Report</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {threats.instagramThreats.map((threat, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-red-500/40 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-pink-950 border border-pink-500/30 text-pink-400">
                      <Instagram className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black font-mono text-white">{threat.identifier}</h4>
                      <span className="text-[11px] text-red-400 font-bold">Impersonating: {threat.impersonatedBrand}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-red-950 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-wider">
                    {threat.reportsCount} Reports
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{threat.evidence}</p>
                {threat.whatsAppNumber && (
                  <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-800">
                    Linked WhatsApp: <strong className="text-slate-300">{threat.whatsAppNumber}</strong>
                  </div>
                )}
              </div>
            ))}

            {threats.whatsAppThreats.map((threat, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-red-500/40 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-500/30 text-emerald-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black font-mono text-white">{threat.identifier}</h4>
                      <span className="text-[11px] text-red-400 font-bold">{threat.impersonatedBrand}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-red-950 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-wider">
                    {threat.reportsCount} Reports
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{threat.evidence}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- REPORT SCAM MODAL --- */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span>Submit Social / WhatsApp Scam</span>
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSocialReport} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Platform
                </label>
                <select
                  value={reportForm.platform}
                  onChange={(e: any) => setReportForm({ ...reportForm, platform: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-red-500"
                >
                  <option value="INSTAGRAM">Instagram Storefront</option>
                  <option value="WHATSAPP">WhatsApp Number</option>
                  <option value="CROSS_PLATFORM">Cross-Platform (Instagram + WhatsApp)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Account Handle / Phone Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="@seller_id or +91 98765 43210"
                  value={reportForm.identifier}
                  onChange={(e) => setReportForm({ ...reportForm, identifier: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                    WhatsApp Number (if any)
                  </label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={reportForm.whatsAppNumber}
                    onChange={(e) => setReportForm({ ...reportForm, whatsAppNumber: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Scammer UPI ID (if any)
                  </label>
                  <input
                    type="text"
                    placeholder="name@okaxis"
                    value={reportForm.upiId}
                    onChange={(e) => setReportForm({ ...reportForm, upiId: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Financial Loss Amount (₹ INR optional)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1499"
                  value={reportForm.financialLossAmount}
                  onChange={(e) => setReportForm({ ...reportForm, financialLossAmount: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Incident Evidence Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain the incident (e.g. asked for advance UPI on WhatsApp, sent fake tracking slip, then blocked)..."
                  value={reportForm.evidenceText}
                  onChange={(e) => setReportForm({ ...reportForm, evidenceText: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold uppercase text-[10px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold uppercase text-[10px] transition cursor-pointer disabled:opacity-50"
                >
                  {submittingReport ? 'Registering...' : 'Submit Threat Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
