/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  Paintbrush,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { AppProvider, useApp } from './context/AppContext';
import type { AppView, ListingType, ProviderProfile } from './types/sheba';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { BrowseProvidersView } from './components/BrowseProvidersView';
import { ProviderProfileView } from './components/ProviderProfileView';
import { ChatView } from './components/ChatView';
import { FavoritesView } from './components/FavoritesView';
import { UserProfileView } from './components/UserProfileView';
import { CreatePostView } from './components/CreatePostView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';

function ShebaFinderApp() {
  const {
    language,
    user,
    userProfile,
    isEmailVerified,
    favorites,
    approvedProviders,
    conversations,
    notifPermission,
    notifPromptDismissed,
    dismissNotifPrompt,
    requestBrowserNotifications,
    latestPopupNotif,
    dismissPopupNotif,
    markNotificationRead,
    recordInterest,
  } = useApp();

  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    null
  );
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [draftChatTarget, setDraftChatTarget] = useState<{
    conversationId: string;
    provider: ProviderProfile;
  } | null>(null);
  const pendingChatProviderRef = useRef<ProviderProfile | null>(null);

  const [createPostPresetType, setCreatePostPresetType] =
    useState<ListingType>('service');
  const [editingPost, setEditingPost] = useState<ProviderProfile | null>(null);
  const [createPostReturnView, setCreatePostReturnView] =
    useState<AppView>('home');
  const [publishingBanner, setPublishingBanner] = useState<{
    state: 'idle' | 'publishing' | 'published' | 'error';
    message: string;
  }>({ state: 'idle', message: '' });
  const publishTimerRef = useRef<number | null>(null);

  const [chatNotice, setChatNotice] = useState<string>('');
  const chatNoticeTimerRef = useRef<number | null>(null);

  const [browseFilters, setBrowseFilters] = useState<{
    keyword: string;
    category: string;
    division: string;
    district: string;
    upazila: string;
    listingType: '' | ListingType;
  }>({
    keyword: '',
    category: '',
    division: '',
    district: '',
    upazila: '',
    listingType: '',
  });
  const [browseKey, setBrowseKey] = useState(0);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [postLoginView, setPostLoginView] = useState<AppView>('profile');

  // Deep-link support for ?post=<providerId> URLs shared via Chat or clipboard
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const postParam = params.get('post');
    if (postParam) {
      setSelectedProviderId(postParam);
      setCurrentView('provider');
    }
  }, []);

  useEffect(() => {
    return () => {
      if (publishTimerRef.current) window.clearTimeout(publishTimerRef.current);
      if (chatNoticeTimerRef.current) {
        window.clearTimeout(chatNoticeTimerRef.current);
      }
    };
  }, []);

  const showChatNotice = (msg: string) => {
    setChatNotice(msg);
    if (chatNoticeTimerRef.current) window.clearTimeout(chatNoticeTimerRef.current);
    chatNoticeTimerRef.current = window.setTimeout(() => {
      setChatNotice('');
    }, 5500);
  };

  const navigate = (view: AppView, keepConversation = false) => {
    if (view !== 'provider' && window.location.search.includes('post=')) {
      window.history.replaceState(null, '', window.location.pathname);
    }

    if (view === 'chat' && !keepConversation) {
      setActiveConversationId(null);
      setDraftChatTarget(null);
    }

    if (view === 'services') {
      setBrowseFilters({
        keyword: '',
        category: '',
        division: '',
        district: '',
        upazila: '',
        listingType: 'service',
      });
      setBrowseKey((k) => k + 1);
    } else if (view === 'house-rent') {
      setBrowseFilters({
        keyword: '',
        category: '',
        division: '',
        district: '',
        upazila: '',
        listingType: 'house-rent',
      });
      setBrowseKey((k) => k + 1);
    } else if (view === 'secondhand') {
      setBrowseFilters({
        keyword: '',
        category: '',
        division: '',
        district: '',
        upazila: '',
        listingType: 'secondhand',
      });
      setBrowseKey((k) => k + 1);
    } else if (view === 'browse') {
      setBrowseFilters((prev) => ({
        ...prev,
        listingType: '',
      }));
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Service Worker notification clicks to route user directly to chat/listing
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    const handleSwMessage = (event: MessageEvent) => {
      const payload = event.data;
      if (!payload || payload.type !== 'SHEBA_NOTIF_CLICK') return;
      if (payload.conversationId) {
        setActiveConversationId(String(payload.conversationId));
        navigate('chat', true);
      } else if (payload.providerId) {
        setSelectedProviderId(String(payload.providerId));
        navigate('provider');
      } else {
        navigate('chat');
      }
    };
    navigator.serviceWorker.addEventListener('message', handleSwMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSwMessage);
    };
  }, []);

  const openAuth = (redirectTarget: AppView = 'profile') => {
    setPostLoginView(redirectTarget);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    const pendingChat = pendingChatProviderRef.current;
    if (pendingChat) {
      pendingChatProviderRef.current = null;
      window.setTimeout(() => {
        handleStartChat(pendingChat);
      }, 120);
      return;
    }
    navigate(postLoginView);
  };

  const handleOpenCreatePost = (presetType: ListingType = 'service') => {
    setCreatePostPresetType(presetType);
    setEditingPost(null);
    setCreatePostReturnView(
      currentView === 'create-post' ? 'profile' : currentView
    );
    if (!user || !isEmailVerified) {
      openAuth('create-post');
      return;
    }
    navigate('create-post');
  };

  const handleEditPost = (post: ProviderProfile) => {
    setCreatePostPresetType(post.listingType || 'service');
    setEditingPost(post);
    setCreatePostReturnView(
      currentView === 'create-post' ? 'profile' : currentView
    );
    if (!user || !isEmailVerified) {
      openAuth('create-post');
      return;
    }
    navigate('create-post');
  };

  const handleSearchSubmit = (filters: {
    keyword: string;
    category: string;
    division: string;
    district: string;
    upazila: string;
    listingType?: '' | ListingType;
  }) => {
    if (filters.category) {
      recordInterest(filters.category, []);
    }
    setBrowseFilters({
      keyword: filters.keyword,
      category: filters.category,
      division: filters.division,
      district: filters.district,
      upazila: filters.upazila,
      listingType: filters.listingType || '',
    });
    setBrowseKey((k) => k + 1);
    if (window.location.search.includes('post=')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    setCurrentView('browse');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (
    categorySlug: string,
    listingType?: ListingType
  ) => {
    recordInterest(categorySlug, []);
    setBrowseFilters({
      keyword: '',
      category: categorySlug,
      division: '',
      district: '',
      upazila: '',
      listingType: listingType || '',
    });
    setBrowseKey((k) => k + 1);
    if (window.location.search.includes('post=')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    setCurrentView(
      listingType === 'house-rent'
        ? 'house-rent'
        : listingType === 'secondhand'
          ? 'secondhand'
          : listingType === 'service'
            ? 'services'
            : 'browse'
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewProvider = (providerId: string) => {
    const found = approvedProviders.find((p) => p.id === providerId);
    if (found) {
      recordInterest(found.categorySlug, found.tags || []);
    }
    setSelectedProviderId(providerId);
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}?post=${encodeURIComponent(providerId)}`
    );
    setCurrentView('provider');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleFavorite = async (provider: ProviderProfile) => {
    if (!user || !isEmailVerified) {
      openAuth('favorites');
      return;
    }

    recordInterest(provider.categorySlug, provider.tags || []);
    const favRef = doc(db, 'users', user.uid, 'favorites', provider.id);
    const exists = favorites.some((f) => f.providerId === provider.id);

    try {
      if (exists) {
        await deleteDoc(favRef);
      } else {
        await setDoc(favRef, {
          providerId: provider.id,
          businessName: provider.businessName,
          categoryNameBn: provider.categoryNameBn,
          categoryNameEn: provider.categoryNameEn,
          district: provider.district,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.WRITE,
        `users/${user.uid}/favorites/${provider.id}`
      );
    }
  };

  const handleStartChat = (provider: ProviderProfile) => {
    if (!user || !isEmailVerified) {
      pendingChatProviderRef.current = provider;
      openAuth('chat');
      return;
    }

    if (provider.ownerId === user.uid) {
      const existing = conversations.find((c) => c.providerId === provider.id);
      setDraftChatTarget(null);
      if (existing) {
        setActiveConversationId(existing.id);
        navigate('chat', true);
      } else {
        showChatNotice(
          language === 'bn'
            ? 'এটি আপনার নিজের পোস্ট — কোনো ক্রেতা মেসেজ পাঠালে এখানে ইনবক্সে দেখাবে।'
            : 'This is your own listing — buyer inquiries will appear here in Chat.'
        );
        navigate('chat');
      }
      return;
    }

    const conversationId = `${user.uid}_${provider.id}`;
    setDraftChatTarget({ conversationId, provider });
    setActiveConversationId(conversationId);
    navigate('chat', true);
  };

  const handlePopupClick = async () => {
    if (!latestPopupNotif) return;
    const item = latestPopupNotif;
    dismissPopupNotif();
    await markNotificationRead(item.id);
    if (item.conversationId) {
      setDraftChatTarget(null);
      setActiveConversationId(item.conversationId);
      navigate('chat', true);
    } else if (item.providerId) {
      handleViewProvider(item.providerId);
    } else if (item.type === 'message') {
      navigate('chat');
    } else {
      navigate('profile');
    }
  };

  const isDirectoryView =
    currentView === 'services' ||
    currentView === 'browse' ||
    currentView === 'house-rent' ||
    currentView === 'secondhand';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-[#090D16] dark:text-slate-100">
      <Navbar
        currentView={currentView}
        onNavigate={(view) => navigate(view)}
        onOpenAuth={() => openAuth('profile')}
        onOpenCreatePost={handleOpenCreatePost}
        onOpenConversation={(convId) => {
          setDraftChatTarget(null);
          setActiveConversationId(convId);
          navigate('chat', true);
        }}
      />

      {/* Automatic Notification Permission Prompt Banner (when browser hasn't decided yet) */}
      {notifPermission === 'default' && !notifPromptDismissed && (
        <div className="border-b border-blue-200 bg-blue-50/90 px-4 py-2 dark:border-blue-900/60 dark:bg-blue-950/35">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <BellRing
                className="h-4 w-4 shrink-0 text-[#2563EB] dark:text-blue-400"
                aria-hidden="true"
              />
              <span className="font-medium">
                {language === 'bn'
                  ? 'নতুন মেসেজ ও আপডেট সরাসরি ফোনে পেতে নোটিফিকেশন Allow করুন'
                  : 'Allow notifications to receive instant chat alerts on your phone'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void requestBrowserNotifications()}
                className="cursor-pointer rounded-md bg-[#2563EB] px-3 py-1 text-xs font-bold text-white hover:bg-[#1D4ED8]"
              >
                {language === 'bn' ? 'Allow করুন' : 'Allow'}
              </button>
              <button
                type="button"
                onClick={dismissNotifPrompt}
                aria-label="Dismiss notification prompt"
                className="cursor-pointer p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Publishing Status Banner */}
      {publishingBanner.state !== 'idle' && (
        <div className="pointer-events-none fixed top-16 left-0 right-0 z-50 flex justify-center px-4">
          <div
            className={`pointer-events-auto flex max-w-md items-center gap-2.5 rounded-lg border px-4 py-2.5 text-xs font-semibold shadow-lg sm:text-sm ${
              publishingBanner.state === 'publishing'
                ? 'border-blue-200 bg-white text-slate-900 dark:border-blue-900 dark:bg-[#111827] dark:text-slate-100'
                : publishingBanner.state === 'published'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/95 dark:text-emerald-200'
                  : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/95 dark:text-red-200'
            }`}
          >
            {publishingBanner.state === 'publishing' && (
              <Paintbrush className="animate-brush-float h-4 w-4 shrink-0 text-[#2563EB]" />
            )}
            {publishingBanner.state === 'published' && (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            )}
            {publishingBanner.state === 'error' && (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{publishingBanner.message}</span>
            <button
              type="button"
              onClick={() => setPublishingBanner({ state: 'idle', message: '' })}
              className="ml-1 cursor-pointer p-0.5 opacity-70 hover:opacity-100"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Chat Action Notice Toast */}
      {chatNotice && (
        <div className="pointer-events-none fixed top-16 left-0 right-0 z-50 flex justify-center px-4">
          <div className="pointer-events-auto flex max-w-md items-center gap-2.5 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-lg dark:border-blue-900 dark:bg-[#111827] dark:text-slate-100">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#2563EB]" />
            <span>{chatNotice}</span>
            <button
              type="button"
              onClick={() => setChatNotice('')}
              className="cursor-pointer p-0.5 text-slate-400 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Real-Time In-App Notification Popup */}
      {latestPopupNotif && (
        <div className="fixed top-18 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-blue-200 bg-white p-3.5 shadow-xl dark:border-blue-900/80 dark:bg-[#111827]">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-400">
              <BellRing className="h-4 w-4" aria-hidden="true" />
            </span>
            <button
              type="button"
              onClick={() => void handlePopupClick()}
              className="min-w-0 flex-1 cursor-pointer text-left"
            >
              <p className="truncate text-xs font-bold text-slate-950 dark:text-slate-50">
                {language === 'bn'
                  ? latestPopupNotif.titleBn
                  : latestPopupNotif.titleEn}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                {language === 'bn'
                  ? latestPopupNotif.bodyBn
                  : latestPopupNotif.bodyEn}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#2563EB] dark:text-blue-400">
                {language === 'bn' ? 'দেখতে ক্লিক করুন →' : 'Tap to open →'}
              </p>
            </button>
            <button
              type="button"
              onClick={dismissPopupNotif}
              aria-label="Dismiss notification"
              className="cursor-pointer p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-x-hidden">
        <motion.div
          key={`${currentView}-${selectedProviderId || ''}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
        >
        {currentView === 'home' && (
          <HomeView
            onSearchSubmit={handleSearchSubmit}
            onSelectCategory={handleSelectCategory}
            onNavigate={navigate}
            onOpenCreatePost={handleOpenCreatePost}
            onViewProvider={handleViewProvider}
            onStartChat={(p) => handleStartChat(p)}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {isDirectoryView && (
          <BrowseProvidersView
            key={`${currentView}-${browseKey}`}
            initialKeyword={browseFilters.keyword}
            initialCategory={browseFilters.category}
            initialDivision={browseFilters.division}
            initialDistrict={browseFilters.district}
            initialUpazila={browseFilters.upazila}
            initialListingType={
              currentView === 'services'
                ? 'service'
                : currentView === 'house-rent'
                  ? 'house-rent'
                  : currentView === 'secondhand'
                    ? 'secondhand'
                    : browseFilters.listingType
            }
            onBack={() => navigate('home')}
            onViewProvider={handleViewProvider}
            onStartChat={(p) => handleStartChat(p)}
            onToggleFavorite={handleToggleFavorite}
            onBecomeProvider={() =>
              handleOpenCreatePost(
                currentView === 'house-rent'
                  ? 'house-rent'
                  : currentView === 'secondhand'
                    ? 'secondhand'
                    : 'service'
              )
            }
          />
        )}

        {currentView === 'provider' && selectedProviderId && (
          <ProviderProfileView
            providerId={selectedProviderId}
            onBack={() => navigate('browse')}
            onStartChat={(p) => handleStartChat(p)}
            onToggleFavorite={handleToggleFavorite}
            onOpenAuth={() => openAuth('provider')}
            onViewProvider={handleViewProvider}
          />
        )}

        {currentView === 'chat' && (
          <ChatView
            activeConversationId={activeConversationId}
            draftTarget={draftChatTarget}
            onClearDraftAttachment={(convId) => {
              if (!convId || draftChatTarget?.conversationId === convId) {
                setDraftChatTarget(null);
              }
            }}
            onSelectConversation={setActiveConversationId}
            onOpenAuth={() => openAuth('chat')}
            onBrowseProviders={() => navigate('browse')}
            onViewProvider={handleViewProvider}
          />
        )}

        {currentView === 'favorites' && (
          <FavoritesView
            onViewProvider={handleViewProvider}
            onStartChat={(p) => handleStartChat(p)}
            onToggleFavorite={handleToggleFavorite}
            onBrowse={() => navigate('browse')}
            onOpenAuth={() => openAuth('favorites')}
          />
        )}

        {(currentView === 'profile' || currentView === 'provider-dashboard') && (
          <UserProfileView
            onOpenAuth={() => openAuth('profile')}
            onViewPublicProfile={handleViewProvider}
            onOpenCreatePost={handleOpenCreatePost}
            onEditPost={handleEditPost}
            onSignedOut={() => navigate('home')}
          />
        )}

        {currentView === 'create-post' && (
          <CreatePostView
            initialListingType={createPostPresetType}
            editingPost={editingPost}
            onBack={() => {
              setEditingPost(null);
              navigate(createPostReturnView);
            }}
            onOpenAuth={() => openAuth('create-post')}
            onStartPublishing={(isEditing) => {
              if (publishTimerRef.current) {
                window.clearTimeout(publishTimerRef.current);
              }
              setEditingPost(null);
              setPublishingBanner({
                state: 'publishing',
                message: isEditing
                  ? language === 'bn'
                    ? 'আপনার পোস্ট আপডেট হচ্ছে...'
                    : 'Updating your post...'
                  : language === 'bn'
                    ? 'আপনার পোস্ট পাবলিশ হচ্ছে...'
                    : 'Publishing your post...',
              });
              navigate('profile');
            }}
            onPublishSuccess={(isEditing) => {
              setPublishingBanner({
                state: 'published',
                message: isEditing
                  ? language === 'bn'
                    ? 'পোস্ট সফলভাবে আপডেট হয়েছে!'
                    : 'Post updated successfully!'
                  : language === 'bn'
                    ? 'আপনার পোস্ট সফলভাবে পাবলিশ হয়েছে!'
                    : 'Your post has been published!',
              });
              if (publishTimerRef.current) {
                window.clearTimeout(publishTimerRef.current);
              }
              publishTimerRef.current = window.setTimeout(() => {
                setPublishingBanner({ state: 'idle', message: '' });
              }, 5500);
            }}
            onPublishError={(msg) => {
              setPublishingBanner({
                state: 'error',
                message: msg,
              });
              if (publishTimerRef.current) {
                window.clearTimeout(publishTimerRef.current);
              }
              publishTimerRef.current = window.setTimeout(() => {
                setPublishingBanner({ state: 'idle', message: '' });
              }, 7000);
            }}
          />
        )}

        {currentView === 'admin' && <AdminDashboardView />}
        </motion.div>
      </main>

      <Footer onNavigate={(view) => navigate(view)} />

      <MobileBottomNav
        currentView={currentView}
        onNavigate={(view) => navigate(view)}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <ShebaFinderApp />
      </AppProvider>
    </ErrorBoundary>
  );
}
