import { useMemo, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Home,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  User as UserIcon,
  Wrench,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { AppView, ListingType, ProviderProfile } from '../types/sheba';
import { CategoryIllustration } from './CategoryIllustration';
import { LocationSelectors } from './LocationSelectors';
import { ProviderCard } from './ProviderCard';
import { SafeImage } from './SafeImage';
import { CardSkeletonGrid } from './ShimmerSkeleton';

interface HomeViewProps {
  onSearchSubmit: (filters: {
    keyword: string;
    category: string;
    division: string;
    district: string;
    upazila: string;
    listingType?: '' | ListingType;
  }) => void;
  onSelectCategory: (categorySlug: string, listingType?: ListingType) => void;
  onNavigate: (view: AppView) => void;
  onOpenCreatePost: (presetType?: ListingType) => void;
  onViewProvider: (providerId: string) => void;
  onStartChat: (provider: ProviderProfile) => void;
  onToggleFavorite: (provider: ProviderProfile) => void;
}

export function HomeView({
  onSearchSubmit,
  onSelectCategory,
  onNavigate,
  onOpenCreatePost,
  onViewProvider,
  onStartChat,
  onToggleFavorite,
}: HomeViewProps) {
  const {
    language,
    t,
    user,
    userProfile,
    categories,
    approvedProviders,
    providersLoading,
    favorites,
    ratingByProvider,
    interestProfile,
  } = useApp();

  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [upazila, setUpazila] = useState('');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Per-section quick category filters
  const [serviceTab, setServiceTab] = useState<string>('all');
  const [houseRentTab, setHouseRentTab] = useState<string>('all');
  const [secondHandTab, setSecondHandTab] = useState<string>('all');
  const [darazFeedType, setDarazFeedType] = useState<'all' | ListingType>('all');
  const [darazLimit, setDarazLimit] = useState(20);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearchSubmit({ keyword, category, division, district, upazila });
  };

  const serviceCategories = useMemo(
    () => categories.filter((c) => (c.listingType || 'service') === 'service'),
    [categories]
  );
  const houseRentCategories = useMemo(
    () => categories.filter((c) => c.listingType === 'house-rent'),
    [categories]
  );
  const secondHandCategories = useMemo(
    () => categories.filter((c) => c.listingType === 'secondhand'),
    [categories]
  );

  // 1. Service listings with category filter
  const filteredServices = useMemo(() => {
    const base = approvedProviders.filter(
      (p) => !p.listingType || p.listingType === 'service'
    );
    const list =
      serviceTab === 'all'
        ? base
        : base.filter((p) => p.categorySlug === serviceTab);
    return list.slice(0, 6);
  }, [approvedProviders, serviceTab]);

  // 2. House rent listings with category filter
  const filteredHouseRent = useMemo(() => {
    const base = approvedProviders.filter((p) => p.listingType === 'house-rent');
    const list =
      houseRentTab === 'all'
        ? base
        : base.filter((p) => p.categorySlug === houseRentTab);
    return list.slice(0, 6);
  }, [approvedProviders, houseRentTab]);

  // 3. Second-hand listings with category filter
  const filteredSecondHand = useMemo(() => {
    const base = approvedProviders.filter((p) => p.listingType === 'secondhand');
    const list =
      secondHandTab === 'all'
        ? base
        : base.filter((p) => p.categorySlug === secondHandTab);
    return list.slice(0, 6);
  }, [approvedProviders, secondHandTab]);

  // 4. All items combined for Daraz-style 2-col feed
  const darazItems = useMemo(() => {
    const list =
      darazFeedType === 'all'
        ? approvedProviders
        : approvedProviders.filter(
            (p) => (p.listingType || 'service') === darazFeedType
          );
    return list.slice(0, darazLimit);
  }, [approvedProviders, darazFeedType, darazLimit]);

  const totalDarazMatching = useMemo(() => {
    if (darazFeedType === 'all') return approvedProviders.length;
    return approvedProviders.filter(
      (p) => (p.listingType || 'service') === darazFeedType
    ).length;
  }, [approvedProviders, darazFeedType]);

  // 5. Bottom-of-Page Personalized / Smart Suggestion Posts
  const suggestedPosts = useMemo(() => {
    if (approvedProviders.length === 0) return [];
    const favSet = new Set(favorites.map((f) => f.providerId));
    const catSet = new Set(interestProfile.categories);
    const tagSet = new Set(interestProfile.tags);

    return [...approvedProviders]
      .map((item) => {
        let score = 0;
        if (catSet.has(item.categorySlug)) score += 6;
        if (item.tags) {
          for (const tg of item.tags) {
            if (tagSet.has(tg)) score += 3;
          }
        }
        if (item.verificationStatus === 'verified') score += 2;
        if (favSet.has(item.id)) score += 1;
        const stat = ratingByProvider[item.id];
        if (stat) score += stat.avg;
        if (item.categorySlug === 'tutor') score += 1;
        return { item, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((entry) => entry.item);
  }, [approvedProviders, favorites, interestProfile, ratingByProvider]);

  const userName =
    userProfile?.displayName ||
    user?.displayName ||
    (language === 'bn' ? 'স্বাগতম' : 'Welcome');
  const avatarSrc = userProfile?.photoUrl || user?.photoURL || '';
  const activeLocationLabel = [upazila, district, division]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="pb-10">
      {/* Full-Width Clean Hero */}
      <section className="border-b border-slate-200 bg-white py-5 sm:py-8 dark:border-slate-800 dark:bg-[#090D16]">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
            {/* Left Copy & Search Controls */}
            <div className="lg:col-span-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onNavigate('profile')}
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                  >
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={userName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserIcon
                        className="h-4 w-4 text-slate-600 dark:text-slate-300"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                  <div className="text-xs">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {userName}
                    </p>
                    <button
                      type="button"
                      onClick={() => setFilterDrawerOpen((prev) => !prev)}
                      className="inline-flex cursor-pointer items-center gap-1 text-slate-500 hover:text-[#2563EB] dark:text-slate-400 dark:hover:text-blue-400"
                    >
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span>
                        {activeLocationLabel ||
                          (language === 'bn'
                            ? 'সারা বাংলাদেশ (এলাকা বাছুন)'
                            : 'All Bangladesh (Select Area)')}
                      </span>
                    </button>
                  </div>
                </div>

                <span className="text-xs font-semibold text-[#2563EB] dark:text-blue-400">
                  {language === 'bn'
                    ? '৬৪ জেলা · ১০০% ফ্রি মার্কেটপ্লেস'
                    : '64 Districts · 100% Free'}
                </span>
              </div>

              <h1 className="mt-4 font-display text-2xl leading-tight font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl dark:text-slate-50">
                {t.heroTitle}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {t.heroSubtitle}
              </p>

              {/* Search Bar + Filter Drawer */}
              <form onSubmit={handleSubmit} className="mt-5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search
                      className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      aria-label={t.searchPlaceholder}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#111827] dark:text-slate-100 dark:focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setFilterDrawerOpen((prev) => !prev)}
                    aria-expanded={filterDrawerOpen}
                    aria-label={t.filterLocation}
                    className={`inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors ${
                      filterDrawerOpen
                        ? 'border-[#2563EB] bg-blue-50 text-[#2563EB] dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-400'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200'
                    }`}
                  >
                    <SlidersHorizontal className="h-4.5 w-4.5" aria-hidden="true" />
                  </button>

                  <button
                    type="submit"
                    className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] sm:px-5"
                  >
                    <span>{t.searchButton}</span>
                  </button>
                </div>

                {filterDrawerOpen && (
                  <div className="space-y-2.5 border-t border-slate-200 pt-3 dark:border-slate-800">
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        aria-label={t.allCategories}
                        className="min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#0B1120] dark:text-slate-100"
                      >
                        <option value="">{t.allCategories}</option>
                        {categories.map((cat) => (
                          <option key={cat.slug} value={cat.slug}>
                            {language === 'bn' ? cat.nameBn : cat.nameEn}
                          </option>
                        ))}
                      </select>

                      <div className="sm:col-span-3">
                        <LocationSelectors
                          division={division}
                          district={district}
                          upazila={upazila}
                          onDivisionChange={setDivision}
                          onDistrictChange={setDistrict}
                          onUpazilaChange={setUpazila}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </form>

              {/* Quick Actions: Services, House Rent, Second-Hand & All Posts */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('services')}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-[#2563EB] hover:text-[#2563EB] dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200"
                >
                  <Wrench className="h-3.5 w-3.5 text-[#2563EB] dark:text-blue-400" aria-hidden="true" />
                  <span>{language === 'bn' ? 'কাজ ও সেবা' : 'Work & Services'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('house-rent')}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-[#2563EB] hover:text-[#2563EB] dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200"
                >
                  <Home className="h-3.5 w-3.5 text-[#2563EB] dark:text-blue-400" aria-hidden="true" />
                  <span>{t.navHouseRent}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('secondhand')}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-[#2563EB] hover:text-[#2563EB] dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200"
                >
                  <ShoppingBag className="h-3.5 w-3.5 text-[#2563EB] dark:text-blue-400" aria-hidden="true" />
                  <span>{t.navSecondHand}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('browse')}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-[#2563EB] hover:text-[#2563EB] dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200"
                >
                  <span>{language === 'bn' ? 'সব বিজ্ঞাপন' : 'All Posts'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenCreatePost('service')}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[#2563EB] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
                >
                  <span>+ {t.becomeProvider}</span>
                </button>
              </div>
            </div>

            {/* Right Clean Visual Frame */}
            <div className="hidden lg:col-span-4 lg:block">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
                <SafeImage
                  src="/src/assets/images/sheba_hero_craftsman_1795435936196.jpg"
                  alt={
                    language === 'bn'
                      ? 'দক্ষ সেবাদাতা বৈদ্যুতিক কাজ করছেন'
                      : 'Skilled service technician inspecting equipment'
                  }
                  eager
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Full-Width Flat Marketplace Feed */}
      <div className="mx-auto max-w-7xl space-y-8 px-3 pt-6 sm:px-6 lg:px-8">
        {/* SVG Category Grid */}
        <section>
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-bold tracking-tight text-slate-950 sm:text-xl dark:text-slate-50">
              {t.mostUsedServices}
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('services')}
              className="cursor-pointer text-xs font-semibold text-[#2563EB] hover:underline sm:text-sm dark:text-blue-400"
            >
              {t.viewAll}
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7">
            {serviceCategories.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => onSelectCategory(cat.slug, 'service')}
                className="group flex cursor-pointer flex-col items-center rounded-lg border border-slate-200 bg-white p-2.5 text-center transition-all hover:border-[#2563EB]/60 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] dark:border-slate-800 dark:bg-[#111827] dark:hover:border-blue-500/60"
              >
                <div className="flex h-10 w-10 items-center justify-center transition-transform group-hover:scale-105">
                  <CategoryIllustration slug={cat.slug} className="h-9 w-9" />
                </div>
                <span className="mt-1.5 line-clamp-2 text-[11px] leading-snug font-semibold text-slate-800 sm:text-xs dark:text-slate-200">
                  {language === 'bn' ? cat.nameBn : cat.nameEn}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* SECTION 1: সেবার বিজ্ঞাপন (Horizontal Card + Filter Tabs) */}
        <section className="border-t border-slate-200 pt-6 dark:border-slate-800">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight text-slate-950 sm:text-xl dark:text-slate-50">
                {language === 'bn' ? 'সেবার বিজ্ঞাপন' : 'Local Services'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'ক্যাটাগরি ফিল্টার করে আপনার কাছের সেবাদাতাদের খুঁজুন'
                  : 'Filter by service category near you'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('services')}
              className="cursor-pointer text-xs font-semibold text-[#2563EB] hover:underline sm:text-sm dark:text-blue-400"
            >
              {t.viewAll}
            </button>
          </div>

          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1.5">
            <button
              type="button"
              onClick={() => setServiceTab('all')}
              className={`min-h-8 shrink-0 cursor-pointer rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                serviceTab === 'all'
                  ? 'bg-[#2563EB] text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-[#2563EB]/50 dark:border-slate-800 dark:bg-[#111827] dark:text-slate-300'
              }`}
            >
              {t.allCategoryShort}
            </button>
            {serviceCategories.slice(0, 9).map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setServiceTab(cat.slug)}
                className={`min-h-8 shrink-0 cursor-pointer rounded-md px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                  serviceTab === cat.slug
                    ? 'bg-[#2563EB] text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-[#2563EB]/50 dark:border-slate-800 dark:bg-[#111827] dark:text-slate-300'
                }`}
              >
                {language === 'bn' ? cat.nameBn : cat.nameEn}
              </button>
            ))}
          </div>

          {providersLoading ? (
            <div className="mt-3">
              <CardSkeletonGrid variant="horizontal" count={3} />
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="mt-3 py-6 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'এই ক্যাটাগরিতে এখনো কোনো সেবার বিজ্ঞাপন নেই।'
                  : 'No service posts in this filter yet.'}
              </p>
              <button
                type="button"
                onClick={() => onOpenCreatePost('service')}
                className="mt-3 inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md bg-[#2563EB] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
              >
                <span>{t.becomeProvider}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  variant="horizontal"
                  isFavorite={favorites.some(
                    (f) => f.providerId === provider.id
                  )}
                  onToggleFavorite={onToggleFavorite}
                  onViewProfile={onViewProvider}
                  onStartChat={onStartChat}
                />
              ))}
            </div>
          )}
        </section>

        {/* SECTION 2: বাসা ভাড়া ও টু-লেট (Full-Width Flat + Filter Tabs + Horizontal Card) */}
        <section className="border-t border-slate-200 pt-6 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Home
                className="h-5 w-5 text-[#2563EB] dark:text-blue-400"
                aria-hidden="true"
              />
              <div>
                <h2 className="font-display text-lg font-bold tracking-tight text-slate-950 sm:text-xl dark:text-slate-50">
                  {t.houseRentSectionTitle}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.houseRentSectionSub}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onOpenCreatePost('house-rent')}
                className="cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#2563EB] hover:text-[#2563EB] dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200"
              >
                + {language === 'bn' ? 'টু-লেট দিন' : 'Post Rental'}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('house-rent')}
                className="cursor-pointer text-xs font-semibold text-[#2563EB] hover:underline sm:text-sm dark:text-blue-400"
              >
                {t.viewAll}
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1.5">
            <button
              type="button"
              onClick={() => setHouseRentTab('all')}
              className={`min-h-8 shrink-0 cursor-pointer rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                houseRentTab === 'all'
                  ? 'bg-[#2563EB] text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-[#2563EB]/50 dark:border-slate-800 dark:bg-[#111827] dark:text-slate-300'
              }`}
            >
              {t.allCategoryShort}
            </button>
            {houseRentCategories.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setHouseRentTab(cat.slug)}
                className={`min-h-8 shrink-0 cursor-pointer rounded-md px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                  houseRentTab === cat.slug
                    ? 'bg-[#2563EB] text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-[#2563EB]/50 dark:border-slate-800 dark:bg-[#111827] dark:text-slate-300'
                }`}
              >
                {language === 'bn' ? cat.nameBn : cat.nameEn}
              </button>
            ))}
          </div>

          {providersLoading ? (
            <div className="mt-3">
              <CardSkeletonGrid variant="horizontal" count={3} />
            </div>
          ) : filteredHouseRent.length === 0 ? (
            <p className="mt-3 py-4 text-sm text-slate-500 dark:text-slate-400">
              {language === 'bn'
                ? 'এই ফিল্টারে কোনো বাসা ভাড়ার বিজ্ঞাপন নেই।'
                : 'No house rentals in this filter yet.'}
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredHouseRent.map((post) => (
                <ProviderCard
                  key={post.id}
                  provider={post}
                  variant="horizontal"
                  isFavorite={favorites.some((f) => f.providerId === post.id)}
                  onToggleFavorite={onToggleFavorite}
                  onViewProfile={onViewProvider}
                  onStartChat={onStartChat}
                />
              ))}
            </div>
          )}
        </section>

        {/* SECTION 3: সেকেন্ড হ্যান্ড ক্রয়-বিক্রয় (Full-Width Flat + Filter Tabs + Horizontal Card) */}
        <section className="border-t border-slate-200 pt-6 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShoppingBag
                className="h-5 w-5 text-[#2563EB] dark:text-blue-400"
                aria-hidden="true"
              />
              <div>
                <h2 className="font-display text-lg font-bold tracking-tight text-slate-950 sm:text-xl dark:text-slate-50">
                  {t.secondHandSectionTitle}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.secondHandSectionSub}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onOpenCreatePost('secondhand')}
                className="cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#2563EB] hover:text-[#2563EB] dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200"
              >
                + {language === 'bn' ? 'পণ্য বিক্রি করুন' : 'Sell Item'}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('secondhand')}
                className="cursor-pointer text-xs font-semibold text-[#2563EB] hover:underline sm:text-sm dark:text-blue-400"
              >
                {t.viewAll}
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1.5">
            <button
              type="button"
              onClick={() => setSecondHandTab('all')}
              className={`min-h-8 shrink-0 cursor-pointer rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                secondHandTab === 'all'
                  ? 'bg-[#2563EB] text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-[#2563EB]/50 dark:border-slate-800 dark:bg-[#111827] dark:text-slate-300'
              }`}
            >
              {t.allCategoryShort}
            </button>
            {secondHandCategories.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setSecondHandTab(cat.slug)}
                className={`min-h-8 shrink-0 cursor-pointer rounded-md px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                  secondHandTab === cat.slug
                    ? 'bg-[#2563EB] text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-[#2563EB]/50 dark:border-slate-800 dark:bg-[#111827] dark:text-slate-300'
                }`}
              >
                {language === 'bn' ? cat.nameBn : cat.nameEn}
              </button>
            ))}
          </div>

          {providersLoading ? (
            <div className="mt-3">
              <CardSkeletonGrid variant="horizontal" count={3} />
            </div>
          ) : filteredSecondHand.length === 0 ? (
            <p className="mt-3 py-4 text-sm text-slate-500 dark:text-slate-400">
              {language === 'bn'
                ? 'এই ফিল্টারে কোনো সেকেন্ড হ্যান্ড পণ্য নেই।'
                : 'No second-hand items in this filter yet.'}
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredSecondHand.map((post) => (
                <ProviderCard
                  key={post.id}
                  provider={post}
                  variant="horizontal"
                  isFavorite={favorites.some((f) => f.providerId === post.id)}
                  onToggleFavorite={onToggleFavorite}
                  onViewProfile={onViewProvider}
                  onStartChat={onStartChat}
                />
              ))}
            </div>
          )}
        </section>

        {/* SECTION 4: সব ধরনের বিজ্ঞাপন একসাথে (Daraz 2-Column Vertical Card Grid) */}
        <section className="border-t border-slate-200 pt-6 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight text-slate-950 sm:text-xl dark:text-slate-50">
                {language === 'bn'
                  ? 'সব ধরনের বিজ্ঞাপন (একসাথে দেখুন)'
                  : 'All Marketplace Items'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'সেবা, বাসা ভাড়া ও সেকেন্ড হ্যান্ড — সব পোস্ট একত্রে'
                  : 'Services, rentals & second-hand items combined'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('browse')}
              className="cursor-pointer text-xs font-semibold text-[#2563EB] hover:underline sm:text-sm dark:text-blue-400"
            >
              {t.viewAll}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {(
              [
                { id: 'all', bn: 'সবগুলো', en: 'All' },
                { id: 'service', bn: 'সেবা / কাজ', en: 'Services' },
                { id: 'house-rent', bn: 'বাসা ভাড়া', en: 'House Rent' },
                { id: 'secondhand', bn: 'সেকেন্ড হ্যান্ড', en: 'Second-Hand' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setDarazFeedType(opt.id);
                  setDarazLimit(20);
                }}
                className={`min-h-8 cursor-pointer rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  darazFeedType === opt.id
                    ? 'bg-[#2563EB] text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-[#2563EB]/50 dark:border-slate-800 dark:bg-[#111827] dark:text-slate-300'
                }`}
              >
                {language === 'bn' ? opt.bn : opt.en}
              </button>
            ))}
          </div>

          {providersLoading ? (
            <div className="mt-3.5">
              <CardSkeletonGrid variant="grid" count={6} />
            </div>
          ) : darazItems.length > 0 && (
            <>
              <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 md:grid-cols-4 lg:grid-cols-5">
                {darazItems.map((item) => (
                  <ProviderCard
                    key={`daraz-${item.id}`}
                    provider={item}
                    variant="grid"
                    isFavorite={favorites.some((f) => f.providerId === item.id)}
                    onToggleFavorite={onToggleFavorite}
                    onViewProfile={onViewProvider}
                    onStartChat={onStartChat}
                  />
                ))}
              </div>

              {darazItems.length < totalDarazMatching && (
                <div className="mt-5 text-center">
                  <button
                    type="button"
                    onClick={() => setDarazLimit((prev) => prev + 15)}
                    className="min-h-10 cursor-pointer rounded-md border border-slate-300 bg-white px-6 text-xs font-bold text-slate-800 transition-colors hover:border-[#2563EB] hover:text-[#2563EB] dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200"
                  >
                    {language === 'bn' ? 'আরও বিজ্ঞাপন দেখুন' : 'Load More Items'}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Clean Minimal Trust & Coverage Strip (Flat, zero nested cards) */}
        <section className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-6 lg:grid-cols-4 dark:border-slate-800">
          {[
            {
              icon: MapPin,
              title: t.trustDivisions,
              sub: t.trustDivisionsSub,
            },
            {
              icon: CheckCircle2,
              title: t.trustFree,
              sub: t.trustFreeSub,
            },
            {
              icon: ShieldCheck,
              title: t.trustVerified,
              sub: t.trustVerifiedSub,
            },
            {
              icon: MessageSquare,
              title: t.trustChat,
              sub: t.trustChatSub,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start gap-2.5 py-1">
                <Icon
                  className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#2563EB] dark:text-blue-400"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-display text-xs font-bold text-slate-900 sm:text-sm dark:text-slate-100">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {item.sub}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        {/* VERY BOTTOM OF LANDING PAGE: Suggested Posts */}
        {(providersLoading || suggestedPosts.length > 0) && (
          <section className="border-t border-slate-200 pt-6 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold tracking-tight text-slate-950 sm:text-xl dark:text-slate-50">
                  {language === 'bn'
                    ? 'আপনার জন্য সাজেশন'
                    : 'Suggested Posts For You'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'bn'
                    ? 'আপনার পছন্দ, ট্যাগ ও জনপ্রিয়তার ভিত্তিতে বাছাইকৃত বিজ্ঞাপন'
                    : 'Recommended listings based on your interests & trending tags'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('browse')}
                className="cursor-pointer text-xs font-semibold text-[#2563EB] hover:underline sm:text-sm dark:text-blue-400"
              >
                {t.viewAll}
              </button>
            </div>

            {providersLoading ? (
              <div className="mt-3.5">
                <CardSkeletonGrid variant="grid" count={5} />
              </div>
            ) : (
              <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 md:grid-cols-4 lg:grid-cols-5">
                {suggestedPosts.map((sugItem) => (
                  <ProviderCard
                    key={`sug-${sugItem.id}`}
                    provider={sugItem}
                    variant="grid"
                    isFavorite={favorites.some((f) => f.providerId === sugItem.id)}
                    onToggleFavorite={onToggleFavorite}
                    onViewProfile={onViewProvider}
                    onStartChat={onStartChat}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
