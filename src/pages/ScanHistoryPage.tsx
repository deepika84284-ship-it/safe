import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { ScanResult } from '../types';
import {
  History,
  Search,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Filter
} from 'lucide-react';

export const ScanHistoryPage: React.FC = () => {
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.getScanHistory(50);
        if (res.success && res.scans) {
          setScans(res.scans);
        }
      } catch (err) {
        console.error('Failed to load scan history', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const filteredScans = scans.filter((scan) => {
    const matchesSearch =
      scan.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scan.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = selectedRisk === 'ALL' || scan.riskLevel === selectedRisk;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-wider font-mono mb-2">
              <History className="w-3.5 h-3.5" />
              <span>Cyber Threat Telemetry</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">Scanned Domains History</h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Browse real-time global e-commerce website scans, risk classifications, and threat scores.
            </p>
          </div>

          <Link
            to="/scanner"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider text-xs flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            <span>Scan New URL</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row gap-3 shadow-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by domain (e.g. nike.com or mega-discounts)..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border-2 border-slate-700 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="px-4 py-3 rounded-xl bg-slate-950 border-2 border-slate-700 text-xs text-white font-black uppercase tracking-wider focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="VERY HIGH">Very High Risk</option>
            </select>
          </div>
        </div>

        {/* Scan List Table / Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mx-auto mb-3" />
            <span className="text-xs text-slate-400 font-mono">Loading scan telemetry history...</span>
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3 shadow-xl">
            <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-black text-white uppercase tracking-wider">No Matching Scans Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
              Try modifying your search keywords or clear your risk level filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredScans.map((scan) => {
              const isHigh = scan.score >= 60;
              const isVeryHigh = scan.score >= 80;

              return (
                <div
                  key={scan.id}
                  className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-3 flex flex-col justify-between shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          to={`/scan/${scan.id}`}
                          className="font-mono text-base font-black text-white hover:text-blue-400 transition break-all"
                        >
                          {scan.domain}
                        </Link>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {new Date(scan.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div
                            className={`text-lg font-black font-mono ${
                              isVeryHigh
                                ? 'text-red-400'
                                : isHigh
                                ? 'text-orange-400'
                                : scan.score >= 30
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {scan.score}
                            <span className="text-[10px] text-slate-500 font-normal">/100</span>
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider font-mono border ${
                            isVeryHigh
                              ? 'bg-red-500/20 text-red-300 border-red-500/40'
                              : isHigh
                              ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                              : scan.score >= 30
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {scan.riskLevel}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 italic line-clamp-2 font-medium">
                      "{scan.recommendations[0] || 'Standard caution advised.'}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      Signals: {scan.signals.filter((s) => s.detected).length} flags
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/website/${scan.domain}`}
                        className="text-slate-300 hover:text-white font-black uppercase text-[11px]"
                      >
                        Dossier
                      </Link>
                      <Link
                        to={`/scan/${scan.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 font-black uppercase text-[11px] flex items-center gap-1"
                      >
                        <span>Report</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
