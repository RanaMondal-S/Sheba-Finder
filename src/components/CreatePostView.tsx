import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpLeft,
  Check,
  Hash,
  Home,
  ImagePlus,
  Paintbrush,
  Plus,
  ShoppingBag,
  SlidersHorizontal,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { db, uploadMediaAsset } from '../lib/firebase';
import { useApp } from '../context/AppContext';
import { localizeDigits } from '../i18n/translations';
import { buildSpecPayload, getCategorySpecConfig } from '../data/categorySpecs';
import { normalizeTag, SUGGESTED_TAGS_BY_TYPE } from '../utils/tags';
import type { ListingType, ProviderProfile } from '../types/sheba';
import { LocationSelectors } from './LocationSelectors';
import { SafeImage } from './SafeImage';

interface CreatePostViewProps {
  initialListingType?: ListingType;
  editingPost?: ProviderProfile | null;
  onBack: () => void;
  onOpenAuth: () => void;
  onStartPublishing: (isEditing: boolean) => void;
  onPublishSuccess: (isEditing: boolean) => void;
  onPublishError: (message: string) => void;
}

export function CreatePostView({
  initialListingType = 'service',
  editingPost = null,
  onBack,
  onOpenAuth,
  onStartPublishing,
  onPublishSuccess,
  onPublishError,
}: CreatePostViewProps) {
  const { language, t, user, userProfile, isEmailVerified, categories } =
    useApp();

  const isEditing = Boolean(editingPost);

  const [listingType, setListingType] = useState<ListingType>(
    editingPost?.listingType || initialListingType || 'service'
  );
  const [categorySlug, setCategorySlug] = useState<string>(() => {
    if (editingPost?.categorySlug) return editingPost.categorySlug;
    const match = categories.find(
      (c) => (c.listingType || 'service') === (initialListingType || 'service')
    );
    return match?.slug || categories[0]?.slug || 'tutor';
  });
  const [customCategory, setCustomCategory] = useState(
    editingPost?.customCategory || ''
  );
  const [businessName, setBusinessName] = useState(
    editingPost?.businessName || ''
  );
  const [ownerName, setOwnerName] = useState(
    editingPost?.ownerName ||
      userProfile?.displayName ||
      user?.displayName ||
      user?.email?.split('@')[0] ||
      ''
  );
  const [division, setDivision] = useState(editingPost?.division || 'Dhaka');
  const [district, setDistrict] = useState(editingPost?.district || 'Dhaka');
  const [upazila, setUpazila] = useState(editingPost?.upazila || 'Dhanmondi');
  const [serviceAreasText, setServiceAreasText] = useState(
    (editingPost?.serviceAreas || []).join(', ')
  );
  const [experienceYears, setExperienceYears] = useState<number>(
    editingPost?.experienceYears ?? (initialListingType === 'service' ? 2 : 0)
  );
  const [startingRate, setStartingRate] = useState(
    editingPost?.startingRate || ''
  );
  const [propertySpec, setPropertySpec] = useState(
    editingPost?.propertySpec || ''
  );
  const [specValues, setSpecValues] = useState<Record<string, string>>({});
  const [customSpecValues, setCustomSpecValues] = useState<
    Record<string, string>
  >({});
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [customFeatureInput, setCustomFeatureInput] = useState('');
  const [condition, setCondition] = useState(
    editingPost?.condition || 'Like New'
  );
  const [addressNote, setAddressNote] = useState(
    editingPost?.addressNote || ''
  );
  const [bio, setBio] = useState(editingPost?.bio || '');
  const [phone, setPhone] = useState(
    editingPost?.phone || userProfile?.phone || ''
  );
  const [whatsapp, setWhatsapp] = useState(
    editingPost?.whatsapp || userProfile?.phone || ''
  );
  const [tags, setTags] = useState<string[]>(editingPost?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [galleryUrls, setGalleryUrls] = useState<string[]>(() => {
    if (!editingPost) return [];
    return Array.from(
      new Set(
        [editingPost.profilePhotoUrl, ...(editingPost.galleryUrls || [])].filter(
          (u): u is string => Boolean(u && u.trim())
        )
      )
    );
  });

  const [uploadingGalleryCount, setUploadingGalleryCount] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Field refs for automatic scroll-to-error & focus
  const customCategoryRef = useRef<HTMLInputElement | null>(null);
  const businessNameRef = useRef<HTMLInputElement | null>(null);
  const ownerNameRef = useRef<HTMLInputElement | null>(null);
  const locationSectionRef = useRef<HTMLDivElement | null>(null);
  const bioRef = useRef<HTMLTextAreaElement | null>(null);

  // Restore dynamic specs when editing
  useEffect(() => {
    if (!editingPost) return;
    const type = editingPost.listingType || 'service';
    const cfg = getCategorySpecConfig(editingPost.categorySlug, type);
    const nextSpecValues: Record<string, string> = {};
    const nextCustomSpecValues: Record<string, string> = {};
    const nextFeatures: string[] = [];

    for (const item of editingPost.specItems || []) {
      const colonIdx = item.indexOf(':');
      if (colonIdx > 0) {
        const keyLabel = item.slice(0, colonIdx).trim();
        const valLabel = item.slice(colonIdx + 1).trim();
        const matchedField = cfg.fields.find(
          (f) => f.labelBn === keyLabel || f.labelEn === keyLabel
        );
        if (matchedField) {
          if (matchedField.options) {
            const matchedOpt = matchedField.options.find(
              (o) =>
                o.labelBn === valLabel ||
                o.labelEn === valLabel ||
                o.value === valLabel
            );
            if (matchedOpt) {
              nextSpecValues[matchedField.key] = matchedOpt.value;
            } else {
              nextSpecValues[matchedField.key] = '__custom__';
              nextCustomSpecValues[matchedField.key] = valLabel;
            }
          } else {
            nextSpecValues[matchedField.key] = valLabel;
          }
          continue;
        }
      }
      const matchedFeat = cfg.features.find(
        (f) => f.labelBn === item || f.labelEn === item || f.value === item
      );
      if (matchedFeat) {
        nextFeatures.push(matchedFeat.value);
      } else if (item && item !== editingPost.propertySpec) {
        nextFeatures.push(item);
      }
    }
    setSpecValues(nextSpecValues);
    setCustomSpecValues(nextCustomSpecValues);
    setSelectedFeatures(nextFeatures);
  }, [editingPost]);

  const categoriesForType = useMemo(() => {
    const matching = categories.filter(
      (c) => (c.listingType || 'service') === listingType
    );
    return matching.length > 0 ? matching : categories;
  }, [categories, listingType]);

  const specConfig = useMemo(
    () => getCategorySpecConfig(categorySlug, listingType),
    [categorySlug, listingType]
  );

  const isOtherCategory = categorySlug.endsWith('-others');

  const handleListingTypeChange = (nextType: ListingType) => {
    setListingType(nextType);
    const firstMatch = categories.find(
      (c) => (c.listingType || 'service') === nextType
    );
    if (firstMatch) {
      setCategorySlug(firstMatch.slug);
    }
    setCustomCategory('');
    setSpecValues({});
    setCustomSpecValues({});
    setSelectedFeatures([]);
  };

  const handleCategoryChange = (nextSlug: string) => {
    setCategorySlug(nextSlug);
    if (!nextSlug.endsWith('-others')) {
      setCustomCategory('');
    }
    setSpecValues({});
    setCustomSpecValues({});
    setSelectedFeatures([]);
  };

  const toggleFeature = (featValue: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featValue)
        ? prev.filter((item) => item !== featValue)
        : [...prev, featValue]
    );
  };

  const addCustomFeature = () => {
    const clean = customFeatureInput.trim().slice(0, 60);
    if (!clean) return;
    setSelectedFeatures((prev) =>
      prev.includes(clean) ? prev : [...prev, clean]
    );
    setCustomFeatureInput('');
  };

  const addTag = (raw: string) => {
    const clean = normalizeTag(raw);
    if (!clean) return;
    setTags((prev) => {
      if (prev.includes(clean) || prev.length >= 15) return prev;
      return [...prev, clean];
    });
    setTagInput('');
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      if (tagInput.trim()) addTag(tagInput);
    }
  };

  const handleGalleryUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const selectedFiles = Array.from(e.target.files || []);
    e.target.value = '';
    if (selectedFiles.length === 0) return;

    const remainingSlots = Math.max(0, 8 - galleryUrls.length);
    if (remainingSlots === 0) {
      setUploadError(
        language === 'bn'
          ? 'সর্বোচ্চ ৮টি ছবি যুক্ত করা যাবে।'
          : 'Maximum 8 photos allowed.'
      );
      return;
    }

    const filesToUpload = selectedFiles.slice(0, remainingSlots);
    setUploadError('');
    setUploadingGalleryCount((prev) => prev + filesToUpload.length);

    await Promise.all(
      filesToUpload.map(async (file, index) => {
        try {
          const url = await uploadMediaAsset(
            file,
            `providers/${user.uid}/gallery_${Date.now()}_${index}.jpg`
          );
          setGalleryUrls((prev) => (prev.length < 8 ? [...prev, url] : prev));
        } catch (err) {
          setUploadError(err instanceof Error ? err.message : String(err));
        } finally {
          setUploadingGalleryCount((prev) => Math.max(0, prev - 1));
        }
      })
    );
  };

  if (!user) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-slate-50">
          {language === 'bn'
            ? 'পোস্ট তৈরি করতে লগইন করুন'
            : 'Sign in to publish a post'}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {language === 'bn'
            ? 'সম্পূর্ণ বিনামূল্যে সেবা, বাসা ভাড়া বা সেকেন্ড হ্যান্ড বিজ্ঞাপন দিতে আপনার অ্যাকাউন্টে লগইন করুন।'
            : 'Sign in for free to publish services, house rent, or second-hand posts.'}
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="min-h-10 cursor-pointer rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
          >
            {language === 'bn' ? 'ফিরে যান' : 'Back'}
          </button>
          <button
            type="button"
            onClick={onOpenAuth}
            className="min-h-10 cursor-pointer rounded-md bg-[#2563EB] px-6 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
          >
            {t.signIn}
          </button>
        </div>
      </section>
    );
  }

  if (!isEmailVerified) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30">
          <h1 className="font-display text-xl font-bold text-amber-950 dark:text-amber-200">
            {t.emailVerifyTitle}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-amber-900 dark:text-amber-300">
            {t.emailVerifyBody}
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="min-h-10 cursor-pointer rounded-md border border-amber-400 px-4 text-xs font-semibold text-amber-950 dark:text-amber-200"
            >
              {language === 'bn' ? 'ফিরে যান' : 'Back'}
            </button>
            <button
              type="button"
              onClick={onOpenAuth}
              className="min-h-10 cursor-pointer rounded-md bg-[#2563EB] px-4 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
            >
              {language === 'bn' ? 'অ্যাকাউন্ট যাচাই করুন' : 'Verify Account'}
            </button>
          </div>
        </div>
      </section>
    );
  }

  const clearFieldError = (key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    let firstInvalidTarget: HTMLElement | null = null;

    if (isOtherCategory && customCategory.trim().length < 2) {
      errors.customCategory =
        language === 'bn'
          ? 'অনুগ্রহ করে আপনার সেবা বা পণ্যের নাম লিখুন (কমপক্ষে ২ অক্ষর)।'
          : 'Please enter a custom category name (at least 2 chars).';
      if (!firstInvalidTarget) firstInvalidTarget = customCategoryRef.current;
    }

    if (businessName.trim().length < 2) {
      errors.businessName =
        language === 'bn'
          ? 'অনুগ্রহ করে পোস্টের সঠিক শিরোনাম লিখুন (কমপক্ষে ২ অক্ষর)।'
          : 'Please enter a valid title (at least 2 chars).';
      if (!firstInvalidTarget) firstInvalidTarget = businessNameRef.current;
    }

    if (ownerName.trim().length < 2) {
      errors.ownerName =
        language === 'bn'
          ? 'অনুগ্রহ করে আপনার নাম লিখুন (কমপক্ষে ২ অক্ষর)।'
          : 'Please enter your contact name.';
      if (!firstInvalidTarget) firstInvalidTarget = ownerNameRef.current;
    }

    if (!division || !district || !upazila) {
      errors.location =
        language === 'bn'
          ? 'অনুগ্রহ করে বিভাগ, জেলা এবং উপজেলা নির্বাচন করুন।'
          : 'Please select division, district, and upazila.';
      if (!firstInvalidTarget) firstInvalidTarget = locationSectionRef.current;
    }

    if (bio.trim().length < 10) {
      errors.bio =
        language === 'bn'
          ? 'অনুগ্রহ করে কমপক্ষে ১০ অক্ষরের বিস্তারিত বিবরণ লিখুন।'
          : 'Please write at least 10 characters in the description.';
      if (!firstInvalidTarget) firstInvalidTarget = bioRef.current;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (firstInvalidTarget) {
        firstInvalidTarget.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        if (typeof (firstInvalidTarget as HTMLInputElement).focus === 'function') {
          window.setTimeout(() => {
            (firstInvalidTarget as HTMLInputElement).focus();
          }, 260);
        }
      }
      return;
    }

    // Build final payload before exiting this page
    const pendingTag = normalizeTag(tagInput);
    const finalTags =
      pendingTag && !tags.includes(pendingTag) && tags.length < 15
        ? [...tags, pendingTag]
        : tags;

    const cat =
      categories.find((c) => c.slug === categorySlug) || categoriesForType[0];
    const cleanCustomCat = isOtherCategory
      ? customCategory.trim().slice(0, 80)
      : '';

    const parsedAreas = serviceAreasText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20);

    const builtSpec = buildSpecPayload(
      specConfig,
      specValues,
      customSpecValues,
      selectedFeatures,
      language
    );
    const extraNote = propertySpec.trim().slice(0, 140);
    const mergedSpecItems = [...builtSpec.specItems];
    if (
      extraNote &&
      !mergedSpecItems.includes(extraNote) &&
      mergedSpecItems.length < 16
    ) {
      mergedSpecItems.push(extraNote.slice(0, 80));
    }

    const payload = {
      listingType,
      businessName: businessName.trim().slice(0, 120),
      ownerName: ownerName.trim().slice(0, 100),
      categorySlug: cat.slug,
      categoryNameBn: cleanCustomCat || cat.nameBn,
      categoryNameEn: cleanCustomCat || cat.nameEn,
      customCategory: cleanCustomCat,
      division,
      district,
      upazila,
      serviceAreas: parsedAreas,
      tags: finalTags,
      condition: listingType === 'secondhand' ? condition.slice(0, 40) : '',
      propertySpec: (extraNote || builtSpec.summary).slice(0, 140),
      specItems: mergedSpecItems,
      addressNote: addressNote.trim().slice(0, 160),
      experienceYears:
        listingType === 'service' ? Math.max(0, Number(experienceYears) || 0) : 0,
      startingRate: startingRate.trim().slice(0, 60),
      bio: bio.trim().slice(0, 1500),
      phone: phone.trim().slice(0, 30),
      whatsapp: whatsapp.trim().slice(0, 30),
      profilePhotoUrl: galleryUrls[0] || '',
      galleryUrls,
      updatedAt: serverTimestamp(),
    };

    // Immediately exit dedicated Create Post Page & show "Publishing..." banner
    onStartPublishing(isEditing);

    // Run Firestore write cleanly in the background
    const writePromise = !editingPost
      ? addDoc(collection(db, 'providers'), {
          ownerId: user.uid,
          ...payload,
          status: 'approved',
          verificationStatus: 'none',
          isDemo: false,
          createdAt: serverTimestamp(),
        })
      : updateDoc(doc(db, 'providers', editingPost.id), payload);

    writePromise
      .then(() => {
        onPublishSuccess(isEditing);
      })
      .catch((err) => {
        onPublishError(err instanceof Error ? err.message : String(err));
      });
  };

  const inputCls = (hasError = false) =>
    `mt-1.5 min-h-10 w-full rounded-md border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:bg-[#090D16] dark:text-slate-100 ${
      hasError
        ? 'border-red-500 ring-1 ring-red-500 focus:border-red-600'
        : 'border-slate-300 focus:border-[#2563EB] dark:border-slate-700'
    }`;

  return (
    <section className="min-h-[85vh] bg-white py-5 pb-24 sm:py-8 dark:bg-[#090D16]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Top Navigation Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <div>
              <h1 className="font-display text-lg font-bold text-slate-950 sm:text-2xl dark:text-slate-50">
                {isEditing
                  ? language === 'bn'
                    ? 'পোস্ট সম্পাদনা করুন'
                    : 'Edit Post'
                  : t.createNewPost}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'সব তথ্য পূরণ করে পোস্ট করুন — কোনো অপেক্ষা ছাড়াই সাথে সাথে লাইভ হবে'
                  : 'Fill in the details and publish immediately for free'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-6">
          {/* Step 1: Select Listing Type */}
          <div>
            <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              {language === 'bn'
                ? '১. বিজ্ঞাপনের ধরন নির্বাচন করুন'
                : '1. Select Listing Type'}
            </span>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                {
                  type: 'service' as ListingType,
                  icon: Wrench,
                  bn: 'সেবা / টিউশনি / টেকনিশিয়ান',
                  en: 'Local Service / Tutor',
                },
                {
                  type: 'house-rent' as ListingType,
                  icon: Home,
                  bn: 'বাসা ভাড়া / টু-লেট',
                  en: 'House Rent',
                },
                {
                  type: 'secondhand' as ListingType,
                  icon: ShoppingBag,
                  bn: 'সেকেন্ড হ্যান্ড ক্রয়-বিক্রয়',
                  en: 'Second-Hand Item',
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = listingType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => handleListingTypeChange(opt.type)}
                    className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border px-3.5 py-2 text-left text-xs font-bold transition-colors ${
                      active
                        ? 'border-[#2563EB] bg-blue-50 text-[#2563EB] dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-300'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#111827] dark:text-slate-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{language === 'bn' ? opt.bn : opt.en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Core Details */}
          <div className="grid grid-cols-1 gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? '২. ক্যাটাগরি নির্বাচন করুন' : '2. Category'}
              </label>
              <select
                value={categorySlug}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={inputCls(false)}
              >
                {categoriesForType.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {language === 'bn' ? cat.nameBn : cat.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {isOtherCategory ? (
              <div>
                <label className="block text-xs font-bold text-[#2563EB] dark:text-blue-400">
                  {language === 'bn'
                    ? 'আপনার সেবা / পণ্যের নাম লিখুন *'
                    : 'Enter Custom Service / Item Name *'}
                </label>
                <input
                  ref={customCategoryRef}
                  type="text"
                  maxLength={80}
                  value={customCategory}
                  onChange={(e) => {
                    setCustomCategory(e.target.value);
                    clearFieldError('customCategory');
                  }}
                  placeholder={
                    listingType === 'house-rent'
                      ? language === 'bn'
                        ? 'যেমন: ছাদ বাগান / গুদাম ঘর'
                        : 'e.g., Garage / Warehouse'
                      : listingType === 'secondhand'
                        ? language === 'bn'
                          ? 'যেমন: ডিএসএলআর ক্যামেরা / গিটার'
                          : 'e.g., DSLR Camera / Guitar'
                        : language === 'bn'
                          ? 'যেমন: সোলার প্যানেল / ওয়েল্ডিং / নার্সিং'
                          : 'e.g., Solar Tech / Welding / Nurse'
                  }
                  className={inputCls(Boolean(fieldErrors.customCategory))}
                />
                {fieldErrors.customCategory && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{fieldErrors.customCategory}</span>
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {listingType === 'house-rent'
                    ? language === 'bn'
                      ? 'মাসিক ভাড়া'
                      : 'Monthly Rent'
                    : listingType === 'secondhand'
                      ? language === 'bn'
                        ? 'বিক্রয় মূল্য'
                        : 'Selling Price'
                      : language === 'bn'
                        ? 'সম্ভাব্য ফি / বেতন / রেট'
                        : 'Starting Rate / Honorarium'}
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={startingRate}
                  onChange={(e) => setStartingRate(e.target.value)}
                  placeholder={
                    listingType === 'house-rent'
                      ? language === 'bn'
                        ? '৳১৬,০০০ / মাস'
                        : '৳16,000 / month'
                      : listingType === 'secondhand'
                        ? language === 'bn'
                          ? '৳১২,৫০০ (আলোচনা সাপেক্ষে)'
                          : '৳12,500 (Negotiable)'
                        : categorySlug === 'tutor'
                          ? language === 'bn'
                            ? '৳৫,০০০ / মাস'
                            : '৳5,000 / month'
                          : language === 'bn'
                            ? '৳৫০০ / ভিজিট'
                            : '৳500 / visit'
                  }
                  className={inputCls(false)}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {listingType === 'house-rent'
                  ? language === 'bn'
                    ? 'বাসা ভাড়ার শিরোনাম *'
                    : 'Rental Title *'
                  : listingType === 'secondhand'
                    ? language === 'bn'
                      ? 'পণ্যের নাম / শিরোনাম *'
                      : 'Item Title *'
                    : language === 'bn'
                      ? 'শিরোনাম (যেমন: অভিজ্ঞ গণিত ও বিজ্ঞান টিউটর) *'
                      : 'Service / Post Title *'}
              </label>
              <input
                ref={businessNameRef}
                type="text"
                value={businessName}
                onChange={(e) => {
                  setBusinessName(e.target.value);
                  clearFieldError('businessName');
                }}
                placeholder={
                  listingType === 'house-rent'
                    ? language === 'bn'
                      ? 'যেমন: মিরপুর ১০-এ ৩ বেডের ফ্যামিলি ফ্ল্যাট ভাড়া'
                      : 'e.g., 3-Bed Family Flat in Mirpur 10'
                    : listingType === 'secondhand'
                      ? language === 'bn'
                        ? 'যেমন: Samsung Galaxy S23 Ultra (২৫৬ জিবি)'
                        : 'e.g., Samsung Galaxy S23 Ultra 256GB'
                      : language === 'bn'
                        ? 'যেমন: অভিজ্ঞ গণিত ও বিজ্ঞান হোম টিউটর'
                        : 'e.g., Experienced Math & Science Home Tutor'
                }
                className={inputCls(Boolean(fieldErrors.businessName))}
              />
              {fieldErrors.businessName && (
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{fieldErrors.businessName}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'পোস্টকারীর নাম *' : 'Contact Name *'}
              </label>
              <input
                ref={ownerNameRef}
                type="text"
                value={ownerName}
                onChange={(e) => {
                  setOwnerName(e.target.value);
                  clearFieldError('ownerName');
                }}
                className={inputCls(Boolean(fieldErrors.ownerName))}
              />
              {fieldErrors.ownerName && (
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{fieldErrors.ownerName}</span>
                </p>
              )}
            </div>

            {isOtherCategory && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'bn' ? 'সম্ভাব্য মূল্য / ফি' : 'Price / Fee'}
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={startingRate}
                  onChange={(e) => setStartingRate(e.target.value)}
                  placeholder={language === 'bn' ? '৳৫০০ / আলোচনা সাপেক্ষে' : '৳500 / Negotiable'}
                  className={inputCls(false)}
                />
              </div>
            )}

            {listingType === 'service' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'bn' ? 'অভিজ্ঞতা (বছর)' : 'Experience (Years)'}
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className={`${inputCls(false)} tabular-nums`}
                />
              </div>
            )}

            {listingType === 'secondhand' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'bn' ? 'পণ্যের অবস্থা' : 'Item Condition'}
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className={inputCls(false)}
                >
                  <option value="Like New">
                    {language === 'bn' ? 'প্রায় নতুন (Like New)' : 'Like New'}
                  </option>
                  <option value="Good">
                    {language === 'bn' ? 'ভালো অবস্থা (Good)' : 'Good'}
                  </option>
                  <option value="Used">
                    {language === 'bn' ? 'ব্যবহৃত (Used)' : 'Used'}
                  </option>
                </select>
              </div>
            )}
          </div>

          {/* Step 3: Category-Specific Options (Select OR Type Custom!) */}
          <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
              <SlidersHorizontal
                className="h-4 w-4 text-[#2563EB] dark:text-blue-400"
                aria-hidden="true"
              />
              <span>
                {language === 'bn'
                  ? '৩. ক্যাটাগরি অনুযায়ী বিস্তারিত অপশন (সিলেক্ট করুন অথবা নিজে লিখুন)'
                  : '3. Category-Specific Options (Select or write custom)'}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {specConfig.fields.map((field) => {
                const selectedVal = specValues[field.key] || '';
                const isCustomFieldSelected = selectedVal === '__custom__';
                return (
                  <div key={field.key}>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {language === 'bn' ? field.labelBn : field.labelEn}
                    </label>
                    {field.type === 'select' && field.options ? (
                      <>
                        <select
                          value={selectedVal}
                          onChange={(e) =>
                            setSpecValues((prev) => ({
                              ...prev,
                              [field.key]: e.target.value,
                            }))
                          }
                          className="mt-1.5 min-h-10 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#090D16] dark:text-slate-100"
                        >
                          <option value="">
                            {language === 'bn' ? '-- নির্বাচন করুন --' : '-- Select --'}
                          </option>
                          {field.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {language === 'bn' ? opt.labelBn : opt.labelEn}
                            </option>
                          ))}
                          <option value="__custom__">
                            {language === 'bn'
                              ? '✎ অন্যান্য (নিজের মতো লিখুন)'
                              : '✎ Other (Type custom option)'}
                          </option>
                        </select>

                        {isCustomFieldSelected && (
                          <input
                            type="text"
                            maxLength={80}
                            value={customSpecValues[field.key] || ''}
                            onChange={(e) =>
                              setCustomSpecValues((prev) => ({
                                ...prev,
                                [field.key]: e.target.value,
                              }))
                            }
                            placeholder={
                              language === 'bn'
                                ? 'আপনার নিজের অপশন লিখুন...'
                                : 'Type your custom value...'
                            }
                            className="mt-2 min-h-9 w-full rounded-md border border-[#2563EB] bg-blue-50/40 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none dark:border-blue-500 dark:bg-[#111827] dark:text-slate-100"
                          />
                        )}
                      </>
                    ) : (
                      <input
                        type="text"
                        maxLength={80}
                        value={selectedVal}
                        onChange={(e) =>
                          setSpecValues((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        placeholder={
                          language === 'bn'
                            ? field.placeholderBn
                            : field.placeholderEn
                        }
                        className="mt-1.5 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#090D16] dark:text-slate-100"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Preset Feature Chips + Custom Feature Writer */}
            <div className="mt-4">
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === 'bn'
                  ? specConfig.featuresLabelBn
                  : specConfig.featuresLabelEn}
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {specConfig.features.map((feat) => {
                  const active = selectedFeatures.includes(feat.value);
                  return (
                    <button
                      key={feat.value}
                      type="button"
                      onClick={() => toggleFeature(feat.value)}
                      className={`inline-flex cursor-pointer items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? 'border-[#2563EB] bg-[#2563EB] text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-[#2563EB] dark:border-slate-700 dark:bg-[#111827] dark:text-slate-300'
                      }`}
                    >
                      {active && <Check className="h-3 w-3" aria-hidden="true" />}
                      <span>{language === 'bn' ? feat.labelBn : feat.labelEn}</span>
                    </button>
                  );
                })}

                {/* Custom user-added feature chips */}
                {selectedFeatures
                  .filter((val) => !specConfig.features.some((f) => f.value === val))
                  .map((customFeat) => (
                    <button
                      key={customFeat}
                      type="button"
                      onClick={() => toggleFeature(customFeat)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[#2563EB] bg-[#2563EB] px-2.5 py-1.5 text-xs font-medium text-white"
                    >
                      <Check className="h-3 w-3" aria-hidden="true" />
                      <span>{customFeat}</span>
                      <X className="h-3 w-3 opacity-80" aria-hidden="true" />
                    </button>
                  ))}
              </div>

              {/* Add custom option input */}
              <div className="mt-2.5 flex gap-2">
                <input
                  type="text"
                  maxLength={60}
                  value={customFeatureInput}
                  onChange={(e) => setCustomFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomFeature();
                    }
                  }}
                  placeholder={
                    language === 'bn'
                      ? 'তালিকার বাইরে কোনো অপশন/সুবিধা থাকলে লিখে "যোগ" চাপুন...'
                      : 'Type a custom option/feature not listed above...'
                  }
                  className="min-h-9 flex-1 rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#090D16] dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={addCustomFeature}
                  className="inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-md border border-[#2563EB] px-3 text-xs font-bold text-[#2563EB] hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{language === 'bn' ? 'যোগ' : 'Add'}</span>
                </button>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === 'bn'
                  ? 'অতিরিক্ত স্পেসিফিকেশন / শর্ট হাইলাইট (ঐচ্ছিক)'
                  : 'Additional Quick Highlight (Optional)'}
              </label>
              <input
                type="text"
                maxLength={140}
                value={propertySpec}
                onChange={(e) => setPropertySpec(e.target.value)}
                placeholder={
                  listingType === 'house-rent'
                    ? language === 'bn'
                      ? 'যেমন: সম্পূর্ণ টাইলস করা · দক্ষিণমুখী কর্নার ফ্ল্যাট'
                      : 'e.g., Full tiled corner apartment'
                    : listingType === 'secondhand'
                      ? language === 'bn'
                        ? 'যেমন: ব্যাটারি হেলথ ৯৪% · কোনো দাগ নেই'
                        : 'e.g., 94% battery health · Scratch-free'
                      : language === 'bn'
                        ? 'যেমন: নিজের নোটস ও নিয়মিত ক্লাস টেস্ট'
                        : 'e.g., Own hand notes & weekly exams'
                }
                className="mt-1.5 min-h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#090D16] dark:text-slate-100"
              />
            </div>
          </div>

          {/* Step 4: Location */}
          <div
            ref={locationSectionRef}
            className="border-t border-slate-200 pt-5 dark:border-slate-800"
          >
            <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
              {language === 'bn'
                ? '৪. এলাকা নির্বাচন করুন (বিভাগ, জেলা, উপজেলা) *'
                : '4. Location (Division, District, Upazila) *'}
            </span>
            <LocationSelectors
              division={division}
              district={district}
              upazila={upazila}
              onDivisionChange={(val) => {
                setDivision(val);
                clearFieldError('location');
              }}
              onDistrictChange={(val) => {
                setDistrict(val);
                clearFieldError('location');
              }}
              onUpazilaChange={(val) => {
                setUpazila(val);
                clearFieldError('location');
              }}
              includeAllOption={false}
              required
            />
            {fieldErrors.location && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{fieldErrors.location}</span>
              </p>
            )}

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'bn' ? 'মোবাইল নম্বর (ঐচ্ছিক)' : 'Phone Number (Optional)'}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+880 17..."
                  className={`${inputCls(false)} font-mono`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'bn' ? 'হোয়াটসঅ্যাপ (ঐচ্ছিক)' : 'WhatsApp (Optional)'}
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+880 17..."
                  className={`${inputCls(false)} font-mono`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {listingType === 'service'
                    ? language === 'bn'
                      ? 'অতিরিক্ত এলাকা (কমা দিয়ে)'
                      : 'Extra Areas (comma separated)'
                    : language === 'bn'
                      ? 'ঠিকানা / রোড নোট (ঐচ্ছিক)'
                      : 'Street / Landmark Note'}
                </label>
                <input
                  type="text"
                  value={listingType === 'service' ? serviceAreasText : addressNote}
                  onChange={(e) =>
                    listingType === 'service'
                      ? setServiceAreasText(e.target.value)
                      : setAddressNote(e.target.value)
                  }
                  placeholder={
                    listingType === 'service'
                      ? language === 'bn'
                        ? 'মিরপুর, মোহাম্মদপুর'
                        : 'Mirpur, Mohammadpur'
                      : language === 'bn'
                        ? 'রোড ৪, সেক্টর ৭'
                        : 'Road 4, Sector 7'
                  }
                  className={inputCls(false)}
                />
              </div>
            </div>
          </div>

          {/* Step 5: #Tags */}
          <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Hash className="h-4 w-4 text-[#2563EB] dark:text-blue-400" aria-hidden="true" />
              <span>
                {language === 'bn'
                  ? '৫. #ট্যাগ যোগ করুন — ট্যাগের সাথে মিল রেখে সাজেশন দেখানো হবে'
                  : '5. Add #Tags — powers similar suggestions'}
              </span>
            </label>

            <div className="mt-2.5 flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={
                  language === 'bn'
                    ? '#ট্যাগ লিখে Enter চাপুন...'
                    : 'Type a #tag and press Enter...'
                }
                className="min-h-9 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#090D16] dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => addTag(tagInput)}
                className="min-h-9 cursor-pointer rounded-md bg-[#2563EB] px-4 text-xs font-bold text-white hover:bg-[#1D4ED8]"
              >
                {language === 'bn' ? 'যোগ' : 'Add'}
              </button>
            </div>

            {tags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {tags.map((tg) => (
                  <span
                    key={tg}
                    className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-[#2563EB] dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-300"
                  >
                    <span>#{tg}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setTags((prev) => prev.filter((item) => item !== tg))
                      }
                      aria-label={`Remove ${tg}`}
                      className="cursor-pointer hover:text-red-600"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {language === 'bn' ? 'প্রস্তাবিত ট্যাগ:' : 'Suggested:'}
              </span>
              {SUGGESTED_TAGS_BY_TYPE[listingType].map((sug) => {
                const selected = tags.includes(sug.tag);
                return (
                  <button
                    key={sug.tag}
                    type="button"
                    disabled={selected}
                    onClick={() => addTag(sug.tag)}
                    className={`cursor-pointer rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                      selected
                        ? 'border-slate-200 bg-slate-100 text-slate-400 opacity-50 dark:border-slate-800 dark:bg-slate-800'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-[#2563EB] hover:text-[#2563EB] dark:border-slate-700 dark:bg-[#111827] dark:text-slate-300'
                    }`}
                  >
                    #{sug.tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 6: Bio / Description */}
          <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {language === 'bn' ? '৬. বিস্তারিত বিবরণ *' : '6. Full Description *'}
            </label>
            <textarea
              ref={bioRef}
              rows={4}
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                clearFieldError('bio');
              }}
              placeholder={
                listingType === 'house-rent'
                  ? language === 'bn'
                    ? 'বাসার সুবিধা, বিদ্যুৎ-পানি-গ্যাস ব্যবস্থা, অগ্রিম ও শর্তাবলি লিখুন...'
                    : 'Describe apartment amenities, utilities, floor, and rental terms...'
                  : listingType === 'secondhand'
                    ? language === 'bn'
                      ? 'পণ্যটি কতদিন ব্যবহৃত হয়েছে, কোনো সমস্যা আছে কিনা এবং কোথা থেকে দেখা যাবে তা লিখুন...'
                      : 'Describe usage duration, condition, included accessories, and pickup details...'
                    : language === 'bn'
                      ? 'আপনি কী কী কাজ/বিষয় পড়ান বা সেবা দেন, কত বছরের অভিজ্ঞতা, কোন সময়ে সেবা দেন তা লিখুন...'
                      : 'Describe your subjects/services, tools, working hours, and experience...'
              }
              className={`mt-1.5 w-full rounded-md border bg-white p-3 text-sm leading-relaxed focus:outline-none dark:bg-[#090D16] dark:text-slate-100 ${
                fieldErrors.bio
                  ? 'border-red-500 ring-1 ring-red-500 focus:border-red-600'
                  : 'border-slate-300 focus:border-[#2563EB] dark:border-slate-700'
              }`}
            />
            {fieldErrors.bio && (
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{fieldErrors.bio}</span>
              </p>
            )}
          </div>

          {/* Step 7: Unified Photos (First Photo Becomes Thumbnail) */}
          <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
            <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">
              {language === 'bn'
                ? `৭. পোস্টের ছবি আপলোড করুন (${localizeDigits(galleryUrls.length, language)}/৮)`
                : `7. Upload Post Photos (${galleryUrls.length}/8)`}
            </span>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'bn'
                ? 'প্রথম ছবিটি স্বয়ংক্রিয়ভাবে থাম্বনেইল হিসেবে ব্যবহৃত হবে এবং সবগুলো ছবি স্লাইডারে দেখা যাবে।'
                : 'The first photo automatically serves as the listing thumbnail; all photos display in the top slider.'}
            </p>

            {uploadError && (
              <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">
                {uploadError}
              </p>
            )}

            <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-5 md:grid-cols-6">
              {galleryUrls.map((url, idx) => (
                <div
                  key={`${url.slice(0, 20)}-${idx}`}
                  className={`group relative aspect-square overflow-hidden rounded-md border ${
                    idx === 0
                      ? 'border-2 border-[#2563EB]'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <SafeImage
                    src={url}
                    alt={`Photo ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {idx === 0 ? (
                    <span className="absolute bottom-1 left-1 rounded bg-[#2563EB] px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {language === 'bn' ? 'থাম্বনেইল' : 'Thumbnail'}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setGalleryUrls((prev) => {
                          const next = [...prev];
                          const [chosen] = next.splice(idx, 1);
                          return [chosen, ...next];
                        })
                      }
                      className="absolute bottom-1 left-1 inline-flex cursor-pointer items-center gap-0.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-[#2563EB]"
                    >
                      <ArrowUpLeft className="h-2.5 w-2.5" aria-hidden="true" />
                      <span>{language === 'bn' ? '১ম করুন' : 'Make 1st'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setGalleryUrls((prev) => prev.filter((_, i) => i !== idx))
                    }
                    aria-label="Remove image"
                    className="absolute top-1 right-1 cursor-pointer rounded bg-black/75 p-1 text-white hover:bg-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}

              {Array.from({ length: uploadingGalleryCount }).map((_, idx) => (
                <div
                  key={`uploading-tile-${idx}`}
                  className="animate-paint-upload flex aspect-square flex-col items-center justify-center rounded-md border border-blue-300 dark:border-blue-800"
                >
                  <Paintbrush
                    className="animate-brush-float h-5 w-5 text-[#2563EB] dark:text-blue-400"
                    aria-hidden="true"
                  />
                  <span className="mt-1 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                    {language === 'bn' ? 'আপলোড হচ্ছে' : 'Uploading'}
                  </span>
                </div>
              ))}

              {galleryUrls.length + uploadingGalleryCount < 8 && (
                <label className="inline-flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 text-[#2563EB] transition-colors hover:border-[#2563EB] hover:bg-blue-50 dark:border-slate-700 dark:text-blue-400 dark:hover:bg-blue-950/30">
                  <ImagePlus className="h-6 w-6" aria-hidden="true" />
                  <span className="mt-1 text-[11px] font-semibold">
                    {language === 'bn' ? 'ছবি বাছাই করুন' : 'Add Photos'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Sticky Bottom Submit Row */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
            <button
              type="button"
              onClick={onBack}
              className="min-h-11 cursor-pointer rounded-md border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={uploadingGalleryCount > 0}
              className="min-h-11 cursor-pointer rounded-md bg-[#2563EB] px-7 text-sm font-bold text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-60"
            >
              {uploadingGalleryCount > 0
                ? language === 'bn'
                  ? 'ছবি আপলোড হচ্ছে...'
                  : 'Uploading photos...'
                : isEditing
                  ? language === 'bn'
                    ? 'পরিবর্তন সেভ করুন'
                    : 'Save Changes'
                  : language === 'bn'
                    ? 'পোস্ট পাবলিশ করুন'
                    : 'Publish Post'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
