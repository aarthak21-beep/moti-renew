import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { hasLocalSecurity, setupLocalSecurity, unlockLocalSecurity, recoverLocalSecurity } from '../lib/secureStorage';

type Stage = 'setup' | 'unlock' | 'recover' | 'show-recovery' | 'ready';

export const LocalSecurityGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.uid || 'usr_moti_demo_01';
  const [stage, setStage] = useState<Stage>(() => hasLocalSecurity(userId) ? 'unlock' : 'setup');
  useEffect(() => { setStage(hasLocalSecurity(userId) ? 'unlock' : 'setup'); resetFields(); }, [userId]);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [recoveryInput, setRecoveryInput] = useState('');
  const [newRecoveryKey, setNewRecoveryKey] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const resetFields = () => { setPin(''); setConfirmPin(''); setRecoveryInput(''); setError(''); };

  const handleSetup = async () => {
    setError('');
    if (pin !== confirmPin) { setError('दोन्ही PIN जुळत नाहीत.'); return; }
    setBusy(true);
    try {
      const key = await setupLocalSecurity(userId, pin);
      setNewRecoveryKey(key);
      setStage('show-recovery');
      resetFields();
    } catch (e) { setError(e instanceof Error ? e.message : 'सुरक्षा सेटअप पूर्ण झाले नाही.'); }
    finally { setBusy(false); }
  };

  const handleUnlock = async () => {
    setBusy(true); setError('');
    try { await unlockLocalSecurity(userId, pin); setStage('ready'); resetFields(); }
    catch (e) { setError(e instanceof Error ? e.message : 'PIN तपासता आला नाही.'); }
    finally { setBusy(false); }
  };

  const handleRecover = async () => {
    if (pin !== confirmPin) { setError('दोन्ही नवीन PIN जुळत नाहीत.'); return; }
    setBusy(true); setError('');
    try {
      const key = await recoverLocalSecurity(userId, recoveryInput, pin);
      setNewRecoveryKey(key);
      setStage('show-recovery');
      resetFields();
    } catch (e) { setError(e instanceof Error ? e.message : 'Recovery पूर्ण झाले नाही.'); }
    finally { setBusy(false); }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300">Loading...</div>;
  if (stage === 'ready') return <>{children}</>;

  const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-lg tracking-[0.25em] text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
  const buttonClass = 'w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl dark:bg-blue-950">🔐</div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">MOTI Renew Security</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">तुमचा डेटा या डिव्हाइसवर एन्क्रिप्ट करून सुरक्षित ठेवला जातो.</p>
        </div>

        {stage === 'setup' && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">नवीन PIN तयार करा</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">६ ते १२ अंकांचा PIN ठेवा. हा PIN प्रत्येक वेळी अॅप उघडताना लागेल.</p>
            <input aria-label="नवीन PIN" className={inputClass} type="password" inputMode="numeric" autoComplete="new-password" maxLength={12} placeholder="नवीन PIN" value={pin} onChange={e => setPin(e.target.value.replace(/\\D/g, '').slice(0, 12))} />
            <input aria-label="PIN पुन्हा टाका" className={inputClass} type="password" inputMode="numeric" autoComplete="new-password" maxLength={12} placeholder="PIN पुन्हा टाका" value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\\D/g, '').slice(0, 12))} />
            <button className={buttonClass} disabled={busy || pin.length < 6 || confirmPin.length < 6} onClick={handleSetup}>{busy ? 'सेटअप सुरू आहे…' : 'PIN सेट करा'}</button>
          </div>
        )}

        {stage === 'unlock' && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">PIN टाकून अॅप उघडा</h2>
            <input aria-label="PIN" className={inputClass} type="password" inputMode="numeric" autoComplete="current-password" maxLength={12} placeholder="तुमचा PIN" value={pin} onChange={e => setPin(e.target.value.replace(/\\D/g, '').slice(0, 12))} onKeyDown={e => e.key === 'Enter' && void handleUnlock()} />
            <button className={buttonClass} disabled={busy || pin.length < 6} onClick={handleUnlock}>{busy ? 'तपासत आहे…' : 'Unlock'}</button>
            <button className="w-full py-2 text-xs font-semibold text-blue-600 dark:text-blue-400" onClick={() => { resetFields(); setStage('recover'); }}>PIN विसरलात? Recovery Key वापरा</button>
          </div>
        )}

        {stage === 'recover' && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Recovery Key वापरा</h2>
            <input aria-label="Recovery Key" className={inputClass + ' text-sm tracking-normal'} autoComplete="off" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" value={recoveryInput} onChange={e => setRecoveryInput(e.target.value.toUpperCase())} />
            <input aria-label="नवीन PIN" className={inputClass} type="password" inputMode="numeric" maxLength={12} placeholder="नवीन PIN (६-१२ अंक)" value={pin} onChange={e => setPin(e.target.value.replace(/\\D/g, '').slice(0, 12))} />
            <input aria-label="नवीन PIN पुन्हा टाका" className={inputClass} type="password" inputMode="numeric" maxLength={12} placeholder="नवीन PIN पुन्हा टाका" value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\\D/g, '').slice(0, 12))} />
            <button className={buttonClass} disabled={busy || !recoveryInput.trim() || pin.length < 6 || confirmPin.length < 6} onClick={handleRecover}>{busy ? 'Recovery सुरू आहे…' : 'PIN Reset करा'}</button>
            <button className="w-full py-2 text-xs text-slate-500" onClick={() => { resetFields(); setStage('unlock'); }}>मागे जा</button>
          </div>
        )}

        {stage === 'show-recovery' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Recovery Key सुरक्षित ठेवा</h2>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">PIN विसरल्यास ही Key वापरून नवीन PIN तयार करता येईल. ही Key पुन्हा दाखवता येणार नाही. कागदावर लिहून सुरक्षित ठेवा.</p>
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-center font-mono text-lg font-bold tracking-wider text-slate-900 select-all dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">{newRecoveryKey}</div>
            <button className={buttonClass} onClick={() => { setNewRecoveryKey(''); setStage('ready'); }}>मी Recovery Key सुरक्षित ठेवली आहे</button>
          </div>
        )}

        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        <p className="mt-5 text-center text-[10px] text-slate-400">PIN आणि Recovery Key कोणालाही सांगू नका.</p>
      </div>
    </div>
  );
};
