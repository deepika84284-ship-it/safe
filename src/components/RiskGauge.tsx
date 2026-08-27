import React from 'react';
import { RiskLevel, ConfidenceLevel } from '../types';
import { ShieldCheck, AlertTriangle, AlertOctagon, ShieldAlert, CheckCircle } from 'lucide-react';

interface RiskGaugeProps {
  score: number;
  level: RiskLevel;
  confidence?: ConfidenceLevel;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  level,
  confidence = 'HIGH',
  size = 'lg',
  showDetails = true
}) => {
  // Score clamped between 0 and 100
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

  // Color mappings
  let strokeColor = '#10b981'; // Emerald for LOW
  let badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let levelText = 'LOW RISK';
  let Icon = ShieldCheck;

  if (level === 'VERY HIGH' || normalizedScore >= 80) {
    strokeColor = '#ef4444'; // Red
    badgeBg = 'bg-red-500/20 text-red-300 border-red-500/40';
    levelText = 'VERY HIGH RISK';
    Icon = AlertOctagon;
  } else if (level === 'HIGH' || normalizedScore >= 60) {
    strokeColor = '#f97316'; // Orange
    badgeBg = 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    levelText = 'HIGH RISK';
    Icon = ShieldAlert;
  } else if (level === 'MEDIUM' || normalizedScore >= 30) {
    strokeColor = '#f59e0b'; // Amber
    badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    levelText = 'MEDIUM RISK';
    Icon = AlertTriangle;
  }

  // SVG dimensions & math
  const radius = size === 'sm' ? 36 : size === 'md' ? 56 : 78;
  const strokeWidth = size === 'sm' ? 7 : size === 'md' ? 10 : 13;
  const circumference = 2 * Math.PI * radius;
  // Use 270 degree arc for gauge look
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        <svg
          className={`transform -rotate-90 ${
            size === 'sm' ? 'w-24 h-24' : size === 'md' ? 'w-36 h-36' : 'w-48 h-48'
          }`}
        >
          {/* Background track */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            className="stroke-slate-800"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active gauge bar */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className={`font-black font-mono tracking-tight text-white ${
              size === 'sm' ? 'text-xl' : size === 'md' ? 'text-3xl' : 'text-4xl'
            }`}
          >
            {normalizedScore}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-black text-slate-400 font-mono">
            /100
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="mt-3 flex flex-col items-center gap-1.5 font-mono">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border tracking-wider uppercase ${badgeBg}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {levelText}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span>CONFIDENCE:</span>
            <span className="font-black text-slate-200">{confidence}</span>
          </div>
        </div>
      )}
    </div>
  );
};
