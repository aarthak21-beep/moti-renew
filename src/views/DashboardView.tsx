import React from 'react';
import { 
  Layers, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  PlusCircle, 
  CreditCard, 
  Calendar, 
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Send,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubscriptions } from '../context/SubscriptionContext';
import { translations, Language } from '../i18n/translations';
import { formatCurrency, getMonthlyEquivalent } from '../utils/currencyUtils';
import { formatDate, getDaysUntil } from '../utils/dateUtils';
import { exportRenewalsReportToCSV } from '../utils/csvExport';

interface DashboardViewProps {
  onOpenAddModal: () => void;
  onOpenRecordPayment: (subId?: string) => void;
  onOpenWhatsApp: (subId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddModal,
  onOpenRecordPayment,
  onOpenWhatsApp,
  onNavigateTab,
}) => {
  const { user } = useAuth();
  const { subscriptions, activities, metrics } = useSubscriptions();

  const lang: Language = user?.language || 'en';
  const t = translations[lang] || translations.en;

  // Urgent subscriptions (overdue or due in <= 3 days)
  const urgentSubs = subscriptions
    .filter(s => s.status === 'Active' || s.status === 'Expired')
    .map(s => ({ ...s, days: getDaysUntil(s.renewalDate) }))
    .filter(s => s.days <= 3)
    .sort((a, b) => a.days - b.days);

  // Next 7 days renewals
  const upcomingThisWeek = subscriptions
    .filter(s => s.status === 'Active')
    .map(s => ({ ...s, days: getDaysUntil(s.renewalDate) }))
    .filter(s => s.days >= 0 && s.days <= 7)
    .sort((a, b) => a.days - b.days);

  // Category breakdown calculation
  const categoryTotals: Record<string, number> = {};
  let totalCalculated = 0;
  subscriptions.forEach(sub => {
    if (sub.status === 'Active') {
      const monthly = getMonthlyEquivalent(sub.amount, sub.billingCycle);
      categoryTotals[sub.category] = (categoryTotals[sub.category] || 0) + monthly;
      totalCalculated += monthly;
    }
  });

  const categoryEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-300">
      
      {/* Top Banner & Quick Actions */}
      <div className="p-5 sm:p-7 rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 text-white shadow-xl shadow-blue-950/10 relative overflow-hidden ring-1 ring-white/10">
        {/* Subtle background glow */}
        <div className="absolute -right-10 -top-16 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-24 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                {t.companyName}
              </span>
              <span className="text-xs text-blue-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Renewal Overview
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Welcome back, {user?.displayName || 'Subscriber'}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-xl">
              {t.tagline} Tracking {metrics.totalSubscriptions} subscriptions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-white text-blue-900 hover:bg-blue-50 shadow-md active:scale-98 transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-blue-600" />
              <span>{t.actions.addSubscription}</span>
            </button>
            <button
              onClick={() => onOpenRecordPayment()}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-700/80 hover:bg-blue-600 text-white border border-blue-400/30 active:scale-98 transition flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-emerald-300" />
              <span>{t.actions.recordPayment}</span>
            </button>
            <button
              onClick={() => exportRenewalsReportToCSV(subscriptions)}
              className="p-2 rounded-xl bg-blue-700/50 hover:bg-blue-600/70 text-blue-100 border border-blue-400/30 transition cursor-pointer"
              title="Download Renewals Report CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Urgent Renewals Alert Bar (if any <= 3 days or overdue) */}
      {urgentSubs.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-700/60 dark:bg-amber-950/20 text-slate-900 dark:text-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 animate-bounce">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                  {urgentSubs.some(s => s.days < 0) ? t.reminders.overdueAlert : t.reminders.upcomingAlert}
                </h2>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                  {urgentSubs.length} subscription{urgentSubs.length > 1 ? 's require' : ' requires'} immediate attention.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {urgentSubs.slice(0, 3).map(sub => (
                <div 
                  key={sub.id} 
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-xs flex items-center gap-2 shadow-xs shrink-0"
                >
                  <span className="font-semibold">{sub.serviceName}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${sub.days < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                    {sub.days < 0 ? `${Math.abs(sub.days)}d late` : sub.days === 0 ? 'Today' : `${sub.days}d left`}
                  </span>
                  <button
                    onClick={() => onOpenRecordPayment(sub.id)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    Pay
                  </button>
                  <button
                    onClick={() => onOpenWhatsApp(sub.id)}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    WA
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6 Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4">
        
        {/* Total Subscriptions */}
        <div 
          onClick={() => onNavigateTab('subscriptions')}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-950/5 transition-all duration-200 cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              {t.metrics.totalSubs}
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 group-hover:scale-110 transition">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            {metrics.totalSubscriptions}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Across all categories
          </span>
        </div>

        {/* Active Subscriptions */}
        <div 
          onClick={() => onNavigateTab('subscriptions')}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-950/5 transition-all duration-200 cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              {t.metrics.activeSubs}
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 group-hover:scale-110 transition">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {metrics.activeSubscriptions}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Currently renewed
          </span>
        </div>

        {/* Upcoming Renewals */}
        <div 
          onClick={() => onNavigateTab('calendar')}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-950/5 transition-all duration-200 cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              {t.metrics.upcomingRenewals}
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 group-hover:scale-110 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-blue-600 dark:text-blue-400">
            {metrics.upcomingRenewals}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Due within 30 days
          </span>
        </div>

        {/* Expired Subscriptions */}
        <div 
          onClick={() => onNavigateTab('subscriptions')}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-950/5 transition-all duration-200 cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              {t.metrics.expiredSubs}
            </span>
            <div className="p-1.5 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 group-hover:scale-110 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-red-600 dark:text-red-400">
            {metrics.expiredSubscriptions}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Needs renewal or cancel
          </span>
        </div>

        {/* Monthly Expense */}
        <div 
          onClick={() => onNavigateTab('analytics')}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-950/5 transition-all duration-200 cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              {t.metrics.monthlyExpense}
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 group-hover:scale-110 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white truncate">
            {formatCurrency(metrics.monthlyExpenseINR, 'INR')}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Active run-rate
          </span>
        </div>

        {/* Yearly Expense */}
        <div 
          onClick={() => onNavigateTab('analytics')}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-950/5 transition-all duration-200 cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              {t.metrics.yearlyExpense}
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 group-hover:scale-110 transition">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white truncate">
            {formatCurrency(metrics.yearlyExpenseINR, 'INR')}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Annual projection
          </span>
        </div>

      </div>

      {/* Main Grid: Left = Due This Week & Categories; Right = Recent Activity & Quick Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Renewals Due in next 7 days */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Renewals Due Next 7 Days
                </h2>
              </div>
              <button
                onClick={() => onNavigateTab('calendar')}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold inline-flex items-center gap-1"
              >
                <span>Full Calendar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingThisWeek.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-400 text-xs">
                No renewals due in the next 7 days. Your stack is fully up to date!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {upcomingThisWeek.map((sub) => (
                  <div key={sub.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {sub.serviceName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {sub.serviceName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {sub.category} • {formatDate(sub.renewalDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {formatCurrency(sub.amount, sub.currency)}
                        </p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${sub.days === 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'}`}>
                          {sub.days === 0 ? 'Due Today' : `${sub.days}d remaining`}
                        </span>
                      </div>

                      <button
                        onClick={() => onOpenRecordPayment(sub.id)}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                        title="Record Payment"
                      >
                        Pay
                      </button>

                      <button
                        onClick={() => onOpenWhatsApp(sub.id)}
                        className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300 transition"
                        title="WhatsApp Reminder"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Spending Breakdown */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.analytics.categorySpending}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Monthly Normalized
              </span>
            </div>

            {categoryEntries.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                {t.analytics.noData}
              </div>
            ) : (
              <div className="space-y-3.5">
                {categoryEntries.map(([category, amt]) => {
                  const percentage = totalCalculated > 0 ? Math.round((amt / totalCalculated) * 100) : 0;
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {t.categories[category as keyof typeof t.categories] || category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                            {percentage}%
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatCurrency(amt, 'INR')}/mo
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, Math.max(5, percentage))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Col: Recent Activities & WhatsApp Preview shortcut */}
        <div className="space-y-6">
          
          {/* Recent Activity Log */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.metrics.recentActivities}
              </h2>
              <span className="text-[11px] text-slate-400">
                Recent
              </span>
            </div>

            {activities.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                {t.empty.noActivity}
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {activities.slice(0, 6).map((act) => (
                  <div key={act.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                        {act.title}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {act.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WhatsApp Direct Hub Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 dark:border-emerald-800/60 dark:bg-emerald-950/20 text-slate-900 dark:text-slate-100 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
              <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>WhatsApp Reminder</span>
            </div>
            <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed">
              Open the prepared renewal or payment message in WhatsApp, review it, and send it.
            </p>
            <button
              onClick={() => onNavigateTab('reminders')}
              className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Create WhatsApp Reminder</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>



        </div>

      </div>

    </div>
  );
};
