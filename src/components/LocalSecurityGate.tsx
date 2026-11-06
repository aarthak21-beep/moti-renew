import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { hasLocalSecurity, setupLocalSecurity, unlockLocalSecurity, recoverLocalSecurity } from '../lib/secureStorage';

type Stage = 'setup' | 'unlock' | 'recover' | 'show-recovery' | 'ready';

export const LocalSecurityGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.uid || 'usr_moti_demo_01';
  const [stage, setStage] = useState<Stage>(() => hasLocalSecurity(userId) ? 'unlock' : 'setup');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [recoveryInput, setRecoveryInput] = useState('');
  const [newRecoveryKey, setNewRecoveryKey] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const resetFields = () => { setPin(''); setConfirmPin(''); setRecoveryInput(''); setError(''); };
  useEffect(() => { setStage(hasLocalSecurity(userId) ? 'unlock' : 'setup'); resetFields(); }, [userId]);

  const handleSetup = async () => {
    setError('');
    if (pin !== confirmPin) { setError('The PINs do not match.'); return; }
    setBusy(true);
    try {
      const key = await setupLocalSecurity(userId, pin);
      setNewRecoveryKey(key);
      setStage('show-recovery');
      resetFields();
    } catch (e) { setError(e instanceof Error ? e.message : 'Security setup could not be completed.'); }
    finally { setBusy(false); }
  };

  const handleUnlock = async () => {
    setBusy(true); setError('');
    try { await unlockLocalSecurity(userId, pin); setStage('ready'); resetFields(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to verify PIN.'); }
    finally { setBusy(false); }
  };

  const handleRecover = async () => {
    if (pin !== confirmPin) { setError('The new PINs do not match.'); return; }
    setBusy(true); setError('');
    try {
      const key = await recoverLocalSecurity(userId, recoveryInput, pin);
      setNewRecoveryKey(key);
      setStage('show-recovery');
      resetFields();
    } catch (e) { setError(e instanceof Error ? e.message : 'Recovery could not be completed.'); }
    finally { setBusy(false); }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300">Loading...</div>;
  if (stage === 'ready') return <>{children}</>;

  const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3.5 text-center text-lg tracking-[0.25em] text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/15 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:focus:bg-slate-800';
  const buttonClass = 'w-full rounded-xl bg-gradient-to-r from-teal-700 to-emerald-500 px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-teal-600/20 transition hover:from-teal-800 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_left,_#ccfbf1_0%,_#f0fdfa_32%,_#f8fafc_72%)] px-4 py-8 dark:bg-[radial-gradient(ellipse_at_top_left,_#134e4a_0%,_#0f172a_55%,_#020617_100%)]">
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white bg-white/95 p-7 shadow-[0_28px_90px_-25px_rgba(15,118,110,0.38)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400" />
        <div className="mb-7 flex items-center gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-400 text-sm font-black text-white shadow-lg shadow-teal-600/25 ring-4 ring-teal-50 dark:ring-teal-950">MR</div>
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-teal-600 dark:text-teal-400">MOTI TECHNOLOGIES</p>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">MOTI Renew</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Your renewals, under control.</p>
          </div>
        </div>
        <div className="mb-6 text-center">
          <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Secure access, <span className="bg-gradient-to-r from-teal-600 to-emerald-400 bg-clip-text text-transparent">made simple.</span></p>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">Your data is encrypted and securely stored on this device.</p>
        </div>

        {stage === 'setup' && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Create a new PIN</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Choose a 6–12 digit PIN. You will need it each time you open the app.</p>
            <input aria-label="New PIN" className={inputClass} type="password" inputMode="numeric" autoComplete="new-password" maxLength={12} placeholder="New PIN" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 12))} />
            <input aria-label="Re-enter PIN" className={inputClass} type="password" inputMode="numeric" autoComplete="new-password" maxLength={12} placeholder="Re-enter PIN" value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 12))} />
            <button className={buttonClass} disabled={busy || pin.length < 6 || confirmPin.length < 6} onClick={handleSetup}>{busy ? 'Setting up…' : 'Set PIN'}</button>
          </div>
        )}

        {stage === 'unlock' && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Enter your PIN to unlock the app</h2>
            <input aria-label="PIN" className={inputClass} type="password" inputMode="numeric" autoComplete="current-password" maxLength={12} placeholder="Your PIN" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 12))} onKeyDown={e => e.key === 'Enter' && void handleUnlock()} />
            <button className={buttonClass} disabled={busy || pin.length < 6} onClick={handleUnlock}>{busy ? 'Verifying…' : 'Unlock'}</button>
            <button className="w-full py-2 text-xs font-semibold text-teal-700 dark:text-teal-400" onClick={() => { resetFields(); setStage('recover'); }}>Forgot PIN? Use Recovery Key</button>
          </div>
        )}

        {stage === 'recover' && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Use Recovery Key</h2>
            <input aria-label="Recovery Key" className={inputClass + ' text-sm tracking-normal'} autoComplete="off" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" value={recoveryInput} onChange={e => setRecoveryInput(e.target.value.toUpperCase())} />
            <input aria-label="New PIN" className={inputClass} type="password" inputMode="numeric" maxLength={12} placeholder="New PIN (6–12 digits)" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 12))} />
            <input aria-label="New Re-enter PIN" className={inputClass} type="password" inputMode="numeric" maxLength={12} placeholder="New Re-enter PIN" value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 12))} />
            <button className={buttonClass} disabled={busy || !recoveryInput.trim() || pin.length < 6 || confirmPin.length < 6} onClick={handleRecover}>{busy ? 'Recovering…' : 'Reset PIN'}</button>
            <button className="w-full py-2 text-xs text-slate-500" onClick={() => { resetFields(); setStage('unlock'); }}>Go back</button>
          </div>
        )}

        {stage === 'show-recovery' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Keep your Recovery Key safe</h2>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">If you forget your PIN, use this key to create a new PIN. This key cannot be shown again. Write it down and keep it in a safe place.</p>
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-center font-mono text-lg font-bold tracking-wider text-slate-900 select-all dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">{newRecoveryKey}</div>
            <button className={buttonClass} onClick={() => { setNewRecoveryKey(''); setStage('ready'); }}>I have saved my Recovery Key in a safe place</button>
          </div>
        )}

        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        <div className="mt-7 border-t border-slate-100 pt-5 text-center dark:border-slate-800">
          <p className="text-[10px] font-medium tracking-wide text-slate-400">Never share your PIN or Recovery Key with anyone.</p>
          <p className="mt-2 text-[10px] font-medium tracking-wide text-slate-400">Developed by <span className="font-extrabold text-slate-600 dark:text-slate-300">MOTI TECHNOLOGIES</span></p>
        </div>
      </div>
    </div>
  );
};
