import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { ScanResult, Report, MockTransaction } from '../types';
import {
  LayoutDashboard,
  Shield,
  Search,
  History,
  FileText,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Plus
} from 'lucide-react';

export const UserDashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [transactions, setTransactions] = useState<MockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickScanUrl, setQuickScanUrl] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [scansRes, reportsRes, txRes] = await Promise.all([
          api.getScanHistory(6),
          api.getMyReports(),
          api.getMyTransactions()
        ]);

        if (scansRes.success) setRecentScans(scansRes.scans || []);
        if (reportsRes.success) setMyReports(reportsRes.reports || []);
        if (txRes.success) setTransactions(txRes.transactions || []);
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated]);

  const handleQuickScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickScanUrl.trim()) return;
    navigate(`/scanner?url=${encodeURIComponent(quickScanUrl.trim())}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* User Hero Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-950 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-[0.2em] mb-2">
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{language === 'ta' ? 'நுகர்வோர் பாதுகாப்பு தளம்' : 'Consumer Shield Hub'}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
                {language === 'ta' ? `வணக்கம், ${user?.name || 'பயனர்'}` : `Welcome, ${user?.name || 'Shopper'}`}
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-mono font-medium">{user?.email}</p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/scanner"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{language === 'ta' ? 'தளத்தை சோதிக்க' : 'Scan a Store'}</span>
              </Link>
              <Link
                to="/report"
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-600/30 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'ta' ? 'புகார் அளிக்க' : 'Report Scam'}</span>
              </Link>
            </div>
          </div>

          {/* Quick Scanner Bar */}
          <form onSubmit={handleQuickScan} className="pt-2">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-4" />
              <input
                type="text"
                value={quickScanUrl}
                onChange={(e) => setQuickScanUrl(e.target.value)}
                placeholder={language === 'ta' ? 'ஆன்லைன் கடையை சோதிக்கவும் (எ.கா: nike.com அல்லது suspect-shop.com)...' : 'Scan any shopping website (e.g. nike.com or suspect-shop.com)...'}
                className="w-full pl-11 pr-28 py-3.5 rounded-2xl bg-slate-950 border-2 border-slate-700 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-md"
              >
                {language === 'ta' ? 'ஸ்கேன்' : 'Scan'}
              </button>
            </div>
          </form>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
            <div className="text-xs font-black uppercase tracking-wider text-slate-400">
              {language === 'ta' ? 'செய்த மொத்த சோதனைகள்' : 'Total Scans Executed'}
            </div>
            <div className="text-3xl font-black text-blue-400 font-mono">{recentScans.length}</div>
            <div className="text-[11px] font-medium text-slate-500">
              {language === 'ta' ? 'நிகழ்நேர டொமைன் ஸ்கேன்கள்' : 'Real-time domain scans'}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
            <div className="text-xs font-black uppercase tracking-wider text-slate-400">
              {language === 'ta' ? 'சமூக மோசடி புகார்கள்' : 'Community Reports'}
            </div>
            <div className="text-3xl font-black text-red-400 font-mono">{myReports.length}</div>
            <div className="text-[11px] font-medium text-slate-500">
              {language === 'ta' ? 'பதிவு செய்யப்பட்ட புகார்கள்' : 'Fraud incident submissions'}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
            <div className="text-xs font-black uppercase tracking-wider text-slate-400">
              {language === 'ta' ? 'பாதுகாப்பு சாண்ட்பாக்ஸ் ஆர்டர்கள்' : 'Sandbox Orders'}
            </div>
            <div className="text-3xl font-black text-emerald-400 font-mono">{transactions.length}</div>
            <div className="text-[11px] font-medium text-slate-500">
              {language === 'ta' ? 'பாதுகாப்பான பரிவர்த்தனைகள்' : 'Safe sandbox simulations'}
            </div>
          </div>
        </div>

        {/* Main Content Sections: Scans & Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Scans Box */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" />
                <span>{language === 'ta' ? 'சமீபத்திய டொமைன் சோதனைகள்' : 'Recent Domain Scans'}</span>
              </h3>
              <Link to="/history" className="text-xs font-black uppercase tracking-wider text-blue-400 hover:text-blue-300">
                {language === 'ta' ? 'அனைத்தும்' : 'View All'}
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                {language === 'ta' ? 'ஏற்றுகிறது...' : 'Loading scans...'}
              </div>
            ) : recentScans.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-950 text-center text-xs text-slate-400 font-medium">
                {language === 'ta' ? 'சமீபத்திய சோதனைகள் எதுவும் இல்லை. மேலே உள்ள பெட்டியில் இணையதளத்தை உள்ளிடவும்.' : 'No recent scans yet. Try scanning a website above!'}
              </div>
            ) : (
              <div className="space-y-3">
                {recentScans.slice(0, 4).map((scan) => (
                  <div
                    key={scan.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <Link
                        to={`/scan/${scan.id}`}
                        className="font-mono font-bold text-slate-200 hover:text-blue-400 transition"
                      >
                        {scan.domain}
                      </Link>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {new Date(scan.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase font-mono ${
                          scan.score >= 80
                            ? 'bg-red-500/20 text-red-300'
                            : scan.score >= 60
                            ? 'bg-orange-500/20 text-orange-300'
                            : scan.score >= 30
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {scan.score}/100 {scan.riskLevel}
                      </span>
                      <Link
                        to={`/scan/${scan.id}`}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Incident Reports Box */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-400" />
                <span>{language === 'ta' ? 'நான் சமர்ப்பித்த புகார்கள்' : 'My Submitted Reports'}</span>
              </h3>
              <Link to="/my-reports" className="text-xs font-black uppercase tracking-wider text-red-400 hover:text-red-300">
                {language === 'ta' ? 'அனைத்தும்' : 'View All'}
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                {language === 'ta' ? 'ஏற்றுகிறது...' : 'Loading reports...'}
              </div>
            ) : myReports.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-950 text-center text-xs text-slate-400 font-medium">
                {language === 'ta' ? 'நீங்கள் இன்னும் எந்த புகாரும் சமர்ப்பிக்கவில்லை.' : 'You have not filed any incident reports yet.'}
              </div>
            ) : (
              <div className="space-y-3">
                {myReports.slice(0, 4).map((report) => (
                  <div
                    key={report.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-200">{report.domain}</div>
                      <div className="text-[11px] text-red-300 font-medium truncate max-w-[200px] mt-0.5">
                        {report.reason}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase font-mono ${
                        report.status === 'CONFIRMED'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : report.status === 'PENDING'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
