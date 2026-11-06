import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  PieChart, 
  Layers, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubscriptions } from '../context/SubscriptionContext';
import { translations, Language } from '../i18n/translations';
import { formatCurrency, getMonthlyEquivalent, getYearlyEquivalent } from '../utils/currencyUtils';
import { exportRenewalsReportToCSV, exportSubscriptionsToCSV, exportPaymentsToCSV } from '../utils/csvExport';

export const AnalyticsView: React.FC = () => {
  const { user } = useAuth();
  const { subscriptions, payments, metrics } = useSubscriptions();

  const lang: Language = user?.language || 'en';
  const t = translations[lang] || translations.en;

  // Category breakdown
  const categoryStats: Record<string, { count: number; monthly: number; yearly: number }> = {};
  let totalMonthlyAll = 0;

  subscriptions.forEach(sub => {
    if (sub.status === 'Active') {
      const m = getMonthlyEquivalent(sub.amount, sub.billingCycle);
      const y = getYearlyEquivalent(sub.amount, sub.billingCycle);
      
      if (!categoryStats[sub.category]) {
        categoryStats[sub.category] = { count: 0, monthly: 0, yearly: 0 };
      }
      categoryStats[sub.category].count += 1;
      categoryStats[sub.category].monthly += m;
      categoryStats[sub.category].yearly += y;
      totalMonthlyAll += m;
    }
  });

  const categoryList = Object.entries(categoryStats).sort((a, b) => b[1].monthly - a[1].monthly);

  // Billing Cycle distribution
  const cycleDistribution: Record<string, number> = {
    Weekly: 0,
    Monthly: 0,
    Quarterly: 0,
    Yearly: 0,
  };
  subscriptions.forEach(s => {
    if (s.status === 'Active') {
      cycleDistribution[s.billingCycle] = (cycleDistribution[s.billingCycle] || 0) + 1;
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t.nav.analytics}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Spending trends, burn-rate metrics, category allocation, and exportable financial reports.
          </p>
        </div>

        {/* CSV Export Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportSubscriptionsToCSV(subscriptions)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Subscriptions CSV</span>
          </button>
          <button
            onClick={() => exportPaymentsToCSV(payments)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Payments CSV</span>
          </button>
          <button
            onClick={() => exportRenewalsReportToCSV(subscriptions)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Full Renewal Report</span>
          </button>
        </div>
      </div>

      {/* 4 Financial KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Monthly Expense (INR)</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatCurrency(metrics.monthlyExpenseINR, 'INR')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Normalized monthly cash outlay
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Annual Projected (INR)</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {formatCurrency(metrics.yearlyExpenseINR, 'INR')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Estimated 12-month commitment
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Active vs Expired</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {metrics.activeSubscriptions} <span className="text-xs text-slate-400">active</span> / {metrics.expiredSubscriptions} <span className="text-xs text-red-500">exp</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics.upcomingRenewals} due in next 30 days
          </p>
        </div>

      </div>

      {/* Category Spending Detailed Table & Bars */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.analytics.categorySpending}
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Share of Total Monthly Spend
          </span>
        </div>

        {categoryList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {t.analytics.noData}
          </div>
        ) : (
          <div className="space-y-4">
            {categoryList.map(([catName, stats]) => {
              const share = totalMonthlyAll > 0 ? Math.round((stats.monthly / totalMonthlyAll) * 100) : 0;
              return (
                <div key={catName} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {t.categories[catName as keyof typeof t.categories] || catName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                        {stats.count} subscriptions
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                        {share}% share
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {formatCurrency(stats.monthly, 'INR')}/mo
                      </span>
                    </div>
                  </div>

                  <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.max(4, share))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Yearly projection: {formatCurrency(stats.yearly, 'INR')}</span>
                    <span>Average per sub: {formatCurrency(Math.round(stats.monthly / stats.count), 'INR')}/mo</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cycle breakdown & Cadence */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-slate-400">
            Billing Cycle Distribution
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(cycleDistribution).map(([cycle, count]) => (
              <div key={cycle} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[11px]">{cycle}</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-slate-400">
            Audit & Export Compliance
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            All reports follow standard RFC-4180 CSV specifications compatible with QuickBooks, Zoho Books, Tally, and Google Sheets.
          </p>
          <button
            onClick={() => exportRenewalsReportToCSV(subscriptions)}
            className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All Data (Full Audit CSV)</span>
          </button>
        </div>

      </div>

    </div>
  );
};
