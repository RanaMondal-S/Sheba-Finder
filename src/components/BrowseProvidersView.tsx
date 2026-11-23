import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Home,
  LayoutGrid,
  List,
  RotateCcw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Wrench,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { localizeDigits } from '../i18n/translations';
import { normalizeTag } from '../utils/tags';
import type { ListingType, ProviderProfile } from '../types/sheba';
import { LocationSelectors } from './LocationSelectors';
import { ProviderCard } from './ProviderCard';
import { CardSkeletonGrid } from './ShimmerSkeleton';

interface BrowseProvidersViewProps {
  initialKeyword?: string;
  initialCategory?: string;
  initialDivision?: string;
  initialDistrict?: string;
  initialUpazila?: string;
  initialListingType?: '' | ListingType;
  onBack?: () => void;
  onViewProvider: (providerId: string) => void;
  onStartChat: (provider: ProviderProfile) => void;
  onToggleFavorite: (provider: ProviderProfile) => void;
  onBecomeProvider: () => void;
}

export function BrowseProvidersView({
  initialKeyword = '',
  initialCategory = '',
  initialDivision = '',
  initialDistrict = '',
  initialUpazila = '',
  initialListingType = '',
  onBack,
  onViewProvider,
  onStartChat,
  onToggleFavorite,
  onBecomeProvider,
}: BrowseProvidersViewProps) {
  const {
    language,
    t,
    categories,
    approvedProviders,
    providersLoading,
    ratingByProvider,
    favorites,
  } = useApp();

  const [listingType, setListingType] = useState<'' | ListingType>(
    initialListingType
  );
  const [keyword, setKeyword] = useState(initialKeyword);
  const [category, setCategory] = useState(initialCategory);
  const [division, setDivision] = useState(initialDivision);
  const [district, setDistrict] = useState(initialDistrict);
  const [upazila, setUpazila] = useState(initialUpazila);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'experience'>(
    'newest'
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filtersExpanded, setFiltersExpanded] = useState(
    Boolean(initialDivision || initialDistrict || initialUpazila)
  );

  const visibleCategories = useMemo(() => {
    if (!listingType) return categories;
    return categories.filter(
      (c) => (c.listingType || 'service') === listingType
    );
  }, [categories, listingType]);

  const filteredProviders = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const cleanQTag = normalizeTag(q);

    const list = approvedProviders.filter((p) => {
      const pType = p.listingType || 'service';
      if (listingType && pType !== listingType) return false;
      if (category && p.categorySlug !== category) return false;
      if (division && p.division.toLowerCase() !== division.toLowerCase()) {
        return false;
      }
      if (district && p.district.toLowerCase() !== district.toLowerCase()) {
        return false;
      }
      if (upazila && p.upazila.toLowerCase() !== upazila.toLowerCase()) {
        return false;
      }
      if (verifiedOnly && p.verificationStatus !== 'verified') return false;

      if (q) {
        const hay = [
          p.businessName,
          p.ownerName,
          p.customCategory || '',
          p.categoryNameBn,
          p.categoryNameEn,
          p.bio,
          p.startingRate || '',
          p.propertySpec || '',
          ...(p.specItems || []),
          p.condition || '',
          p.addressNote || '',
          p.division,
          p.district,
          p.upazila,
          ...(p.serviceAreas || []),
          ...(p.tags || []).map((tg) => `#${tg} ${tg}`),
        ]
          .join(' ')
          .toLowerCase();

        const tagMatch =
          cleanQTag &&
          (p.tags || []).some((tg) => normalizeTag(tg).includes(cleanQTag));

        if (!hay.includes(q) && !tagMatch) return false;
      }

      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'rating') {
        const ra = ratingByProvider[a.id]?.avg ?? 0;
        const rb = ratingByProvider[b.id]?.avg ?? 0;
        return rb - ra;
      }
      if (sortBy === 'experience') {
        return (b.experienceYears || 0) - (a.experienceYears || 0);
      }
      const ta = a.createdAt?.toMillis?.() ?? 0;
      const tb = b.createdAt?.toMillis?.() ?? 0;
      return tb - ta;
    });
  }, [
    approvedProviders,
    listingType,
    keyword,
    category,
    division,
    district,
    upazila,
    verifiedOnly,
    sortBy,
    ratingByProvider,
  ]);

  const resetFilters = () => {
    setKeyword('');
    setCategory('');
    setDivision('');
    setDistrict('');
    setUpazila('');
    setVerifiedOnly(false);
    setSortBy('newest');
  };

  const sectionHeading =
    listingType === 'service'
      ? t.servicesDirectoryTitle
      : listingType === 'house-rent'
        ? t.houseRentSectionTitle
        : listingType === 'secondhand'
          ? t.secondHandSectionTitle
          : t.providersDirectoryTitle;

  return (
    <section className="min-h-[78vh] py-5 sm:py-8">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label={language === 'bn' ? 'পিছনে যান' : 'Back'}
                className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-100"
              >
                <ArrowLeft className="h-4.5 w-4.5" aria-hidden="true" />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-bold tracking-tight text-slate-950 sm:text-2xl dark:text-slate-50">
                {sectionHeading}
              </h1>
              <p className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
                {localizeDigits(filteredProviders.length, language)}{' '}
                {t.providersFound}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {/* Daraz 2-col Grid / Horizontal List Switcher */}
            <div className="flex items-center rounded-md border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-[#111827]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                className={`inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded ${
                  viewMode === 'grid'
                    ? 'bg-[#2563EB] text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                className={`inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded ${
                  viewMode === 'list'
                    ? 'bg-[#2563EB] text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                <List className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setFiltersExpanded((prev) => !prev)}
              className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors sm:px-3 ${
                filtersExpanded
                  ? 'border-[#2563EB] bg-blue-50 text-[#2563EB] dark:border-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{t.filterLocation}</span>
            </button>

            <button
              type="button"
              onClick={resetFilters}
              aria-label={t.clearFilters}
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 sm:w-auto sm:gap-1.5 sm:px-3 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-300"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden text-xs font-semibold sm:inline">
                {t.clearFilters}
              </span>
            </button>
          </div>
        </div>

        {/* Dedicated Marketplace Section Switcher */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {[
            { id: '' as const, icon: null, bn: 'সব বিজ্ঞাপন', en: 'All Listings' },
            { id: 'service' as const, icon: Wrench, bn: 'সেবা / কাজ', en: 'Services' },
            { id: 'house-rent' as const, icon: Home, bn: 'বাসা ভাড়া', en: 'House Rent' },
            {
              id: 'secondhand' as const,
              icon: ShoppingBag,
              bn: 'সেকেন্ড হ্যান্ড',
              en: 'Second-Hand',
            },
          ].map((sec) => {
            const Icon = sec.icon;
            const active = listingType === sec.id;
            return (
              <button
                key={sec.id || 'all'}
                type="button"
                onClick={() => {
                  setListingType(sec.id);
                  setCategory('');
                }}
                className={`inline-flex min-h-8.5 cursor-pointer items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-[#2563EB] text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200'
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
                <span>{language === 'bn' ? sec.bn : sec.en}</span>
              </button>
            );
          })}
        </div>

        {/* Search + Sort Row */}
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-12">
          <div className="relative sm:col-span-8">
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
              className="h-10 w-full rounded-md border border-slate-200 bg-white py-2 pr-3 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#111827] dark:text-slate-100"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'newest' | 'rating' | 'experience')
              }
              aria-label={language === 'bn' ? 'সাজানোর ধরন' : 'Sort by'}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#111827] dark:text-slate-100"
            >
              <option value="newest">
                {language === 'bn' ? 'সর্বশেষ যুক্ত' : 'Newest First'}
              </option>
              <option value="rating">
                {language === 'bn' ? 'সর্বোচ্চ রেটিং' : 'Highest Rated'}
              </option>
              <option value="experience">
                {language === 'bn' ? 'অভিজ্ঞতা অনুযায়ী' : 'Most Experienced'}
              </option>
            </select>
          </div>
        </div>

        {/* Flat Expandable Bangladesh Location Cascade & Verified Toggle */}
        {filtersExpanded && (
          <div className="mt-3 space-y-3 border-y border-slate-200 py-3.5 dark:border-slate-800">
            <LocationSelectors
              division={division}
              district={district}
              upazila={upazila}
              onDivisionChange={setDivision}
              onDistrictChange={setDistrict}
              onUpazilaChange={setUpazila}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-[#2563EB]"
                />
                <BadgeCheck
                  className="h-4 w-4 text-[#2563EB] dark:text-blue-400"
                  aria-hidden="true"
                />
                <span>{t.verifiedOnly}</span>
              </label>
            </div>
          </div>
        )}

        {/* Horizontal Scrollable Category Filter Tabs */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setCategory('')}
            className={`min-h-8 shrink-0 cursor-pointer rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
              category === ''
                ? 'bg-[#2563EB] text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-[#2563EB]/50 dark:border-slate-800 dark:bg-[#111827] dark:text-slate-300'
            }`}
          >
            {t.allCategoryShort}
          </button>

          {visibleCategories.map((cat) => {
            const active = category === cat.slug;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setCategory(cat.slug)}
                className={`min-h-8 shrink-0 cursor-pointer rounded-md px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-[#2563EB] text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-[#2563EB]/50 dark:border-slate-800 dark:bg-[#111827] dark:text-slate-300'
                }`}
              >
                {language === 'bn' ? cat.nameBn : cat.nameEn}
              </button>
            );
          })}
        </div>

        {/* Results Grid */}
        {providersLoading ? (
          <div className="mt-4">
            <CardSkeletonGrid
              variant={viewMode === 'grid' ? 'grid' : 'horizontal'}
              count={8}
            />
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="mt-6 py-10 text-center">
            <h2 className="font-display text-lg font-bold text-slate-950 dark:text-slate-100">
              {t.noProvidersTitle}
            </h2>
            <p className="mx-auto mt-1.5 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {t.noProvidersSub}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-9 cursor-pointer rounded-md border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t.clearFilters}
              </button>
              <button
                type="button"
                onClick={onBecomeProvider}
                className="min-h-9 cursor-pointer rounded-md bg-[#2563EB] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
              >
                {t.becomeProvider}
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 md:grid-cols-4 lg:grid-cols-5">
            {filteredProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                variant="grid"
                isFavorite={favorites.some((f) => f.providerId === provider.id)}
                onToggleFavorite={onToggleFavorite}
                onViewProfile={onViewProvider}
                onStartChat={onStartChat}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                variant="horizontal"
                isFavorite={favorites.some((f) => f.providerId === provider.id)}
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
