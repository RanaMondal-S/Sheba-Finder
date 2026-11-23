import { useState } from 'react';
import {
  Bell,
  BellRing,
  CheckCheck,
  Globe,
  LogOut,
  Menu,
  Moon,
  Plus,
  Shield,
  Sun,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { localizeDigits } from '../i18n/translations';
import type { AppView, ListingType } from '../types/sheba';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenAuth: () => void;
  onOpenCreatePost?: (presetType?: ListingType) => void;
  onOpenConversation?: (conversationId: string) => void;
}

export function Navbar({
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenCreatePost,
  onOpenConversation,
}: NavbarProps) {
  const {
    language,
    setLanguage,
    t,
    theme,
    toggleTheme,
    user,
    userProfile,
    isAdmin,
    unreadChatCount,
    notifications,
    unreadNotificationCount,
    notifPermission,
    browserNotifEnabled,
    requestBrowserNotifications,
    toggleBrowserNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    handleSignOut,
  } = useApp();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const avatarUrl = userProfile?.photoUrl || user?.photoURL || '';
  const displayLabel =
    userProfile?.displayName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    '';

  const navItems: { view: AppView; label: string; count?: number }[] = [
    { view: 'home', label: t.navHome },
    { view: 'services', label: t.navServices },
    { view: 'house-rent', label: t.navHouseRent },
    { view: 'secondhand', label: t.navSecondHand },
    { view: 'browse', label: t.navBrowse },
    {
      view: 'chat',
      label: t.navChat,
      count: unreadChatCount > 0 ? unreadChatCount : undefined,
    },
    { view: 'favorites', label: t.navFavorites },
    { view: 'profile', label: t.navProfile },
    ...(isAdmin ? [{ view: 'admin' as AppView, label: t.navAdmin }] : []),
  ];

  const handleNavClick = (view: AppView) => {
    onNavigate(view);
    setMobileOpen(false);
    setNotifOpen(false);
  };

  const isItemActive = (view: AppView) => {
    if (view === 'profile') {
      return currentView === 'profile' || currentView === 'provider-dashboard';
    }
    return currentView === view;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 text-slate-900 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-[#090D16]/95 dark:text-slate-100">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap font-display text-lg font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2563EB] text-xs font-extrabold text-white">
            S
          </span>
          <span>{t.brand}</span>
        </button>

        <nav
          aria-label="Primary Navigation"
          className="hidden items-center gap-1 lg:flex"
        >
          {navItems.map((item) => {
            const active = isItemActive(item.view);
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => handleNavClick(item.view)}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                  active
                    ? 'bg-blue-50 font-semibold text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-400'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#2563EB] px-1 font-mono text-[10px] font-bold text-white tabular-nums">
                    {localizeDigits(item.count, language)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            aria-label={
              language === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'
            }
            className="inline-flex h-8.5 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{language === 'bn' ? 'EN' : 'বাংলা'}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === 'light'
                ? 'Switch to dark mode'
                : 'Switch to light mode'
            }
            className="inline-flex h-8.5 w-8.5 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Sun className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                aria-label={
                  language === 'bn' ? 'নোটিফিকেশন দেখুন' : 'View notifications'
                }
                className="relative inline-flex h-8.5 w-8.5 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2563EB] px-1 font-mono text-[10px] font-bold text-white tabular-nums">
                    {localizeDigits(unreadNotificationCount, language)}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border border-slate-200 bg-white p-3 text-slate-900 shadow-lg dark:border-slate-700 dark:bg-[#111827] dark:text-slate-100">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
                    <span className="text-xs font-bold">
                      {language === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
                    </span>
                    <div className="flex items-center gap-2">
                      {unreadNotificationCount > 0 && (
                        <button
                          type="button"
                          onClick={() => void markAllNotificationsRead()}
                          className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:underline dark:text-blue-400"
                        >
                          <CheckCheck className="h-3 w-3" aria-hidden="true" />
                          <span>{language === 'bn' ? 'সব পঠিত' : 'Read all'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setNotifOpen(false)}
                        className="cursor-pointer text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                      >
                        {language === 'bn' ? 'বন্ধ' : 'Close'}
                      </button>
                    </div>
                  </div>

                  {/* Browser / Phone Push Notification Activation Bar */}
                  {notifPermission !== 'unsupported' && (
                    <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 dark:border-slate-800 dark:bg-[#090D16]">
                      <div className="flex min-w-0 items-center gap-2">
                        <BellRing
                          className={`h-4 w-4 shrink-0 ${
                            notifPermission === 'granted' && browserNotifEnabled
                              ? 'text-[#2563EB] dark:text-blue-400'
                              : 'text-slate-400'
                          }`}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            {notifPermission === 'granted'
                              ? browserNotifEnabled
                                ? language === 'bn'
                                  ? 'ফোন/ব্রাউজার অ্যালার্ট চালু আছে'
                                  : 'Browser alerts ON'
                                : language === 'bn'
                                  ? 'ব্রাউজার অ্যালার্ট বন্ধ আছে'
                                  : 'Browser alerts paused'
                              : notifPermission === 'denied'
                                ? language === 'bn'
                                  ? 'ব্রাউজার সেটিংস থেকে অনুমতি দিন'
                                  : 'Blocked in browser settings'
                                : language === 'bn'
                                  ? 'ফোনে নোটিফিকেশন চালু করুন'
                                  : 'Enable phone/browser alerts'}
                          </p>
                        </div>
                      </div>
                      {notifPermission !== 'denied' && (
                        <button
                          type="button"
                          onClick={() =>
                            notifPermission === 'granted'
                              ? void toggleBrowserNotifications()
                              : void requestBrowserNotifications()
                          }
                          className={`shrink-0 cursor-pointer rounded px-2 py-1 text-[11px] font-bold transition-colors ${
                            notifPermission === 'granted' && browserNotifEnabled
                              ? 'border border-slate-300 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:text-slate-200'
                              : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                          }`}
                        >
                          {notifPermission === 'granted'
                            ? browserNotifEnabled
                              ? language === 'bn'
                                ? 'বন্ধ'
                                : 'Off'
                              : language === 'bn'
                                ? 'চালু'
                                : 'On'
                            : language === 'bn'
                              ? 'চালু করুন'
                              : 'Enable'}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                        {language === 'bn'
                          ? 'নতুন কোনো নোটিফিকেশন নেই'
                          : 'No notifications yet'}
                      </p>
                    ) : (
                      notifications.slice(0, 12).map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            void markNotificationRead(n.id);
                            if (n.conversationId && onOpenConversation) {
                              setNotifOpen(false);
                              onOpenConversation(n.conversationId);
                            } else if (n.type === 'message') {
                              handleNavClick('chat');
                            } else if (
                              n.type === 'approval' ||
                              n.type === 'verification'
                            ) {
                              handleNavClick('profile');
                            }
                          }}
                          className={`w-full cursor-pointer rounded-md border p-2.5 text-left transition-colors ${
                            n.read
                              ? 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-[#090D16]'
                              : 'border-blue-200 bg-blue-50/70 dark:border-blue-900/70 dark:bg-blue-950/30'
                          }`}
                        >
                          <p className="text-xs font-semibold">
                            {language === 'bn' ? n.titleBn : n.titleEn}
                          </p>
                          {(n.bodyBn || n.bodyEn) && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                              {language === 'bn' ? n.bodyBn : n.bodyEn}
                            </p>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {user && (
            <button
              type="button"
              onClick={() =>
                onOpenCreatePost
                  ? onOpenCreatePost('service')
                  : handleNavClick('create-post')
              }
              className="hidden h-8.5 shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-md bg-[#2563EB] px-3 text-xs font-bold text-white transition-colors hover:bg-[#1D4ED8] lg:inline-flex"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{language === 'bn' ? 'পোস্ট দিন' : 'Post Ad'}</span>
            </button>
          )}

          {user ? (
            <div className="hidden items-center gap-2 lg:flex">
              <button
                type="button"
                onClick={() => handleNavClick('profile')}
                className="inline-flex h-8.5 cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayLabel}
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon
                    className="h-3.5 w-3.5 shrink-0 text-[#2563EB] dark:text-blue-400"
                    aria-hidden="true"
                  />
                )}
                <span className="max-w-28 truncate">{displayLabel}</span>
              </button>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                aria-label={t.signOut}
                className="inline-flex h-8.5 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{t.signOut}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="hidden h-8.5 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-md bg-[#2563EB] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] lg:inline-flex"
            >
              {t.signIn}
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="inline-flex h-8.5 w-8.5 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 lg:hidden dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200"
          >
            {mobileOpen ? (
              <X className="h-4.5 w-4.5" aria-hidden="true" />
            ) : (
              <Menu className="h-4.5 w-4.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 text-slate-900 lg:hidden dark:border-slate-800 dark:bg-[#090D16] dark:text-slate-100">
          <nav className="flex flex-col gap-1">
            {isAdmin && (
              <button
                type="button"
                onClick={() => handleNavClick('admin')}
                className="flex min-h-10 items-center gap-2 rounded-md bg-blue-50 px-3 text-left text-sm font-semibold text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-400"
              >
                <Shield className="h-4 w-4" aria-hidden="true" />
                <span>{t.navAdmin}</span>
              </button>
            )}

            {navItems
              .filter((item) => item.view !== 'admin')
              .map((item) => (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => handleNavClick(item.view)}
                  className={`flex min-h-10 items-center justify-between rounded-md px-3 text-left text-sm font-medium ${
                    isItemActive(item.view)
                      ? 'bg-blue-50 font-semibold text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-400'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.count !== undefined && (
                    <span className="font-mono text-xs font-semibold tabular-nums">
                      {localizeDigits(item.count, language)}
                    </span>
                  )}
                </button>
              ))}

            <div className="mt-2 border-t border-slate-200 pt-3 dark:border-slate-800">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 px-1">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayLabel}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[#2563EB] dark:bg-blue-950">
                        <UserIcon className="h-4 w-4" aria-hidden="true" />
                      </span>
                    )}
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {displayLabel}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      void handleSignOut();
                    }}
                    className="flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    <span>{t.signOut}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenAuth();
                  }}
                  className="flex min-h-10 w-full cursor-pointer items-center justify-center rounded-md bg-[#2563EB] text-sm font-semibold text-white hover:bg-[#1D4ED8]"
                >
                  {t.signIn}
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
