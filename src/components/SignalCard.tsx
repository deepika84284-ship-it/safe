import React from 'react';
import { RiskSignal } from '../types';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Lock,
  Globe,
  FileText,
  CreditCard,
  Users,
  Sparkles
} from 'lucide-react';

interface SignalCardProps {
  signal: RiskSignal;
}

export const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  const category = signal?.category || 'COMMUNITY_SIGNALS';
  const severity = signal?.severity || 'LOW';
  const title = signal?.title || 'Security Indicator';
  const description = signal?.description || '';
  const points = typeof signal?.points === 'number' ? signal.points : 0;
  const evidence = signal?.evidence;

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'SSL_SECURITY':
        return <Lock className="w-4 h-4" />;
      case 'DOMAIN_INTEGRITY':
        return <Globe className="w-4 h-4" />;
      case 'POLICY_TRANSPARENCY':
        return <FileText className="w-4 h-4" />;
      case 'PAYMENT_RISK':
        return <CreditCard className="w-4 h-4" />;
      case 'COMMUNITY_SIGNALS':
        return <Users className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return {
          border: 'border-red-500/40 bg-red-950/20',
          badge: 'bg-red-500/20 text-red-300 border-red-500/40',
          icon: <AlertOctagon className="w-4 h-4 text-red-400" />
        };
      case 'HIGH':
        return {
          border: 'border-orange-500/40 bg-orange-950/20',
          badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          icon: <AlertTriangle className="w-4 h-4 text-orange-400" />
        };
      case 'MEDIUM':
        return {
          border: 'border-amber-500/40 bg-amber-950/20',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />
        };
      case 'LOW':
        return {
          border: 'border-slate-800 bg-slate-900/60',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: <AlertTriangle className="w-4 h-4 text-slate-400" />
        };
      default:
        return {
          border: 'border-emerald-500/30 bg-emerald-950/10',
          badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />
        };
    }
  };

  const style = getSeverityStyle(severity);

  return (
    <div
      className={`p-5 rounded-2xl border-2 transition-all hover:border-slate-600 ${style.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-950 text-slate-300 border border-slate-800">
            {getCategoryIcon(category)}
          </div>
          <div>
            <h4 className="font-black text-sm sm:text-base text-white uppercase tracking-tight flex items-center gap-2">
              {title}
            </h4>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">
              {category.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {points !== 0 && (
            <span
              className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl border ${
                points > 0 ? 'text-red-300 bg-red-950/60 border-red-500/40' : 'text-emerald-300 bg-emerald-950/60 border-emerald-500/40'
              }`}
            >
              {points > 0 ? `+${points} RISK` : `${points} RISK`}
            </span>
          )}
          <div
            className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border uppercase font-mono ${style.badge}`}
          >
            {style.icon}
            {severity}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-300 leading-relaxed font-medium">{description}</p>

      {evidence && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span className="text-slate-500 font-bold uppercase text-[10px]">Evidence:</span>
          <span className="text-slate-300 truncate font-medium">{evidence}</span>
        </div>
      )}
    </div>
  );
};
