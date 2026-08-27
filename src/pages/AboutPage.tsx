import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Cpu,
  Users,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Globe,
  ArrowRight
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-wider font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>Cybersecurity Architecture</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tight">
            About SafeCart Defense
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto font-medium">
            SafeCart delivers pre-transaction threat intelligence: giving consumers transparent risk verification before making irreversible financial payments.
          </p>
        </div>

        {/* Mission Statement Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 border-2 border-blue-500/40 space-y-4 shadow-xl">
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-blue-500" />
            <span>Our Core Mission</span>
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            Billions of dollars are lost each year to counterfeit shopping storefronts, unverified social media ads, and deceptive lookalike websites. SafeCart gives consumers instantaneous security visibility into domain authenticity, cryptographic integrity, and historical community dispute records.
          </p>
        </div>

        {/* 4 Pillars of the Risk Engine */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight text-center">
            The 4 Pillars of SafeCart's Risk Engine
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-wide">1. SSRF-Hardened URL Ingestion</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                All URLs are sanitized through strict Server-Side Request Forgery (SSRF) filters, blocking private cloud subnets, loopbacks, and non-standard schemes to ensure secure analysis without exposing internal infrastructure.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-wide">2. Domain & Brand Heuristics</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Our rule engine analyzes Top-Level Domain (TLD) risk distributions, estimated registration age, and Levenshtein distance against authentic multinational retail trademarks to flag typosquatting.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-wide">3. Merchant Policy & Contact Audit</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                We inspect whether the merchant publishes transparent return/refund policies, verifiable physical corporate registration details, and secure checkout gateways rather than suspicious cash-wire prompts.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-wide">4. Moderated Threat Network</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Shoppers report non-delivery incidents, counterfeit goods, and communication breakdowns. Moderated submissions dynamically adjust real-time risk scores to protect subsequent visitors.
              </p>
            </div>
          </div>
        </div>

        {/* Security & Ethical Boundaries */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            <span>Ethical Security & Zero-Financial-Data Mandate</span>
          </h2>
          <div className="space-y-2 text-xs text-slate-300 leading-relaxed font-medium">
            <p>
              SafeCart is strictly a defensive intelligence tool. We do <strong>NOT</strong> collect credit card numbers, CVVs, PINs, OTP codes, or bank account credentials.
            </p>
            <p>
              Our payment sandbox uses synthetic mock transactions to demonstrate buyer escrow protection mechanisms safely without processing real currency.
            </p>
          </div>
        </div>

        {/* Official Legal Disclaimer */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
          <div className="font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <AlertCircle className="w-4 h-4 text-blue-400" />
            <span>Operational Disclaimer:</span>
          </div>
          <p className="leading-relaxed font-medium">
            SafeCart provides automated heuristic indicators and community feedback. A low risk score does not guarantee 100% merchant legitimacy, and a high risk score represents an automated recommendation for consumer caution. Always verify critical orders independently.
          </p>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pt-4">
          <Link
            to="/scanner"
            className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider text-xs inline-flex items-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            <span>Scan Domain Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
