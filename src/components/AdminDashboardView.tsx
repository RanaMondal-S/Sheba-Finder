import { useEffect, useState, type FormEvent } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  BadgeCheck,
  Check,
  Download,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useApp } from '../context/AppContext';
import { localizeDigits } from '../i18n/translations';
import { getListingTypeLabel } from '../utils/tags';
import type {
  AdminUser,
  LocationEntry,
  ProviderApprovalStatus,
  ProviderProfile,
  ProviderService,
  ReportItem,
  Review,
  ServiceCategory,
  UserProfile,
} from '../types/sheba';

type AdminTab =
  | 'providers'
  | 'services'
  | 'verifications'
  | 'taxonomy'
  | 'reports'
  | 'users';

export function AdminDashboardView() {
  const {
    language,
    user,
    isAdmin,
    isBootstrapAdmin,
    categories,
    customLocations,
    reviews,
  } = useApp();

  const [tab, setTab] = useState<AdminTab>('providers');
  const [allProviders, setAllProviders] = useState<ProviderProfile[]>([]);
  const [allServices, setAllServices] = useState<
    (ProviderService & { providerName: string })[]
  >([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);

  // New Category form
  const [catSlug, setCatSlug] = useState('');
  const [catNameBn, setCatNameBn] = useState('');
  const [catNameEn, setCatNameEn] = useState('');

  // New Location form
  const [locDivEn, setLocDivEn] = useState('');
  const [locDivBn, setLocDivBn] = useState('');
  const [locDistEn, setLocDistEn] = useState('');
  const [locDistBn, setLocDistBn] = useState('');
  const [locUpEn, setLocUpEn] = useState('');
  const [locUpBn, setLocUpBn] = useState('');

  useEffect(() => {
    if (!isAdmin) return;

    const unsubProviders = onSnapshot(
      collection(db, 'providers'),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ProviderProfile, 'id'>),
        }));
        setAllProviders(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'providers')
    );

    const unsubReports = onSnapshot(
      collection(db, 'reports'),
      (snap) => {
        setReports(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ReportItem, 'id'>),
          }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'reports')
    );

    let unsubUsers = () => {};
    let unsubAdmins = () => {};
    if (isBootstrapAdmin) {
      unsubUsers = onSnapshot(
        collection(db, 'users'),
        (snap) => {
          setUsersList(snap.docs.map((d) => d.data() as UserProfile));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'users')
      );
      unsubAdmins = onSnapshot(
        collection(db, 'admins'),
        (snap) => {
          setAdminsList(snap.docs.map((d) => d.data() as AdminUser));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'admins')
      );
    }

    return () => {
      unsubProviders();
      unsubReports();
      unsubUsers();
      unsubAdmins();
    };
  }, [isAdmin, isBootstrapAdmin]);

  useEffect(() => {
    if (!isAdmin || allProviders.length === 0) {
      setAllServices([]);
      return;
    }

    let cancelled = false;
    const loadServices = async () => {
      const merged: (ProviderService & { providerName: string })[] = [];
      for (const p of allProviders) {
        try {
          const snap = await getDocs(
            collection(db, 'providers', p.id, 'services')
          );
          for (const d of snap.docs) {
            merged.push({
              id: d.id,
              providerName: p.businessName,
              ...(d.data() as Omit<ProviderService, 'id'>),
            });
          }
        } catch {
          // Ignore inaccessible subcollection
        }
      }
      if (!cancelled) setAllServices(merged);
    };
    void loadServices();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, allProviders]);

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-red-600" aria-hidden="true" />
        <h1 className="mt-4 font-display text-2xl font-bold text-slate-950 dark:text-slate-50">
          {language === 'bn'
            ? 'শুধুমাত্র অনুমোদিত অ্যাডমিনদের জন্য সংরক্ষিত'
            : 'Administrator Access Required'}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {language === 'bn'
            ? 'এই প্যানেলটি সার্ভার-সাইড সিকিউরিটি রুল দ্বারা সুরক্ষিত।'
            : 'This console is strictly restricted by Firestore security rules.'}
        </p>
      </section>
    );
  }

  const notifyUser = async (
    targetUid: string,
    titleBn: string,
    titleEn: string,
    bodyBn: string,
    bodyEn: string,
    type: 'approval' | 'verification' | 'system'
  ) => {
    await addDoc(collection(db, 'notifications'), {
      userId: targetUid,
      titleBn,
      titleEn,
      bodyBn,
      bodyEn,
      type,
      read: false,
      createdAt: serverTimestamp(),
    });
  };

  const handleProviderStatus = async (
    provider: ProviderProfile,
    nextStatus: ProviderApprovalStatus
  ) => {
    try {
      await updateDoc(doc(db, 'providers', provider.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      await notifyUser(
        provider.ownerId,
        `আপনার পোস্ট স্ট্যাটাস: ${nextStatus}`,
        `Listing status updated: ${nextStatus}`,
        provider.businessName,
        provider.businessName,
        'approval'
      );
      setStatusMessage(`${provider.businessName} -> ${nextStatus}`);
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `providers/${provider.id}`
      );
    }
  };

  const handleDeleteProvider = async (provider: ProviderProfile) => {
    try {
      await deleteDoc(doc(db, 'providers', provider.id));
      setConfirmDeleteKey(null);
      setStatusMessage(
        language === 'bn'
          ? `মুছে ফেলা হয়েছে: ${provider.businessName}`
          : `Deleted listing: ${provider.businessName}`
      );
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `providers/${provider.id}`
      );
    }
  };

  const handleVerificationDecision = async (
    provider: ProviderProfile,
    decision: 'verified' | 'rejected'
  ) => {
    try {
      await updateDoc(doc(db, 'providers', provider.id), {
        verificationStatus: decision,
        updatedAt: serverTimestamp(),
      });
      await notifyUser(
        provider.ownerId,
        decision === 'verified'
          ? 'অভিনন্দন! আপনার প্রোফাইল ভেরিফায়েড হয়েছে'
          : 'ভেরিফিকেশন অনুরোধ প্রত্যাখ্যাত হয়েছে',
        decision === 'verified'
          ? 'Your listing is now Verified'
          : 'Verification request was not approved',
        provider.businessName,
        provider.businessName,
        'verification'
      );
      setStatusMessage(`${provider.businessName} verification -> ${decision}`);
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `providers/${provider.id}`
      );
    }
  };

  const handleServiceDecision = async (
    srv: ProviderService & { providerName: string },
    decision: 'approved' | 'rejected'
  ) => {
    try {
      await updateDoc(
        doc(db, 'providers', srv.providerId, 'services', srv.id),
        {
          status: decision,
          updatedAt: serverTimestamp(),
        }
      );
      setAllServices((prev) =>
        prev.map((item) =>
          item.id === srv.id && item.providerId === srv.providerId
            ? { ...item, status: decision }
            : item
        )
      );
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `providers/${srv.providerId}/services/${srv.id}`
      );
    }
  };

  const handleDeleteService = async (
    srv: ProviderService & { providerName: string }
  ) => {
    try {
      await deleteDoc(doc(db, 'providers', srv.providerId, 'services', srv.id));
      setAllServices((prev) =>
        prev.filter(
          (item) => !(item.id === srv.id && item.providerId === srv.providerId)
        )
      );
      setConfirmDeleteKey(null);
      setStatusMessage(
        language === 'bn' ? `সার্ভিস মুছে ফেলা হয়েছে: ${srv.title}` : `Deleted service: ${srv.title}`
      );
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `providers/${srv.providerId}/services/${srv.id}`
      );
    }
  };

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    const slug = catSlug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-');
    if (slug.length < 2) return;
    try {
      await setDoc(doc(db, 'categories', slug), {
        slug,
        nameBn: catNameBn.trim(),
        nameEn: catNameEn.trim(),
        active: true,
        iconName: 'Wrench',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setCatSlug('');
      setCatNameBn('');
      setCatNameEn('');
      setStatusMessage(`Category added: ${slug}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `categories/${slug}`);
    }
  };

  const handleDeleteCategory = async (slug: string) => {
    try {
      await deleteDoc(doc(db, 'categories', slug));
      setConfirmDeleteKey(null);
      setStatusMessage(`Category deleted: ${slug}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${slug}`);
    }
  };

  const handleAddLocation = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'locations'), {
        divisionEn: locDivEn.trim(),
        divisionBn: locDivBn.trim(),
        districtEn: locDistEn.trim(),
        districtBn: locDistBn.trim(),
        upazilaEn: locUpEn.trim(),
        upazilaBn: locUpBn.trim(),
        active: true,
        createdAt: serverTimestamp(),
      });
      setLocDivEn('');
      setLocDivBn('');
      setLocDistEn('');
      setLocDistBn('');
      setLocUpEn('');
      setLocUpBn('');
      setStatusMessage('Custom location added.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'locations');
    }
  };

  const handleDeleteLocation = async (locId: string) => {
    try {
      await deleteDoc(doc(db, 'locations', locId));
      setConfirmDeleteKey(null);
      setStatusMessage('Location deleted.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `locations/${locId}`);
    }
  };

  const handleReportStatus = async (
    rep: ReportItem,
    nextStatus: ReportItem['status']
  ) => {
    try {
      await updateDoc(doc(db, 'reports', rep.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reports/${rep.id}`);
    }
  };

  const handleDeleteReport = async (repId: string) => {
    try {
      await deleteDoc(doc(db, 'reports', repId));
      setConfirmDeleteKey(null);
      setStatusMessage('Report deleted.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `reports/${repId}`);
    }
  };

  const handleToggleReviewVisibility = async (rev: Review) => {
    const nextStatus = rev.status === 'published' ? 'hidden' : 'published';
    try {
      await updateDoc(doc(db, 'reviews', rev.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reviews/${rev.id}`);
    }
  };

  const handleDeleteReview = async (revId: string) => {
    try {
      await deleteDoc(doc(db, 'reviews', revId));
      setConfirmDeleteKey(null);
      setStatusMessage('Review deleted.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `reviews/${revId}`);
    }
  };

  const handleToggleAdminRole = async (targetUser: UserProfile) => {
    const exists = adminsList.some((a) => a.uid === targetUser.uid);
    try {
      if (exists) {
        await deleteDoc(doc(db, 'admins', targetUser.uid));
      } else {
        await setDoc(doc(db, 'admins', targetUser.uid), {
          uid: targetUser.uid,
          email: targetUser.email,
          grantedBy: user?.uid || '',
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.WRITE,
        `admins/${targetUser.uid}`
      );
    }
  };

  const handleDeleteUserDoc = async (targetUser: UserProfile) => {
    if (targetUser.uid === user?.uid) return;
    try {
      await deleteDoc(doc(db, 'users', targetUser.uid));
      setConfirmDeleteKey(null);
      setStatusMessage(`User document deleted: ${targetUser.email}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${targetUser.uid}`);
    }
  };

  const pendingProvidersCount = allProviders.filter(
    (p) => p.status === 'pending'
  ).length;
  const pendingVerificationsCount = allProviders.filter(
    (p) => p.verificationStatus === 'pending'
  ).length;
  const openReportsCount = reports.filter((r) => r.status === 'open').length;

  const tabs: { id: AdminTab; label: string }[] = [
    {
      id: 'providers',
      label:
        language === 'bn'
          ? `সকল পোস্ট (${localizeDigits(allProviders.length, language)})`
          : `Listings (${allProviders.length})`,
    },
    {
      id: 'services',
      label: language === 'bn' ? 'সার্ভিস আইটেম' : 'Services',
    },
    {
      id: 'verifications',
      label:
        language === 'bn'
          ? `ভেরিফিকেশন (${localizeDigits(pendingVerificationsCount, language)})`
          : `Verifications (${pendingVerificationsCount})`,
    },
    {
      id: 'taxonomy',
      label: language === 'bn' ? 'ক্যাটাগরি ও এলাকা' : 'Categories & Locations',
    },
    {
      id: 'reports',
      label:
        language === 'bn'
          ? `রিপোর্ট ও রিভিউ (${localizeDigits(openReportsCount, language)})`
          : `Reports & Reviews (${openReportsCount})`,
    },
    ...(isBootstrapAdmin
      ? [
          {
            id: 'users' as AdminTab,
            label: language === 'bn' ? 'ব্যবহারকারী ও অ্যাডমিন' : 'Users & Admins',
          },
        ]
      : []),
  ];

  const renderDeleteButton = (keyId: string, onConfirm: () => void) => {
    if (confirmDeleteKey === keyId) {
      return (
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-8 cursor-pointer rounded-md bg-red-600 px-2.5 text-xs font-bold text-white hover:bg-red-700"
          >
            {language === 'bn' ? 'নিশ্চিত ডিলিট' : 'Confirm Delete'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDeleteKey(null)}
            className="min-h-8 cursor-pointer rounded-md border border-slate-300 px-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
          >
            {language === 'bn' ? 'না' : 'Cancel'}
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => setConfirmDeleteKey(keyId)}
        className="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-md border border-red-200 px-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/30"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{language === 'bn' ? 'ডিলিট' : 'Delete'}</span>
      </button>
    );
  };

  return (
    <section className="min-h-[80vh] py-8">
      <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end dark:border-slate-800">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-950 sm:text-3xl dark:text-slate-50">
              {language === 'bn' ? 'অ্যাডমিন কন্ট্রোল প্যানেল' : 'Admin Management Console'}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {language === 'bn'
                ? 'যেকোনো পোস্ট, সার্ভিস, রিভিউ, রিপোর্ট ও ক্যাটাগরি পরিচালনা এবং ডিলিট করুন'
                : 'Moderate, verify, or delete any listing, service item, review, report, or category'}
            </p>
          </div>

          <a
            href="/admin-panel.html"
            download="admin-panel.html"
            className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {language === 'bn'
                ? 'লোকেল HTML প্যানেল ডাউনলোড'
                : 'Download Localhost HTML Panel'}
            </span>
          </a>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: language === 'bn' ? 'মোট পোস্ট / বিজ্ঞাপন' : 'Total Listings',
              value: allProviders.length,
            },
            {
              label: language === 'bn' ? 'লাইভ পোস্ট' : 'Live Listings',
              value: allProviders.filter((p) => p.status === 'approved').length,
            },
            {
              label: language === 'bn' ? 'ভেরিফিকেশন আবেদন' : 'Verification Requests',
              value: pendingVerificationsCount,
            },
            {
              label: language === 'bn' ? 'খোলা রিপোর্ট' : 'Open Reports',
              value: openReportsCount,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#111827]"
            >
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-slate-950 tabular-nums dark:text-slate-50">
                {localizeDigits(stat.value, language)}
              </p>
            </div>
          ))}
        </div>

        {statusMessage && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
            {statusMessage}
          </div>
        )}

        {pendingProvidersCount > 0 && (
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
            {language === 'bn'
              ? `${localizeDigits(pendingProvidersCount, language)}টি পুরোনো পোস্ট অপেক্ষমাণ আছে`
              : `${pendingProvidersCount} legacy pending listings`}
          </p>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-[#111827]">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`min-h-8 cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                tab === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Tab: Providers / Listings */}
        {tab === 'providers' && (
          <div className="space-y-3">
            {allProviders.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-[#111827]">
                {language === 'bn' ? 'কোনো পোস্ট পাওয়া যায়নি।' : 'No listings found.'}
              </p>
            ) : (
              <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-[#111827]">
                {allProviders.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span
                          className={`font-bold uppercase ${
                            p.status === 'approved'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : p.status === 'suspended' || p.status === 'rejected'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {p.status}
                        </span>
                        <span>·</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {getListingTypeLabel(p.listingType, language)}
                        </span>
                        <span>·</span>
                        <span>
                          {p.customCategory ||
                            (language === 'bn' ? p.categoryNameBn : p.categoryNameEn)}
                        </span>
                        <span>·</span>
                        <span>
                          {p.upazila}, {p.district}
                        </span>
                      </div>
                      <h3 className="mt-1 font-display text-base font-bold text-slate-950 dark:text-slate-50">
                        {p.businessName}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {p.ownerName} {p.phone ? `· ${p.phone}` : ''}
                      </p>
                      {p.tags && p.tags.length > 0 && (
                        <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {p.tags.slice(0, 6).map((tag) => `#${tag}`).join(' ')}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {p.status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => void handleProviderStatus(p, 'approved')}
                          className="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-md bg-blue-600 px-2.5 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{language === 'bn' ? 'প্রকাশ' : 'Approve'}</span>
                        </button>
                      )}
                      {p.status !== 'suspended' && (
                        <button
                          type="button"
                          onClick={() => void handleProviderStatus(p, 'suspended')}
                          className="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-md border border-amber-300 px-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/30"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{language === 'bn' ? 'স্থগিত' : 'Suspend'}</span>
                        </button>
                      )}
                      {renderDeleteButton(`provider-${p.id}`, () =>
                        void handleDeleteProvider(p)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Services */}
        {tab === 'services' && (
          <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-[#111827]">
            {allServices.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">
                {language === 'bn' ? 'কোনো সার্ভিস পাওয়া যায়নি।' : 'No provider services found.'}
              </p>
            ) : (
              allServices.map((srv) => (
                <div
                  key={`${srv.providerId}-${srv.id}`}
                  className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {srv.providerName} · {srv.status.toUpperCase()}
                    </p>
                    <h3 className="mt-0.5 font-semibold text-slate-950 dark:text-slate-100">
                      {srv.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {srv.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {srv.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => void handleServiceDecision(srv, 'approved')}
                        className="min-h-8 cursor-pointer rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        {language === 'bn' ? 'অনুমোদন' : 'Approve'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleServiceDecision(srv, 'rejected')}
                      className="min-h-8 cursor-pointer rounded-md border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                    >
                      {language === 'bn' ? 'প্রত্যাখ্যান' : 'Reject'}
                    </button>
                    {renderDeleteButton(`srv-${srv.providerId}-${srv.id}`, () =>
                      void handleDeleteService(srv)
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Verifications */}
        {tab === 'verifications' && (
          <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-[#111827]">
            {allProviders.map((p) => (
              <div
                key={p.id}
                className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-bold text-slate-950 dark:text-slate-100">
                      {p.businessName}
                    </h3>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      ({p.verificationStatus})
                    </span>
                  </div>
                  {p.verificationNote && (
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {p.verificationNote}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleVerificationDecision(p, 'verified')}
                    className="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                    <span>{language === 'bn' ? 'ভেরিফায়েড করুন' : 'Verify'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleVerificationDecision(p, 'rejected')}
                    className="min-h-8 cursor-pointer rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                  >
                    {language === 'bn' ? 'বাতিল' : 'Revoke / Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Categories & Locations */}
        {tab === 'taxonomy' && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
              <h2 className="font-display text-base font-bold text-slate-950 dark:text-slate-50">
                {language === 'bn' ? 'সেবা ক্যাটাগরি যোগ করুন' : 'Add Service Category'}
              </h2>
              <form onSubmit={handleAddCategory} className="mt-3 space-y-2.5">
                <input
                  type="text"
                  required
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="slug (e.g., solar-tech)"
                  className="min-h-9 w-full rounded-md border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-[#090D16] dark:text-slate-100"
                />
                <input
                  type="text"
                  required
                  value={catNameBn}
                  onChange={(e) => setCatNameBn(e.target.value)}
                  placeholder="বাংলা নাম"
                  className="min-h-9 w-full rounded-md border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-[#090D16] dark:text-slate-100"
                />
                <input
                  type="text"
                  required
                  value={catNameEn}
                  onChange={(e) => setCatNameEn(e.target.value)}
                  placeholder="English Name"
                  className="min-h-9 w-full rounded-md border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-[#090D16] dark:text-slate-100"
                />
                <button
                  type="submit"
                  className="min-h-9 cursor-pointer rounded-md bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  {language === 'bn' ? 'ক্যাটাগরি সংরক্ষণ' : 'Save Category'}
                </button>
              </form>

              <div className="mt-5 max-h-72 space-y-2 overflow-y-auto border-t border-slate-200 pt-4 dark:border-slate-800">
                {categories.map((c: ServiceCategory) => (
                  <div
                    key={c.slug}
                    className="flex items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <span className="truncate">
                      {c.nameBn} / {c.nameEn} ({c.slug})
                    </span>
                    {renderDeleteButton(`cat-${c.slug}`, () =>
                      void handleDeleteCategory(c.slug)
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
              <h2 className="font-display text-base font-bold text-slate-950 dark:text-slate-50">
                {language === 'bn' ? 'কাস্টম এলাকা / থানা যোগ করুন' : 'Add Custom Location'}
              </h2>
              <form onSubmit={handleAddLocation} className="mt-3 grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  required
                  value={locDivEn}
                  onChange={(e) => setLocDivEn(e.target.value)}
                  placeholder="Division (EN)"
                  className="min-h-9 rounded-md border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-[#090D16] dark:text-slate-100"
                />
                <input
                  type="text"
                  required
                  value={locDivBn}
                  onChange={(e) => setLocDivBn(e.target.value)}
                  placeholder="বিভাগ (বাংলা)"
                  className="min-h-9 rounded-md border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-[#090D16] dark:text-slate-100"
                />
                <input
                  type="text"
                  required
                  value={locDistEn}
                  onChange={(e) => setLocDistEn(e.target.value)}
                  placeholder="District (EN)"
                  className="min-h-9 rounded-md border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-[#090D16] dark:text-slate-100"
                />
                <input
                  type="text"
                  required
                  value={locDistBn}
                  onChange={(e) => setLocDistBn(e.target.value)}
                  placeholder="জেলা (বাংলা)"
                  className="min-h-9 rounded-md border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-[#090D16] dark:text-slate-100"
                />
                <input
                  type="text"
                  required
                  value={locUpEn}
                  onChange={(e) => setLocUpEn(e.target.value)}
                  placeholder="Upazila / Area (EN)"
                  className="min-h-9 rounded-md border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-[#090D16] dark:text-slate-100"
                />
                <input
                  type="text"
                  required
                  value={locUpBn}
                  onChange={(e) => setLocUpBn(e.target.value)}
                  placeholder="উপজেলা / এলাকা (বাংলা)"
                  className="min-h-9 rounded-md border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-[#090D16] dark:text-slate-100"
                />
                <button
                  type="submit"
                  className="col-span-2 min-h-9 cursor-pointer rounded-md bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  {language === 'bn' ? 'লোকেশন যোগ করুন' : 'Add Location'}
                </button>
              </form>

              <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                {customLocations.map((loc: LocationEntry) => (
                  <div
                    key={loc.id}
                    className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300"
                  >
                    <span>
                      {loc.upazilaBn} ({loc.upazilaEn}), {loc.districtEn}
                    </span>
                    {renderDeleteButton(`loc-${loc.id}`, () =>
                      void handleDeleteLocation(loc.id)
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Reports & Reviews */}
        {tab === 'reports' && (
          <div className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
              <h2 className="font-display text-base font-bold text-slate-950 dark:text-slate-50">
                {language === 'bn' ? 'ব্যবহারকারী রিপোর্টসমূহ' : 'User Reports'}
              </h2>
              {reports.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  {language === 'bn' ? 'কোনো রিপোর্ট নেই।' : 'No reports filed.'}
                </p>
              ) : (
                <div className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
                  {reports.map((rep) => (
                    <div
                      key={rep.id}
                      className="flex flex-col justify-between gap-3 py-3 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {rep.providerName} · {rep.reason} ({rep.status})
                        </p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                          {rep.details} — {rep.reporterName}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => void handleReportStatus(rep, 'resolved')}
                          className="min-h-8 cursor-pointer rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          {language === 'bn' ? 'সমাধান' : 'Resolve'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleReportStatus(rep, 'dismissed')}
                          className="min-h-8 cursor-pointer rounded-md border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                        >
                          {language === 'bn' ? 'বাতিল' : 'Dismiss'}
                        </button>
                        {renderDeleteButton(`rep-${rep.id}`, () =>
                          void handleDeleteReport(rep.id)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
              <h2 className="font-display text-base font-bold text-slate-950 dark:text-slate-50">
                {language === 'bn' ? 'রিভিউ মডারেশন' : 'Reviews Moderation'}
              </h2>
              {reviews.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  {language === 'bn' ? 'কোনো রিভিউ নেই।' : 'No reviews yet.'}
                </p>
              ) : (
                <div className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="flex flex-col justify-between gap-3 py-3 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {rev.authorName} · {rev.rating}/5 · ({rev.status})
                        </p>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                          {rev.comment}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void handleToggleReviewVisibility(rev)}
                          className="min-h-8 cursor-pointer rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                        >
                          {rev.status === 'published'
                            ? language === 'bn'
                              ? 'লুকান'
                              : 'Hide'
                            : language === 'bn'
                              ? 'প্রকাশ করুন'
                              : 'Publish'}
                        </button>
                        {renderDeleteButton(`rev-${rev.id}`, () =>
                          void handleDeleteReview(rev.id)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Users & Admins */}
        {tab === 'users' && isBootstrapAdmin && (
          <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-[#111827]">
            {usersList.map((u) => {
              const hasAdmin = adminsList.some((a) => a.uid === u.uid);
              return (
                <div
                  key={u.uid}
                  className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                      {u.displayName} ({u.role})
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {u.email}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleToggleAdminRole(u)}
                      className={`min-h-8 cursor-pointer rounded-md px-3 text-xs font-semibold ${
                        hasAdmin
                          ? 'border border-amber-300 text-amber-800 dark:border-amber-800 dark:text-amber-300'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {hasAdmin
                        ? language === 'bn'
                          ? 'অ্যাডমিন সরান'
                          : 'Revoke Admin'
                        : language === 'bn'
                          ? 'অ্যাডমিন বানান'
                          : 'Grant Admin'}
                    </button>
                    {u.uid !== user?.uid &&
                      renderDeleteButton(`user-${u.uid}`, () =>
                        void handleDeleteUserDoc(u)
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
