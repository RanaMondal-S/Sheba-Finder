import {
  Bookmark,
  Home,
  LayoutGrid,
  MessageCircle,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { localizeDigits } from '../i18n/translations';
import type { AppView } from '../types/sheba';

interface MobileBottomNavProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

export function MobileBottomNav({
  currentView,
  onNavigate,
}: MobileBottomNavProps) {
  const { language, t, unreadChatCount } = useApp();

  if (currentView === 'provider') {
    return null;
  }

  const items: {
    view: AppView;
    label: string;
    icon: typeof Home;
    badge?: number;
  }[] = [
    { view: 'home', label: t.navHome, icon: Home },
    {
      view: 'chat',
      label: t.navChat,
      icon: MessageCircle,
      badge: unreadChatCount > 0 ? unreadChatCount : undefined,
    },
    { view: 'browse', label: t.navBrowse, icon: LayoutGrid },
    { view: 'favorites', label: t.navFavorites, icon: Bookmark },
    { view: 'profile', label: t.navProfile, icon: User },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-1.5 backdrop-blur-md md:hidden dark:border-slate-800 dark:bg-[#090D16]/95"
    >
      <div className="mx-auto flex max-w-md items-center justify-around gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            currentView === item.view ||
            (item.view === 'browse' &&
              (currentView === 'services' ||
                currentView === 'house-rent' ||
                currentView === 'secondhand')) ||
            (item.view === 'profile' && currentView === 'provider-dashboard');

          return (
            <button
              key={item.view}
              type="button"
              onClick={() => onNavigate(item.view)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                active
                  ? 'bg-blue-50 text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span className="relative">
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2563EB] px-1 font-mono text-[10px] font-bold text-white tabular-nums">
                    {localizeDigits(item.badge, language)}
                  </span>
                )}
              </span>
              {active && (
                <span className="whitespace-nowrap">{item.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
