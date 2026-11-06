import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  AlertTriangle, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldAlert, 
  Sparkles,
  Globe,
  Info,
  Calendar,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubscriptions } from '../context/SubscriptionContext';
import { translations, Language } from '../i18n/translations';
import { generateWhatsAppMessage, getWhatsAppShareUrl } from '../utils/whatsapp';
import { formatDate, getDaysUntil } from '../utils/dateUtils';
import { formatCurrency } from '../utils/currencyUtils';

interface RemindersViewProps {
  preselectedSubId?: string;
  onOpenRecordPayment: (subId: string) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  preselectedSubId,
  onOpenRecordPayment,
}) => {
  const { user } = useAuth();
  const { subscriptions, notifications, markNotificationAsRead } = useSubscriptions();

  const lang: Language = user?.language || 'en';
  const t = translations[lang] || translations.en;

  const [selectedSubId, setSelectedSubId] = useState<string>('');
  const [targetPhone, setTargetPhone] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [messageLang, setMessageLang] = useState<'en' | 'hi'>(lang === 'hi' ? 'hi' : 'en');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (preselectedSubId) {
      setSelectedSubId(preselectedSubId);
    } else if (subscriptions.length > 0 && !selectedSubId) {
      setSelectedSubId(subscriptions[0].id);
    }
  }, [preselectedSubId, subscriptions, selectedSubId]);

  const selectedSub = subscriptions.find(s => s.id === selectedSubId) || subscriptions[0];

  const generatedMessage = selectedSub 
    ? generateWhatsAppMessage(selectedSub, messageLang, recipientName)
    : '';

  const handleCopyMessage = () => {
    if (!generatedMessage) return;
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    if (!generatedMessage) return;
    const url = getWhatsAppShareUrl(targetPhone, generatedMessage);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {t.reminders.whatsAppTitle}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t.reminders.whatsAppSub}
        </p>
      </div>

      {/* Mandatory WhatsApp API Integration Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-700/60 dark:bg-amber-950/20 text-slate-900 dark:text-slate-100 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
            WhatsApp Integration & Delivery Notice
          </h4>
          <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
            {t.reminders.whatsAppDisclaimer}
          </p>
        </div>
      </div>

      {/* WhatsApp Message Generator Hub (2 Column) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Message Configuration Form */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              WhatsApp Message Generator
            </h3>
          </div>

          {/* Select Subscription */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Subscription to Remind *
            </label>
            <select
              value={selectedSubId}
              onChange={(e) => setSelectedSubId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
              {subscriptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.serviceName} ({formatCurrency(s.amount, s.currency)} • Due {formatDate(s.renewalDate)})
                </option>
              ))}
            </select>
          </div>

          {/* Recipient Phone & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Recipient Name (Optional)
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Accounts Dept / John"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.reminders.recipientNumber}
              </label>
              <input
                type="text"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          {/* Language Selector for Message */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              Message Language
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMessageLang('en')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  messageLang === 'en'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                🇺🇸 English
              </button>
              <button
                type="button"
                onClick={() => setMessageLang('hi')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  messageLang === 'hi'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                🇮🇳 हिन्दी
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={handleOpenWhatsApp}
              className="w-full sm:flex-1 py-2.5 px-4 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{t.actions.openWhatsApp}</span>
            </button>
            <button
              onClick={handleCopyMessage}
              className="w-full sm:w-auto py-2.5 px-4 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>
        </div>

        {/* Right: Message Preview Box */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {t.reminders.previewMessage}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                WhatsApp Format
              </span>
            </div>

            {/* Chat bubble simulation */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-slate-950/80 border border-emerald-200/60 dark:border-emerald-900/40 font-mono text-xs text-slate-800 dark:text-emerald-100 whitespace-pre-wrap leading-relaxed shadow-inner max-h-[340px] overflow-y-auto">
              {generatedMessage}
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Encoding: UTF-8 WhatsApp Rich text</span>
            <span>Brand: Moti Technologies</span>
          </div>
        </div>

      </div>

      {/* Active In-App Notification Center Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              All Scheduled Reminders & Notification Logs
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {notifications.length} alerts pending
          </span>
        </div>

        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {t.empty.noNotifications}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((notif) => {
              const isOverdue = notif.isOverdue;
              return (
                <div key={notif.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl shrink-0 ${isOverdue ? 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'}`}>
                      {isOverdue ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {notif.serviceName}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Renewal due: {formatDate(notif.renewalDate)} ({formatCurrency(notif.amount, notif.currency)})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOverdue ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                      {isOverdue ? `${Math.abs(notif.daysRemaining)}d Overdue` : notif.daysRemaining === 0 ? 'Due Today' : `${notif.daysRemaining} days remaining`}
                    </span>

                    <button
                      onClick={() => onOpenRecordPayment(notif.subscriptionId)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                    >
                      Record Payment
                    </button>
                    <button
                      onClick={() => setSelectedSubId(notif.subscriptionId)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition"
                    >
                      Draft WhatsApp
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
