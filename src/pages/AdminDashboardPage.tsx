import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Report, Website, MockTransaction } from '../types';
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  CreditCard,
  RotateCcw,
  Trash2,
  Edit,
  ExternalLink,
  ShieldCheck,
  RefreshCcw,
  Sparkles,
  Database,
  Server
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [transactions, setTransactions] = useState<MockTransaction[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [activeTab, setActiveTab] = useState<'REPORTS' | 'WEBSITES' | 'TRANSACTIONS'>('REPORTS');
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);
  const [editScore, setEditScore] = useState(50);
  const [editBadge, setEditBadge] = useState<string>('NEEDS_CAUTION');

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, reportsRes, websitesRes, txRes, dbStatusRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminReports('ALL'),
        api.getAdminWebsites(),
        api.getAdminTransactions(),
        api.getDatabaseStatus().catch(() => ({ success: false, status: null }))
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (reportsRes.success) setReports(reportsRes.reports);
      if (websitesRes.success) setWebsites(websitesRes.websites);
      if (txRes.success) setTransactions(txRes.transactions);
      if (dbStatusRes.success) setDbStatus(dbStatusRes.status);
    } catch (err: any) {
      error('Admin Data Load Error', err.response?.data?.message || 'Access prohibited or network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncDatabase = async () => {
    setIsSyncingDb(true);
    try {
      const res = await api.syncDatabase();
      if (res.success) {
        setDbStatus(res.status);
        success('MongoDB Synced', 'Application state synchronized with MongoDB Atlas cluster.');
        loadData();
      }
    } catch (err: any) {
      error('MongoDB Sync Failed', err.response?.data?.message || 'Failed to sync with MongoDB.');
    } finally {
      setIsSyncingDb(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [isAdmin]);

  const handleModerateReport = async (reportId: string, status: 'CONFIRMED' | 'REJECTED') => {
    try {
      const res = await api.moderateReport(reportId, status, `Moderated by admin ${user?.name || ''}`);
      if (res.success) {
        success('Report Moderated', `Status updated to ${status}. Domain risk score recalculated.`);
        loadData();
      }
    } catch (err: any) {
      error('Moderation Failed', err.response?.data?.message);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm('Delete this report record permanently?')) return;
    try {
      const res = await api.deleteReport(reportId);
      if (res.success) {
        info('Report Deleted', 'Report removed from database.');
        loadData();
      }
    } catch (err: any) {
      error('Deletion Failed', err.response?.data?.message);
    }
  };

  const handleUpdateWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWebsite) return;
    try {
      const res = await api.updateWebsiteOverride(editingWebsite.id, {
        riskScore: Number(editScore),
        reputationBadge: editBadge as any
      });
      if (res.success) {
        success('Website Updated', `Security overrides applied for ${editingWebsite.domain}`);
        setEditingWebsite(null);
        loadData();
      }
    } catch (err: any) {
      error('Update Failed', err.response?.data?.message);
    }
  };

  const handleProcessRefund = async (txId: string, approve: boolean) => {
    try {
      const res = await api.processAdminRefund(txId, approve);
      if (res.success) {
        success('Refund Processed', approve ? 'Demo refund approved and released.' : 'Refund rejected.');
        loadData();
      }
    } catch (err: any) {
      error('Refund Action Failed', err.response?.data?.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-950/80 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-[0.2em] mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Cybersecurity Operations</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">Security Admin Center</h1>
            <p className="text-xs text-slate-400 mt-1 font-mono font-medium">
              Logged in as <strong className="text-red-400">{user?.email}</strong> • Administrative Security Clearance
            </p>
          </div>

          <button
            onClick={loadData}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 self-start sm:self-auto transition cursor-pointer"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">Total Scans Executed</div>
              <div className="text-3xl font-black text-blue-400 font-mono">{stats.totalScans}</div>
            </div>
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">High Risk Domains</div>
              <div className="text-3xl font-black text-red-400 font-mono">{stats.highRiskWebsites}</div>
            </div>
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">Pending Reports</div>
              <div className="text-3xl font-black text-amber-400 font-mono">{stats.pendingReports}</div>
            </div>
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">Confirmed Scams</div>
              <div className="text-3xl font-black text-red-400 font-mono">{stats.confirmedScams}</div>
            </div>
          </div>
        )}

        {/* MongoDB Atlas Cluster Status */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-white">MongoDB Atlas Database</span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    dbStatus?.connected
                      ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-400'
                      : 'bg-amber-950 border border-amber-500/40 text-amber-400'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${dbStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {dbStatus?.connected ? 'Atlas Connected' : 'Hybrid Local Cache'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Cluster: <strong className="text-slate-300">{dbStatus?.cluster || 'cluster0.qjtkz6v.mongodb.net'}</strong> • DB: <strong className="text-slate-300">{dbStatus?.dbName || 'safecart'}</strong>
                {dbStatus?.pingLatencyMs !== undefined && dbStatus?.pingLatencyMs !== null && (
                  <span> • Latency: <strong className="text-emerald-400">{dbStatus.pingLatencyMs}ms</strong></span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={handleSyncDatabase}
              disabled={isSyncingDb}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
              <span>{isSyncingDb ? 'Syncing Collections...' : 'Sync MongoDB Atlas'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-2 text-xs font-black uppercase tracking-wider">
          {[
            { id: 'REPORTS', label: `Moderation Queue (${reports.length})`, icon: ShieldAlert },
            { id: 'WEBSITES', label: `Domain Profiles (${websites.length})`, icon: FileText },
            { id: 'TRANSACTIONS', label: `Sandbox Logs (${transactions.length})`, icon: CreditCard }
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-red-950 text-red-300 border border-red-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Loading */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 rounded-full border-4 border-red-500/20 border-t-red-400 animate-spin mx-auto mb-3" />
            <span className="text-xs text-slate-400 font-medium">Loading administrative records...</span>
          </div>
        ) : (
          <>
            {/* Tab 1: Moderation Queue */}
            {activeTab === 'REPORTS' && (
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400 font-medium">
                    No community dispute reports in queue.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-xs shadow-lg"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-white">{report.domain}</span>
                            <span
                              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase font-mono ${
                                report.status === 'CONFIRMED'
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                  : report.status === 'PENDING'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {report.status}
                            </span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400 font-medium">By: {report.reporterName}</span>
                          </div>

                          <div className="text-slate-500 font-mono text-[11px]">
                            {new Date(report.createdAt).toLocaleString()}
                          </div>
                        </div>

                        <div>
                          <div className="font-bold text-red-300 uppercase tracking-wider text-[11px]">{report.reason}</div>
                          <p className="text-slate-300 mt-1 leading-relaxed font-medium">{report.description}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-4 text-slate-400 font-medium">
                            <span>Issue: <strong className="text-slate-200">{report.transactionIssue}</strong></span>
                            {report.financialLossAmount > 0 && (
                              <span className="font-mono font-bold text-red-400">Reported Loss: ${report.financialLossAmount.toFixed(2)}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {report.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleModerateReport(report.id, 'CONFIRMED')}
                                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider text-[11px] transition flex items-center gap-1.5 cursor-pointer shadow-md"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Confirm Scam</span>
                                </button>
                                <button
                                  onClick={() => handleModerateReport(report.id, 'REJECTED')}
                                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-black uppercase tracking-wider text-[11px] transition flex items-center gap-1.5 cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject Claim</span>
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteReport(report.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Websites Registry */}
            {activeTab === 'WEBSITES' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {websites.map((site) => (
                    <div
                      key={site.id}
                      className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-xs flex flex-col justify-between shadow-lg"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-sm font-bold text-white">{site.domain}</span>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              First Scanned: {new Date(site.firstScannedAt).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-black text-white font-mono text-lg">{site.riskScore}/100</div>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{site.riskLevel}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase font-mono ${
                              site.reputationBadge === 'VERIFIED_TRUSTED'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : site.reputationBadge === 'NEEDS_CAUTION'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {site.reputationBadge || 'STANDARD'}
                          </span>
                          <span className="text-slate-400 font-medium">Reports: {site.totalReports} ({site.confirmedReports} confirmed)</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <Link
                          to={`/website/${site.domain}`}
                          className="text-blue-400 hover:text-blue-300 font-black uppercase tracking-wider text-[11px] flex items-center gap-1.5"
                        >
                          <span>View Public Dossier</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>

                        <button
                          onClick={() => {
                            setEditingWebsite(site);
                            setEditScore(site.riskScore);
                            setEditBadge(site.reputationBadge || 'NEEDS_CAUTION');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black uppercase tracking-wider text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5 text-blue-400" />
                          <span>Override Risk</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Transactions */}
            {activeTab === 'TRANSACTIONS' && (
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400 font-medium">
                    No payment sandbox transactions recorded yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-xs shadow-lg"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-white">{tx.productName}</span>
                            <span className="text-slate-400 font-mono">({tx.domain})</span>
                            <span
                              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase font-mono ${
                                tx.status === 'REFUNDED'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : tx.status === 'REFUND_REQUESTED'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-blue-500/20 text-blue-300'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="font-black text-white font-mono text-base">${tx.amount.toFixed(2)}</span>
                            <span className="text-[10px] text-slate-500 font-mono block">Ref: {tx.protectionReference}</span>
                          </div>
                        </div>

                        <div className="text-slate-400 font-medium">
                          Timeline: {tx.timeline.length} updates recorded.
                        </div>

                        {tx.status === 'REFUND_REQUESTED' && (
                          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleProcessRefund(tx.id, true)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider text-[11px] flex items-center gap-1.5 cursor-pointer shadow-md"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Approve Demo Refund</span>
                            </button>
                            <button
                              onClick={() => handleProcessRefund(tx.id, false)}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-black uppercase tracking-wider text-[11px] flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Reject Dispute</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Override Modal */}
        {editingWebsite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-700 space-y-5 shadow-2xl">
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Override Risk for {editingWebsite.domain}
              </h3>

              <form onSubmit={handleUpdateWebsite} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-200 font-black uppercase tracking-wider mb-1.5">
                    Risk Score (0 - 100):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editScore}
                    onChange={(e) => setEditScore(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border-2 border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-200 font-black uppercase tracking-wider mb-1.5">
                    Reputation Classification:
                  </label>
                  <select
                    value={editBadge}
                    onChange={(e) => setEditBadge(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border-2 border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="VERIFIED_TRUSTED">VERIFIED_TRUSTED</option>
                    <option value="NEEDS_CAUTION">NEEDS_CAUTION</option>
                    <option value="HIGH_RISK">HIGH_RISK</option>
                    <option value="KNOWN_SCAM">KNOWN_SCAM</option>
                  </select>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingWebsite(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-black uppercase tracking-wider cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider cursor-pointer shadow-lg shadow-red-600/30"
                  >
                    Save Override
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
