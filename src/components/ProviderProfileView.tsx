import { useEffect, useMemo, useRef, useState, type FormEvent, type TouchEvent } from 'react';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Hash,
  MapPin,
  Maximize2,
  MessageCircle,
  MessageSquare,
  Phone,
  Share2,
  Star,
  User as UserIcon,
  X,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useApp } from '../context/AppContext';
import { localizeDigits } from '../i18n/translations';
import { getListingTypeLabel, getRelatedByTags } from '../utils/tags';
import type { ProviderProfile, ProviderService } from '../types/sheba';
import { ProviderCard } from './ProviderCard';
import { SafeImage } from './SafeImage';
import { ProfileDetailSkeleton } from './ShimmerSkeleton';

interface ProviderProfileViewProps {
  providerId: string;
  onBack: () => void;
  onStartChat: (provider: ProviderProfile, sendPostLink?: boolean) => void;
  onToggleFavorite: (provider: ProviderProfile) => void;
  onOpenAuth: () => void;
  onViewProvider?: (providerId: string) => void;
}

export function ProviderProfileView({
  providerId,
  onBack,
  onStartChat,
  onToggleFavorite,
  onOpenAuth,
  onViewProvider,
}: ProviderProfileViewProps) {
  const {
    language,
    t,
    user,
    userProfile,
    isAdmin,
    isEmailVerified,
    approvedProviders,
    reviews,
    ratingByProvider,
    favorites,
  } = useApp();

  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ProviderService[]>([]);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Review state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Report modal state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Misleading Information');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    setActiveSlide(0);
    setFullscreenOpen(false);
    setBioExpanded(false);
  }, [providerId]);

  useEffect(() => {
    const cached = approvedProviders.find((p) => p.id === providerId);
    if (cached) {
      setProvider(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchProvider = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'providers', providerId));
        if (!cancelled) {
          if (snap.exists()) {
            setProvider({
              id: snap.id,
              ...(snap.data() as Omit<ProviderProfile, 'id'>),
            });
          } else {
            setProvider(null);
          }
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) setLoading(false);
        handleFirestoreError(err, OperationType.GET, `providers/${providerId}`);
      }
    };
    void fetchProvider();
    return () => {
      cancelled = true;
    };
  }, [providerId, approvedProviders]);

  useEffect(() => {
    if (!provider) return;
    const isOwnerOrAdmin =
      Boolean(user && provider.ownerId === user.uid) || isAdmin;

    const servicesQuery = isOwnerOrAdmin
      ? collection(db, 'providers', provider.id, 'services')
      : query(
          collection(db, 'providers', provider.id, 'services'),
          where('status', '==', 'approved')
        );

    const unsub = onSnapshot(
      servicesQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ProviderService, 'id'>),
        }));
        setServices(list);
      },
      (err) => {
        handleFirestoreError(
          err,
          OperationType.LIST,
          `providers/${provider.id}/services`
        );
      }
    );

    return () => unsub();
  }, [provider, user, isAdmin]);

  const photos = useMemo(() => {
    if (!provider) return [];
    const merged = [
      provider.profilePhotoUrl || '',
      ...(provider.galleryUrls || []),
    ].filter((u) => Boolean(u && u.trim()));
    return Array.from(new Set(merged));
  }, [provider]);

  useEffect(() => {
    if (activeSlide >= photos.length && photos.length > 0) {
      setActiveSlide(0);
    }
  }, [photos.length, activeSlide]);

  // Keyboard arrows & Escape for full-screen photo viewer
  useEffect(() => {
    if (!fullscreenOpen || photos.length === 0) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullscreenOpen(false);
      } else if (e.key === 'ArrowRight') {
        setActiveSlide((prev) => (prev + 1) % photos.length);
      } else if (e.key === 'ArrowLeft') {
        setActiveSlide((prev) => (prev - 1 + photos.length) % photos.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fullscreenOpen, photos.length]);

  const relatedByTags = useMemo(() => {
    if (!provider) return [];
    return getRelatedByTags(provider, approvedProviders, 4);
  }, [provider, approvedProviders]);

  if (loading) {
    return <ProfileDetailSkeleton />;
  }

  if (!provider) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-slate-50">
          {language === 'bn'
            ? 'পোস্ট বা প্রোফাইলটি পাওয়া যায়নি'
            : 'Listing not found'}
        </h1>
        <button
          type="button"
          onClick={onBack}
          className="mt-5 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{t.backToBrowse}</span>
        </button>
      </div>
    );
  }

  const providerReviews = reviews
    .filter((r) => r.providerId === provider.id)
    .sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() ?? 0;
      const tb = b.createdAt?.toMillis?.() ?? 0;
      return tb - ta;
    });

  const ratingStat = ratingByProvider[provider.id];
  const isFav = favorites.some((f) => f.providerId === provider.id);
  const isOwner = Boolean(user && provider.ownerId === user.uid);

  const phoneNumber = (provider.phone || '').trim();
  const whatsappRaw = (provider.whatsapp || provider.phone || '').trim();
  const cleanWhatsapp = whatsappRaw.replace(/[^\d+]/g, '');
  const whatsappUrl = cleanWhatsapp
    ? `https://wa.me/${cleanWhatsapp.startsWith('0') ? `88${cleanWhatsapp}` : cleanWhatsapp.replace(/^\+/, '')}`
    : '';

  const categoryTitle =
    provider.customCategory?.trim() ||
    (language === 'bn' ? provider.categoryNameBn : provider.categoryNameEn);

  const prevSlide = () => {
    if (photos.length <= 1) return;
    setActiveSlide((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const nextSlide = () => {
    if (photos.length <= 1) return;
    setActiveSlide((prev) => (prev + 1) % photos.length);
  };

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null || photos.length <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const diff = touchStartX.current - endX;
    if (Math.abs(diff) > 36) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    touchStartX.current = null;
  };

  const handleShare = async () => {
    const shareTitle = `${provider.businessName} — ShebaFinder`;
    const shareText = `${provider.businessName} (${provider.upazila}, ${provider.district})`;
    const shareUrl = `${window.location.origin}${window.location.pathname}?post=${provider.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        return;
      } catch {
        // Fallback to clipboard copy
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText} - ${shareUrl}`);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2200);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!isEmailVerified) {
      setReviewError(t.emailVerifyBody);
      return;
    }
    if (isOwner) {
      setReviewError(
        language === 'bn'
          ? 'নিজের পোস্টে রিভিউ দেওয়া যাবে না।'
          : 'You cannot review your own listing.'
      );
      return;
    }
    if (comment.trim().length < 3) {
      setReviewError(
        language === 'bn'
          ? 'অনুগ্রহ করে অন্তত ৩ অক্ষরের একটি মতামত লিখুন।'
          : 'Please write a comment of at least 3 characters.'
      );
      return;
    }

    setReviewError('');
    setReviewSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        providerId: provider.id,
        authorId: user.uid,
        authorName:
          userProfile?.displayName ||
          user.displayName ||
          user.email?.split('@')[0] ||
          'Customer',
        rating,
        comment: comment.trim(),
        status: 'published',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setComment('');
      setRating(5);
      setReviewSuccess(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reviews');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleReportSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!isEmailVerified) {
      setReportError(t.emailVerifyBody);
      return;
    }
    if (reportDetails.trim().length < 5) {
      setReportError(
        language === 'bn'
          ? 'অনুগ্রহ করে বিস্তারিত কারণ লিখুন।'
          : 'Please provide at least 5 characters explaining the issue.'
      );
      return;
    }
    setReportError('');
    setReportSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        providerId: provider.id,
        providerName: provider.businessName,
        reporterId: user.uid,
        reporterName:
          userProfile?.displayName || user.displayName || 'Customer',
        reason: reportReason,
        details: reportDetails.trim(),
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setReportSuccess(true);
      setReportDetails('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reports');
    } finally {
      setReportSubmitting(false);
    }
  };

  const bioIsLong = provider.bio.length > 200;
  const typeLabel = getListingTypeLabel(provider.listingType, language);
  const currentPhotoUrl = photos[activeSlide] || '';

  return (
    <section className="min-h-[85vh] bg-white pb-24 md:py-6 md:pb-12 dark:bg-[#090D16]">
      <div className="mx-auto max-w-6xl md:px-6 lg:px-8">
        {provider.status !== 'approved' && (
          <div className="mx-3 mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 md:mx-0 md:mt-0 md:mb-4 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            {language === 'bn'
              ? `বর্তমান স্ট্যাটাস: ${provider.status}`
              : `Current status: ${provider.status}`}
          </div>
        )}

        {/* Top Full-Width Landing Hero: Swipeable Slider + Core Info */}
        <div className="grid grid-cols-1 gap-6 border-b border-slate-200 pb-6 lg:grid-cols-12 dark:border-slate-800">
          {/* Interactive Swipeable Photo Slider at Top */}
          <div className="lg:col-span-6">
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 md:rounded-lg dark:bg-slate-900"
            >
              {currentPhotoUrl ? (
                <button
                  type="button"
                  onClick={() => setFullscreenOpen(true)}
                  aria-label={
                    language === 'bn'
                      ? 'ফুল স্ক্রিন ছবি দেখুন'
                      : 'View photo in full screen'
                  }
                  className="block h-full w-full cursor-zoom-in"
                >
                  <SafeImage
                    src={currentPhotoUrl}
                    alt={`${provider.businessName} - ${activeSlide + 1}`}
                    fallbackTitle={provider.businessName}
                    eager
                    className="h-full w-full object-cover"
                  />
                </button>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <UserIcon className="h-20 w-20" aria-hidden="true" />
                </div>
              )}

              {/* Back Button */}
              <button
                type="button"
                onClick={onBack}
                aria-label={t.backToBrowse}
                className="absolute top-3 left-3 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-slate-200/80 bg-white/95 text-slate-900 shadow-xs hover:bg-white dark:border-slate-700 dark:bg-slate-900/90 dark:text-white"
              >
                <ArrowLeft className="h-4.5 w-4.5" aria-hidden="true" />
              </button>

              {/* Full Screen Button */}
              {currentPhotoUrl && (
                <button
                  type="button"
                  onClick={() => setFullscreenOpen(true)}
                  aria-label="Full screen"
                  className="absolute top-3 right-3 inline-flex h-9 items-center gap-1.5 rounded-md bg-black/65 px-2.5 text-xs font-semibold text-white backdrop-blur-xs hover:bg-black/85"
                >
                  <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{language === 'bn' ? 'ফুল স্ক্রিন' : 'Full Screen'}</span>
                </button>
              )}

              {/* Left / Right Slide Controls */}
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevSlide}
                    aria-label="Previous photo"
                    className="absolute top-1/2 left-2.5 inline-flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/80"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    aria-label="Next photo"
                    className="absolute top-1/2 right-2.5 inline-flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/80"
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>

                  <span className="absolute right-3 bottom-3 rounded-md bg-black/70 px-2.5 py-1 font-mono text-xs font-semibold text-white tabular-nums">
                    {localizeDigits(activeSlide + 1, language)} /{' '}
                    {localizeDigits(photos.length, language)}
                  </span>
                </>
              )}
            </div>

            {/* Thumbnail Strip Directly Under Top Slider */}
            {photos.length > 1 && (
              <div className="mt-2.5 flex items-center gap-2 overflow-x-auto px-3 pb-1 md:px-0">
                {photos.map((url, idx) => (
                  <button
                    key={`${url.slice(0, 20)}-${idx}`}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    className={`h-14 w-16 shrink-0 cursor-pointer overflow-hidden rounded-md border-2 transition-all ${
                      activeSlide === idx
                        ? 'border-[#2563EB] opacity-100'
                        : 'border-transparent opacity-65 hover:opacity-100'
                    }`}
                  >
                    <SafeImage
                      src={url}
                      alt={`Slide ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Core Listing Details & Direct Action Bar */}
          <div className="px-3 md:px-0 lg:col-span-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-[#2563EB] dark:text-blue-400">
                    {typeLabel}
                  </span>{' '}
                  · {categoryTitle}
                  {provider.isDemo ? ` · ${t.demoLabel}` : ''}
                </p>
                <h1 className="mt-1 font-display text-xl font-bold tracking-tight text-slate-950 sm:text-2xl dark:text-slate-50">
                  {provider.businessName}
                </h1>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void handleShare()}
                  aria-label={t.shareLabel}
                  title={copiedNotice ? t.linkCopied : t.shareLabel}
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200"
                >
                  {copiedNotice ? (
                    <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <Share2 className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onToggleFavorite(provider)}
                  aria-label={isFav ? t.savedFavorite : t.saveFavorite}
                  className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border transition-colors ${
                    isFav
                      ? 'border-[#2563EB] bg-blue-50 text-[#2563EB] dark:border-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-300'
                  }`}
                >
                  <Bookmark
                    className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>

            {/* Owner + Verified + Rating */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-display font-bold text-slate-900 dark:text-slate-100">
                {provider.ownerName}
              </span>

              {provider.verificationStatus === 'verified' && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] dark:text-blue-400">
                  <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                  <span>{t.verifiedBadge}</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1 text-xs tabular-nums">
                <Star
                  className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                  aria-hidden="true"
                />
                {ratingStat ? (
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {localizeDigits(ratingStat.avg, language)} (
                    {localizeDigits(ratingStat.count, language)} {t.reviewsCount})
                  </span>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400">
                    {t.noReviewsYet}
                  </span>
                )}
              </span>
            </div>

            {/* Location & Experience */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <MapPin
                className="h-3.5 w-3.5 shrink-0 text-[#2563EB] dark:text-blue-400"
                aria-hidden="true"
              />
              <span>
                {provider.upazila}, {provider.district}, {provider.division}
              </span>
              {(!provider.listingType || provider.listingType === 'service') &&
                provider.experienceYears > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {localizeDigits(provider.experienceYears, language)}{' '}
                      {t.yearsExp}
                    </span>
                  </>
                )}
              {provider.condition && provider.listingType === 'secondhand' && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {provider.condition}
                  </span>
                </>
              )}
            </div>

            {/* Rate / Price */}
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
              <p className="font-display text-2xl font-extrabold text-[#2563EB] tabular-nums dark:text-blue-400">
                {provider.startingRate?.trim() || t.negotiableRate}
              </p>

              <button
                type="button"
                onClick={() => {
                  setReportSuccess(false);
                  setReportOpen(true);
                }}
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400"
              >
                <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.reportProvider}</span>
              </button>
            </div>

            {/* Description */}
            <div className="mt-4">
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.aboutMe}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {bioIsLong && !bioExpanded
                  ? `${provider.bio.slice(0, 200)}... `
                  : `${provider.bio} `}
                {bioIsLong && (
                  <button
                    type="button"
                    onClick={() => setBioExpanded((prev) => !prev)}
                    className="cursor-pointer font-semibold text-[#2563EB] hover:underline dark:text-blue-400"
                  >
                    {bioExpanded ? t.readLess : t.readMore}
                  </button>
                )}
              </p>

              {provider.addressNote && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'bn' ? 'ঠিকানা: ' : 'Address: '}
                  </span>
                  {provider.addressNote}
                </p>
              )}

              {provider.serviceAreas && provider.serviceAreas.length > 0 && (
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'bn' ? 'সেবা এলাকা: ' : 'Service Areas: '}
                  </span>
                  {provider.serviceAreas.join(' · ')}
                </p>
              )}

              {provider.tags && provider.tags.length > 0 && (
                <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <Hash
                    className="h-3.5 w-3.5 text-[#2563EB] dark:text-blue-400"
                    aria-hidden="true"
                  />
                  {provider.tags.map((tg) => (
                    <span key={tg} className="text-slate-700 dark:text-slate-300">
                      #{tg}
                    </span>
                  ))}
                </p>
              )}
            </div>

            {/* Direct Action Bar: In-App Chat (Sends Post Link) + Conditional Call + Conditional WhatsApp */}
            <div className="mt-5 hidden flex-wrap items-center gap-2.5 md:flex">
              <button
                type="button"
                onClick={() => onStartChat(provider, true)}
                className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                <span>
                  {isOwner
                    ? language === 'bn'
                      ? 'ক্রেতাদের মেসেজ দেখুন'
                      : 'Buyer Messages'
                    : language === 'bn'
                      ? 'সরাসরি চ্যাট করুন'
                      : 'Chat in App'}
                </span>
              </button>

              {phoneNumber && (
                <a
                  href={`tel:${phoneNumber}`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <Phone
                    className="h-4 w-4 text-[#2563EB] dark:text-blue-400"
                    aria-hidden="true"
                  />
                  <span>{t.callNow}</span>
                </a>
              )}

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Full-Width Flat Sections (Zero Nested Boxes) */}
        <div className="divide-y divide-slate-200 px-3 md:px-0 dark:divide-slate-800">
          {/* Dynamic Specifications & Features */}
          {((provider.specItems && provider.specItems.length > 0) ||
            provider.propertySpec) && (
            <div className="py-5">
              <h2 className="font-display text-base font-bold text-slate-950 dark:text-slate-50">
                {t.specsHeading}
              </h2>
              {provider.specItems && provider.specItems.length > 0 ? (
                <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                  {provider.specItems.map((item, idx) => {
                    const colonIdx = item.indexOf(':');
                    if (colonIdx > 0 && colonIdx < item.length - 1) {
                      const label = item.slice(0, colonIdx).trim();
                      const val = item.slice(colonIdx + 1).trim();
                      return (
                        <div
                          key={`${item}-${idx}`}
                          className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-2 text-xs sm:text-sm dark:border-slate-800/80"
                        >
                          <dt className="text-slate-500 dark:text-slate-400">
                            {label}
                          </dt>
                          <dd className="text-right font-semibold text-slate-900 dark:text-slate-100">
                            {val}
                          </dd>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={`${item}-${idx}`}
                        className="flex items-center gap-2 border-b border-slate-100 py-2 text-xs font-semibold text-slate-800 sm:text-sm dark:border-slate-800/80 dark:text-slate-200"
                      >
                        <Check
                          className="h-3.5 w-3.5 shrink-0 text-[#2563EB] dark:text-blue-400"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </div>
                    );
                  })}
                </dl>
              ) : (
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  {provider.propertySpec}
                </p>
              )}
            </div>
          )}

          {/* Available Sub-Services / Packages */}
          {services.length > 0 && (
            <div className="py-5">
              <h2 className="font-display text-base font-bold text-slate-950 dark:text-slate-50">
                {t.servicesOffered}
              </h2>
              <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {services.map((srv) => (
                  <div
                    key={srv.id}
                    className="flex flex-col justify-between gap-1.5 py-2.5 sm:flex-row sm:items-center"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                        {srv.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {srv.description}
                      </p>
                    </div>
                    {srv.priceEstimate && (
                      <p className="shrink-0 font-display text-sm font-bold text-[#2563EB] tabular-nums dark:text-blue-400">
                        {srv.priceEstimate}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* #Tag-Based Related Suggestions (Daraz 2-Column Mobile Grid) */}
          {relatedByTags.length > 0 && (
            <div className="py-5">
              <h2 className="font-display text-base font-bold text-slate-950 dark:text-slate-50">
                {t.relatedByTagsTitle}
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                {relatedByTags.map(({ post }) => (
                  <ProviderCard
                    key={post.id}
                    provider={post}
                    variant="grid"
                    isFavorite={favorites.some((f) => f.providerId === post.id)}
                    onToggleFavorite={onToggleFavorite}
                    onViewProfile={(id) => onViewProvider?.(id)}
                    onStartChat={onStartChat}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Reviews & Submit Review */}
          <div className="py-5">
            <h2 className="font-display text-base font-bold text-slate-950 dark:text-slate-50">
              {t.customerReviews}
            </h2>

            {!isOwner && (
              <form
                onSubmit={handleReviewSubmit}
                className="mt-3.5 space-y-3 border-b border-slate-200 pb-5 dark:border-slate-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {t.writeReview}
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setRating(starVal)}
                        aria-label={`${starVal} stars`}
                        className="cursor-pointer p-1"
                      >
                        <Star
                          className={`h-4.5 w-4.5 ${
                            starVal <= rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    language === 'bn'
                      ? 'সেবা বা পণ্যের মান ও অভিজ্ঞতা সম্পর্কে লিখুন...'
                      : 'Share your experience...'
                  }
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#111827] dark:text-slate-100"
                />

                {reviewError && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{reviewError}</span>
                  </p>
                )}
                {reviewSuccess && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      {language === 'bn'
                        ? 'আপনার রিভিউ প্রকাশ করা হয়েছে!'
                        : 'Your review has been published.'}
                    </span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="min-h-9 cursor-pointer rounded-md bg-[#2563EB] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#1D4ED8] disabled:opacity-60"
                >
                  {user ? t.submitReview : t.signIn}
                </button>
              </form>
            )}

            {providerReviews.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'এখনো কোনো রিভিউ জমা পড়েনি।'
                  : 'No reviews yet.'}
              </p>
            ) : (
              <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
                {providerReviews.map((rev) => (
                  <div key={rev.id} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {rev.authorName}
                      </p>
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-amber-500 tabular-nums">
                        <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                        <span>{localizeDigits(rev.rating, language)}/5</span>
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Mobile Bottom Direct Action Bar: Direct Chat + Conditional Call + Conditional WhatsApp */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur-md md:hidden dark:border-slate-800 dark:bg-[#090D16]/95">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <button
            type="button"
            onClick={() => onStartChat(provider, true)}
            className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-[#2563EB] px-3 text-xs font-bold text-white"
          >
            <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {isOwner
                ? language === 'bn'
                  ? 'ক্রেতাদের মেসেজ'
                  : 'Buyer Chats'
                : language === 'bn'
                  ? 'সরাসরি চ্যাট'
                  : 'Chat Now'}
            </span>
          </button>

          {phoneNumber && (
            <a
              href={`tel:${phoneNumber}`}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-100"
            >
              <Phone
                className="h-4 w-4 text-[#2563EB] dark:text-blue-400"
                aria-hidden="true"
              />
              <span>{t.callNow}</span>
            </a>
          )}

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-3.5 text-xs font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              <span>WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      {/* Full-Screen Swipeable Photo Lightbox */}
      {fullscreenOpen && currentPhotoUrl && (
        <div
          role="dialog"
          aria-modal="true"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-3 sm:p-6"
          onClick={() => setFullscreenOpen(false)}
        >
          <div className="absolute top-4 right-4 left-4 flex items-center justify-between text-white">
            <span className="rounded-md bg-white/10 px-3 py-1 font-mono text-xs font-semibold tabular-nums">
              {localizeDigits(activeSlide + 1, language)} /{' '}
              {localizeDigits(photos.length, language)}
            </span>
            <button
              type="button"
              onClick={() => setFullscreenOpen(false)}
              aria-label="Close full screen"
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div
            className="relative flex max-h-[84vh] max-w-[96vw] items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <SafeImage
              src={currentPhotoUrl}
              alt={`${provider.businessName} - ${activeSlide + 1}`}
              className="max-h-[82vh] w-auto max-w-full rounded-md object-contain"
            />
          </div>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevSlide();
                }}
                aria-label="Previous photo"
                className="fixed top-1/2 left-3 inline-flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 sm:left-6"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextSlide();
                }}
                aria-label="Next photo"
                className="fixed top-1/2 right-3 inline-flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 sm:right-6"
              >
                <ChevronRight className="h-6 w-6" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Report Modal */}
      {reportOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onClick={() => setReportOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-950 dark:text-slate-50">
                {t.reportProvider}
              </h3>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  {language === 'bn'
                    ? 'আপনার রিপোর্টটি অ্যাডমিনের কাছে পাঠানো হয়েছে। আমরা দ্রুত পর্যালোচনা করব।'
                    : 'Your report has been submitted to our administrators for review.'}
                </p>
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="min-h-10 w-full cursor-pointer rounded-md bg-[#2563EB] text-sm font-semibold text-white"
                >
                  {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'bn' ? 'কারণ' : 'Reason'}
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="mt-1 min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-[#0B1120] dark:text-slate-100"
                  >
                    <option value="Misleading Information">
                      {language === 'bn' ? 'ভুল বা বিভ্রান্তিকর তথ্য' : 'Misleading Information'}
                    </option>
                    <option value="Unprofessional Behavior">
                      {language === 'bn' ? 'অপেশাদার আচরণ' : 'Unprofessional Behavior'}
                    </option>
                    <option value="Fake Contact / Spam">
                      {language === 'bn' ? 'ভুয়া নম্বর বা স্প্যাম' : 'Fake Contact / Spam'}
                    </option>
                    <option value="Other">
                      {language === 'bn' ? 'অন্যান্য' : 'Other'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'bn' ? 'বিস্তারিত বিবরণ' : 'Details'}
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-[#0B1120] dark:text-slate-100"
                  />
                </div>

                {reportError && (
                  <p className="text-xs font-medium text-red-700 dark:text-red-400">
                    {reportError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="min-h-10 w-full cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {language === 'bn' ? 'রিপোর্ট জমা দিন' : 'Submit Report'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
