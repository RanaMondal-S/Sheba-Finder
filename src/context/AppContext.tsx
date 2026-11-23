import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  BOOTSTRAP_ADMIN_EMAIL,
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { DEFAULT_CATEGORIES } from '../data/categories';
import { TRANSLATIONS } from '../i18n/translations';
import { getTrendingTags } from '../utils/tags';
import type {
  Conversation,
  Favorite,
  Language,
  LocationEntry,
  NotificationItem,
  ProviderProfile,
  Review,
  ServiceCategory,
  ThemeMode,
  UserProfile,
} from '../types/sheba';

interface ProviderRatingSummary {
  avg: number;
  count: number;
}

export type BrowserNotifPermission =
  | 'default'
  | 'granted'
  | 'denied'
  | 'unsupported';

interface AppContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (typeof TRANSLATIONS)['bn'] | (typeof TRANSLATIONS)['en'];
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  user: User | null;
  authReady: boolean;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isBootstrapAdmin: boolean;
  isEmailVerified: boolean;
  categories: ServiceCategory[];
  customLocations: LocationEntry[];
  approvedProviders: ProviderProfile[];
  trendingTags: { tag: string; count: number }[];
  providersLoading: boolean;
  providersRefreshing: boolean;
  reviews: Review[];
  ratingByProvider: Record<string, ProviderRatingSummary>;
  favorites: Favorite[];
  conversations: Conversation[];
  unreadChatCount: number;
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  notifPermission: BrowserNotifPermission;
  browserNotifEnabled: boolean;
  notifPromptDismissed: boolean;
  dismissNotifPrompt: () => void;
  latestPopupNotif: NotificationItem | null;
  dismissPopupNotif: () => void;
  requestBrowserNotifications: () => Promise<BrowserNotifPermission>;
  toggleBrowserNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  interestProfile: { categories: string[]; tags: string[] };
  recordInterest: (categorySlug?: string, tags?: string[]) => void;
  handleSignOut: () => Promise<void>;
  refreshAuthUser: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const LANG_STORAGE_KEY = 'shebafinder_language';
const THEME_STORAGE_KEY = 'shebafinder_theme';
const NOTIF_PREF_KEY = 'shebafinder_browser_notif_enabled';
const NOTIF_DISMISSED_KEY = 'shebafinder_notif_prompt_dismissed';
const INTEREST_CATS_KEY = 'shebafinder_interest_cats';
const INTEREST_TAGS_KEY = 'shebafinder_interest_tags';
const PROVIDERS_CACHE_KEY = 'shebafinder_providers_cache_v1';

function readProvidersCache(): ProviderProfile[] {
  try {
    const raw = localStorage.getItem(PROVIDERS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ProviderProfile[]) : [];
  } catch {
    return [];
  }
}

function writeProvidersCache(items: ProviderProfile[]) {
  try {
    const slim = items.slice(0, 28).map((p) => {
      const photo =
        p.profilePhotoUrl && p.profilePhotoUrl.length <= 28000
          ? p.profilePhotoUrl
          : p.profilePhotoUrl?.startsWith('http')
            ? p.profilePhotoUrl
            : '';
      return {
        id: p.id,
        ownerId: p.ownerId,
        listingType: p.listingType,
        businessName: p.businessName,
        ownerName: p.ownerName,
        categorySlug: p.categorySlug,
        categoryNameBn: p.categoryNameBn,
        categoryNameEn: p.categoryNameEn,
        customCategory: p.customCategory,
        division: p.division,
        district: p.district,
        upazila: p.upazila,
        tags: p.tags,
        specItems: p.specItems?.slice(0, 6),
        condition: p.condition,
        propertySpec: p.propertySpec,
        experienceYears: p.experienceYears,
        bio: p.bio?.slice(0, 240) || '',
        startingRate: p.startingRate,
        profilePhotoUrl: photo,
        galleryUrls: photo ? [photo] : [],
        status: p.status,
        verificationStatus: p.verificationStatus,
        isDemo: p.isDemo,
      };
    });
    localStorage.setItem(PROVIDERS_CACHE_KEY, JSON.stringify(slim));
  } catch {
    // Ignore quota errors
  }
}

// Singleton per-UID promise guard prevents duplicate concurrent setDoc() races
// between onAuthStateChanged and Google Sign-In popup completion.
const profileSyncInFlight = new Map<string, Promise<void>>();

