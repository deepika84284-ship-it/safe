import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Shield, Lock, Mail, ArrowRight, UserCheck, ShieldAlert } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const redirectParam = searchParams.get('redirect');
  const fromLocation = (location.state as any)?.from?.pathname;
  const rawTarget = redirectParam ? decodeURIComponent(redirectParam) : (fromLocation || null);
  const targetRedirect = rawTarget && rawTarget.startsWith('/') && !rawTarget.startsWith('/login') && !rawTarget.startsWith('/register') ? rawTarget : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      success('Welcome back!', 'Successfully signed in to SafeCart.');
      if (targetRedirect) {
        navigate(targetRedirect);
      } else if (res.user?.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      error('Authentication Failed', res.message || 'Invalid email or password.');
    }
  };

  const handleFillDemoUser = () => {
    setEmail('user@safecart.local');
    setPassword('User123!');
  };

  const handleFillDemoAdmin = () => {
    setEmail('admin@safecart.local');
    setPassword('Admin123!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Brand */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 mx-auto text-white">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Sign In to SafeCart
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Access your verified scan history, track scam reports, and protect transactions.
          </p>
        </div>

        {/* Demo Credentials Quick Switch Bar */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
          <div className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-mono">
            <UserCheck className="w-4 h-4 text-blue-400" />
            <span>Quick Demo Credentials:</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleFillDemoUser}
              className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 text-[11px] font-black uppercase tracking-wider text-slate-300 hover:text-white transition text-center cursor-pointer font-mono"
            >
              Demo Consumer
            </button>
            <button
              type="button"
              onClick={handleFillDemoAdmin}
              className="py-2 px-3 rounded-xl bg-red-950/40 border border-red-800/60 hover:border-red-500 text-[11px] font-black uppercase tracking-wider text-red-400 hover:text-white transition text-center cursor-pointer font-mono"
            >
              Demo Admin
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-1.5">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-500 absolute left-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border-2 border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-500 absolute left-4" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border-2 border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
              >
                <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Don't have an account?</span>
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-black uppercase tracking-wider">
              Create Account
            </Link>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/admin/login"
            className="text-xs text-slate-500 hover:text-red-400 font-mono inline-flex items-center gap-1.5 transition font-bold"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Cybersecurity Admin Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
