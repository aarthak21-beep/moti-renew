import React, { useState, useEffect } from 'react';
import { X, Sparkles, Calendar, DollarSign, CreditCard, Tag, AlertCircle } from 'lucide-react';
import { 
  Subscription, 
  SubscriptionCategory, 
  BillingCycle, 
  PaymentMethod, 
  SubscriptionStatus 
} from '../types';
import { calculateNextRenewal } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { translations, Language } from '../i18n/translations';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sub: Omit<Subscription, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<any>;
  initialData?: Subscription | null;
}

const PRESET_SERVICES = [
  { name: 'AWS Cloud', provider: 'Amazon Web Services', category: 'Cloud Storage' as SubscriptionCategory, cycle: 'Monthly' as BillingCycle, amount: 8500 },
  { name: 'Google Workspace', provider: 'Google LLC', category: 'Business Tools' as SubscriptionCategory, cycle: 'Monthly' as BillingCycle, amount: 4800 },
  { name: 'Canva Pro', provider: 'Canva Pty Ltd', category: 'Software' as SubscriptionCategory, cycle: 'Yearly' as BillingCycle, amount: 3999 },
  { name: 'ChatGPT Plus', provider: 'OpenAI', category: 'Software' as SubscriptionCategory, cycle: 'Monthly' as BillingCycle, amount: 20 },
  { name: 'Netflix Premium', provider: 'Netflix', category: 'Entertainment' as SubscriptionCategory, cycle: 'Monthly' as BillingCycle, amount: 649 },
  { name: 'Airtel Xstream Fiber', provider: 'Bharti Airtel', category: 'Internet' as SubscriptionCategory, cycle: 'Monthly' as BillingCycle, amount: 1179 },
  { name: 'Spotify Premium', provider: 'Spotify AB', category: 'Entertainment' as SubscriptionCategory, cycle: 'Monthly' as BillingCycle, amount: 119 },
  { name: 'GitHub Copilot', provider: 'GitHub Inc', category: 'Software' as SubscriptionCategory, cycle: 'Monthly' as BillingCycle, amount: 10 },
];

const CATEGORIES: SubscriptionCategory[] = [
  'Software',
  'Entertainment',
  'Education',
  'Business Tools',
  'Cloud Storage',
  'Internet',
  'Other'
];

