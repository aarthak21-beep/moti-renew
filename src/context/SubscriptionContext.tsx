import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  Subscription, PaymentRecord, ActivityLog, NotificationItem,
  Currency, PaymentMethod, SubscriptionStatus
} from '../types';
import { useAuth } from './AuthContext';
import { calculateNextRenewal, getDaysUntil } from '../utils/dateUtils';
import { getMonthlyEquivalent, getYearlyEquivalent } from '../utils/currencyUtils';
import { appwriteConfigured, APPWRITE_DATABASE_ID, APPWRITE_TABLES, tablesDB, Query, ownerPermissions } from '../lib/appwrite';

interface SubscriptionContextType {
  subscriptions: Subscription[];
  payments: PaymentRecord[];
  activities: ActivityLog[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  loading: boolean;
  addSubscription: (sub: Omit<Subscription, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateSubscription: (id: string, updates: Partial<Subscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  recordPayment: (payment: {
    subscriptionId: string; paymentDate: string; amount: number; currency: Currency;
    paymentMethod: PaymentMethod; transactionRef?: string;
    status: 'Success' | 'Pending' | 'Failed'; notes?: string; advanceRenewalDate?: boolean;
  }) => Promise<string>;
  deletePayment: (paymentId: string) => Promise<void>;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  metrics: {
    totalSubscriptions: number; activeSubscriptions: number; upcomingRenewals: number;
    expiredSubscriptions: number; monthlyExpenseINR: number; yearlyExpenseINR: number;
    monthlyExpenseUSD: number; yearlyExpenseUSD: number;
  };
}

const demoSubscriptions: Subscription[] = [
  { id: 'sub_aws_01', userId: 'usr_moti_demo_01', serviceName: 'AWS Cloud Services', providerName: 'Amazon Web Services', category: 'Cloud Storage', amount: 14500, currency: 'INR', billingCycle: 'Monthly', startDate: '2025-11-01', renewalDate: new Date(Date.now()+2*86400000).toISOString().slice(0,10), notes: 'Production VPC, EC2 clusters & S3 buckets', paymentMethod: 'Credit Card', status: 'Active', reminderDays: [1,3,7], createdAt: '2025-11-01T10:00:00Z', updatedAt: '2025-11-01T10:00:00Z' },
  { id: 'sub_google_workspace_02', userId: 'usr_moti_demo_01', serviceName: 'Google Workspace Business', providerName: 'Google LLC', category: 'Business Tools', amount: 4800, currency: 'INR', billingCycle: 'Monthly', startDate: '2025-08-15', renewalDate: new Date(Date.now()+6*86400000).toISOString().slice(0,10), notes: '12 business email accounts + Google Meet standard', paymentMethod: 'Auto-Debit / NACH', status: 'Active', reminderDays: [1,3,7,15], createdAt: '2025-08-15T12:00:00Z', updatedAt: '2025-08-15T12:00:00Z' },
  { id: 'sub_canva_pro_03', userId: 'usr_moti_demo_01', serviceName: 'Canva Pro Enterprise', providerName: 'Canva Pty Ltd', category: 'Software', amount: 3999, currency: 'INR', billingCycle: 'Yearly', startDate: '2025-04-10', renewalDate: new Date(Date.now()+14*86400000).toISOString().slice(0,10), notes: 'Brand kit and social media graphics team account', paymentMethod: 'UPI / GPay / PhonePe', status: 'Active', reminderDays: [1,7,15], createdAt: '2025-04-10T09:00:00Z', updatedAt: '2025-04-10T09:00:00Z' },
  { id: 'sub_airtel_fiber_04', userId: 'usr_moti_demo_01', serviceName: 'Airtel Xstream Fiber 300Mbps', providerName: 'Bharti Airtel', category: 'Internet', amount: 1179, currency: 'INR', billingCycle: 'Monthly', startDate: '2025-01-01', renewalDate: new Date(Date.now()+86400000).toISOString().slice(0,10), notes: 'Office broadband connection with static IP', paymentMethod: 'UPI / GPay / PhonePe', status: 'Active', reminderDays: [1,3], createdAt: '2025-01-01T08:00:00Z', updatedAt: '2025-01-01T08:00:00Z' },
  { id: 'sub_chatgpt_plus_05', userId: 'usr_moti_demo_01', serviceName: 'ChatGPT Plus & Team', providerName: 'OpenAI', category: 'Software', amount: 20, currency: 'USD', billingCycle: 'Monthly', startDate: '2025-06-20', renewalDate: new Date(Date.now()+21*86400000).toISOString().slice(0,10), notes: 'Engineering team research and prompt tests', paymentMethod: 'Credit Card', status: 'Active', reminderDays: [1,3,7], createdAt: '2025-06-20T14:30:00Z', updatedAt: '2025-06-20T14:30:00Z' },
  { id: 'sub_netflix_06', userId: 'usr_moti_demo_01', serviceName: 'Netflix Premium 4K', providerName: 'Netflix Inc', category: 'Entertainment', amount: 649, currency: 'INR', billingCycle: 'Monthly', startDate: '2025-03-05', renewalDate: new Date(Date.now()-3*86400000).toISOString().slice(0,10), notes: 'Executive lounge screen + mobile devices', paymentMethod: 'Debit Card', status: 'Expired', reminderDays: [1,3], createdAt: '2025-03-05T18:00:00Z', updatedAt: '2025-03-05T18:00:00Z' },
  { id: 'sub_coursera_plus_07', userId: 'usr_moti_demo_01', serviceName: 'Coursera Plus Learning', providerName: 'Coursera Inc', category: 'Education', amount: 399, currency: 'USD', billingCycle: 'Yearly', startDate: '2025-05-12', renewalDate: new Date(Date.now()+45*86400000).toISOString().slice(0,10), notes: 'Upskilling program for junior engineers', paymentMethod: 'Credit Card', status: 'Active', reminderDays: [7,15], createdAt: '2025-05-12T11:00:00Z', updatedAt: '2025-05-12T11:00:00Z' },
];

const demoPayments: PaymentRecord[] = [
  { id: 'pay_01', userId: 'usr_moti_demo_01', subscriptionId: 'sub_aws_01', serviceName: 'AWS Cloud Services', paymentDate: new Date(Date.now()-28*86400000).toISOString().slice(0,10), amount: 14500, currency: 'INR', paymentMethod: 'Credit Card', transactionRef: 'HDFC-CC-90823412', status: 'Success', notes: 'Monthly invoice paid in full', createdAt: '2026-09-30T10:00:00Z' },
  { id: 'pay_02', userId: 'usr_moti_demo_01', subscriptionId: 'sub_google_workspace_02', serviceName: 'Google Workspace Business', paymentDate: new Date(Date.now()-24*86400000).toISOString().slice(0,10), amount: 4800, currency: 'INR', paymentMethod: 'Auto-Debit / NACH', transactionRef: 'NACH-ICICI-887123', status: 'Success', notes: 'Auto-debit successful', createdAt: '2026-10-04T12:00:00Z' },
  { id: 'pay_03', userId: 'usr_moti_demo_01', subscriptionId: 'sub_airtel_fiber_04', serviceName: 'Airtel Xstream Fiber 300Mbps', paymentDate: new Date(Date.now()-29*86400000).toISOString().slice(0,10), amount: 1179, currency: 'INR', paymentMethod: 'UPI / GPay / PhonePe', transactionRef: 'UPI-GPAY-4029184712', status: 'Success', notes: 'Paid via GPay Business QR', createdAt: '2026-09-29T15:00:00Z' },
];
const demoActivities: ActivityLog[] = [
  { id: 'act_01', userId: 'usr_moti_demo_01', type: 'payment_recorded', title: 'Payment Recorded: AWS Cloud', description: 'Recorded payment of ₹14,500 via Credit Card', timestamp: new Date(Date.now()-2*3600000).toISOString() },
  { id: 'act_02', userId: 'usr_moti_demo_01', type: 'reminder_generated', title: 'Renewal Reminder: Airtel Fiber', description: 'Renewal due soon', timestamp: new Date(Date.now()-6*3600000).toISOString() },
  { id: 'act_03', userId: 'usr_moti_demo_01', type: 'status_changed', title: 'Overdue Alert: Netflix', description: 'Subscription marked overdue as renewal date passed', timestamp: new Date(Date.now()-86400000).toISOString() },
];

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const currentUserId = user?.uid || 'usr_moti_demo_01';
  const isRealUser = Boolean(appwriteConfigured && user && !user.uid.startsWith('usr_'));
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      if (isRealUser && user) {
        const [subs, pays, acts] = await Promise.all([
          tablesDB.listRows(APPWRITE_DATABASE_ID, APPWRITE_TABLES.subscriptions, [Query.equal('userId', user.uid), Query.limit(100)]),
          tablesDB.listRows(APPWRITE_DATABASE_ID, APPWRITE_TABLES.payments, [Query.equal('userId', user.uid), Query.limit(100)]),
          tablesDB.listRows(APPWRITE_DATABASE_ID, APPWRITE_TABLES.activities, [Query.equal('userId', user.uid), Query.limit(100)]),
        ]);
        const unpack = (rows: any[]) => rows.map(row => {
          try { return typeof row.data === 'string' ? JSON.parse(row.data) : row.data; }
          catch { console.error('Could not parse an Appwrite data row:', row.$id); return null; }
        }).filter(Boolean);
        if (!cancelled) {
          setSubscriptions(unpack(subs.rows) as Subscription[]);
          setPayments(unpack(pays.rows) as PaymentRecord[]);
          setActivities(unpack(acts.rows) as ActivityLog[]);
        }
      } else {
        const saved = localStorage.getItem(`moti_renew_data_${currentUserId}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (!cancelled) {
              setSubscriptions(parsed.subscriptions || []);
              setPayments(parsed.payments || []);
              setActivities(parsed.activities || []);
            }
          } catch {
            if (!cancelled) { setSubscriptions([]); setPayments([]); setActivities([]); }
          }
        } else if (!cancelled && user) {
          setSubscriptions(demoSubscriptions.map(s => ({ ...s, userId: currentUserId })));
          setPayments(demoPayments.map(p => ({ ...p, userId: currentUserId })));
          setActivities(demoActivities.map(a => ({ ...a, userId: currentUserId })));
        } else if (!cancelled) {
          setSubscriptions([]); setPayments([]); setActivities([]);
        }
      }
      if (!cancelled) setLoading(false);
    };
    void load();
    return () => { cancelled = true; };
  }, [currentUserId, isRealUser]);

  useEffect(() => {
    if (!loading && !isRealUser && currentUserId) {
      localStorage.setItem(`moti_renew_data_${currentUserId}`, JSON.stringify({ subscriptions, payments, activities }));
    }
  }, [subscriptions, payments, activities, currentUserId, loading, isRealUser]);

  const persist = async (table: 'subscriptions' | 'payments' | 'activities', record: any) => {
    if (!isRealUser || !user) return;
    const tableId = APPWRITE_TABLES[table];
    const rowData = { userId: user.uid, id: record.id, data: JSON.stringify(record) };
    try {
      await tablesDB.updateRow(APPWRITE_DATABASE_ID, tableId, record.id, rowData);
    } catch (error: any) {
      if (error?.code !== 404) throw error;
      await tablesDB.createRow(APPWRITE_DATABASE_ID, tableId, record.id, rowData, ownerPermissions(user.uid));
    }
  };
  const remove = async (table: 'subscriptions' | 'payments', id: string) => {
    if (!isRealUser || !user) return;
    const tableId = APPWRITE_TABLES[table];
    await tablesDB.deleteRow(APPWRITE_DATABASE_ID, tableId, id);
  };

  useEffect(() => {
    if (!loading) {
      setSubscriptions(prev => {
        let changed = false;
        const today = new Date(); today.setHours(0,0,0,0);
        const next = prev.map(s => {
          if (s.status === 'Active' && new Date(s.renewalDate + 'T00:00:00').getTime() < today.getTime()) {
            changed = true; return { ...s, status: 'Expired' as SubscriptionStatus };
          }
          return s;
        });
        return changed ? next : prev;
      });
    }
  }, [loading]);

  const notifications: NotificationItem[] = useMemo(() => subscriptions
    .filter(s => s.status === 'Active' || s.status === 'Expired')
    .map(s => {
      const days = getDaysUntil(s.renewalDate);
      const id = `notif_${s.id}_${s.renewalDate}`;
      return { id, subscriptionId: s.id, serviceName: s.serviceName, renewalDate: s.renewalDate, daysRemaining: days, amount: s.amount, currency: s.currency, isOverdue: days < 0, createdAt: new Date().toISOString(), read: readNotificationIds.has(id) };
    })
    .filter(n => n.isOverdue || n.daysRemaining <= 15)
    .sort((a,b) => a.daysRemaining-b.daysRemaining), [subscriptions, readNotificationIds]);
  const unreadNotificationCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const addSubscription = async (data: Omit<Subscription, 'id'|'userId'|'createdAt'|'updatedAt'>) => {
    const now = new Date().toISOString();
    const id = 'sub_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,5);
    const record: Subscription = { ...data, id, userId: currentUserId, createdAt: now, updatedAt: now };
    await persist('subscriptions', record);
    setSubscriptions(prev => [record, ...prev]);
    const activity: ActivityLog = { id: 'act_'+Date.now().toString(36), userId: currentUserId, type: 'subscription_created', title: `Added Subscription: ${record.serviceName}`, description: `${record.category} • ${record.currency} ${record.amount} (${record.billingCycle})`, timestamp: now };
    setActivities(prev => [activity, ...prev]);
    await persist('activities', activity);
    return id;
  };

  const updateSubscription = async (id: string, updates: Partial<Subscription>) => {
    const existing = subscriptions.find(s => s.id === id);
    if (!existing) return;
    const now = new Date().toISOString();
    const updated = { ...existing, ...updates, updatedAt: now };
    await persist('subscriptions', updated);
    setSubscriptions(prev => prev.map(s => s.id === id ? updated : s));
    const activity: ActivityLog = { id: 'act_'+Date.now().toString(36), userId: currentUserId, type: 'subscription_updated', title: `Updated: ${existing.serviceName}`, description: 'Modified subscription parameters and renewal details', timestamp: now };
    setActivities(prev => [activity, ...prev]);
    await persist('activities', activity);
  };

  const deleteSubscription = async (id: string) => {
    const existing = subscriptions.find(s => s.id === id);
    await remove('subscriptions', id);
    setSubscriptions(prev => prev.filter(s => s.id !== id));
    if (existing) {
      const activity: ActivityLog = { id: 'act_'+Date.now().toString(36), userId: currentUserId, type: 'subscription_deleted', title: `Deleted: ${existing.serviceName}`, description: 'Removed subscription and reminders from tracking', timestamp: new Date().toISOString() };
      setActivities(prev => [activity, ...prev]);
      await persist('activities', activity);
    }
  };

  const recordPayment = async (data: {
    subscriptionId: string; paymentDate: string; amount: number; currency: Currency;
    paymentMethod: PaymentMethod; transactionRef?: string; status: 'Success'|'Pending'|'Failed';
    notes?: string; advanceRenewalDate?: boolean;
  }) => {
    const target = subscriptions.find(s => s.id === data.subscriptionId);
    if (!target) throw new Error('Subscription not found');
    const now = new Date().toISOString();
    const id = 'pay_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,5);
    const payment: PaymentRecord = { ...data, id, userId: currentUserId, serviceName: target.serviceName, createdAt: now };
    await persist('payments', payment);
    setPayments(prev => [payment, ...prev]);
    if (data.status === 'Success' && data.advanceRenewalDate !== false) {
      const updated = { ...target, renewalDate: calculateNextRenewal(target.renewalDate, target.billingCycle), status: 'Active' as SubscriptionStatus, updatedAt: now };
      await persist('subscriptions', updated);
      setSubscriptions(prev => prev.map(s => s.id === target.id ? updated : s));
    }
    const activity: ActivityLog = { id: 'act_'+Date.now().toString(36), userId: currentUserId, type: 'payment_recorded', title: `Payment Recorded: ${target.serviceName}`, description: `Amount: ${data.currency} ${data.amount} • Ref: ${data.transactionRef || 'N/A'} • Status: ${data.status}`, timestamp: now };
    setActivities(prev => [activity, ...prev]);
    await persist('activities', activity);
    return id;
  };

  const deletePayment = async (id: string) => {
    await remove('payments', id);
    setPayments(prev => prev.filter(p => p.id !== id));
  };
  const markNotificationAsRead = (id: string) => setReadNotificationIds(prev => new Set(prev).add(id));
  const markAllNotificationsAsRead = () => setReadNotificationIds(new Set(notifications.map(n => n.id)));

  const metrics = useMemo(() => {
    let active = 0, expired = 0, upcoming = 0, monthlyINR = 0, yearlyINR = 0, monthlyUSD = 0, yearlyUSD = 0;
    subscriptions.forEach(s => {
      const days = getDaysUntil(s.renewalDate);
      if (s.status === 'Active') {
        active++;
        if (days >= 0 && days <= 30) upcoming++;
        const m = getMonthlyEquivalent(s.amount, s.billingCycle), y = getYearlyEquivalent(s.amount, s.billingCycle);
        if (s.currency === 'INR') { monthlyINR += m; yearlyINR += y; }
        if (s.currency === 'USD') { monthlyUSD += m; yearlyUSD += y; }
      } else if (s.status === 'Expired' || days < 0) expired++;
    });
    return { totalSubscriptions: subscriptions.length, activeSubscriptions: active, upcomingRenewals: upcoming, expiredSubscriptions: expired, monthlyExpenseINR: Math.round(monthlyINR), yearlyExpenseINR: Math.round(yearlyINR), monthlyExpenseUSD: Math.round(monthlyUSD), yearlyExpenseUSD: Math.round(yearlyUSD) };
  }, [subscriptions]);

  return <SubscriptionContext.Provider value={{ subscriptions, payments, activities, notifications, unreadNotificationCount, loading, addSubscription, updateSubscription, deleteSubscription, recordPayment, deletePayment, markNotificationAsRead, markAllNotificationsAsRead, metrics }}>{children}</SubscriptionContext.Provider>;
};

export const useSubscriptions = () => {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscriptions must be used within a SubscriptionProvider');
  return context;
};
