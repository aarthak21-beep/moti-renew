import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Receipt, 
  BarChart3, 
  CalendarDays, 
  MessageSquareText, 
  Settings, 
  PlusCircle, 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubscriptions } from '../context/SubscriptionContext';
import { translations, Language } from '../i18n/translations';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenAddModal: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  onOpenAddModal,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { user } = useAuth();
  const { subscriptions, unreadNotificationCount } = useSubscriptions();

  const lang: Language = user?.language || 'en';
  const t = translations[lang] || translations.en;

  const navItems = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { 
      id: 'subscriptions', 
      label: t.nav.subscriptions, 
      icon: Layers, 
      badge: subscriptions.length > 0 ? subscriptions.length : undefined 
    },
    { id: 'payments', label: t.nav.payments, icon: Receipt },
    { id: 'calendar', label: t.nav.calendar, icon: CalendarDays },
    { id: 'analytics', label: t.nav.analytics, icon: BarChart3 },
    { 
      id: 'reminders', 
      label: t.nav.reminders, 
      icon: MessageSquareText,
      badge: unreadNotificationCount > 0 ? unreadNotificationCount : undefined,
      badgeColor: 'bg-red-500 text-white'
    },
    { id: 'settings', label: t.nav.settings, icon: Settings },
  ];

  const handleSelectTab = (id: string) => {
    onTabChange(id);
    onCloseMobile();
  };

  const content = (
    <div className="h-full flex flex-col justify-between p-4 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors">
      <div className="space-y-6">
        
        {/* Quick Add Button */}
        <div>
          <button
            onClick={() => {
              onOpenAddModal();
              onCloseMobile();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-[0.98] transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.actions.addSubscription}</span>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/60 dark:text-blue-400'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>


    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:block w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16">
        {content}
      </aside>

      {/* Mobile Drawer (with Backdrop) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-xs bg-white dark:bg-slate-900 h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
