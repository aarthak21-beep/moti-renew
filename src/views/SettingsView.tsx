import React, { useRef, useState } from 'react';
import { 
  User, 
  Building2, 
  Mail, 
  Globe, 
  DollarSign, 
  Sun, 
  Moon, 
  Check, 
  Save, 
  Download,
  Upload,
  HardDrive
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { translations, Language } from '../i18n/translations';
import { Currency } from '../types';
import { readSecureData, writeSecureData } from '../lib/secureStorage';

export const SettingsView: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const lang: Language = user?.language || 'en';
  const t = translations[lang] || translations.en;

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [defaultCurrency, setDefaultCurrency] = useState<Currency>(user?.defaultCurrency || 'INR');
  const [selectedLang, setSelectedLang] = useState<Language>(user?.language || 'en');
  const [theme, setTheme] = useState<'light' | 'dark'>(user?.theme || 'light');
  const [savedMessage, setSavedMessage] = useState(false);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      displayName: displayName.trim(),
      companyName: companyName.trim(),
      defaultCurrency,
      language: selectedLang,
      theme,
    });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {t.nav.settings}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure organisation profile, default currency, multi-language localization, and database settings.
        </p>
      </div>

      {savedMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
          <Check className="w-4 h-4 shrink-0" />
          <span>Settings saved and synchronized successfully!</span>
        </div>
      )}

      {/* Local backup and restore */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <HardDrive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Backup & Restore</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Export your subscriptions, payment history and activity as a file. Keep the file somewhere safe. Restore replaces the current records on this device.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={async () => {
              const userId = user?.uid || 'usr_moti_demo_01';
              const raw = await readSecureData<{ subscriptions?: unknown[]; payments?: unknown[]; activities?: unknown[] }>(userId);
              const data: { subscriptions: unknown[]; payments: unknown[]; activities: unknown[] } = { subscriptions: [], payments: [], activities: [] };
              if (raw) {
                data = {
                  subscriptions: Array.isArray(raw.subscriptions) ? raw.subscriptions : [],
                  payments: Array.isArray(raw.payments) ? raw.payments : [],
                  activities: Array.isArray(raw.activities) ? raw.activities : [],
                };
              }
              const backup = {
                app: 'MOTI Renew',
                formatVersion: 1,
                createdAt: new Date().toISOString(),
                data,
              };
              const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `moti-renew-backup-${new Date().toISOString().slice(0, 10)}.json`;
              document.body.appendChild(link);
              link.click();
              link.remove();
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Download Backup
          </button>
          <button
            type="button"
            onClick={() => backupInputRef.current?.click()}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Restore from Backup
          </button>
          <input
            ref={backupInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) return;
              if (file.size > 25 * 1024 * 1024) {
                alert('Backup file is too large (maximum 25 MB).');
                return;
              }
              try {
                const parsed = JSON.parse(await file.text());
                const data = parsed?.data;
                if (parsed?.app !== 'MOTI Renew' || parsed?.formatVersion !== 1 ||
                    !data || !Array.isArray(data.subscriptions) ||
                    !Array.isArray(data.payments) || !Array.isArray(data.activities)) {
                  throw new Error('This is not a supported MOTI Renew backup file.');
                }
                if (!window.confirm('Restore this backup? Your current subscriptions, payments and activity on this device will be replaced.')) return;
                const userId = user?.uid || 'usr_moti_demo_01';
                await writeSecureData(userId, data);
                alert('Backup restored. The app will now reload.');
                window.location.reload();
              } catch (error) {
                alert(error instanceof Error ? error.message : 'Could not restore this backup file.');
              }
            }}
          />
        </div>
        <p className="text-[11px] text-amber-700 dark:text-amber-300">
          Backup files contain business and payment information. Store them securely and do not share them publicly.
        </p>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            User & Organisation Profile
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {t.auth.displayName}
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              {t.auth.companyName}
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            {t.auth.email}
          </label>
          <input
            type="email"
            disabled
            value={user?.email || 'aarthak21@gmail.com'}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            Email is tied to your individual tenant authentication account.
          </span>
        </div>

        {/* Currency & Language Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              Default Currency
            </label>
            <select
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value as Currency)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="INR">INR (₹ Indian Rupee)</option>
              <option value="USD">USD ($ US Dollar)</option>
              <option value="EUR">EUR (€ Euro)</option>
              <option value="GBP">GBP (£ British Pound)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              Language
            </label>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value as Language)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="en">🇺🇸 English</option>
              <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
              <option value="mr">🇮🇳 मराठी (Marathi)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-slate-400" /> : <Sun className="w-3.5 h-3.5 text-slate-400" />}
              Appearance Theme
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="light">Light Mode (Clean SaaS)</option>
              <option value="dark">Dark Mode (Midnight Navy)</option>
            </select>
          </div>

        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{t.actions.save}</span>
          </button>
        </div>

      </form>

      {/* About Moti Technologies Footer */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white shadow-md border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-sm tracking-tight text-white">
            Moti Renew
          </span>
          <span className="text-xs text-blue-300 font-semibold">
            By Moti Technologies
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
          Designed specifically for growing Indian businesses and global founders to maintain 100% control over recurring SaaS expenditure and critical renewal schedules.
        </p>
      </div>

    </div>
  );
};
