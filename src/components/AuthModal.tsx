import React, { useState } from 'react';
import { X, Lock, User, Building2, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { translations, Language } from '../i18n/translations';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, loginWithEmail, signupWithEmail } = useAuth();
  const lang: Language = user?.language || 'en';
  const t = translations[lang] || translations.en;

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        if (!userId.trim() || !password) {
          setError('Please provide User ID and password');
          return;
        }
        const signedIn = await loginWithEmail(userId.trim(), password);
        if (!signedIn) throw new Error('Sign in did not complete. Check the User ID and password, then try again.');
        onClose();
      } else if (mode === 'signup') {
        if (!name.trim() || !userId.trim() || !password) {
          setError('Please fill all required fields');
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          return;
        }
        setSuccessMessage('Creating your account... Please wait.');
        const created = await signupWithEmail(name.trim(), userId.trim(), company.trim(), password);
        if (!created) throw new Error('Account was not created. Check Supabase Email confirmation settings and try again.');
        setSuccessMessage('Account created successfully! You can now sign in using your User ID and password.');
      }
    } catch (err: any) {
      setSuccessMessage(null);
      setError(err?.message || 'Authentication operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[radial-gradient(ellipse_at_top_left,_#ccfbf1_0%,_#f0fdfa_32%,_#f8fafc_72%)] dark:bg-[radial-gradient(ellipse_at_top_left,_#134e4a_0%,_#0f172a_55%,_#020617_100%)] flex items-center justify-center p-4">
      <div className="relative w-full max-w-md overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2rem] shadow-[0_28px_90px_-25px_rgba(15,118,110,0.38)] border border-white dark:border-slate-700 p-7 sm:p-8 animate-in zoom-in-95 duration-200">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400" />
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-400 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-teal-600/25 ring-4 ring-teal-50 dark:ring-teal-950">
              MR
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-teal-600 dark:text-teal-400">MOTI TECHNOLOGIES</p>
              <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {mode === 'signin' ? t.auth.signIn : mode === 'signup' ? t.auth.signUp : t.auth.resetPassword}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Moti Renew <span className="text-teal-500">•</span> Stay ahead of every renewal
              </p>
            </div>
          </div>
          {user && <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>}
        </div>

        <div className="mt-7 mb-6">
          <p className="text-2xl sm:text-[1.7rem] leading-tight font-extrabold tracking-tight text-slate-900 dark:text-white">
            Your renewals, <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-400">under control.</span>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Sign in to manage subscriptions, track payments and never miss an important date.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {t.auth.displayName} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aarthak Sharma"
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
              />
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {t.auth.companyName}
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Moti Technologies"
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              User ID *
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={30}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. moti_admin"
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
            />
          </div>

          {true && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  {t.auth.password} *
                </label>
      
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 text-sm font-extrabold rounded-xl bg-gradient-to-r from-teal-700 to-emerald-500 hover:from-teal-800 hover:to-emerald-600 text-white shadow-lg shadow-teal-600/20 disabled:opacity-50 transition cursor-pointer"
          >
            {loading 
              ? 'Processing...' 
              : mode === 'signin' 
              ? t.auth.signIn 
              : mode === 'signup' 
              ? t.auth.signUp 
              : t.auth.signIn}
          </button>

          {/* Toggle between modes */}
          <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            {mode === 'signin' ? (
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); setSuccessMessage(null); }}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                {t.auth.dontHaveAccount}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); setSuccessMessage(null); }}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                {t.auth.alreadyHaveAccount}
              </button>
            )}
          </div>
        </form>

        <div className="mt-7 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-500">
            Developed by <span className="font-extrabold text-slate-600 dark:text-slate-300">MOTI TECHNOLOGIES</span>
          </p>
        </div>
      </div>
    </div>
  );
};
