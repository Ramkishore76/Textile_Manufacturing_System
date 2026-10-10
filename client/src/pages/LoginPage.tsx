import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  Factory,
  ArrowRight,
  Lock,
  Mail,
  ShieldCheck,
  User,
  KeyRound,
  Building2,
  Phone,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  // Mode: 'SIGN_IN' | 'REGISTER' | 'VERIFY_OTP'
  const [mode, setMode] = useState<'SIGN_IN' | 'REGISTER' | 'VERIFY_OTP'>('SIGN_IN');

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('STORE');
  const [regPhone, setRegPhone] = useState('');
  const [regCompany, setRegCompany] = useState('');

  // OTP Verification State
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [devHintOtp, setDevHintOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);

  // Status & Feedback
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Resend Countdown Timer
  useEffect(() => {
    let timer: any;
    if (mode === 'VERIFY_OTP' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, countdown]);

  // Demo Accounts for Quick Testing
  const demoAccounts = [
    { role: 'Owner / Admin', email: 'admin@agttextile.com', pass: 'Admin@123' },
    { role: 'Sales Head', email: 'sales@agttextile.com', pass: 'Sales@123' },
    { role: 'Store Manager', email: 'store@agttextile.com', pass: 'Store@123' },
    { role: 'Production Mgr', email: 'production@agttextile.com', pass: 'Prod@123' },
    { role: 'Quality Inspector', email: 'quality@agttextile.com', pass: 'Quality@123' },
    { role: 'Dispatch Staff', email: 'dispatch@agttextile.com', pass: 'Dispatch@123' },
    { role: 'HR & Accounts', email: 'accounts@agttextile.com', pass: 'Accounts@123' },
    { role: 'Buyer (Nordic)', email: 'buyer@nordicapparel.com', pass: 'Buyer@123' },
    { role: 'Buyer (CasualLine)', email: 'buyer@casualline.com', pass: 'Buyer@123' },
  ];

  const handleSelectDemo = (acc: (typeof demoAccounts)[0]) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setError(null);
  };

  /**
   * Handle Step 1: Login Request (Dispatches Brevo Email OTP)
   */
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post<any>('/auth/login', { email, password });

      if (res.requiresOtp) {
        setTargetEmail(res.email);
        setMaskedEmail(res.maskedEmail || res.email);
        setUserName(res.name);
        setTempToken(res.tempToken);
        setDevHintOtp(res.devOtp || null);
        setMode('VERIFY_OTP');
        setCountdown(60);
        setCanResend(false);
        setSuccessInfo(res.message || 'Verification code sent to your email.');
      } else if (res.token) {
        // Fallback if OTP is bypassed
        login(res.token, res.user);
        navigate(res.redirectUrl || '/app/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Step 1 (Alternative): New User Registration (Dispatches Brevo Email OTP)
   */
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post<any>('/auth/register', {
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        phone: regPhone || undefined,
        companyName: regRole === 'BUYER' ? regCompany : undefined,
      });

      if (res.requiresOtp) {
        setTargetEmail(res.email);
        setMaskedEmail(res.maskedEmail || res.email);
        setUserName(res.name);
        setTempToken(res.tempToken);
        setDevHintOtp(res.devOtp || null);
        setMode('VERIFY_OTP');
        setCountdown(60);
        setCanResend(false);
        setSuccessInfo('Account created! Please check your email for the verification code.');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please review your details.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Step 2: Verify Brevo OTP Code & Authorize Session
   */
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post<any>('/auth/verify-otp', {
        email: targetEmail,
        otp: otp.trim(),
        tempToken,
      });

      login(res.token, res.user);
      navigate(res.redirectUrl || '/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resend OTP via Brevo API
   */
  const handleResendOtp = async () => {
    if (!canResend || resending) return;
    setResending(true);
    setError(null);

    try {
      const res = await api.post<any>('/auth/resend-otp', {
        email: targetEmail,
        tempToken,
      });

      setDevHintOtp(res.devOtp || null);
      setCountdown(60);
      setCanResend(false);
      setSuccessInfo(res.message || 'A new verification code has been dispatched.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-white border border-zinc-200/90 p-2 items-center justify-center mb-3 shadow-xs">
          <img src="/logo.png" alt="AGT Textile Mills Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
          AGT Textile Mills
        </h1>
        <p className="mt-1 text-xs text-zinc-500 font-medium">
          Manufacturing Vault & Role Governance Platform
        </p>

        {/* Security Badge with Brevo verification indicator */}
        <div className="inline-flex items-center space-x-1.5 mt-3 px-3 py-1 rounded-full bg-indigo-50/80 border border-indigo-200/60 text-[11px] font-medium text-indigo-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>Protected by Brevo Transactional Email Verification</span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-2xl border border-zinc-200/80 shadow-xs">
          {/* Top Segmented Mode Tabs (Sign In vs Create Account) */}
          {mode !== 'VERIFY_OTP' && (
            <div className="flex bg-zinc-100/80 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('SIGN_IN');
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  mode === 'SIGN_IN'
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('REGISTER');
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  mode === 'REGISTER'
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                New User Registration
              </button>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success / Status Alert */}
          {successInfo && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successInfo}</span>
            </div>
          )}

          {/* VIEW 1: SIGN IN FORM */}
          {mode === 'SIGN_IN' && (
            <form className="space-y-4" onSubmit={handleSignInSubmit}>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@agttextile.com"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition placeholder:text-zinc-400 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition placeholder:text-zinc-400 shadow-2xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Sending Brevo Verification Code...</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-2">
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>

              {/* Demo Persona Fast-Click Switcher */}
              <div className="mt-6 pt-5 border-t border-zinc-100">
                <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-center mb-3">
                  One-Click Persona Logins
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => handleSelectDemo(acc)}
                      className="px-2 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-[11px] font-medium text-zinc-700 truncate transition"
                      title={`${acc.role} (${acc.email})`}
                    >
                      {acc.role}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* VIEW 2: NEW USER REGISTRATION */}
          {mode === 'REGISTER' && (
            <form className="space-y-3.5" onSubmit={handleRegisterSubmit}>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Work Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="ramesh@agttextile.com"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Password (min 6 chars) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Assigned Role *
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition shadow-2xs"
                  >
                    <option value="STORE">Store Manager</option>
                    <option value="PRODUCTION">Production Manager</option>
                    <option value="QUALITY">Quality Inspector</option>
                    <option value="SALES">Sales Head</option>
                    <option value="DISPATCH">Dispatch Staff</option>
                    <option value="ACCOUNTS">Finance & Accounts</option>
                    <option value="BUYER">External Buyer Client</option>
                    <option value="ADMIN">Administrator / Owner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 98422..."
                      className="w-full pl-8 pr-2.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {regRole === 'BUYER' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Buyer Company Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={regCompany}
                      onChange={(e) => setRegCompany(e.target.value)}
                      required
                      placeholder="e.g. Nordic Apparel Corp"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition shadow-2xs"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex justify-center items-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Creating & Dispatching Brevo OTP...</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-2">
                    <span>Register & Verify Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>
          )}

          {/* VIEW 3: BREVO EMAIL OTP VERIFICATION SCREEN */}
          {mode === 'VERIFY_OTP' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center">
                <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/80 items-center justify-center text-indigo-600 mb-2 shadow-2xs">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
                  Verify Your Email
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  We sent a 6-digit security code via Brevo to
                </p>
                <div className="inline-block mt-1 font-mono font-semibold text-xs text-indigo-700 bg-indigo-50/70 border border-indigo-200/60 px-2.5 py-0.5 rounded-full">
                  {maskedEmail || targetEmail}
                </div>
              </div>

              {/* Developer / Local Sandbox Fast Autofill Badge */}
              {devHintOtp && (
                <div className="p-3 bg-amber-50/90 border border-amber-200/70 rounded-xl text-xs text-amber-900">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Brevo OTP Delivered:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtp(devHintOtp)}
                      className="px-2 py-0.5 bg-amber-200/80 hover:bg-amber-300 text-amber-900 rounded font-mono font-bold text-[11px] transition"
                    >
                      Autofill {devHintOtp}
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-2 text-center">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(val);
                    }}
                    required
                    maxLength={6}
                    autoFocus
                    placeholder="••••••"
                    className="w-full text-center py-3 bg-zinc-50 border-2 border-indigo-200 rounded-2xl text-2xl font-mono font-bold tracking-[0.5em] text-zinc-900 focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition placeholder:text-zinc-300 shadow-2xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center space-x-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Verifying with Brevo...</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2">
                      <span>Authorize Session</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </button>
              </form>

              {/* Resend Controls & Back Button */}
              <div className="pt-3 border-t border-zinc-100 flex flex-col space-y-2 text-center text-xs">
                <div className="text-zinc-500">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resending}
                      className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center space-x-1"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                      <span>{resending ? 'Resending Code...' : 'Resend Verification Code'}</span>
                    </button>
                  ) : (
                    <span>
                      Resend code available in{' '}
                      <strong className="text-zinc-700 font-mono">{countdown}s</strong>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMode('SIGN_IN');
                    setOtp('');
                    setError(null);
                    setSuccessInfo(null);
                  }}
                  className="inline-flex items-center justify-center space-x-1.5 text-zinc-400 hover:text-zinc-700 transition font-medium pt-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
