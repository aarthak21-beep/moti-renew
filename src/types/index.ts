export type SubscriptionCategory = 
  | 'Software'
  | 'Entertainment'
  | 'Education'
  | 'Business Tools'
  | 'Cloud Storage'
  | 'Internet'
  | 'Other';

export type BillingCycle = 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';

export type Currency = 'INR';

export type SubscriptionStatus = 'Active' | 'Paused' | 'Expired' | 'Cancelled';

export type PaymentMethod = 
  | 'Credit Card'
  | 'Debit Card'
  | 'UPI / GPay / PhonePe'
  | 'Net Banking'
  | 'Auto-Debit / NACH'
  | 'PayPal'
  | 'Other';

export type PaymentStatus = 'Success' | 'Pending' | 'Failed';

export interface Subscription {
  id: string;
  userId: string;
  serviceName: string;
  providerName: string;
  category: SubscriptionCategory;
  amount: number;
  currency: Currency;
  billingCycle: BillingCycle;
  startDate: string; // YYYY-MM-DD
  renewalDate: string; // YYYY-MM-DD
  notes?: string;
  paymentMethod: PaymentMethod;
  status: SubscriptionStatus;
  reminderDays: number[]; // e.g. [1, 3, 7, 15]
  customReminderDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  subscriptionId: string;
  serviceName: string;
  paymentDate: string; // YYYY-MM-DD
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  status: PaymentStatus;
  notes?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  type: 'subscription_created' | 'subscription_updated' | 'subscription_deleted' | 'payment_recorded' | 'reminder_generated' | 'status_changed';
  title: string;
  description: string;
  timestamp: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  companyName?: string;
  defaultCurrency: Currency;
  language: 'en' | 'hi';
  theme: 'light' | 'dark';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  subscriptionId: string;
  serviceName: string;
  renewalDate: string;
  daysRemaining: number;
  amount: number;
  currency: Currency;
  isOverdue: boolean;
  createdAt: string;
  read: boolean;
}
