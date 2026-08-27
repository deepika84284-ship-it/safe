import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ScanResult, Website } from '../types';
import { RiskGauge } from '../components/RiskGauge';
import { SignalCard } from '../components/SignalCard';
import { ProtectedCheckoutModal } from '../components/ProtectedCheckoutModal';
import { ReportModal } from '../components/ReportModal';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  ArrowRight,
  RefreshCcw,
  FileText,
  CreditCard,
  Lock,
  Globe,
  Users,
  CheckCircle2,
  ExternalLink,
  Share2,
  Download,
  Smartphone
} from 'lucide-react';

export const ScanResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [scan, setScan] = useState<ScanResult | null>(null);
  const [website, setWebsite] = useState<Website | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isProtectedCheckoutOpen, setIsProtectedCheckoutOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    const fetchScan = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await api.getScanById(id);
        if (res.success && res.scan) {
          setScan(res.scan);
          setWebsite(res.website);
        } else {
          setError('Scan report not found.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load scan result.');
      } finally {
        setLoading(false);
      }
    };

    fetchScan();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin mb-4" />
        <div className="text-sm font-semibold text-slate-300">Retrieving Cybersecurity Dossier...</div>
        <div className="text-xs text-slate-500 font-mono mt-1">Scan ID: {id}</div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Scan Not Found</h2>
          <p className="text-xs text-slate-400">{error || 'This scan record may have expired or was invalid.'}</p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/scanner"
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition"
            >
              Run New Scan
            </Link>
            <Link
              to="/"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active detected risk signals
  const detectedSignals = scan.signals.filter((s) => s.detected);
  const safeSignals = scan.signals.filter((s) => !s.detected);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8" id="scan-result-container">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Link to="/" className="hover:text-blue-400">
              SafeCart
            </Link>
            <span>/</span>
            <Link to="/scanner" className="hover:text-blue-400">
              Scanner
            </Link>
            <span>/</span>
            <span className="text-white font-mono">{scan.domain}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Scan link copied to clipboard!');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Share Report</span>
            </button>
            <Link
              to="/scanner"
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Scan Another</span>
            </Link>
          </div>
        </div>

        {/* High Risk Critical Alert Banner if score >= 60 */}
        {scan.score >= 60 && (
          <div
            className={`p-5 rounded-3xl border flex items-start gap-4 animate-in fade-in shadow-xl ${
              scan.score >= 80
                ? 'bg-red-950/40 border-red-500/50 text-red-200'
                : 'bg-orange-950/40 border-orange-500/50 text-orange-200'
            }`}
          >
            <div
              className={`p-2.5 rounded-2xl shrink-0 ${
                scan.score >= 80 ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
              }`}
            >
              {scan.score >= 80 ? <AlertOctagon className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-tight">
                {scan.score >= 80
                  ? 'Critical Threat Indicators Detected'
                  : 'Elevated E-Commerce Risk Factors'}
              </h3>
              <p className="text-xs mt-1 leading-relaxed text-slate-300 font-medium">
                {scan.score >= 80
                  ? 'Multiple critical warning indicators were identified on this domain. Avoid making advance payments or entering sensitive financial details until you independently verify the merchant.'
                  : 'This website exhibits questionable security or policy patterns. Exercise caution and verify contact credentials prior to checkout.'}
              </p>
            </div>
          </div>
        )}

        {/* Main Result Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-8">
          {/* Header Title & Target */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-slate-400 font-black">
                Security Dossier
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white font-mono mt-1 break-all tracking-tight">
                {scan.domain}
              </h1>
              <div className="text-xs text-slate-400 font-mono mt-1 truncate max-w-lg">
                Scanned URL: {scan.url}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/website/${scan.domain}`}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>View Full Dossier</span>
              </Link>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-800/80 text-red-300 text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>Report Website</span>
              </button>
            </div>
          </div>

          {/* Risk Gauge & Recommendation Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-slate-950/80 p-6 rounded-2xl border border-slate-800">
            <div className="flex justify-center md:border-r md:border-slate-800 md:pr-6">
              <RiskGauge score={scan.score} level={scan.riskLevel} confidence={scan.confidence} size="lg" />
            </div>

            <div className="md:col-span-2 space-y-4">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Primary Recommendation
                </div>
                <div className="text-base sm:text-lg font-black text-white mt-1">
                  "{scan.recommendations[0] || 'Review seller terms carefully.'}"
                </div>
              </div>

              {scan.recommendations.length > 1 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-400">Action Checklist:</div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside font-medium">
                    {scan.recommendations.slice(1).map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Sandbox Button */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsProtectedCheckoutOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Start Protected Checkout (Demo)</span>
                </button>
                <Link
                  to={`/gpay-escrow?domain=${encodeURIComponent(scan.domain)}`}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-emerald-200" />
                  <span>Google Pay (GPay) Shield</span>
                </Link>
              </div>
            </div>
          </div>

          {/* What We Checked Summary Matrix */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">
              Verification Matrix (What We Checked)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <div className="font-bold text-white uppercase text-[11px]">HTTPS / SSL</div>
                  <div className="text-[10px] text-slate-400 font-mono">{scan.metadata.hasSsl ? 'Secure TLS' : 'Insecure'}</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <div className="font-bold text-white uppercase text-[11px]">Domain Signals</div>
                  <div className="text-[10px] text-slate-400 font-mono">TLD {scan.metadata.tld}</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <div className="font-bold text-white uppercase text-[11px]">Website Policies</div>
                  <div className="text-[10px] text-slate-400 font-medium">Refunds & Terms</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <div className="font-bold text-white uppercase text-[11px]">Community Trust</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {website?.confirmedReports || 0} Confirmed
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-2.5 col-span-2 sm:col-span-1">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <div className="font-bold text-white uppercase text-[11px]">Payment Safety</div>
                  <div className="text-[10px] text-slate-400 font-medium">Gateway Audit</div>
                </div>
              </div>
            </div>
          </div>

          {/* Detected Risk Warnings List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Detected Risk Indicators ({detectedSignals.length})</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider text-[10px]">
                {detectedSignals.length === 0 ? 'Zero active warnings' : 'Factors contributing to risk score'}
              </span>
            </div>

            {detectedSignals.length === 0 ? (
              <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3 font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  No suspicious indicators or consumer dispute flags were detected during this automated scan.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {detectedSignals.map((signal) => (
                  <SignalCard key={signal.id} signal={signal} />
                ))}
              </div>
            )}
          </div>

          {/* Safe Passing Signals */}
          {safeSignals.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Passing Indicators ({safeSignals.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {safeSignals.map((signal) => (
                  <SignalCard key={signal.id} signal={signal} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Bottom Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono font-medium">
            Scan completed at {new Date(scan.createdAt).toLocaleString()} • ID: {scan.id}
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={`/website/${scan.domain}`}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer"
            >
              View Details
            </Link>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer"
            >
              Report Website
            </button>
            <Link
              to="/scanner"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-blue-600/30"
            >
              Scan Another Website
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive Modals */}
      <ProtectedCheckoutModal
        domain={scan.domain}
        websiteId={scan.websiteId}
        isOpen={isProtectedCheckoutOpen}
        onClose={() => setIsProtectedCheckoutOpen(false)}
      />

      <ReportModal
        initialDomain={scan.domain}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};