const BILLING_CYCLES: BillingCycle[] = ['Weekly', 'Monthly', 'Quarterly', 'Yearly'];
const PAYMENT_METHODS: PaymentMethod[] = [
  'Credit Card',
  'Debit Card',
  'UPI / GPay / PhonePe',
  'Net Banking',
  'Auto-Debit / NACH',
  'PayPal',
  'Other'
];
const STATUSES: SubscriptionStatus[] = ['Active', 'Paused', 'Expired', 'Cancelled'];

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const { user } = useAuth();
  const lang: Language = user?.language || 'en';
  const t = translations[lang] || translations.en;

  const today = new Date().toISOString().split('T')[0];

  const [serviceName, setServiceName] = useState('');
  const [providerName, setProviderName] = useState('');
  const [category, setCategory] = useState<SubscriptionCategory>('Software');
  const [amount, setAmount] = useState<number | ''>(999);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('Monthly');
  const [startDate, setStartDate] = useState(today);
  const [renewalDate, setRenewalDate] = useState(() => calculateNextRenewal(today, 'Monthly'));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI / GPay / PhonePe');
  const [status, setStatus] = useState<SubscriptionStatus>('Active');
  const [notes, setNotes] = useState('');
  const [reminderDays, setReminderDays] = useState<number[]>([1, 3, 7]);
  const [customReminderDate, setCustomReminderDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setServiceName(initialData.serviceName);
      setProviderName(initialData.providerName || '');
      setCategory(initialData.category);
      setAmount(initialData.amount);
      setBillingCycle(initialData.billingCycle);
      setStartDate(initialData.startDate);
      setRenewalDate(initialData.renewalDate);
      setPaymentMethod(initialData.paymentMethod);
      setStatus(initialData.status);
      setNotes(initialData.notes || '');
      setReminderDays(initialData.reminderDays || [1, 3, 7]);
      setCustomReminderDate(initialData.customReminderDate || '');
    } else {
      setServiceName('');
      setProviderName('');
      setCategory('Software');
      setAmount(999);
      setBillingCycle('Monthly');
      setStartDate(today);
      setRenewalDate(calculateNextRenewal(today, 'Monthly'));
      setPaymentMethod('UPI / GPay / PhonePe');
      setStatus('Active');
      setNotes('');
      setReminderDays([1, 3, 7]);
      setCustomReminderDate('');
    }
    setError(null);
  }, [initialData, isOpen, today]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESET_SERVICES[0]) => {
    setServiceName(preset.name);
    setProviderName(preset.provider);
    setCategory(preset.category);
    setBillingCycle(preset.cycle);
    setAmount(preset.amount);
    setRenewalDate(calculateNextRenewal(startDate, preset.cycle));
  };

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    setRenewalDate(calculateNextRenewal(newStart, billingCycle));
  };

  const handleBillingCycleChange = (newCycle: BillingCycle) => {
    setBillingCycle(newCycle);
    setRenewalDate(calculateNextRenewal(startDate, newCycle));
  };

  const toggleReminderDay = (day: number) => {
    if (reminderDays.includes(day)) {
      setReminderDays(reminderDays.filter(d => d !== day));
    } else {
      setReminderDays([...reminderDays, day].sort((a, b) => a - b));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!serviceName.trim()) {
      setError('Service name is required');
      return;
    }

    if (amount === '' || Number(amount) < 0) {
      setError('Please provide a valid subscription amount');
      return;
    }

    if (!renewalDate) {
      setError('Renewal date is required');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        serviceName: serviceName.trim(),
        providerName: providerName.trim(),
        category,
        amount: Number(amount),
        currency: 'INR',
        billingCycle,
        startDate,
        renewalDate,
        paymentMethod,
        status,
        notes: notes.trim(),
        reminderDays,
        customReminderDate: customReminderDate || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save subscription');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {initialData ? t.actions.editSubscription : t.actions.addSubscription}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Track renewal timelines, expenses, and automated alerts.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Presets (Only when adding) */}
          {!initialData && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Fill Popular Services</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SERVICES.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-blue-950/50 dark:hover:border-blue-800 transition cursor-pointer"
                  >
                    + {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Row 1: Service Name & Provider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.fields.serviceName} *
              </label>
              <input
                type="text"
                required
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g. AWS Cloud, Netflix 4K, Canva"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.fields.providerName}
              </label>
              <input
                type="text"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                placeholder="e.g. Amazon, Google, Bharti Airtel"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Row 2: Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {t.fields.category} *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SubscriptionCategory)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {t.categories[cat] || cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.fields.status} *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {t.statuses[st as keyof typeof t.statuses] || st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Amount, Currency & Billing Cycle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                {t.fields.amount} *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.fields.billingCycle} *
              </label>
              <select
                value={billingCycle}
                onChange={(e) => handleBillingCycleChange(e.target.value as BillingCycle)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                {BILLING_CYCLES.map((cycle) => (
                  <option key={cycle} value={cycle}>
                    {t.billingCycles[cycle] || cycle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Start Date & Renewal Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {t.fields.startDate}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {t.fields.renewalDate} *
              </label>
              <input
                type="date"
                required
                value={renewalDate}
                onChange={(e) => setRenewalDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-950/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Row 5: Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              {t.fields.paymentMethod}
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>{pm}</option>
              ))}
            </select>
          </div>

          {/* Row 6: Renewal Reminders (1, 3, 7, 15 days + custom date) */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t.fields.reminderOptions}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { day: 1, label: t.reminders.day1 },
                { day: 3, label: t.reminders.days3 },
                { day: 7, label: t.reminders.days7 },
                { day: 15, label: t.reminders.days15 },
              ].map(({ day, label }) => {
                const isSelected = reminderDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleReminderDay(day)}
                    className={`py-1.5 px-2.5 text-xs rounded-lg border text-center transition cursor-pointer font-medium ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {t.fields.customReminderDate}:
              </span>
              <input
                type="date"
                value={customReminderDate}
                onChange={(e) => setCustomReminderDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 7: Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t.fields.notes}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Account email: admin@moti.tech, 5 seats plan, cancel before 24h"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {t.actions.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : t.actions.save}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
