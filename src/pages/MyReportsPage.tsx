import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Report } from '../types';
import {
  FileText,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Plus
} from 'lucide-react';

export const MyReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await api.getMyReports();
        if (res.success && res.reports) {
          setReports(res.reports);
        }
      } catch (err) {
        console.error('Failed to load user reports', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const filteredReports = reports.filter((r) => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-wider font-mono mb-2">
              <FileText className="w-3.5 h-3.5" />
              <span>Community Submissions</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">My Scam Reports</h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Track the moderation review and confirmation status of websites you have submitted.
            </p>
          </div>

          <Link
            to="/report"
            className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider text-xs flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-red-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Submit New Report</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-2 text-xs font-black uppercase tracking-wider font-mono">
          {['ALL', 'PENDING', 'REVIEWED', 'CONFIRMED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mx-auto mb-3" />
            <span className="text-xs text-slate-400 font-mono">Loading your submissions...</span>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3 shadow-xl">
            <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-black text-white uppercase tracking-wider">No Reports in this Category</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
              You have not submitted any website reports matching the selected status filter.
            </p>
            <div className="pt-2">
              <Link
                to="/report"
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider text-xs transition inline-block cursor-pointer shadow-lg shadow-blue-600/30"
              >
                Report a Scam Website
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-3 shadow-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-black text-white">{report.domain}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider font-mono border ${
                        report.status === 'CONFIRMED'
                          ? 'bg-red-500/20 text-red-300 border-red-500/40'
                          : report.status === 'PENDING'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : report.status === 'REVIEWED'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>

                  <span className="text-xs text-slate-500 font-mono font-medium">
                    Submitted: {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-red-400 font-mono">{report.reason}</div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed font-medium">{report.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4 text-slate-400 font-medium">
                    <span>Issue: <strong className="text-slate-200 font-bold">{report.transactionIssue}</strong></span>
                    {report.financialLossAmount > 0 && (
                      <span className="font-mono text-red-400 font-bold">Loss: ${report.financialLossAmount.toFixed(2)}</span>
                    )}
                  </div>

                  <Link
                    to={`/website/${report.domain}`}
                    className="text-blue-400 hover:text-blue-300 font-black uppercase tracking-wider text-xs flex items-center gap-1 font-mono"
                  >
                    <span>View Target Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
