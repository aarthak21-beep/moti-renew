import React, { useEffect, useState } from "react";
import { activateOrVerifyLicense, getSavedLicenseKey, isLicenseCheckEnabled } from "../lib/license";

const messages: Record<string, string> = {
  not_found: "हा License Key सापडला नाही.",
  expired: "तुमचा License संपला आहे. नूतनीकरणासाठी संपर्क करा.",
  suspended: "हा License सध्या बंद आहे. Admin शी संपर्क करा.",
  device_mismatch: "हा License दुसऱ्या डिव्हाइसशी जोडलेला आहे. Admin कडून device reset करून घ्या.",
  missing_details: "License माहिती अपूर्ण आहे.",
  verification_failed: "License तपासता आला नाही. इंटरनेट तपासून पुन्हा प्रयत्न करा.",
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
        <p className="mt-2 text-sm text-slate-300">अॅप सुरू करण्यासाठी तुमचा License Key टाका.</p>
        {checking ? (
          <div className="mt-6 text-sm text-slate-300">License तपासत आहोत…</div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <input value={licenseKey} onChange={event => setLicenseKey(event.target.value)} required placeholder="MOTI-XXXX-XXXX" className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500" />
            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
            <button disabled={!licenseKey.trim()} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50">Activate License</button>
          </form>
        )}
        <p className="mt-5 text-xs leading-5 text-slate-400">तुमचा वैयक्तिक Subscription आणि Payment डेटा या डिव्हाइसच्या Browser मध्येच राहतो.</p>
      </div>
    </div>
  );
};
