import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SubscriptionProvider, useSubscriptions } from './context/SubscriptionContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { SubscriptionsView } from './views/SubscriptionsView';
import { PaymentsView } from './views/PaymentsView';
import { CalendarView } from './views/CalendarView';
import { AnalyticsView } from './views/AnalyticsView';
import { RemindersView } from './views/RemindersView';
import { SettingsView } from './views/SettingsView';
import { SubscriptionModal } from './components/SubscriptionModal';
import { PaymentModal } from './components/PaymentModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { Subscription, PaymentRecord } from './types';
import { LicenseGate } from './components/LicenseGate';
import { LocalSecurityGate } from './components/LocalSecurityGate';

function MainApp() {
  const { loading: authLoading } = useAuth();
  const { 
    subscriptions, 
    addSubscription, 
    updateSubscription, 
    deleteSubscription, 
    recordPayment, 
    deletePayment 
  } = useSubscriptions();

  // Navigation state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [preselectedSubIdForPayment, setPreselectedSubIdForPayment] = useState<string | undefined>(undefined);

  const [deletingSubscription, setDeletingSubscription] = useState<Subscription | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<PaymentRecord | null>(null);

  const [preselectedSubIdForWhatsApp, setPreselectedSubIdForWhatsApp] = useState<string | undefined>(undefined);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">Loading...</div>;
  }

  // Open Payment Modal
  const handleOpenRecordPayment = (subId?: string) => {
    setPreselectedSubIdForPayment(subId);
    setIsPaymentModalOpen(true);
  };

  // Open WhatsApp Hub with selected subscription
  const handleOpenWhatsApp = (subId: string) => {
    setPreselectedSubIdForWhatsApp(subId);
    setCurrentTab('reminders');
  };

  // Handle Save Subscription (Add or Edit)
  const handleSaveSubscription = async (data: Omit<Subscription, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (editingSubscription) {
      await updateSubscription(editingSubscription.id, data);
      setEditingSubscription(null);
    } else {
      await addSubscription(data);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenAddModal={() => { setEditingSubscription(null); setIsAddModalOpen(true); }}
        onOpenRecordPayment={handleOpenRecordPayment}
        onOpenWhatsApp={handleOpenWhatsApp}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Main Body with Sidebar + View Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onOpenAddModal={() => { setEditingSubscription(null); setIsAddModalOpen(true); }}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Dynamic View Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onOpenAddModal={() => { setEditingSubscription(null); setIsAddModalOpen(true); }}
              onOpenRecordPayment={handleOpenRecordPayment}
              onOpenWhatsApp={handleOpenWhatsApp}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'subscriptions' && (
            <SubscriptionsView
              onOpenAddModal={() => { setEditingSubscription(null); setIsAddModalOpen(true); }}
              onEditSubscription={(sub) => { setEditingSubscription(sub); setIsAddModalOpen(true); }}
              onDeleteSubscription={(sub) => setDeletingSubscription(sub)}
              onOpenRecordPayment={handleOpenRecordPayment}
              onOpenWhatsApp={handleOpenWhatsApp}
            />
          )}

          {currentTab === 'payments' && (
            <PaymentsView
              onOpenRecordPayment={() => handleOpenRecordPayment()}
              onDeletePayment={(p) => setDeletingPayment(p)}
            />
          )}

          {currentTab === 'calendar' && (
            <CalendarView
              onOpenRecordPayment={handleOpenRecordPayment}
              onOpenWhatsApp={handleOpenWhatsApp}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView />
          )}

          {currentTab === 'reminders' && (
            <RemindersView
              preselectedSubId={preselectedSubIdForWhatsApp}
              onOpenRecordPayment={handleOpenRecordPayment}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Subscription Modal (Create / Edit) */}
      <SubscriptionModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingSubscription(null); }}
        onSave={handleSaveSubscription}
        initialData={editingSubscription}
      />

      {/* Payment Recording Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => { setIsPaymentModalOpen(false); setPreselectedSubIdForPayment(undefined); }}
        subscriptions={subscriptions}
        preselectedSubId={preselectedSubIdForPayment}
        onRecord={recordPayment}
      />

      {/* Delete Subscription Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingSubscription)}
        onClose={() => setDeletingSubscription(null)}
        onConfirm={async () => {
          if (deletingSubscription) {
            await deleteSubscription(deletingSubscription.id);
            setDeletingSubscription(null);
          }
        }}
        title="Delete Subscription"
        message="Are you sure you want to delete this subscription? Tracking history and future reminders will be removed."
        itemName={deletingSubscription?.serviceName || ''}
      />

      {/* Delete Payment Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingPayment)}
        onClose={() => setDeletingPayment(null)}
        onConfirm={async () => {
          if (deletingPayment) {
            await deletePayment(deletingPayment.id);
            setDeletingPayment(null);
          }
        }}
        title="Delete Payment Record"
        message="Are you sure you want to remove this verified payment from the ledger?"
        itemName={deletingPayment ? `${deletingPayment.serviceName} (${deletingPayment.currency} ${deletingPayment.amount})` : ''}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LocalSecurityGate>
        <SubscriptionProvider>
          <LicenseGate><MainApp /></LicenseGate>
        </SubscriptionProvider>
      </LocalSecurityGate>
    </AuthProvider>
  );
}
