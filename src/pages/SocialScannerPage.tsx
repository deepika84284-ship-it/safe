import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { InstagramAnalysisResult, WhatsAppAnalysisResult } from '../types';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Instagram,
  Phone,
  ArrowRight,
  ExternalLink,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  RefreshCcw,
  Zap,
  Lock,
  QrCode,
  DollarSign,
  UserX,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

export const SocialScannerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'INSTAGRAM' | 'WHATSAPP'>('INSTAGRAM');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const [instaResult, setInstaResult] = useState<InstagramAnalysisResult | null>(null);
  const [waResult, setWaResult] = useState<WhatsAppAnalysisResult | null>(null);

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
    platform: 'INSTAGRAM' as 'INSTAGRAM' | 'WHATSAPP',
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

    if (handleParam) {
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
    if (!query.trim()) return;

    if (activeTab === 'INSTAGRAM') {
      await runInstagramScan(query.trim());
    } else {
      await runWhatsAppScan(query.trim());
    }
  };

  const runInstagramScan = async (target: string) => {
    setLoading(true);
    setInstaResult(null);
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
    try {
      const res = await api.scanWhatsApp(target);
      if (res.success) {
        setWaResult(res.analysis);
        success('WhatsApp Threat Audit Complete', `Scanned phone number: ${res.analysis.phoneNumber}`);
      }
    } catch (err: any) {
      error('Scan Failed', err.response?.data?.message || 'Failed to scan WhatsApp number.');
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
        success('Report Registered', 'Thank you! Threat added to community defense network.');
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Title */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-pink-950/80 via-purple-950/80 to-emerald-950/80 border border-pink-500/30 text-[11px] font-black uppercase tracking-widest text-pink-300">
            <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            Social Shopping & WhatsApp Fraud Shield
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            Instagram Fake Store & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-emerald-400">
              WhatsApp Scam Detector
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 font-medium leading-relaxed">
            Insta-ல chat பண்ணி WhatsApp-க்கு redirect பண்ணி advance UPI payment வாங்கிட்டு block பண்ற scam-களை உடனே கண்டுபுடிங்க. Verify if an Instagram handle or WhatsApp seller number is authentic or a dangerous trap.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <button
              onClick={() => {
                setActiveTab('INSTAGRAM');
                setQuery('');
              }}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'INSTAGRAM'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Instagram className="w-4 h-4" />
              <span>Verify Instagram ID / Store</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('WHATSAPP');
                setQuery('');
              }}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'WHATSAPP'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Verify WhatsApp Number / UPI</span>
            </button>
          </div>
        </div>

        {/* Search Scanner Input Box */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl max-w-3xl mx-auto">
          <form onSubmit={handleScan} className="space-y-4">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
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
                    ? 'e.g. @nike_india_outlet_sale or instagram.com/brand_store'
                    : 'e.g. +91 98765 43210, 9812345678 or wa.me/919876543210'
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

            {/* Quick Test Chips */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Test Known Cases:</span>
              {activeTab === 'INSTAGRAM' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickTest('INSTAGRAM', '@nike_india_outlet_sale')}
                    className="px-2.5 py-1 rounded-lg bg-pink-950/60 hover:bg-pink-900 border border-pink-500/30 text-pink-300 font-mono text-[11px] transition"
                  >
                    @nike_india_outlet_sale (Scam)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTest('INSTAGRAM', '@iphone_deals_hub_india')}
                    className="px-2.5 py-1 rounded-lg bg-pink-950/60 hover:bg-pink-900 border border-pink-500/30 text-pink-300 font-mono text-[11px] transition"
                  >
                    @iphone_deals_hub_india (Scam)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTest('INSTAGRAM', '@zara_surplus_store_india')}
                    className="px-2.5 py-1 rounded-lg bg-pink-950/60 hover:bg-pink-900 border border-pink-500/30 text-pink-300 font-mono text-[11px] transition"
                  >
                    @zara_surplus (Fake)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTest('INSTAGRAM', '@nike')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] transition"
                  >
                    @nike (Official)
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickTest('WHATSAPP', '+91 98765 43210')}
                    className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 font-mono text-[11px] transition"
                  >
                    +91 98765 43210 (Blacklisted)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTest('WHATSAPP', '+91 97000 11222')}
                    className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 font-mono text-[11px] transition"
                  >
                    +91 97000 11222 (iPhone Scam)
                  </button>
                </>
              )}
            </div>
          </form>
        </div>

        {/* --- SCAM LIFECYCLE INFOGRAPHIC BANNER --- */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
          <div className="text-center mb-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/30">
              Anatomy of the Instagram-to-WhatsApp Scam (எப்படி ஏமாத்துறாங்க?)
            </span>
            <h3 className="text-lg font-black text-white mt-2 uppercase tracking-wide">
              How the Social Shopping UPI Trap Works
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 relative">
              <div className="w-8 h-8 rounded-xl bg-pink-950 border border-pink-500/30 flex items-center justify-center text-pink-400 font-black text-xs">
                1
              </div>
              <h4 className="text-xs font-black uppercase tracking-wide text-white">
                Fake Instagram Ad / Bio
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Offers 85-90% discount on iPhones, branded sneakers, or luxury sarees. Directs users: <em>"DM for Price or Click WhatsApp Link in Bio"</em>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 relative">
              <div className="w-8 h-8 rounded-xl bg-amber-950 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xs">
                2
              </div>
              <h4 className="text-xs font-black uppercase tracking-wide text-white">
                Forced WhatsApp Chat (wa.me)
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bypasses Instagram/E-commerce buyer protection by taking communication private. Disables comments on Instagram to hide complaints.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 relative">
              <div className="w-8 h-8 rounded-xl bg-red-950 border border-red-500/30 flex items-center justify-center text-red-400 font-black text-xs">
                3
              </div>
              <h4 className="text-xs font-black uppercase tracking-wide text-white">
                Advance UPI / QR Code Demand
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Demands advance payment via GPay / PhonePe / Paytm or ₹300-₹500 "courier booking fee" even for alleged COD orders.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 relative">
              <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-500/30 flex items-center justify-center text-purple-400 font-black text-xs">
                4
              </div>
              <h4 className="text-xs font-black uppercase tracking-wide text-white">
                Fake Tracking Slip & Block
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sends a fake DTDC/Delhivery tracking screenshot, asks for "customs clearance money", then immediately blocks the victim on WhatsApp and Insta.
              </p>
            </div>
          </div>
        </div>

        {/* --- RESULTS SECTION --- */}

        {/* INSTAGRAM RESULT */}
        {instaResult && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-8 animate-in fade-in duration-300">
            {/* Header Badge */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    instaResult.authenticityStatus === 'LIKELY_AUTHENTIC'
                      ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-400'
                      : instaResult.authenticityStatus === 'CONFIRMED_SCAM'
                      ? 'bg-red-950 border border-red-500/40 text-red-400'
                      : 'bg-amber-950 border border-amber-500/40 text-amber-400'
                  }`}
                >
                  {instaResult.authenticityStatus === 'LIKELY_AUTHENTIC' ? (
                    <ShieldCheck className="w-8 h-8" />
                  ) : (
                    <ShieldAlert className="w-8 h-8" />
                  )}
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
                    instaResult.authenticityStatus === 'LIKELY_AUTHENTIC'
                      ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
                      : instaResult.authenticityStatus === 'CONFIRMED_SCAM'
                      ? 'bg-red-950/80 border-red-500/40 text-red-400'
                      : 'bg-amber-950/80 border-amber-500/40 text-amber-400'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  <span>
                    {instaResult.authenticityStatus === 'LIKELY_AUTHENTIC'
                      ? 'Verified Authentic Account'
                      : instaResult.authenticityStatus === 'CONFIRMED_SCAM'
                      ? 'CONFIRMED FAKE SCAM STORE'
                      : 'HIGH SUSPICION / CAUTION'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  Threat Risk Score: <strong className="text-white">{instaResult.riskScore}/100</strong>
                </div>
              </div>
            </div>

            {/* Redirection Alert Banner */}
            {instaResult.redirectionAnalysis.redirectsToWhatsApp && (
              <div className="p-5 rounded-2xl bg-red-950/50 border border-red-500/40 flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-wide text-red-300">
                    High-Risk WhatsApp Redirection Detected (வாட்ஸ்அப் மோசடி எச்சரிக்கை)
                  </h4>
                  <p className="text-xs text-red-200/90 leading-relaxed">
                    {instaResult.redirectionAnalysis.warningNote}
                  </p>
                  {instaResult.whatsAppNumberDetected && (
                    <div className="mt-2 text-xs font-mono text-red-300">
                      Associated WhatsApp Contact: <strong>{instaResult.whatsAppNumberDetected}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Comments Status</span>
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  {instaResult.isCommentsDisabledOrFiltered ? (
                    <>
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400">Disabled / Blocked</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Open Public</span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  {instaResult.isCommentsDisabledOrFiltered ? 'Turns off comments to prevent victims posting warnings.' : 'Legit review transparency.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Estimated Followers</span>
                <div className="text-sm font-black text-white font-mono">
                  {instaResult.followerCountEstimate.toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-400">
                  Engagement: <strong className="text-slate-300">{instaResult.engagementRatioPercent}%</strong> {instaResult.engagementRatioPercent < 0.2 ? '(Bot Anomaly)' : ''}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Username History</span>
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  {instaResult.hasFrequentUsernameChanges ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-400">{instaResult.usernameChangesCount} Changes Detected</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Stable Identity</span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">Account Age: {instaResult.accountAgeEstimated}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Scam Reports in Registry</span>
                <div className="text-sm font-black font-mono">
                  {instaResult.reportedScamCount > 0 ? (
                    <span className="text-red-400">{instaResult.reportedScamCount} Victim Reports</span>
                  ) : (
                    <span className="text-emerald-400">0 Reports</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">SafeCart Community Intel</p>
              </div>
            </div>

            {/* Detected Risk Signals */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                Detailed Threat Analysis & Detected Signals
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
                          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <span>{sig.title}</span>
                      </div>
                      <p className="text-slate-400">{sig.description}</p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 ${
                        sig.severity === 'CRITICAL'
                          ? 'bg-red-950 text-red-400 border border-red-500/30'
                          : sig.severity === 'HIGH'
                          ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {sig.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Recommendations */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Protective Recommendations for Buyers</span>
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

            {/* Quick Report CTA */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setReportForm({
                    ...reportForm,
                    platform: 'INSTAGRAM',
                    identifier: instaResult.handle,
                    whatsAppNumber: instaResult.whatsAppNumberDetected || ''
                  });
                  setShowReportModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Report this Instagram Account as Scam</span>
              </button>
            </div>
          </div>
        )}

        {/* WHATSAPP RESULT */}
        {waResult && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    waResult.riskLevel === 'LOW'
                      ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-400'
                      : 'bg-red-950 border border-red-500/40 text-red-400'
                  }`}
                >
                  <Phone className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white font-mono">
                    {waResult.formattedNumber}
                  </h2>
                  <div className="text-xs text-slate-400">
                    Business / Alias: <strong className="text-slate-200">{waResult.associatedBusinessName}</strong> • {waResult.country}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider border ${
                    waResult.riskLevel === 'LOW'
                      ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
                      : 'bg-red-950/80 border-red-500/40 text-red-400'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  <span>{waResult.riskLevel === 'LOW' ? 'Unreported Phone' : 'CONFIRMED FRAUD NUMBER'}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  Victim Reports: <strong className="text-red-400">{waResult.reportedScamCount}</strong>
                </div>
              </div>
            </div>

            {/* Reported UPI Handles */}
            {waResult.reportedUpiIds.length > 0 && (
              <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/40 space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-red-300 flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  <span>Reported Malicious UPI IDs / Payment Handles:</span>
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

            {/* Checklist */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>WhatsApp Shopping Defense Rules</span>
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

            <div className="flex justify-end">
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
                className="px-4 py-2 rounded-xl bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Report this WhatsApp Number</span>
              </button>
            </div>
          </div>
        )}

        {/* --- LIVE COMMUNITY THREAT REGISTRY FEED --- */}
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black uppercase tracking-wide text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <span>Recently Reported Social Shopping Scams</span>
              </h2>
              <p className="text-xs text-slate-400">
                Live threat intel submitted by users across Instagram and WhatsApp
              </p>
            </div>

            <button
              onClick={() => setShowReportModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-red-600/20 cursor-pointer"
            >
              + Report New Scam
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {threats.instagramThreats.map((t, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-pink-500/40 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-400" />
                    <span className="font-mono font-bold text-white text-sm">{t.identifier}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-red-950 border border-red-500/30 text-red-400 font-mono text-[10px] font-black uppercase">
                    Risk {t.riskScore}/100
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{t.evidence}</p>

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono gap-2">
                  <span>Impersonates: <strong className="text-slate-200">{t.impersonatedBrand}</strong></span>
                  <span>Reports: <strong className="text-red-400">{t.reportsCount}</strong></span>
                </div>
              </div>
            ))}

            {threats.whatsAppThreats.map((t, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono font-bold text-white text-sm">{t.identifier}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-red-950 border border-red-500/30 text-red-400 font-mono text-[10px] font-black uppercase">
                    Risk {t.riskScore}/100
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{t.evidence}</p>

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono gap-2">
                  <span>Alias: <strong className="text-slate-200">{t.impersonatedBrand}</strong></span>
                  <span>Reports: <strong className="text-red-400">{t.reportsCount}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* --- REPORT SCAM MODAL --- */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-black uppercase tracking-wide text-white">
                  Report Social Media / WhatsApp Scam
                </h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSocialReport} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReportForm({ ...reportForm, platform: 'INSTAGRAM' })}
                  className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition ${
                    reportForm.platform === 'INSTAGRAM'
                      ? 'bg-pink-950 border-pink-500 text-pink-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Instagram Scam
                </button>
                <button
                  type="button"
                  onClick={() => setReportForm({ ...reportForm, platform: 'WHATSAPP' })}
                  className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition ${
                    reportForm.platform === 'WHATSAPP'
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  WhatsApp Scam
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  {reportForm.platform === 'INSTAGRAM' ? 'Instagram Handle (@name)' : 'WhatsApp Phone Number'}
                </label>
                <input
                  type="text"
                  value={reportForm.identifier}
                  onChange={(e) => setReportForm({ ...reportForm, identifier: e.target.value })}
                  placeholder={reportForm.platform === 'INSTAGRAM' ? '@fake_deals_store' : '+91 98765 43210'}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-pink-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    WhatsApp Number (if redirected)
                  </label>
                  <input
                    type="text"
                    value={reportForm.whatsAppNumber}
                    onChange={(e) => setReportForm({ ...reportForm, whatsAppNumber: e.target.value })}
                    placeholder="+91 98XXX XXXXX"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Scammer's UPI ID / GPay
                  </label>
                  <input
                    type="text"
                    value={reportForm.upiId}
                    onChange={(e) => setReportForm({ ...reportForm, upiId: e.target.value })}
                    placeholder="scamstore@ybl"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Financial Loss Amount (₹)
                </label>
                <input
                  type="number"
                  value={reportForm.financialLossAmount}
                  onChange={(e) => setReportForm({ ...reportForm, financialLossAmount: e.target.value })}
                  placeholder="e.g. 1499"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  What Happened? (Evidence & Chat details)
                </label>
                <textarea
                  rows={3}
                  value={reportForm.evidenceText}
                  onChange={(e) => setReportForm({ ...reportForm, evidenceText: e.target.value })}
                  placeholder="e.g. Ordered shoes from Insta, they asked to WhatsApp +91..., paid via GPay, then they sent fake courier tracking and blocked me."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-pink-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition disabled:opacity-50"
                >
                  {submittingReport ? 'Submitting...' : 'Submit Scam Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
