import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Download, 
  PlusCircle, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign,
  Calendar,
  CreditCard,
  Hash
} from 'lucide-react';
import { PaymentRecord, PaymentStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSubscriptions } from '../context/SubscriptionContext';
import { translations, Language } from '../i18n/translations';
import { formatCurrency } from '../utils/currencyUtils';
import { formatDate } from '../utils/dateUtils';
import { exportPaymentsToCSV } from '../utils/csvExport';

interface PaymentsViewProps {
  onOpenRecordPayment: () => void;
  onDeletePayment: (payment: PaymentRecord) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  onOpenRecordPayment,
  onDeletePayment,
}) => {
  const { user } = useAuth();
  const { payments } = useSubscriptions();

  const lang: Language = user?.language || 'en';
  const t = translations[lang] || translations.en;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredPayments = useMemo(() => {
    return payments
      .filter((p) => {
        const matchesSearch = 
          p.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.transactionRef && p.transactionRef.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [payments, searchTerm, selectedStatus]);

  // Total paid calculation
  const totalPaidINR = useMemo(() => {
    return payments
      .filter(p => p.status === 'Success' && p.currency === 'INR')
      .reduce((acc, p) => acc + p.amount, 0);
  }, [payments]);

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    if (status === 'Success') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3 h-3" />
          Success
        </span>
      );
    }
    if (status === 'Pending') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800">
        <AlertCircle className="w-3 h-3" />
        Failed
      </span>
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t.nav.payments}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verified ledger of renewal payments, invoices, and payment methods.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportPaymentsToCSV(filteredPayments)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.actions.exportPayments}</span>
          </button>
          
          <button
            onClick={onOpenRecordPayment}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.actions.recordPayment}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400">Total Payments Logged</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {payments.length}
          </div>
          <span className="text-[10px] text-slate-400">Across subscriptions</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400">Total Cleared (INR)</span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(totalPaidINR, 'INR')}
          </div>
          <span className="text-[10px] text-slate-400">Confirmed transactions</span>
        </div>

      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by service or transaction reference..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="all">All Payment Statuses</option>
            <option value="Success">Success</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      {filteredPayments.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {t.empty.noPayments}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Recording verified payments automatically advances subscription renewal timelines.
          </p>
          <button
            onClick={onOpenRecordPayment}
            className="mt-2 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition cursor-pointer"
          >
            + {t.actions.recordPayment}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Transaction Ref</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {p.serviceName}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {formatDate(p.paymentDate)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                      {formatCurrency(p.amount, p.currency)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {p.paymentMethod}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {p.transactionRef || '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getPaymentStatusBadge(p.status)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                      {p.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onDeletePayment(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
