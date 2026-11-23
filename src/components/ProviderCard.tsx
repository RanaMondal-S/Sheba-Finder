import {
  BadgeCheck,
  Bookmark,
  MapPin,
  MessageSquare,
  Star,
  User as UserIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { localizeDigits } from '../i18n/translations';
import { getListingTypeLabel } from '../utils/tags';
import type { ProviderProfile } from '../types/sheba';
import { SafeImage } from './SafeImage';

interface ProviderCardProps {
  provider: ProviderProfile;
  isFavorite: boolean;
  onToggleFavorite: (provider: ProviderProfile) => void;
  onViewProfile: (providerId: string) => void;
  onStartChat?: (provider: ProviderProfile) => void;
  variant?: 'horizontal' | 'grid';
}

export function ProviderCard({
  provider,
  isFavorite,
  onToggleFavorite,
  onViewProfile,
  onStartChat,
  variant = 'horizontal',
}: ProviderCardProps) {
  const { language, t, ratingByProvider } = useApp();
  const ratingStat = ratingByProvider[provider.id];
  const categoryLabel =
    provider.customCategory?.trim() ||
    (language === 'bn' ? provider.categoryNameBn : provider.categoryNameEn);
  const typeLabel = getListingTypeLabel(provider.listingType, language);
  const thumbSrc = provider.profilePhotoUrl || provider.galleryUrls?.[0] || '';

  if (variant === 'grid') {
    return (
      <article
        onClick={() => onViewProfile(provider.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onViewProfile(provider.id);
          }
        }}
        className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-all duration-150 hover:border-[#2563EB]/60 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] dark:border-slate-800 dark:bg-[#111827] dark:hover:border-blue-500/60"
      >
        {/* Top Full-Width Photo (Daraz Style) */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          {thumbSrc ? (
            <SafeImage
              src={thumbSrc}
              alt={provider.businessName}
              fallbackTitle={provider.businessName}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <UserIcon className="h-9 w-9" aria-hidden="true" />
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(provider);
            }}
            aria-label={isFavorite ? t.savedFavorite : t.saveFavorite}
            className={`absolute top-2 right-2 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md bg-white/90 shadow-xs backdrop-blur-xs transition-colors dark:bg-slate-900/90 ${
              isFavorite
                ? 'text-[#2563EB] dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-300'
            }`}
          >
            <Bookmark
              className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Bottom Info */}
        <div className="flex flex-1 flex-col justify-between p-2.5 sm:p-3">
          <div>
            <p className="truncate text-[10px] font-medium text-slate-500 sm:text-[11px] dark:text-slate-400">
              {categoryLabel}
            </p>
            <h3 className="mt-0.5 line-clamp-2 font-display text-[13px] leading-snug font-bold text-slate-900 sm:text-sm dark:text-slate-50">
              {provider.businessName}
            </h3>
            <p className="mt-1.5 truncate font-display text-sm font-extrabold text-[#2563EB] tabular-nums sm:text-[15px] dark:text-blue-400">
              {provider.startingRate?.trim() || t.negotiableRate}
            </p>
            {provider.propertySpec && (
              <p className="mt-0.5 truncate text-[10px] text-slate-500 sm:text-[11px] dark:text-slate-400">
                {provider.propertySpec}
              </p>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between gap-1.5 border-t border-slate-100 pt-1.5 text-[10px] text-slate-500 sm:text-[11px] dark:border-slate-800 dark:text-slate-400">
            <span className="inline-flex min-w-0 items-center gap-0.5 truncate">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{provider.upazila}</span>
            </span>

            <div className="flex shrink-0 items-center gap-1.5 tabular-nums">
              {provider.verificationStatus === 'verified' && (
                <BadgeCheck
                  className="h-3 w-3 text-[#2563EB] dark:text-blue-400"
                  aria-hidden="true"
                />
              )}
              <span className="inline-flex items-center gap-0.5">
                <Star
                  className="h-3 w-3 fill-amber-400 text-amber-400"
                  aria-hidden="true"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {ratingStat ? localizeDigits(ratingStat.avg, language) : '—'}
                </span>
              </span>
              {onStartChat && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartChat(provider);
                  }}
                  aria-label={language === 'bn' ? 'চ্যাট করুন' : 'Chat'}
                  className="inline-flex h-6 cursor-pointer items-center gap-1 rounded bg-blue-50 px-1.5 text-[10px] font-bold text-[#2563EB] transition-colors hover:bg-[#2563EB] hover:text-white dark:bg-blue-950/60 dark:text-blue-400 dark:hover:bg-[#2563EB] dark:hover:text-white"
                >
                  <MessageSquare className="h-3 w-3" aria-hidden="true" />
                  <span>{language === 'bn' ? 'চ্যাট' : 'Chat'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={() => onViewProfile(provider.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewProfile(provider.id);
        }
      }}
      className="group flex cursor-pointer items-stretch gap-3 rounded-lg border border-slate-200 bg-white p-2.5 sm:p-3 transition-all duration-150 hover:border-[#2563EB]/60 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] dark:border-slate-800 dark:bg-[#111827] dark:hover:border-blue-500/60"
    >
      {/* Left Thumbnail */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-slate-100 sm:h-26 sm:w-26 dark:bg-slate-800">
        {thumbSrc ? (
          <SafeImage
            src={thumbSrc}
            alt={provider.businessName}
            fallbackTitle={provider.businessName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <UserIcon className="h-8 w-8" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Right Details */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {provider.listingType && provider.listingType !== 'service'
                    ? typeLabel
                    : provider.ownerName}
                </span>
                <span aria-hidden="true">·</span>
                <span className="truncate">{categoryLabel}</span>
              </p>

              <h3 className="mt-0.5 truncate font-display text-[15px] font-bold text-slate-900 dark:text-slate-50">
                {provider.businessName}
              </h3>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(provider);
              }}
              aria-label={isFavorite ? t.savedFavorite : t.saveFavorite}
              className={`-mt-0.5 -mr-0.5 inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors ${
                isFavorite
                  ? 'text-[#2563EB] dark:text-blue-400'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Bookmark
                className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`}
                aria-hidden="true"
              />
            </button>
          </div>

          <p className="mt-1 truncate font-display text-sm font-bold text-[#2563EB] tabular-nums dark:text-blue-400">
            {provider.startingRate?.trim() || t.negotiableRate}
            {provider.condition && provider.listingType === 'secondhand'
              ? ` · ${provider.condition}`
              : ''}
          </p>

          {provider.propertySpec && (
            <p className="mt-0.5 truncate text-[11px] text-slate-600 dark:text-slate-400">
              {provider.propertySpec}
            </p>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Star
              className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
              aria-hidden="true"
            />
            {ratingStat ? (
              <>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {localizeDigits(ratingStat.avg, language)}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  ({localizeDigits(ratingStat.count, language)})
                </span>
              </>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">
                {t.noReviewsYet}
              </span>
            )}
          </span>

          <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            {provider.verificationStatus === 'verified' && (
              <span
                title={t.verifiedBadge}
                className="inline-flex items-center gap-0.5 font-semibold text-[#2563EB] dark:text-blue-400"
              >
                <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </span>
            )}
            <span className="inline-flex min-w-0 items-center gap-1 truncate">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {provider.upazila}, {provider.district}
              </span>
            </span>
            {onStartChat && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartChat(provider);
                }}
                aria-label={language === 'bn' ? 'চ্যাট করুন' : 'Chat'}
                className="inline-flex h-6.5 shrink-0 cursor-pointer items-center gap-1 rounded bg-blue-50 px-2 text-[11px] font-bold text-[#2563EB] transition-colors hover:bg-[#2563EB] hover:text-white dark:bg-blue-950/60 dark:text-blue-400 dark:hover:bg-[#2563EB] dark:hover:text-white"
              >
                <MessageSquare className="h-3 w-3" aria-hidden="true" />
                <span>{language === 'bn' ? 'চ্যাট' : 'Chat'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
