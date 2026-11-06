import React, { useState, useEffect } from 'react';
import { X, Receipt, CheckCircle, CreditCard, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { PaymentMethod, PaymentStatus, Subscription } from '../types';
import { useAuth } from '../context/AuthContext';
import { translations, Language } from '../i18n/translations';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptions: Subscription[];
  preselectedSubId?: string;
  onRecord: (data: {
    subscriptionId: string;
    paymentDate: string;
    amount: number;
    currency: Currency;
    paymentMethod: PaymentMethod;
    transactionRef?: string;
    status: PaymentStatus;
    notes?: string;
    advanceRenewalDate?: boolean;
  }) => Promise<any>;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'Credit Card',
  'Debit Card',
  'UPI / GPay / PhonePe',
  'Net Banking',
  'Auto-Debit / NACH',
  'PayPal',
  'Other'
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  subscriptions,
  preselectedSubId,
  onRecord,
}) => {
  const { user } = useAuth();
  const lang: Language = user?.language || 'en';
  const t = translations[lang] || translations.en;

  const today = new Date().toISOString().split('T')[0];

  const [selectedSubId, setSelectedSubId] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(today);
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI / GPay / PhonePe');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [status, setStatus] = useState<PaymentStatus>('Success');
  const [notes, setNotes] = useState<string>('');
  const [advanceRenewalDate, setAdvanceRenewalDate] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const activeSubs = subscriptions.filter(s => s.status !== 'Cancelled');
      const initialId = preselectedSubId || (activeSubs.length > 0 ? activeSubs[0].id : '');
      setSelectedSubId(initialId);

      const target = subscriptions.find(s => s.id === initialId);
      if (target) {
        setAmount(target.amount);
        setPaymentMethod(target.paymentMethod);
      }
      setPaymentDate(today);
      setTransactionRef(`TXN-${Date.now().toString().slice(-6)}`);
      setStatus('Success');
      setNotes('');
      setAdvanceRenewalDate(true);
      setError(null);
    }
  }, [isOpen, preselectedSubId, subscriptions, today]);

  const handleSubChange = (subId: string) => {
    setSelectedSubId(subId);
    const target = subscriptions.find(s => s.id === subId);
    if (target) {
      setAmount(target.amount);
      setPaymentMethod(target.paymentMethod);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedSubId) {
      setError('Please select a subscription');
      return;
    }

    if (amount === '' || Number(amount) <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    if (!paymentDate) {
      setError('Payment date is required');
      return;
    }

    setSaving(true);
    try {
      await onRecord({
        subscriptionId: selectedSubId,
        paymentDate,
        amount: Number(amount),
        currency: 'INR',
        paymentMethod,
        transactionRef: transactionRef.trim() || undefined,
        status,
        notes: notes.trim() || undefined,
        advanceRenewalDate,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const selectedSub = subscriptions.find(s => s.id === selectedSubId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {t.actions.recordPayment}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log a verified renewal payment into the ledger.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Select Subscription */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Subscription *
            </label>
            <select
              required
              value={selectedSubId}
              onChange={(e) => handleSubChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="" disabled>Choose subscription...</option>
              {subscriptions.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.serviceName} ({sub.currency} {sub.amount} • {sub.billingCycle})
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                Amount Paid *
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
          </div>

          {/* Payment Date & Method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                Payment Method *
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
          </div>

          {/* Transaction Reference & Payment Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Transaction / UTR Ref
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. UPI-49201923"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="Success">Success</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Advance renewal date checkbox */}
          {selectedSub && status === 'Success' && (
            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="advanceRenewal"
                checked={advanceRenewalDate}
                onChange={(e) => setAdvanceRenewalDate(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="advanceRenewal" className="text-xs text-blue-900 dark:text-blue-200 cursor-pointer">
                <span className="font-semibold">Auto-advance renewal date:</span> Push {selectedSub.serviceName}&apos;s renewal date forward by one {selectedSub.billingCycle.toLowerCase()} cycle and mark status as Active.
              </label>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Receipt Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid from HDFC corporate card, invoice attached in email"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Footer */}
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
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 disabled:opacity-50 transition flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {saving ? 'Recording...' : 'Confirm & Save Payment'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
