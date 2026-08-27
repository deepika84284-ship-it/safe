import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Shield,
  Search,
  History,
  AlertTriangle,
  BookOpen,
  Info,
  LayoutDashboard,
  ShieldAlert,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  CreditCard,
  Globe,
  Languages
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [quickUrl, setQuickUrl] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleQuickScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;
    navigate(`/scanner?url=${encodeURIComponent(quickUrl.trim())}`);
    setQuickUrl('');
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-105 transition">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-black text-lg text-white tracking-tight leading-none flex items-center gap-1.5 uppercase">
              SafeCart
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/60 uppercase tracking-widest">
                SHIELD
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {t('nav.brandSubtitle')}
            </div>
          </div>
        </Link>

        {/* Desktop Quick Scanner Input */}
        <form onSubmit={handleQuickScan} className="hidden xl:flex items-center flex-1 max-w-xs mx-2">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={quickUrl}
              onChange={(e) => setQuickUrl(e.target.value)}
              placeholder={t('nav.searchPlaceholder')}
              className="w-full pl-9 pr-20 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] uppercase tracking-wider transition shadow-sm cursor-pointer"
            >
              {t('nav.scanBtn')}
            </button>
          </div>
        </form>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1">
          <Link
            to="/scanner"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
              isActive('/scanner') ? 'text-blue-400 bg-blue-950/60 border border-blue-800/40' : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            {t('nav.scanner')}
          </Link>
          <Link
            to="/social-scanner"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
              isActive('/social-scanner')
                ? 'text-pink-400 bg-pink-950/70 border border-pink-500/40 shadow-sm shadow-pink-500/20'
                : 'text-pink-300 hover:text-pink-200 hover:bg-pink-950/40 border border-pink-500/20'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
            <span>{t('nav.socialShield')}</span>
          </Link>
          <Link
            to="/ai-assistant"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
              isActive('/ai-assistant')
                ? 'text-purple-300 bg-purple-950/70 border border-purple-500/50 shadow-sm shadow-purple-500/20'
                : 'text-purple-300 hover:text-white hover:bg-purple-950/40 border border-purple-500/30'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
            <span>{t('nav.aiCopilot')}</span>
          </Link>
          <Link
            to="/gpay-escrow"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
              isActive('/gpay-escrow')
                ? 'text-emerald-300 bg-emerald-950/70 border border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                : 'text-emerald-300 hover:text-white hover:bg-emerald-950/40 border border-emerald-500/30'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('nav.gpayEscrow')}</span>
          </Link>
          <Link
            to="/history"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
              isActive('/history') ? 'text-blue-400 bg-blue-950/60 border border-blue-800/40' : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            {t('nav.history')}
          </Link>
          <Link
            to="/report"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
              isActive('/report') ? 'text-blue-400 bg-blue-950/60 border border-blue-800/40' : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            {t('nav.reportScam')}
          </Link>
          <Link
            to="/safety-tips"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
              isActive('/safety-tips') ? 'text-blue-400 bg-blue-950/60 border border-blue-800/40' : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            {t('nav.safetyTips')}
          </Link>
        </nav>

        {/* Language Switcher & User Auth Area */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Language Toggle Button */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-0.5 shadow-inner">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-blue-600 text-white shadow-sm font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Switch to English"
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('ta')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                language === 'ta'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="தமிழுக்கு மாற்றுக"
            >
              தமிழ்
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-200 hover:border-slate-700 transition"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t('nav.dashboard')}</span>
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-800/80 text-xs font-bold uppercase tracking-wider text-red-300 hover:bg-red-900/60 transition"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    <span>{t('nav.adminPanel')}</span>
                  </Link>
                )}

                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-slate-900 transition"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 transition shadow-md shadow-blue-600/30"
                >
                  {t('nav.getStarted')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-slate-950 px-4 py-4 space-y-3">
          {/* Mobile Language Switcher */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>மொழி / Language:</span>
            </span>
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-0.5">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('ta')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  language === 'ta' ? 'bg-amber-600 text-white' : 'text-slate-400'
                }`}
              >
                தமிழ்
              </button>
            </div>
          </div>

          <form onSubmit={handleQuickScan} className="flex gap-2">
            <input
              type="text"
              value={quickUrl}
              onChange={(e) => setQuickUrl(e.target.value)}
              placeholder={t('nav.searchPlaceholder')}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              {t('nav.scanBtn')}
            </button>
          </form>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs font-bold uppercase tracking-wider">
            <Link
              to="/scanner"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg bg-slate-900/60 text-slate-200 hover:text-blue-400"
            >
              {t('nav.scanner')}
            </Link>
            <Link
              to="/social-scanner"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg bg-pink-950/60 text-pink-300 border border-pink-500/30 hover:text-pink-200"
            >
              {t('nav.socialShield')}
            </Link>
            <Link
              to="/ai-assistant"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg bg-purple-950/60 text-purple-300 border border-purple-500/30 hover:text-purple-200 text-center"
            >
              ✨ {t('nav.aiCopilot')}
            </Link>
            <Link
              to="/gpay-escrow"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 hover:text-emerald-200 text-center flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('nav.gpayEscrow')}</span>
            </Link>
            <Link
              to="/history"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg bg-slate-900/60 text-slate-200 hover:text-blue-400"
            >
              {t('nav.history')}
            </Link>
            <Link
              to="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg bg-slate-900/60 text-slate-200 hover:text-blue-400"
            >
              {t('nav.reportScam')}
            </Link>
            <Link
              to="/safety-tips"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg bg-slate-900/60 text-slate-200 hover:text-blue-400"
            >
              {t('nav.safetyTips')}
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg bg-slate-900/60 text-slate-200 hover:text-blue-400"
            >
              {t('nav.about')}
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            {isAuthenticated && user ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-slate-400 font-mono">{user.email}</span>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-red-400 font-bold uppercase tracking-wider cursor-pointer"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center rounded-xl bg-slate-900 text-xs font-bold uppercase tracking-wider text-white"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center rounded-xl bg-blue-600 text-xs font-bold uppercase tracking-wider text-white"
                >
                  {t('nav.getStarted')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