export async function ensureUserProfile(
  firebaseUser: User,
  preferredLanguage: Language = 'bn'
): Promise<void> {
  if (!firebaseUser || !firebaseUser.emailVerified) return;

  const existingPromise = profileSyncInFlight.get(firebaseUser.uid);
  if (existingPromise) {
    return existingPromise;
  }

  const syncTask = (async () => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      const resolvedEmail =
        firebaseUser.email ||
        firebaseUser.providerData?.[0]?.email ||
        'user@shebafinder.app';
      const rawName =
        firebaseUser.displayName ||
        resolvedEmail.split('@')[0] ||
        'ShebaFinder User';
      const safeName = rawName.trim().slice(0, 100) || 'ShebaFinder User';
      const safePhoto =
        firebaseUser.photoURL && firebaseUser.photoURL.length <= 200000
          ? firebaseUser.photoURL
          : '';

      await setDoc(userRef, {
        uid: firebaseUser.uid,
        displayName: safeName,
        email: resolvedEmail.slice(0, 160),
        photoUrl: safePhoto,
        role: 'customer',
        preferredLanguage,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  })().finally(() => {
    profileSyncInFlight.delete(firebaseUser.uid);
  });

  profileSyncInFlight.set(firebaseUser.uid, syncTask);
  return syncTask;
}

function playNotificationTone() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(784, ctx.currentTime);
    osc.frequency.setValueAtTime(1046, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  } catch {
    // Ignore autoplay audio blocks
  }
}

