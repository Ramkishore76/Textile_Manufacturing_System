import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Factory, ShieldCheck, ArrowRight, Lock, Mail } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post<any>('/auth/login', { email, password });
      login(res.token, res.user);
      navigate(res.redirectUrl || '/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Owner / Admin', email: 'admin@everesttextile.com', pass: 'Admin@123' },
    { role: 'Sales Staff', email: 'sales@everesttextile.com', pass: 'Sales@123' },
    { role: 'Store Manager', email: 'store@everesttextile.com', pass: 'Store@123' },
    { role: 'Production Mgr', email: 'production@everesttextile.com', pass: 'Prod@123' },
    { role: 'Quality Inspector', email: 'quality@everesttextile.com', pass: 'Quality@123' },
    { role: 'Dispatch Staff', email: 'dispatch@everesttextile.com', pass: 'Dispatch@123' },
    { role: 'HR & Accounts', email: 'accounts@everesttextile.com', pass: 'Accounts@123' },
    { role: 'Buyer (Nordic)', email: 'buyer@nordicapparel.com', pass: 'Buyer@123' },
    { role: 'Buyer (CasualLine)', email: 'buyer@casualline.com', pass: 'Buyer@123' },
  ];

  const handleSelectDemo = (acc: (typeof demoAccounts)[0]) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-lg bg-neutral-900 items-center justify-center text-white mb-3">
          <Factory className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
          Everest Textile Mills
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          Integrated Textile Manufacturing Management System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-xl border border-neutral-200 shadow-sm">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@everesttextile.com"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-300 rounded-md text-sm text-neutral-900 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition placeholder:text-neutral-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-300 rounded-md text-sm text-neutral-900 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition placeholder:text-neutral-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-md text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 transition disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Authenticating...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          {/* Demo Persona Fast-Click Switcher */}
          <div className="mt-6 pt-5 border-t border-neutral-100">
            <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider text-center mb-3">
              One-Click Role Demo Logins
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleSelectDemo(acc)}
                  className="px-2 py-1.5 rounded-md border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-300 text-[11px] font-medium text-neutral-700 truncate transition"
                  title={`${acc.role} (${acc.email})`}
                >
                  {acc.role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
