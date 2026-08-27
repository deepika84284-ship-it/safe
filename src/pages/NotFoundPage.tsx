import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Home, Search } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full p-8 sm:p-10 rounded-3xl bg-slate-900 border-2 border-slate-800 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="text-5xl font-black font-mono text-white tracking-tighter">404</div>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">Security Dossier Not Found</h1>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            The target record you are trying to reach does not exist or has been relocated within the telemetry archive.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
          <Link
            to="/scanner"
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-blue-600/30 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Scan Domain</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
