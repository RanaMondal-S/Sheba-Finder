import { Bookmark } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ProviderProfile } from '../types/sheba';
import { ProviderCard } from './ProviderCard';
import { CardSkeletonGrid } from './ShimmerSkeleton';

interface FavoritesViewProps {
  onViewProvider: (providerId: string) => void;
  onStartChat: (provider: ProviderProfile) => void;
  onToggleFavorite: (provider: ProviderProfile) => void;
  onBrowse: () => void;
  onOpenAuth: () => void;
}

export function FavoritesView({
  onViewProvider,
  onStartChat,
  onToggleFavorite,
  onBrowse,
  onOpenAuth,
}: FavoritesViewProps) {
  const { language, user, favorites, approvedProviders, providersLoading } =
    useApp();

  if (!user) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <Bookmark className="mx-auto h-10 w-10 text-[#2563EB] dark:text-blue-400" aria-hidden="true" />
        <h1 className="mt-4 font-display text-2xl font-bold text-slate-950 dark:text-slate-50">
          {language === 'bn'
            ? 'সংরক্ষিত তালিকা দেখতে লগইন করুন'
            : 'Sign in to view your saved listings'}
        </h1>
        <button
          type="button"
          onClick={onOpenAuth}
          className="mt-5 min-h-10 cursor-pointer rounded-md bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
        >
          {language === 'bn' ? 'লগইন করুন' : 'Sign In'}
        </button>
      </section>
    );
  }

  const favoriteIds = new Set(favorites.map((f) => f.providerId));
  const savedProviders = approvedProviders.filter((p) =>
    favoriteIds.has(p.id)
  );

  return (
    <section className="min-h-[75vh] py-6 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
          <h1 className="font-display text-xl font-bold text-slate-950 sm:text-2xl dark:text-slate-50">
            {language === 'bn' ? 'আপনার সংরক্ষিত তালিকা' : 'Saved Listings'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {language === 'bn'
              ? 'দ্রুত যোগাযোগের জন্য সংরক্ষিত পোস্ট ও সেবাদাতাদের তালিকা'
              : 'Quick access to services, rentals, and items you saved'}
          </p>
        </div>

        {providersLoading ? (
          <div className="mt-5">
            <CardSkeletonGrid variant="horizontal" count={3} />
          </div>
        ) : savedProviders.length === 0 ? (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#111827]">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {language === 'bn'
                ? 'আপনি এখনো কোনো পোস্ট সংরক্ষিত তালিকায় যুক্ত করেননি।'
                : 'You have not saved any listings yet.'}
            </p>
            <button
              type="button"
              onClick={onBrowse}
              className="mt-4 min-h-9 cursor-pointer rounded-md bg-[#2563EB] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
            >
              {language === 'bn' ? 'পোস্ট খুঁজুন' : 'Browse Listings'}
            </button>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
            {savedProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                isFavorite={true}
                onToggleFavorite={onToggleFavorite}
                onViewProfile={onViewProvider}
                onStartChat={onStartChat}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
