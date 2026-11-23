import { Globe, Moon, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { AppView } from '../types/sheba';

interface FooterProps {
  onNavigate: (view: AppView) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const { language, setLanguage, theme, toggleTheme, t, isAdmin } = useApp();

  return (
    <footer className="border-t border-slate-200 bg-white py-8 pb-24 md:pb-10 dark:border-slate-800 dark:bg-[#090D16]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div className="max-w-md">
            <p className="font-display text-lg font-bold text-slate-950 dark:text-slate-50">
              {t.brand}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {t.footerTagline}
            </p>
            <p className="mt-2.5 text-xs font-semibold text-[#2563EB] dark:text-blue-400">
              {t.freeBadge}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="cursor-pointer whitespace-nowrap hover:text-[#2563EB] dark:hover:text-blue-400"
            >
              {t.navHome}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('services')}
              className="cursor-pointer whitespace-nowrap hover:text-[#2563EB] dark:hover:text-blue-400"
            >
              {t.navServices}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('house-rent')}
              className="cursor-pointer whitespace-nowrap hover:text-[#2563EB] dark:hover:text-blue-400"
            >
              {t.navHouseRent}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('secondhand')}
              className="cursor-pointer whitespace-nowrap hover:text-[#2563EB] dark:hover:text-blue-400"
            >
              {t.navSecondHand}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('browse')}
              className="cursor-pointer whitespace-nowrap hover:text-[#2563EB] dark:hover:text-blue-400"
            >
              {t.navBrowse}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="cursor-pointer whitespace-nowrap hover:text-[#2563EB] dark:hover:text-blue-400"
            >
              {t.navProfile}
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="cursor-pointer whitespace-nowrap hover:text-[#2563EB] dark:hover:text-blue-400"
              >
                {t.navAdmin}
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center dark:border-slate-800 dark:text-slate-400">
          <p>
            © ২০২৬ ShebaFinder ·{' '}
            {language === 'bn'
              ? 'সর্বস্বত্ব সংরক্ষিত · বাংলাদেশ'
              : 'All rights reserved · Bangladesh'}
          </p>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{language === 'bn' ? 'ডার্ক মোড' : 'Dark Mode'}</span>
                </>
              ) : (
                <>
                  <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{language === 'bn' ? 'লাইট মোড' : 'Light Mode'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
