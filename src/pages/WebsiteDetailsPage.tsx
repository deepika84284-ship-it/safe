import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Website, ScanResult } from '../types';
import { RiskGauge } from '../components/RiskGauge';
import { ReportModal } from '../components/ReportModal';
import { ProtectedCheckoutModal } from '../components/ProtectedCheckoutModal';
import {
  Globe,
  ShieldCheck,
  AlertTriangle,
  FileText,
  CreditCard,
  Users,
  Lock,
  ExternalLink,
  Calendar,
  Clock,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';

export const WebsiteDetailsPage: React.FC = () => {
  const { domain } = useParams<{ domain: string }>();

  const [website, setWebsite] = useState<Website | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [activeTab, setActiveTab] = useState<'TECHNICAL' | 'BUSINESS' | 'COMMUNITY' | 'PAYMENT' | 'POLICIES'>('TECHNICAL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  useEffect(() => {
    const fetchWebsiteData = async () => {
      if (!domain) return;
      setLoading(true);
      setError(null);
      try {
        const res = await api.getWebsite(domain);
        if (res.success && res.website) {
          setWebsite(res.website);
          setReports(res.reports || []);
          setRecentScans(res.recentScans || []);
        } else {
          setError('Website profile could not be loaded.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch domain dossier.');
      } finally {
        setLoading(false);
      }
    };

    fetchWebsiteData();
  }, [domain]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin mb-4" />
        <div className="text-sm font-semibold text-slate-300">Assembling Domain Security Dossier...</div>
        <div className="text-xs text-slate-500 font-mono mt-1">{domain}</div>
      </div>
    );
  }

  if (error || !website) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Domain Not Found</h2>
          <p className="text-xs text-slate-400">{error || 'Could not locate security record for this domain.'}</p>
          <div className="pt-2">
            <Link
              to={`/scanner?url=${domain}`}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition"
            >
              Scan {domain} Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
          <Link to="/" className="hover:text-white">
            SafeCart
          </Link>
          <span>/</span>
          <Link to="/scanner" className="hover:text-white">
            Websites
          </Link>
          <span>/</span>
          <span className="text-blue-400 font-mono font-black">{website.domain}</span>
        </div>

        {/* Domain Hero Dossier Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono font-black uppercase tracking-wider">
                  Domain Intelligence Dossier
                </span>
                {website.reputationBadge && (
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-mono font-black border uppercase tracking-wider ${
                      website.reputationBadge === 'VERIFIED_TRUSTED'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : website.reputationBadge === 'NEEDS_CAUTION'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-red-500/15 text-red-300 border-red-500/30'
                    }`}
                  >
                    {website.reputationBadge.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-white font-mono uppercase tracking-tight">{website.domain}</h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium">
                <div className="flex items-center gap-1.5 font-mono">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>First Seen: {new Date(website.firstScannedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Last Scanned: {new Date(website.lastScannedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 self-start md:self-center">
              <RiskGauge score={website.riskScore} level={website.riskLevel} confidence={website.confidence} size="md" />

              <div className="space-y-2">
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="w-full px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Report Scam</span>
                </button>
                <button
                  onClick={() => setIsCheckoutModalOpen(true)}
                  className="w-full px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Test Checkout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-slate-400 font-mono font-bold uppercase text-[10px]">Total User Reports</div>
              <div className="text-xl font-black font-mono text-white mt-1">{website.totalReports}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-slate-400 font-mono font-bold uppercase text-[10px]">Confirmed Fraud Claims</div>
              <div className="text-xl font-black font-mono text-red-400 mt-1">{website.confirmedReports}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-slate-400 font-mono font-bold uppercase text-[10px]">Pending Moderation</div>
              <div className="text-xl font-black font-mono text-amber-400 mt-1">{website.pendingReports}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-slate-400 font-mono font-bold uppercase text-[10px]">Estimated Age</div>
              <div className="text-xl font-black font-mono text-blue-400 mt-1">
                {website.signalsSummary.domainAgeEstimated}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-2 text-xs font-black uppercase tracking-wider font-mono">
          {[
            { id: 'TECHNICAL', label: 'Technical Signals', icon: Lock },
            { id: 'BUSINESS', label: 'Business & Contact Info', icon: Globe },
            { id: 'COMMUNITY', label: `Community Reports (${reports.length})`, icon: Users },
            { id: 'PAYMENT', label: 'Payment Safety', icon: CreditCard },
            { id: 'POLICIES', label: 'Website Policies', icon: FileText }
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Technical Signals */}
        {activeTab === 'TECHNICAL' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
              <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2 font-mono">
                <Lock className="w-5 h-5 text-blue-400" />
                <span>Cryptographic & SSL Protocol</span>
              </h3>
              <div className="space-y-2 text-xs font-medium">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-850">
                  <span className="text-slate-400">HTTPS Transport Encryption:</span>
                  <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                    {website.signalsSummary.hasHttps ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4 text-red-400" />}
                    {website.signalsSummary.hasHttps ? 'Active TLS' : 'Missing HTTPS'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-850">
                  <span className="text-slate-400">SSL Certificate Status:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {website.signalsSummary.hasValidSsl ? 'Valid / Authenticated CA' : 'Unverified / Self-Signed'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
              <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2 font-mono">
                <Globe className="w-5 h-5 text-blue-400" />
                <span>Domain Integrity & Heuristics</span>
              </h3>
              <div className="space-y-2 text-xs font-medium">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-850">
                  <span className="text-slate-400">Brand Impersonation / Typosquatting:</span>
                  <span
                    className={`font-mono font-bold ${
                      website.signalsSummary.isTypoSquatted ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {website.signalsSummary.isTypoSquatted ? 'High Risk Typosquat Flag' : 'Clean Name Structure'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-850">
                  <span className="text-slate-400">Domain Age:</span>
                  <span className="font-mono font-bold text-slate-200">{website.signalsSummary.domainAgeEstimated}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Business Info */}
        {activeTab === 'BUSINESS' && (
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Merchant Identification & Corporate Transparency</h3>
            <p className="text-xs text-slate-400 font-medium">
              Verifying whether the merchant publishes registered business addresses, verifiable support telephone numbers, and corporate credentials.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 font-medium">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Customer Support Channel:</span>
                <span className="font-mono font-bold text-slate-200">
                  {website.signalsSummary.hasContactInfo ? 'Support Email / Form Found' : 'No Verifiable Channel'}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Physical Business Address:</span>
                <span className="font-mono font-bold text-slate-200">
                  {website.signalsSummary.hasContactInfo ? 'Registered Merchant Address' : 'Hidden / Undisclosed'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Community Reports */}
        {activeTab === 'COMMUNITY' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Community Incident & Dispute Reports</h3>
                <p className="text-xs text-slate-400 font-medium">
                  Real experiences submitted by consumers. Reporter identities are strictly anonymized.
                </p>
              </div>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider text-xs transition cursor-pointer shadow-lg shadow-red-600/30"
              >
                File Report
              </button>
            </div>

            {reports.length === 0 ? (
              <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400 space-y-2 shadow-xl">
                <Users className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="font-medium">No consumer dispute reports currently on file for {website.domain}.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {reports.map((r: any) => (
                  <div key={r.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 text-xs shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-200 uppercase">{r.reporterName}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400 font-mono">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider font-mono border ${
                          r.status === 'CONFIRMED'
                            ? 'bg-red-500/20 text-red-300 border-red-500/40'
                            : r.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>

                    <div className="font-black text-red-400 uppercase tracking-wider font-mono">{r.reason}</div>
                    <p className="text-slate-300 leading-relaxed font-medium">{r.description}</p>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-medium">
                      <span>Issue: {r.transactionIssue}</span>
                      {r.financialLossAmount > 0 && (
                        <span className="font-mono text-red-400 font-bold">Reported Loss: ${r.financialLossAmount.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Payment Safety */}
        {activeTab === 'PAYMENT' && (
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              <span>Checkout Gateway & Payment Method Integrity</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Evaluation of whether the website uses legitimate credit card processing networks or attempts to coerce buyers into irreversible peer-to-peer transfers.
            </p>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs font-medium">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Suspicious Wire / Untraceable Payment Prompt:</span>
                <span
                  className={`font-mono font-bold ${
                    website.signalsSummary.hasSuspiciousPaymentInstructions ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {website.signalsSummary.hasSuspiciousPaymentInstructions ? 'Detected (High Risk)' : 'Not Detected'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Buyer Protection Escrow Support:</span>
                <span className="font-mono font-bold text-slate-300">Supported via SafeCart Sandbox</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsCheckoutModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Test Protected Checkout Simulator</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 5: Policies */}
        {activeTab === 'POLICIES' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 text-xs shadow-lg">
              <div className="font-black text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Return & Refund Policy</span>
              </div>
              <p className="text-slate-400 leading-relaxed font-medium">
                {website.signalsSummary.hasRefundPolicy
                  ? 'Standard cancellation and dispute terms detected.'
                  : 'No transparent refund or return policy could be identified on standard website paths.'}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 text-xs shadow-lg">
              <div className="font-black text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Privacy & Data Terms</span>
              </div>
              <p className="text-slate-400 leading-relaxed font-medium">
                {website.signalsSummary.hasPrivacyPolicy
                  ? 'Privacy disclosures and data handling policies present.'
                  : 'Privacy policy missing or incomplete.'}
              </p>
            </div>
          </div>
        )}
      </div>

      <ReportModal
        initialDomain={website.domain}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      <ProtectedCheckoutModal
        domain={website.domain}
        websiteId={website.id}
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
      />
    </div>
  );
};