async function dispatchSystemBrowserNotification(
  title: string,
  body: string,
  tag: string,
  data?: Record<string, string>
) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const options: NotificationOptions = {
    body,
    tag,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: { url: window.location.pathname, ...data },
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, options);
        return;
      }
    }
    new Notification(title, options);
  } catch {
    try {
      new Notification(title, options);
    } catch {
      // Ignore restricted frame notification contexts
    }
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      return saved === 'en' ? 'en' : 'bn';
    } catch {
      return 'bn';
    }
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [notifPermission, setNotifPermission] =
    useState<BrowserNotifPermission>(() => {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'unsupported';
      }
      return Notification.permission;
    });

  const [browserNotifEnabled, setBrowserNotifEnabled] = useState<boolean>(
    () => {
      try {
        const saved = localStorage.getItem(NOTIF_PREF_KEY);
        if (saved === 'false') return false;
        return true;
      } catch {
        return true;
      }
    }
  );

  const [notifPromptDismissed, setNotifPromptDismissed] = useState<boolean>(
    () => {
      try {
        return localStorage.getItem(NOTIF_DISMISSED_KEY) === 'true';
      } catch {
        return false;
      }
    }
  );

  const [interestProfile, setInterestProfile] = useState<{
    categories: string[];
    tags: string[];
  }>(() => {
    try {
      const cats = JSON.parse(localStorage.getItem(INTEREST_CATS_KEY) || '[]');
      const tgs = JSON.parse(localStorage.getItem(INTEREST_TAGS_KEY) || '[]');
      return {
        categories: Array.isArray(cats) ? cats : [],
        tags: Array.isArray(tgs) ? tgs : [],
      };
    } catch {
      return { categories: [], tags: [] };
    }
  });

  const languageRef = useRef<Language>(language);
  languageRef.current = language;
  const browserNotifEnabledRef = useRef<boolean>(browserNotifEnabled);
  browserNotifEnabledRef.current = browserNotifEnabled;

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdminDoc, setIsAdminDoc] = useState(false);

  const [firestoreCategories, setFirestoreCategories] = useState<
    ServiceCategory[]
  >([]);
  const [customLocations, setCustomLocations] = useState<LocationEntry[]>([]);
  const [initialCachedProviders] = useState<ProviderProfile[]>(() =>
    readProvidersCache()
  );
  const [approvedProviders, setApprovedProviders] = useState<ProviderProfile[]>(
    initialCachedProviders
  );
  const [providersLoading, setProvidersLoading] = useState(
    initialCachedProviders.length === 0
  );
  const [providersRefreshing, setProvidersRefreshing] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [customerConvs, setCustomerConvs] = useState<Conversation[]>([]);
  const [providerConvs, setProviderConvs] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [latestPopupNotif, setLatestPopupNotif] =
    useState<NotificationItem | null>(null);

  const seenNotifIdsRef = useRef<Set<string>>(new Set());
  const notifSnapshotInitRef = useRef(false);
  const popupTimerRef = useRef<number | null>(null);
  const autoNotifAttemptedRef = useRef(false);

  const dismissNotifPrompt = () => {
    setNotifPromptDismissed(true);
    try {
      localStorage.setItem(NOTIF_DISMISSED_KEY, 'true');
    } catch {
      // Ignore storage error
    }
  };

  // Register service worker & automatically request notification permission cleanly
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    if (!('Notification' in window)) return;
    setNotifPermission(Notification.permission);

    if (Notification.permission !== 'default' || notifPromptDismissed) return;

    const triggerAutoPrompt = async () => {
      if (autoNotifAttemptedRef.current) return;
      if (Notification.permission !== 'default') {
        setNotifPermission(Notification.permission);
        return;
      }
      autoNotifAttemptedRef.current = true;
      try {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
        if (perm === 'granted') {
          setBrowserNotifEnabled(true);
          try {
            localStorage.setItem(NOTIF_PREF_KEY, 'true');
          } catch {
            // Ignore
          }
        }
      } catch {
        // Browsers requiring direct button gesture will leave it 'default' for the prompt banner
      }
    };

    const timer = window.setTimeout(() => {
      void triggerAutoPrompt();
    }, 900);

    const onFirstGesture = () => {
      if (Notification.permission === 'default' && !notifPromptDismissed) {
        autoNotifAttemptedRef.current = false;
        void triggerAutoPrompt();
      }
    };
    window.addEventListener('pointerdown', onFirstGesture, {
      once: true,
      passive: true,
    });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointerdown', onFirstGesture);
    };
  }, [notifPromptDismissed]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(LANG_STORAGE_KEY, language);
    } catch {
      // Ignore storage failures
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const dismissPopupNotif = () => {
    setLatestPopupNotif(null);
    if (popupTimerRef.current) {
      window.clearTimeout(popupTimerRef.current);
      popupTimerRef.current = null;
    }
  };

  const requestBrowserNotifications =
    async (): Promise<BrowserNotifPermission> => {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        setNotifPermission('unsupported');
        return 'unsupported';
      }

      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/sw.js').catch(() => {});
      }

      const perm = await Notification.requestPermission();
      setNotifPermission(perm);

      if (perm === 'granted') {
        setBrowserNotifEnabled(true);
        try {
          localStorage.setItem(NOTIF_PREF_KEY, 'true');
        } catch {
          // Ignore storage error
        }
        await dispatchSystemBrowserNotification(
          languageRef.current === 'bn'
            ? 'ShebaFinder নোটিফিকেশন চালু হয়েছে'
            : 'ShebaFinder Notifications Enabled',
          languageRef.current === 'bn'
            ? 'এখন থেকে নতুন মেসেজ বা আপডেট সাথে সাথে ফোনে ও ব্রাউজারে পাবেন।'
            : 'You will now receive instant chat & listing alerts.',
          'shebafinder-welcome'
        );
      }
      return perm;
    };

  const toggleBrowserNotifications = async () => {
    if (notifPermission === 'unsupported') return;
    if (notifPermission !== 'granted') {
      await requestBrowserNotifications();
      return;
    }
    const next = !browserNotifEnabled;
    setBrowserNotifEnabled(next);
    try {
      localStorage.setItem(NOTIF_PREF_KEY, String(next));
    } catch {
      // Ignore
    }
  };

  const recordInterest = (categorySlug?: string, tags?: string[]) => {
    setInterestProfile((prev) => {
      const nextCats = categorySlug
        ? [
            categorySlug,
            ...prev.categories.filter((c) => c !== categorySlug),
          ].slice(0, 8)
        : prev.categories;
      const incomingTags = (tags || []).filter(Boolean);
      const nextTags =
        incomingTags.length > 0
          ? Array.from(new Set([...incomingTags, ...prev.tags])).slice(0, 16)
          : prev.tags;

      try {
        localStorage.setItem(INTEREST_CATS_KEY, JSON.stringify(nextCats));
        localStorage.setItem(INTEREST_TAGS_KEY, JSON.stringify(nextTags));
      } catch {
        // Ignore storage error
      }
      return { categories: nextCats, tags: nextTags };
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);

      if (firebaseUser && firebaseUser.emailVerified) {
        try {
          await ensureUserProfile(firebaseUser, languageRef.current);
        } catch (err) {
          console.warn('Initial user profile sync note:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Public categories listener
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'categories'),
      (snap) => {
        const items = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ServiceCategory, 'id'>),
        }));
        setFirestoreCategories(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'categories');
      }
    );
    return () => unsub();
  }, []);

  // Public custom locations listener
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'locations'),
      (snap) => {
        const items = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<LocationEntry, 'id'>),
        }));
        setCustomLocations(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'locations');
      }
    );
    return () => unsub();
  }, []);

  // Fast initial fetch + live approved listings listener
  useEffect(() => {
    let active = true;
    const baseQuery = query(
      collection(db, 'providers'),
      where('status', '==', 'approved'),
      limit(80)
    );

    const sortNewestFirst = (list: ProviderProfile[]) =>
      [...list].sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });

    getDocs(baseQuery)
      .then((snap) => {
        if (!active) return;
        const items = sortNewestFirst(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ProviderProfile, 'id'>),
          }))
        );
        if (items.length > 0) {
          setApprovedProviders(items);
          writeProvidersCache(items);
          setProvidersLoading(false);
        }
      })
      .catch(() => {
        // Live listener below handles state & errors
      });

    const unsub = onSnapshot(
      baseQuery,
      (snap) => {
        const items = sortNewestFirst(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ProviderProfile, 'id'>),
          }))
        );
        setApprovedProviders(items);
        writeProvidersCache(items);
        setProvidersLoading(false);
        setProvidersRefreshing(false);
      },
      (err) => {
        setProvidersLoading(false);
        setProvidersRefreshing(false);
        handleFirestoreError(err, OperationType.LIST, 'providers');
      }
    );
    return () => {
      active = false;
      unsub();
    };
  }, []);

  // Public published reviews listener
  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      where('status', '==', 'published')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Review, 'id'>),
        }));
        setReviews(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'reviews');
      }
    );
    return () => unsub();
  }, []);

  // Authenticated user-scoped listeners
  useEffect(() => {
    if (!authReady || !user) {
      setUserProfile(null);
      setIsAdminDoc(false);
      setFavorites([]);
      setCustomerConvs([]);
      setProviderConvs([]);
      setNotifications([]);
      seenNotifIdsRef.current.clear();
      notifSnapshotInitRef.current = false;
      return;
    }

    const uid = user.uid;
    seenNotifIdsRef.current.clear();
    notifSnapshotInitRef.current = false;

    const unsubUser = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          setUserProfile(snap.data() as UserProfile);
        } else {
          setUserProfile(null);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${uid}`);
      }
    );

    const unsubAdmin = onSnapshot(
      doc(db, 'admins', uid),
      (snap) => {
        setIsAdminDoc(snap.exists());
      },
      () => {
        setIsAdminDoc(false);
      }
    );

    const unsubFavs = onSnapshot(
      collection(db, 'users', uid, 'favorites'),
      (snap) => {
        setFavorites(snap.docs.map((d) => d.data() as Favorite));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${uid}/favorites`);
      }
    );

    const unsubCustomerConvs = onSnapshot(
      query(collection(db, 'conversations'), where('customerId', '==', uid)),
      (snap) => {
        setCustomerConvs(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Conversation, 'id'>),
          }))
        );
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'conversations');
      }
    );

    const unsubProviderConvs = onSnapshot(
      query(
        collection(db, 'conversations'),
        where('providerOwnerId', '==', uid)
      ),
      (snap) => {
        setProviderConvs(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Conversation, 'id'>),
          }))
        );
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'conversations');
      }
    );

    const unsubNotifications = onSnapshot(
      query(collection(db, 'notifications'), where('userId', '==', uid)),
      (snap) => {
        const list = snap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<NotificationItem, 'id'>),
          }))
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() ?? 0;
            const tb = b.createdAt?.toMillis?.() ?? 0;
            return tb - ta;
          });

        if (!notifSnapshotInitRef.current) {
          for (const item of list) {
            seenNotifIdsRef.current.add(item.id);
          }
          notifSnapshotInitRef.current = true;
        } else {
          for (const change of snap.docChanges()) {
            if (change.type === 'added') {
              const item: NotificationItem = {
                id: change.doc.id,
                ...(change.doc.data() as Omit<NotificationItem, 'id'>),
              };
              if (!seenNotifIdsRef.current.has(item.id) && !item.read) {
                seenNotifIdsRef.current.add(item.id);
                setLatestPopupNotif(item);
                if (popupTimerRef.current) {
                  window.clearTimeout(popupTimerRef.current);
                }
                popupTimerRef.current = window.setTimeout(() => {
                  setLatestPopupNotif(null);
                }, 6500);

                playNotificationTone();

                if (browserNotifEnabledRef.current) {
                  const lang = languageRef.current;
                  const title = lang === 'bn' ? item.titleBn : item.titleEn;
                  const body =
                    (lang === 'bn' ? item.bodyBn : item.bodyEn) || '';
                  void dispatchSystemBrowserNotification(
                    title,
                    body,
                    `sheba-${item.id}`,
                    {
                      type: item.type,
                      conversationId: item.conversationId || '',
                      providerId: item.providerId || '',
                    }
                  );
                }
              }
            }
          }
        }

        setNotifications(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'notifications');
      }
    );

    return () => {
      unsubUser();
      unsubAdmin();
      unsubFavs();
      unsubCustomerConvs();
      unsubProviderConvs();
      unsubNotifications();
    };
  }, [authReady, user]);

  const categories = useMemo(() => {
    const map = new Map<string, ServiceCategory>();
    for (const def of DEFAULT_CATEGORIES) {
      map.set(def.slug, def);
    }
    for (const fc of firestoreCategories) {
      const existing = map.get(fc.slug);
      map.set(fc.slug, {
        ...(existing ?? {}),
        ...fc,
        image: fc.image || existing?.image,
        iconName: fc.iconName || existing?.iconName || 'Wrench',
        listingType: fc.listingType || existing?.listingType || 'service',
      });
    }
    return Array.from(map.values()).filter((c) => c.active);
  }, [firestoreCategories]);

  const trendingTags = useMemo(
    () => getTrendingTags(approvedProviders, 12),
    [approvedProviders]
  );

  const ratingByProvider = useMemo(() => {
    const totals: Record<string, { sum: number; count: number }> = {};
    for (const r of reviews) {
      if (!totals[r.providerId]) {
        totals[r.providerId] = { sum: 0, count: 0 };
      }
      totals[r.providerId].sum += r.rating;
      totals[r.providerId].count += 1;
    }
    const result: Record<string, ProviderRatingSummary> = {};
    for (const [pid, stat] of Object.entries(totals)) {
      result[pid] = {
        avg: Number((stat.sum / stat.count).toFixed(1)),
        count: stat.count,
      };
    }
    return result;
  }, [reviews]);

  const conversations = useMemo(() => {
    const byId = new Map<string, Conversation>();
    for (const c of customerConvs) byId.set(c.id, c);
    for (const c of providerConvs) byId.set(c.id, c);
    return Array.from(byId.values()).sort((a, b) => {
      const ta = a.lastMessageAt?.toMillis?.() ?? 0;
      const tb = b.lastMessageAt?.toMillis?.() ?? 0;
      return tb - ta;
    });
  }, [customerConvs, providerConvs]);

  const unreadChatCount = useMemo(() => {
    if (!user) return 0;
    return conversations.reduce((sum, conv) => {
      if (conv.customerId === user.uid && !conv.hiddenForCustomer) {
        return sum + (conv.unreadCustomerCount || 0);
      }
      if (conv.providerOwnerId === user.uid && !conv.hiddenForProvider) {
        return sum + (conv.unreadProviderCount || 0);
      }
      return sum;
    }, 0);
  }, [conversations, user]);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const isBootstrapAdmin = Boolean(
    user &&
      user.emailVerified &&
      user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()
  );

  const isAdmin = isBootstrapAdmin || (Boolean(user?.emailVerified) && isAdminDoc);

  const markNotificationRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const markAllNotificationsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    try {
      const batch = writeBatch(db);
      for (const n of unread.slice(0, 50)) {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'notifications');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const refreshAuthUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser });
    }
  };

  const value: AppContextValue = {
    language,
    setLanguage,
    t: TRANSLATIONS[language],
    theme,
    setTheme,
    toggleTheme,
    user,
    authReady,
    userProfile,
    isAdmin,
    isBootstrapAdmin,
    isEmailVerified: Boolean(user?.emailVerified),
    categories,
    customLocations,
    approvedProviders,
    trendingTags,
    providersLoading,
    providersRefreshing,
    reviews,
    ratingByProvider,
    favorites,
    conversations,
    unreadChatCount,
    notifications,
    unreadNotificationCount,
    notifPermission,
    browserNotifEnabled,
    notifPromptDismissed,
    dismissNotifPrompt,
    latestPopupNotif,
    dismissPopupNotif,
    requestBrowserNotifications,
    toggleBrowserNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    interestProfile,
    recordInterest,
    handleSignOut,
    refreshAuthUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
