import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { updateProfile } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  AlertCircle,
  BadgeCheck,
  BellRing,
  Building2,
  Camera,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Layers,
  LogOut,
  Paintbrush,
  Plus,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import {
  db,
  handleFirestoreError,
  OperationType,
  uploadMediaAsset,
} from '../lib/firebase';
import { useApp } from '../context/AppContext';
import { localizeDigits } from '../i18n/translations';
import { getListingTypeLabel } from '../utils/tags';
import type {
  ListingType,
  ProviderProfile,
  ProviderService,
} from '../types/sheba';
import { ImageCropModal } from './ImageCropModal';
import { SafeImage } from './SafeImage';
import { CardSkeletonGrid } from './ShimmerSkeleton';

interface UserProfileViewProps {
  onOpenAuth: () => void;
  onViewPublicProfile: (providerId: string) => void;
  onOpenCreatePost: (presetType?: ListingType) => void;
  onEditPost: (post: ProviderProfile) => void;
  onSignedOut?: () => void;
}

export function UserProfileView({
  onOpenAuth,
  onViewPublicProfile,
  onOpenCreatePost,
  onEditPost,
  onSignedOut,
}: UserProfileViewProps) {
  const {
    language,
    t,
    user,
    userProfile,
    isEmailVerified,
    notifPermission,
    browserNotifEnabled,
    requestBrowserNotifications,
    toggleBrowserNotifications,
    handleSignOut,
  } = useApp();

  // Account Profile Edit State
  const [accountName, setAccountName] = useState('');
  const [accountPhone, setAccountPhone] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [accountFeedback, setAccountFeedback] = useState('');

  // Cropper Modal State (strictly for account avatar)
  const [cropTarget, setCropTarget] = useState<'avatar' | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);

  // User's All Posts (Multi-Post Support)
  const [myPosts, setMyPosts] = useState<ProviderProfile[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postFilterType, setPostFilterType] = useState<'all' | ListingType>(
    'all'
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Per-post Services / Verification management
  const [managingPostId, setManagingPostId] = useState<string | null>(null);
  const [postServices, setPostServices] = useState<ProviderService[]>([]);
  const [srvTitle, setSrvTitle] = useState('');
  const [srvDesc, setSrvDesc] = useState('');
  const [srvPrice, setSrvPrice] = useState('');
  const [addingService, setAddingService] = useState(false);
  const [verifyPostId, setVerifyPostId] = useState<string | null>(null);
  const [verificationNote, setVerificationNote] = useState('');
  const [submittingVerify, setSubmittingVerify] = useState(false);

  // Sync Account fields from userProfile
  useEffect(() => {
    if (userProfile) {
      setAccountName(userProfile.displayName || '');
      setAccountPhone(userProfile.phone || '');
    } else if (user) {
      setAccountName(user.displayName || user.email?.split('@')[0] || '');
    }
  }, [user, userProfile]);

  // Listen to ALL posts owned by this user (NEVER auto-opens composer when empty!)
  useEffect(() => {
    if (!user) {
      setMyPosts([]);
      setPostsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'providers'),
      where('ownerId', '==', user.uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ProviderProfile, 'id'>),
          }))
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() ?? 0;
            const tb = b.createdAt?.toMillis?.() ?? 0;
            return tb - ta;
          });
        setMyPosts(list);
        setPostsLoading(false);
      },
      (err) => {
        setPostsLoading(false);
        handleFirestoreError(err, OperationType.LIST, 'providers');
      }
    );

    return () => unsub();
  }, [user]);

  // Listen to services subcollection for whichever post is expanded
  useEffect(() => {
    if (!user || !managingPostId) {
      setPostServices([]);
      return;
    }

    const unsub = onSnapshot(
      collection(db, 'providers', managingPostId, 'services'),
      (snap) => {
        setPostServices(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ProviderService, 'id'>),
          }))
        );
      },
      (err) => {
        handleFirestoreError(
          err,
          OperationType.LIST,
          `providers/${managingPostId}/services`
        );
      }
    );

    return () => unsub();
  }, [user, managingPostId]);

  if (!user) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-[#2563EB] dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-400">
          <UserIcon className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-slate-950 sm:text-3xl dark:text-slate-50">
          {t.myProfileAndPosts}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {language === 'bn'
            ? 'আপনার প্রোফাইল ছবি সেট করতে এবং সেবা, বাসা ভাড়া বা সেকেন্ড হ্যান্ড পণ্যের একাধিক বিজ্ঞাপন দিতে বিনামূল্যে লগইন করুন।'
            : 'Sign in for free to customize your profile photo and publish multiple service, house rent, or second-hand posts.'}
        </p>
        <button
          type="button"
          onClick={onOpenAuth}
          className="mt-6 min-h-10 cursor-pointer rounded-md bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
        >
          {t.signIn}
        </button>
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
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenAuth}
              className="min-h-10 cursor-pointer rounded-md bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
            >
              {language === 'bn' ? 'অ্যাকাউন্ট যাচাই করুন' : 'Verify Account'}
            </button>
            <button
              type="button"
              onClick={() => {
                void handleSignOut().then(() => onSignedOut?.());
              }}
              className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.signOut}</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  const avatarSrc = userProfile?.photoUrl || user.photoURL || '';
  const displayTitle =
    userProfile?.displayName ||
    user.displayName ||
    user.email?.split('@')[0] ||
    'User';

  const handleSaveAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) return;
    setSavingAccount(true);
    setAccountFeedback('');
    setErrorMsg('');
    try {
      const cleanName = accountName.trim().slice(0, 100);
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: cleanName,
        phone: accountPhone.trim().slice(0, 30),
        updatedAt: serverTimestamp(),
      });
      await updateProfile(user, { displayName: cleanName }).catch(() => {});
      setAccountFeedback(
        language === 'bn'
          ? 'প্রোফাইল তথ্য সংরক্ষণ করা হয়েছে।'
          : 'Account details updated.'
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingAccount(false);
    }
  };

  const handleAvatarFilePick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCropTarget('avatar');
    setCropFile(file);
  };

  const handleCropConfirmed = async (croppedFile: File) => {
    const target = cropTarget;
    setCropTarget(null);
    setCropFile(null);

    if (target === 'avatar') {
      setUploadingAvatar(true);
      setErrorMsg('');
      setAccountFeedback('');
      try {
        const url = await uploadMediaAsset(
          croppedFile,
          `users/${user.uid}/avatar_${Date.now()}.jpg`
        );
        await updateDoc(doc(db, 'users', user.uid), {
          photoUrl: url,
          updatedAt: serverTimestamp(),
        });
        if (!url.startsWith('data:')) {
          await updateProfile(user, { photoURL: url }).catch(() => {});
        }
        setAccountFeedback(
          language === 'bn'
            ? 'ক্রপ করা প্রোফাইল ছবি সফলভাবে সেভ হয়েছে!'
            : 'Cropped profile photo saved!'
        );
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : String(err));
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, 'providers', postId));
      setConfirmDeleteId(null);
      setFeedback(
        language === 'bn' ? 'পোস্টটি মুছে ফেলা হয়েছে।' : 'Post deleted.'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `providers/${postId}`);
    }
  };

  const handleRequestVerification = async (e: FormEvent, postId: string) => {
    e.preventDefault();
    setSubmittingVerify(true);
    try {
      await updateDoc(doc(db, 'providers', postId), {
        verificationStatus: 'pending',
        verificationNote: verificationNote.trim().slice(0, 400),
        updatedAt: serverTimestamp(),
      });
      setVerifyPostId(null);
      setVerificationNote('');
      setFeedback(
        language === 'bn'
          ? 'ভেরিফিকেশন অনুরোধ অ্যাডমিনের কাছে পাঠানো হয়েছে।'
          : 'Verification request submitted for review.'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `providers/${postId}`);
    } finally {
      setSubmittingVerify(false);
    }
  };

  const handleAddService = async (e: FormEvent, postId: string) => {
    e.preventDefault();
    if (srvTitle.trim().length < 2 || srvDesc.trim().length < 5) return;
    setAddingService(true);
    try {
      await addDoc(collection(db, 'providers', postId, 'services'), {
        providerId: postId,
        ownerId: user.uid,
        title: srvTitle.trim(),
        description: srvDesc.trim(),
        priceEstimate: srvPrice.trim(),
        status: 'approved',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSrvTitle('');
      setSrvDesc('');
      setSrvPrice('');
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `providers/${postId}/services`
      );
    } finally {
      setAddingService(false);
    }
  };

  const handleDeleteService = async (postId: string, serviceId: string) => {
    try {
      await deleteDoc(doc(db, 'providers', postId, 'services', serviceId));
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `providers/${postId}/services/${serviceId}`
      );
    }
  };

  const filteredMyPosts =
    postFilterType === 'all'
      ? myPosts
      : myPosts.filter((p) => (p.listingType || 'service') === postFilterType);

  const liveCount = myPosts.filter((p) => p.status === 'approved').length;

  const inputCls =
    'mt-1.5 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#090D16] dark:text-slate-100';

  return (
    <section className="min-h-[80vh] py-6 pb-20 sm:py-8">
      <div className="mx-auto max-w-5xl space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Account Profile Section with Logout Button */}
        <div className="border-b border-slate-200 pb-6 dark:border-slate-800">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="relative">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                  {avatarSrc ? (
                    <SafeImage
                      src={avatarSrc}
                      alt={displayTitle}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-500 dark:text-slate-400">
                      <UserIcon className="h-8 w-8" aria-hidden="true" />
                    </div>
                  )}

                  {uploadingAvatar && (
                    <div className="animate-paint-upload absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[1px] dark:bg-slate-900/80">
                      <Paintbrush
                        className="animate-brush-float h-5 w-5 text-[#2563EB] dark:text-blue-400"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </div>

                <label
                  title={
                    language === 'bn'
                      ? 'প্রোফাইল ছবি ক্রপ ও পরিবর্তন করুন'
                      : 'Crop & Upload Profile Photo'
                  }
                  className="absolute right-0 bottom-0 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#2563EB] text-white shadow-sm transition-colors hover:bg-[#1D4ED8] dark:border-[#090D16]"
                >
                  <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFilePick}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <h1 className="font-display text-xl font-bold text-slate-950 sm:text-2xl dark:text-slate-50">
                  {displayTitle}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user.email}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-xs font-semibold tabular-nums">
                  <span className="text-[#2563EB] dark:text-blue-400">
                    {localizeDigits(myPosts.length, language)}{' '}
                    {language === 'bn' ? 'টি মোট পোস্ট' : 'Total Posts'}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="text-emerald-700 dark:text-emerald-400">
                    {localizeDigits(liveCount, language)}{' '}
                    {language === 'bn' ? 'টি লাইভ' : 'Live'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Add New + Direct Logout */}
            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
              <button
                type="button"
                onClick={() => onOpenCreatePost('service')}
                className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-[#2563EB] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1D4ED8]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>{language === 'bn' ? 'নতুন পোস্ট দিন' : 'Add New'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  void handleSignOut().then(() => onSignedOut?.());
                }}
                className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:bg-[#111827] dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>{t.signOut}</span>
              </button>
            </div>
          </div>

          {/* Browser / Phone Push Notification Bar */}
          {notifPermission !== 'unsupported' && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <BellRing
                  className={`h-5 w-5 shrink-0 ${
                    notifPermission === 'granted' && browserNotifEnabled
                      ? 'text-[#2563EB] dark:text-blue-400'
                      : 'text-slate-400'
                  }`}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {language === 'bn'
                      ? 'ব্রাউজার ও ফোন নোটিফিকেশন'
                      : 'Browser & Phone Notifications'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {notifPermission === 'granted'
                      ? browserNotifEnabled
                        ? language === 'bn'
                          ? 'চালু আছে — নতুন মেসেজ বা আপডেট সাথে সাথে ফোনে যাবে'
                          : 'Enabled — instant alerts on your device'
                        : language === 'bn'
                          ? 'সাময়িকভাবে বন্ধ আছে'
                          : 'Paused on this device'
                      : notifPermission === 'denied'
                        ? language === 'bn'
                          ? 'ব্রাউজারের সেটিংস থেকে নোটিফিকেশন Allow করুন'
                          : 'Blocked in browser settings'
                        : language === 'bn'
                          ? 'চালু করলে নতুন চ্যাট মেসেজ ব্রাউজার থেকে ফোনে যাবে'
                          : 'Receive instant chat & listing alerts on your phone'}
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
                  className={`min-h-9 cursor-pointer rounded-md px-3.5 text-xs font-bold transition-colors ${
                    notifPermission === 'granted' && browserNotifEnabled
                      ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200'
                      : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                  }`}
                >
                  {notifPermission === 'granted'
                    ? browserNotifEnabled
                      ? language === 'bn'
                        ? 'বন্ধ করুন'
                        : 'Turn Off'
                      : language === 'bn'
                        ? 'চালু করুন'
                        : 'Turn On'
                    : language === 'bn'
                      ? 'নোটিফিকেশন চালু করুন'
                      : 'Enable Alerts'}
                </button>
              )}
            </div>
          )}

          {/* Account Info Edit Row */}
          <form
            onSubmit={handleSaveAccount}
            className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-200 pt-5 sm:grid-cols-12 dark:border-slate-800"
          >
            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'প্রোফাইল নাম' : 'Display Name'}
              </label>
              <input
                type="text"
                required
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}
              </label>
              <input
                type="tel"
                value={accountPhone}
                onChange={(e) => setAccountPhone(e.target.value)}
                placeholder="+880 17..."
                className={`${inputCls} font-mono`}
              />
            </div>

            <div className="flex items-end sm:col-span-3">
              <button
                type="submit"
                disabled={savingAccount}
                className="min-h-10 w-full cursor-pointer rounded-md border border-slate-300 bg-slate-100 px-4 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-200 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {savingAccount
                  ? language === 'bn'
                    ? 'সংরক্ষণ হচ্ছে...'
                    : 'Saving...'
                  : language === 'bn'
                    ? 'তথ্য আপডেট করুন'
                    : 'Save Profile'}
              </button>
            </div>
          </form>

          {accountFeedback && (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{accountFeedback}</span>
            </p>
          )}
        </div>

        {/* Feedback / Error Banners */}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        {feedback && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{feedback}</span>
          </div>
        )}

        {/* All My Posts Management Section (Empty state shows Add New button, NO auto-open form) */}
        <div className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="font-display text-lg font-bold text-slate-950 sm:text-xl dark:text-slate-50">
              {language === 'bn'
                ? 'আমার সকল পোস্ট ও বিজ্ঞাপন'
                : 'All My Posts & Listings'}
            </h2>

            {myPosts.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'all', bn: 'সবগুলো', en: 'All' },
                    { id: 'service', bn: 'সেবা', en: 'Services' },
                    { id: 'house-rent', bn: 'বাসা ভাড়া', en: 'House Rent' },
                    { id: 'secondhand', bn: 'সেকেন্ড হ্যান্ড', en: 'Second-Hand' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPostFilterType(tab.id)}
                    className={`min-h-8 cursor-pointer rounded-md px-3 text-xs font-semibold transition-colors ${
                      postFilterType === tab.id
                        ? 'bg-[#2563EB] text-white'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#111827] dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {language === 'bn' ? tab.bn : tab.en}
                  </button>
                ))}
              </div>
            )}
          </div>

          {postsLoading ? (
            <div className="py-2">
              <CardSkeletonGrid variant="horizontal" count={3} />
            </div>
          ) : filteredMyPosts.length === 0 ? (
            <div className="border-y border-slate-200 py-12 text-center dark:border-slate-800">
              <Layers
                className="mx-auto h-10 w-10 text-slate-400"
                aria-hidden="true"
              />
              <h3 className="mt-3 font-display text-base font-bold text-slate-900 dark:text-slate-100">
                {language === 'bn'
                  ? 'আপনার কোনো পোস্ট এখনো নেই'
                  : 'You have no posts yet'}
              </h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'নতুন সেবা, টিউশনি, বাসা ভাড়া বা সেকেন্ড হ্যান্ড পণ্যের বিজ্ঞাপন দিতে নিচের Add New বাটনে ক্লিক করুন।'
                  : 'Click Add New below to publish a service, house rental, or second-hand item.'}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onOpenCreatePost('service')}
                  className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md bg-[#2563EB] px-5 text-sm font-bold text-white hover:bg-[#1D4ED8]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>{language === 'bn' ? 'Add New / নতুন পোস্ট' : 'Add New Post'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {filteredMyPosts.map((post) => {
                const postType = post.listingType || 'service';
                const isManaging = managingPostId === post.id;
                const isVerifying = verifyPostId === post.id;
                const displayCat =
                  post.customCategory ||
                  (language === 'bn' ? post.categoryNameBn : post.categoryNameEn);

                return (
                  <div key={post.id} className="py-4 sm:py-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="flex min-w-0 gap-3.5">
                        <div className="h-18 w-18 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                          {post.profilePhotoUrl || post.galleryUrls?.[0] ? (
                            <SafeImage
                              src={post.profilePhotoUrl || post.galleryUrls![0]}
                              alt={post.businessName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              <Building2 className="h-6 w-6" aria-hidden="true" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-bold text-[#2563EB] dark:text-blue-400">
                              {getListingTypeLabel(postType, language)}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">·</span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {displayCat}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">·</span>
                            <span
                              className={`font-semibold uppercase ${
                                post.status === 'approved'
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : post.status === 'rejected' ||
                                      post.status === 'suspended'
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-amber-700 dark:text-amber-400'
                              }`}
                            >
                              {post.status === 'approved'
                                ? language === 'bn'
                                  ? 'লাইভ'
                                  : 'LIVE'
                                : post.status}
                            </span>
                            {post.verificationStatus === 'verified' && (
                              <span className="inline-flex items-center gap-0.5 font-semibold text-[#2563EB] dark:text-blue-400">
                                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>{t.verifiedBadge}</span>
                              </span>
                            )}
                          </div>

                          <h3 className="mt-1 font-display text-base font-bold text-slate-950 sm:text-lg dark:text-slate-50">
                            {post.businessName}
                          </h3>

                          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                            {post.upazila}, {post.district}
                            {post.startingRate ? ` · ${post.startingRate}` : ''}
                            {post.propertySpec ? ` · ${post.propertySpec}` : ''}
                          </p>

                          {post.tags && post.tags.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {post.tags.map((tg) => (
                                <span
                                  key={tg}
                                  className="text-[11px] font-medium text-slate-500 dark:text-slate-400"
                                >
                                  #{tg}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewPublicProfile(post.id)}
                          className="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-md border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{language === 'bn' ? 'দেখুন' : 'View'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onEditPost(post)}
                          className="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 text-xs font-bold text-[#2563EB] hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300"
                        >
                          <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{language === 'bn' ? 'সম্পাদনা' : 'Edit'}</span>
                        </button>

                        {postType === 'service' && (
                          <button
                            type="button"
                            onClick={() =>
                              setManagingPostId((prev) =>
                                prev === post.id ? null : post.id
                              )
                            }
                            className="min-h-8 cursor-pointer rounded-md border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            {language === 'bn' ? 'সার্ভিস আইটেম' : 'Items'}
                          </button>
                        )}

                        {post.verificationStatus !== 'verified' &&
                          post.verificationStatus !== 'pending' && (
                            <button
                              type="button"
                              onClick={() =>
                                setVerifyPostId((prev) =>
                                  prev === post.id ? null : post.id
                                )
                              }
                              className="min-h-8 cursor-pointer rounded-md border border-slate-300 px-2.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50 dark:border-slate-700 dark:text-blue-400 dark:hover:bg-blue-950/40"
                            >
                              {language === 'bn' ? 'ভেরিফাই' : 'Verify'}
                            </button>
                          )}

                        {confirmDeleteId === post.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => void handleDeletePost(post.id)}
                              className="min-h-8 cursor-pointer rounded-md bg-red-600 px-2.5 text-xs font-bold text-white hover:bg-red-700"
                            >
                              {language === 'bn' ? 'নিশ্চিত মুছুন' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="min-h-8 cursor-pointer rounded-md border border-slate-300 px-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                            >
                              {language === 'bn' ? 'না' : 'No'}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(post.id)}
                            aria-label="Delete post"
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Verification Request Inline Drawer */}
                    {isVerifying && (
                      <form
                        onSubmit={(e) => void handleRequestVerification(e, post.id)}
                        className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row dark:border-slate-800"
                      >
                        <input
                          type="text"
                          value={verificationNote}
                          onChange={(e) => setVerificationNote(e.target.value)}
                          placeholder={
                            language === 'bn'
                              ? 'ট্রেড লাইসেন্স, এনআইডি বা রেফারেন্স তথ্য লিখুন'
                              : 'Enter NID / Trade license ref or proof note'
                          }
                          className="min-h-9 flex-1 rounded-md border border-slate-300 bg-white px-3 text-xs focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#090D16] dark:text-slate-100"
                        />
                        <button
                          type="submit"
                          disabled={submittingVerify}
                          className="min-h-9 cursor-pointer rounded-md bg-[#2563EB] px-4 text-xs font-bold text-white hover:bg-[#1D4ED8]"
                        >
                          {language === 'bn' ? 'আবেদন পাঠান' : 'Submit Request'}
                        </button>
                      </form>
                    )}

                    {/* Service Items Manager Drawer */}
                    {isManaging && (
                      <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {language === 'bn'
                            ? 'পোস্টের অধীনে অতিরিক্ত সার্ভিস আইটেম যোগ করুন'
                            : 'Manage Individual Services for this Post'}
                        </p>
                        <form
                          onSubmit={(e) => void handleAddService(e, post.id)}
                          className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-12"
                        >
                          <input
                            type="text"
                            required
                            value={srvTitle}
                            onChange={(e) => setSrvTitle(e.target.value)}
                            placeholder={
                              language === 'bn' ? 'সেবার নাম' : 'Service title'
                            }
                            className="min-h-9 rounded-md border border-slate-300 bg-white px-3 text-xs sm:col-span-4 dark:border-slate-700 dark:bg-[#090D16] dark:text-slate-100"
                          />
                          <input
                            type="text"
                            required
                            value={srvDesc}
                            onChange={(e) => setSrvDesc(e.target.value)}
                            placeholder={
                              language === 'bn' ? 'সংক্ষিপ্ত বিবরণ' : 'Short description'
                            }
                            className="min-h-9 rounded-md border border-slate-300 bg-white px-3 text-xs sm:col-span-4 dark:border-slate-700 dark:bg-[#090D16] dark:text-slate-100"
                          />
                          <input
                            type="text"
                            value={srvPrice}
                            onChange={(e) => setSrvPrice(e.target.value)}
                            placeholder={
                              language === 'bn' ? 'ফি (৳৫০০)' : 'Rate (৳500)'
                            }
                            className="min-h-9 rounded-md border border-slate-300 bg-white px-3 text-xs sm:col-span-2 dark:border-slate-700 dark:bg-[#090D16] dark:text-slate-100"
                          />
                          <button
                            type="submit"
                            disabled={addingService}
                            className="min-h-9 cursor-pointer rounded-md bg-[#2563EB] px-3 text-xs font-bold text-white hover:bg-[#1D4ED8] sm:col-span-2"
                          >
                            {language === 'bn' ? 'যোগ' : 'Add'}
                          </button>
                        </form>

                        {postServices.length > 0 && (
                          <div className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
                            {postServices.map((srv) => (
                              <div
                                key={srv.id}
                                className="flex items-center justify-between gap-3 py-2 text-xs"
                              >
                                <div>
                                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {srv.title}
                                  </span>
                                  <span className="ml-2 text-slate-500">
                                    {srv.priceEstimate ? `· ${srv.priceEstimate}` : ''}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteService(post.id, srv.id)}
                                  className="cursor-pointer text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Image Crop Modal strictly for Account Avatar (1:1 circle) */}
      <ImageCropModal
        file={cropFile}
        aspect={1}
        circular={cropTarget === 'avatar'}
        onCancel={() => {
          setCropTarget(null);
          setCropFile(null);
        }}
        onConfirm={(croppedFile) => void handleCropConfirmed(croppedFile)}
      />
    </section>
  );
}
