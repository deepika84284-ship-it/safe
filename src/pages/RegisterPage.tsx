import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Shield, Lock, Mail, User as UserIcon, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      error('Password Too Short', 'Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    const res = await register(name, email, password);
    setIsLoading(false);

    if (res.success) {
      success('Account Created', 'Welcome to SafeCart. Your account is active.');
      navigate('/dashboard');
    } else {
      error('Registration Error', res.message);
    }
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
            Create SafeCart Account
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Join the decentralized community defense network and verify online vendors.
          </p>
        </div>

        {/* Form Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-1.5">
                Full Name
              </label>
              <div className="relative flex items-center">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-4" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border-2 border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>

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
                Password (min. 6 characters)
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
                <span>{isLoading ? 'Registering...' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Already have an account?</span>
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-black uppercase tracking-wider">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
