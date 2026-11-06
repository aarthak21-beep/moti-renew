import React, { useEffect, useState } from "react";
import { activateOrVerifyLicense, getSavedLicenseKey, isLicenseCheckEnabled } from "../lib/license";

const messages: Record<string, string> = {
  not_found: "License key was not found.",
  expired: "Your license has expired. Please contact support for renewal.",
  suspended: "This license is currently suspended. Please contact the administrator.",
  device_mismatch: "This license is linked to another device. Please ask the administrator to reset the device.",
  missing_details: "License information is incomplete.",
  verification_failed: "Unable to verify the license. Check your internet connection and try again.",
};

export const LicenseGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const enabled = isLicenseCheckEnabled();
  const [licenseKey, setLicenseKey] = useState(getSavedLicenseKey());
  const [checking, setChecking] = useState(enabled);
  const [active, setActive] = useState(!enabled);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) return;
    const saved = getSavedLicenseKey();
    if (!saved) { setChecking(false); setActive(false); return; }
    activateOrVerifyLicense(saved)
      .then(() => { setActive(true); setError(""); })
      .catch((reason: Error) => { setActive(false); setError(messages[reason.message] || messages.verification_failed); })
      .finally(() => setChecking(false));
  }, [enabled]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setChecking(true);
    setError("");
    try {
      await activateOrVerifyLicense(licenseKey);
      setActive(true);
    } catch (reason) {
      setActive(false);
      setError(messages[(reason as Error).message] || messages.verification_failed);
    } finally {
      setChecking(false);
    }
  };

  if (!enabled || active) return <>{children}</>;
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-7 text-white shadow-2xl">
        <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Moti Technologies</div>
        <h1 className="text-2xl font-extrabold">MOTI Renew</h1>
        <p className="mt-2 text-sm text-slate-300">Enter your license key to continue.</p>
        {checking ? (
          <div className="mt-6 text-sm text-slate-300">Verifying license…</div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <input value={licenseKey} onChange={event => setLicenseKey(event.target.value)} required placeholder="MOTI-XXXX-XXXX" className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500" />
            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
            <button disabled={!licenseKey.trim()} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50">Activate License</button>
          </form>
        )}
        <p className="mt-5 text-xs leading-5 text-slate-400">Your personal subscription and payment data stays in this device's browser.</p>
      </div>
    </div>
  );
};
