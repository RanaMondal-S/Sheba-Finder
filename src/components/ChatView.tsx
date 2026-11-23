import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCheck,
  Copy,
  ExternalLink,
  ImagePlus,
  Link2,
  Mail,
  MailOpen,
  MapPin,
  MessageSquare,
  Paintbrush,
  Phone,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { db, uploadMediaAsset } from '../lib/firebase';
import { useApp } from '../context/AppContext';
import { localizeDigits } from '../i18n/translations';
import type { ChatMessage, Conversation, ProviderProfile } from '../types/sheba';
import { SafeImage } from './SafeImage';
import { ChatInboxSkeleton } from './ShimmerSkeleton';

interface ChatViewProps {
  activeConversationId: string | null;
  draftTarget: { conversationId: string; provider: ProviderProfile } | null;
  onClearDraftAttachment: (conversationId?: string) => void;
  onSelectConversation: (conversationId: string | null) => void;
  onOpenAuth: () => void;
  onBrowseProviders: () => void;
  onViewProvider?: (providerId: string) => void;
}

type InboxFilter = 'all' | 'unread' | 'read';

const QUICK_REPLIES_BN = [
  'এটি কি এখনো পাওয়া যাবে?',
  'সর্বশেষ দাম কত পড়বে?',
  'লোকেশন ও বিস্তারিত জানাবেন?',
  'কখন কথা বলতে পারবো?',
];

const QUICK_REPLIES_EN = [
  'Is this still available?',
  'What is the final price?',
  'Could you share more details?',
  'When can we talk?',
];

export function ChatView({
  activeConversationId,
  draftTarget,
  onClearDraftAttachment,
  onSelectConversation,
  onOpenAuth,
  onBrowseProviders,
  onViewProvider,
}: ChatViewProps) {
  const {
    language,
    t,
    user,
    authReady,
    userProfile,
    isEmailVerified,
    conversations,
    approvedProviders,
  } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('all');
  const [inboxSearch, setInboxSearch] = useState('');
  const [attachPostInComposer, setAttachPostInComposer] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [confirmDeleteConvId, setConfirmDeleteConvId] = useState<string | null>(
    null
  );
  const [confirmDeleteMsgId, setConfirmDeleteMsgId] = useState<string | null>(
    null
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync composer post attachment state ONLY when a listing's Chat button staged it
  useEffect(() => {
    if (draftTarget && draftTarget.conversationId === activeConversationId) {
      setAttachPostInComposer(true);
    } else {
      setAttachPostInComposer(false);
    }
  }, [draftTarget, activeConversationId]);

  const visibleConversations = useMemo(() => {
    if (!user) return [];
    return conversations.filter((conv) => {
      const isCustomer = conv.customerId === user.uid;
      if (isCustomer && conv.hiddenForCustomer) return false;
      if (!isCustomer && conv.hiddenForProvider) return false;
      return true;
    });
  }, [conversations, user]);

  const unreadInboxCount = useMemo(() => {
    if (!user) return 0;
    return visibleConversations.filter((conv) => {
      const isCustomer = conv.customerId === user.uid;
      return (
        (isCustomer ? conv.unreadCustomerCount : conv.unreadProviderCount) > 0
      );
    }).length;
  }, [visibleConversations, user]);

  const filteredConversations = useMemo(() => {
    if (!user) return [];
    const q = inboxSearch.trim().toLowerCase();
    return visibleConversations.filter((conv) => {
      const isCustomer = conv.customerId === user.uid;
      const unread = isCustomer
        ? conv.unreadCustomerCount
        : conv.unreadProviderCount;
      if (inboxFilter === 'unread' && unread === 0) return false;
      if (inboxFilter === 'read' && unread > 0) return false;

      if (q) {
        const hay = [
          conv.customerName,
          conv.providerName,
          conv.lastMessage,
          conv.providerLocation || '',
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [visibleConversations, inboxFilter, inboxSearch, user]);

  const providerMap = useMemo(() => {
    const map = new Map<string, ProviderProfile>();
    approvedProviders.forEach((p) => map.set(p.id, p));
    if (draftTarget?.provider) {
      map.set(draftTarget.provider.id, draftTarget.provider);
    }
    return map;
  }, [approvedProviders, draftTarget]);

  const existingConversation = useMemo(
    () =>
      activeConversationId
        ? conversations.find((c) => c.id === activeConversationId) || null
        : null,
    [conversations, activeConversationId]
  );

  // Virtual local draft conversation so clicking Chat opens immediately without writing an empty message
  const virtualDraftConversation: Conversation | null = useMemo(() => {
    if (!user || existingConversation) return null;
    if (!draftTarget || draftTarget.conversationId !== activeConversationId) {
      return null;
    }
    const p = draftTarget.provider;
    const customerName =
      (
        userProfile?.displayName ||
        user.displayName ||
        user.email?.split('@')[0] ||
        'Customer'
      )
        .trim()
        .slice(0, 100) || 'Customer';

    return {
      id: draftTarget.conversationId,
      customerId: user.uid,
      customerName,
      providerId: p.id,
      providerOwnerId: p.ownerId,
      providerName: (p.businessName || 'Listing').trim().slice(0, 120),
      providerPhotoUrl: p.profilePhotoUrl || p.galleryUrls?.[0] || '',
      providerRate: p.startingRate || '',
      providerLocation: [p.upazila, p.district].filter(Boolean).join(', '),
      lastMessage: '',
      unreadCustomerCount: 0,
      unreadProviderCount: 0,
    };
  }, [user, existingConversation, draftTarget, activeConversationId, userProfile]);

  const isDraftMode = Boolean(!existingConversation && virtualDraftConversation);
  const selectedConversation = existingConversation || virtualDraftConversation;

  const activeListing = selectedConversation
    ? providerMap.get(selectedConversation.providerId) || null
    : null;

  // Real-time messages listener ONLY when the conversation document exists in Firestore
  useEffect(() => {
    if (!user || !existingConversation) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }

    setErrorMsg('');
    setMessagesLoading(true);
    const q = query(
      collection(db, 'conversations', existingConversation.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setMessages(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ChatMessage, 'id'>),
          }))
        );
        setMessagesLoading(false);
      },
      (err) => {
        console.error('Chat messages listener error:', err);
        setMessagesLoading(false);
        setErrorMsg(
          language === 'bn'
            ? 'মেসেজ লোড করতে সমস্যা হচ্ছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
            : 'Unable to load messages right now. Please try again.'
        );
      }
    );

    return () => unsub();
  }, [user, existingConversation?.id, language]);

  // Mark unread = 0 AND update lastSeenAt timestamp when viewing a live Firestore conversation
  useEffect(() => {
    if (!user || !existingConversation || !isEmailVerified) return;
    const isCustomer = existingConversation.customerId === user.uid;
    const unreadCount = isCustomer
      ? existingConversation.unreadCustomerCount
      : existingConversation.unreadProviderCount;

    const mySeenField = isCustomer ? 'customerLastSeenAt' : 'providerLastSeenAt';
    const convMsgMs = existingConversation.lastMessageAt?.toMillis?.() ?? 0;
    const latestLoadedMsgMs =
      messages[messages.length - 1]?.createdAt?.toMillis?.() ?? 0;
    const latestMs = Math.max(convMsgMs, latestLoadedMsgMs);

    const myLastSeenMs = isCustomer
      ? (existingConversation.customerLastSeenAt?.toMillis?.() ?? 0)
      : (existingConversation.providerLastSeenAt?.toMillis?.() ?? 0);

    const needsSeenSync =
      unreadCount > 0 || (latestMs > 0 && myLastSeenMs < latestMs);

    if (needsSeenSync) {
      const updateField = isCustomer
        ? { unreadCustomerCount: 0 }
        : { unreadProviderCount: 0 };
      updateDoc(doc(db, 'conversations', existingConversation.id), {
        ...updateField,
        [mySeenField]: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    }
  }, [
    user,
    existingConversation?.id,
    existingConversation?.unreadCustomerCount,
    existingConversation?.unreadProviderCount,
    existingConversation?.lastMessageAt,
    existingConversation?.customerLastSeenAt,
    existingConversation?.providerLastSeenAt,
    messages,
    isEmailVerified,
  ]);

  useEffect(() => {
    if (selectedConversation) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, selectedConversation?.id]);

  if (!authReady) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 sheba-shimmer h-7 w-40 rounded" />
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]">
          <ChatInboxSkeleton count={5} />
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <MessageSquare
          className="mx-auto h-10 w-10 text-[#2563EB] dark:text-blue-400"
          aria-hidden="true"
        />
        <h1 className="mt-4 font-display text-2xl font-bold text-slate-950 dark:text-slate-50">
          {language === 'bn'
            ? 'মেসেজিং ব্যবহার করতে লগইন করুন'
            : 'Sign in to access your messages'}
        </h1>
        <button
          type="button"
          onClick={onOpenAuth}
          className="mt-5 min-h-10 cursor-pointer rounded-md bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
        >
          {t.signIn}
        </button>
      </section>
    );
  }

  const handleToggleReadUnread = async (conv: Conversation) => {
    if (!isEmailVerified) return;
    const isCustomer = conv.customerId === user.uid;
    const currentUnread = isCustomer
      ? conv.unreadCustomerCount
      : conv.unreadProviderCount;
    const nextUnread = currentUnread > 0 ? 0 : 1;

    try {
      await updateDoc(doc(db, 'conversations', conv.id), {
        ...(isCustomer
          ? {
              unreadCustomerCount: nextUnread,
              ...(nextUnread === 0
                ? { customerLastSeenAt: serverTimestamp() }
                : {}),
            }
          : {
              unreadProviderCount: nextUnread,
              ...(nextUnread === 0
                ? { providerLastSeenAt: serverTimestamp() }
                : {}),
            }),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Toggle read/unread failed:', err);
    }
  };

  const handleDeleteConversation = async (conv: Conversation) => {
    if (!isEmailVerified) return;
    const isCustomer = conv.customerId === user.uid;
    try {
      await updateDoc(doc(db, 'conversations', conv.id), {
        ...(isCustomer
          ? { hiddenForCustomer: true, unreadCustomerCount: 0 }
          : { hiddenForProvider: true, unreadProviderCount: 0 }),
        updatedAt: serverTimestamp(),
      });
      setConfirmDeleteConvId(null);
      if (activeConversationId === conv.id) {
        onClearDraftAttachment(conv.id);
        onSelectConversation(null);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDeleteMessage = async (msg: ChatMessage) => {
    if (!existingConversation || msg.senderId !== user.uid) return;
    try {
      await deleteDoc(
        doc(db, 'conversations', existingConversation.id, 'messages', msg.id)
      );
      setConfirmDeleteMsgId(null);
      const remaining = messages.filter((m) => m.id !== msg.id);
      const latest = remaining[remaining.length - 1];
      const nextPreview = latest
        ? (
            stripPostUrls(latest.text) ||
            (language === 'bn' ? 'একটি ছবি পাঠিয়েছেন' : 'Sent an image')
          ).slice(0, 200)
        : language === 'bn'
          ? 'মেসেজ মুছে ফেলা হয়েছে'
          : 'Message deleted';
      await updateDoc(doc(db, 'conversations', existingConversation.id), {
        lastMessage: nextPreview,
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleCopyMessage = async (msg: ChatMessage) => {
    const clean = stripPostUrls(msg.text) || msg.text;
    if (!clean) return;
    try {
      await navigator.clipboard.writeText(clean);
      setCopiedMsgId(msg.id);
      window.setTimeout(() => setCopiedMsgId(null), 1800);
    } catch {
      // Ignore clipboard rejection
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleQuickReply = (phrase: string) => {
    setText((prev) => (prev.trim() ? `${prev.trim()} ${phrase}` : phrase));
    inputRef.current?.focus();
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedConversation) return;
    if (!isEmailVerified) {
      setErrorMsg(t.emailVerifyBody);
      onOpenAuth();
      return;
    }

    const typedText = text.trim();
    if (!typedText && !imageFile) return;

    setErrorMsg('');
    setSending(true);

    try {
      let uploadedImageUrl: string | undefined;
      if (imageFile) {
        uploadedImageUrl = await uploadMediaAsset(
          imageFile,
          `chat/${selectedConversation.id}/${Date.now()}_${imageFile.name}`
        );
      }

      const senderName =
        (
          userProfile?.displayName ||
          user.displayName ||
          user.email?.split('@')[0] ||
          'User'
        )
          .trim()
          .slice(0, 100) || 'User';

      const attachedProvider = attachPostInComposer
        ? activeListing || draftTarget?.provider || null
        : null;

      // Format outgoing text: Post link ON TOP + user's typed message BELOW
      const postUrl = attachedProvider
        ? `${window.location.origin}${window.location.pathname}?post=${encodeURIComponent(attachedProvider.id)}`
        : '';

      const formattedText = postUrl
        ? `${postUrl}\n${typedText}`.slice(0, 2000)
        : typedText.slice(0, 2000);

      const convRef = doc(db, 'conversations', selectedConversation.id);
      const isCustomer = selectedConversation.customerId === user.uid;
      const snippetPreview = (
        typedText ||
        (language === 'bn' ? 'একটি ছবি পাঠিয়েছেন' : 'Sent an image')
      ).slice(0, 200);

      // Ensure conversation doc exists cleanly in Firestore BEFORE writing message
      let convExists = Boolean(existingConversation);
      if (!convExists) {
        const snap = await getDoc(convRef);
        convExists = snap.exists();
      }

      if (!convExists) {
        const safeProviderName =
          (selectedConversation.providerName || 'Listing')
            .trim()
            .slice(0, 120) || 'Listing';
        const rawPhoto =
          activeListing?.profilePhotoUrl ||
          activeListing?.galleryUrls?.[0] ||
          selectedConversation.providerPhotoUrl ||
          '';
        const listingPhoto = rawPhoto.length <= 200000 ? rawPhoto : '';
        const listingRate = (
          activeListing?.startingRate ||
          selectedConversation.providerRate ||
          ''
        )
          .trim()
          .slice(0, 60);
        const listingLocation = (
          activeListing
            ? `${activeListing.upazila}, ${activeListing.district}`
            : selectedConversation.providerLocation || ''
        )
          .trim()
          .slice(0, 140);

        await setDoc(convRef, {
          customerId: selectedConversation.customerId,
          customerName: senderName,
          providerId: selectedConversation.providerId,
          providerOwnerId: selectedConversation.providerOwnerId,
          providerName: safeProviderName,
          providerPhotoUrl: listingPhoto,
          providerRate: listingRate,
          providerLocation: listingLocation,
          lastMessage: snippetPreview,
          lastSenderId: user.uid,
          unreadCustomerCount: isCustomer ? 0 : 1,
          unreadProviderCount: isCustomer ? 1 : 0,
          customerLastSeenAt: serverTimestamp(),
          hiddenForCustomer: false,
          hiddenForProvider: false,
          lastMessageAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      const msgPayload: Record<string, unknown> = {
        conversationId: selectedConversation.id,
        customerId: selectedConversation.customerId,
        providerOwnerId: selectedConversation.providerOwnerId,
        senderId: user.uid,
        senderName,
        text: formattedText,
        createdAt: serverTimestamp(),
      };
      if (uploadedImageUrl) {
        msgPayload.imageUrl = uploadedImageUrl;
      }

      await addDoc(
        collection(db, 'conversations', selectedConversation.id, 'messages'),
        msgPayload
      );

      if (convExists) {
        await updateDoc(convRef, {
          lastMessage: snippetPreview,
          lastSenderId: user.uid,
          lastMessageAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          hiddenForCustomer: false,
          hiddenForProvider: false,
          ...(isCustomer
            ? {
                unreadProviderCount: increment(1),
                customerLastSeenAt: serverTimestamp(),
              }
            : {
                unreadCustomerCount: increment(1),
                providerLastSeenAt: serverTimestamp(),
              }),
        });
      }

      const recipientId = isCustomer
        ? selectedConversation.providerOwnerId
        : selectedConversation.customerId;

      await addDoc(collection(db, 'notifications'), {
        userId: recipientId,
        titleBn: `${senderName} নতুন মেসেজ পাঠিয়েছেন`.slice(0, 140),
        titleEn: `New message from ${senderName}`.slice(0, 140),
        bodyBn: `${selectedConversation.providerName}: ${snippetPreview}`.slice(
          0,
          400
        ),
        bodyEn: `${selectedConversation.providerName}: ${snippetPreview}`.slice(
          0,
          400
        ),
        type: 'message',
        conversationId: selectedConversation.id,
        providerId: selectedConversation.providerId,
        read: false,
        createdAt: serverTimestamp(),
      }).catch(() => {});

      setText('');
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (attachPostInComposer) {
        setAttachPostInComposer(false);
        onClearDraftAttachment(selectedConversation.id);
      }
    } catch (err) {
      console.error('Send message error:', err);
      const rawMsg = err instanceof Error ? err.message : String(err);
      if (rawMsg.includes('permission') || rawMsg.includes('PERMISSION_DENIED')) {
        setErrorMsg(
          language === 'bn'
            ? 'মেসেজ পাঠানোর অনুমতি মেলেনি — আপনার অ্যাকাউন্ট ভেরিফাই করা আছে কিনা নিশ্চিত করুন অথবা পেজ রিলোড করুন।'
            : 'Permission error sending message — ensure your account is verified and try again.'
        );
      } else {
        setErrorMsg(rawMsg);
      }
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts?: { toDate?: () => Date }) => {
    if (!ts?.toDate) return '';
    return ts.toDate().toLocaleTimeString(
      language === 'bn' ? 'bn-BD' : 'en-US',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  };

  const formatDateGroup = (ts?: { toDate?: () => Date }) => {
    if (!ts?.toDate) return '';
    const d = ts.toDate();
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (sameDay(d, today)) return language === 'bn' ? 'আজ' : 'Today';
    if (sameDay(d, yesterday)) return language === 'bn' ? 'গতকাল' : 'Yesterday';
    return d.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isConvSeenByRecipient = (conv: Conversation) => {
    const isCustomer = conv.customerId === user.uid;
    const otherUnread = isCustomer
      ? conv.unreadProviderCount
      : conv.unreadCustomerCount;
    const otherSeenMs = isCustomer
      ? (conv.providerLastSeenAt?.toMillis?.() ?? 0)
      : (conv.customerLastSeenAt?.toMillis?.() ?? 0);
    const lastMsgMs = conv.lastMessageAt?.toMillis?.() ?? 0;
    return otherUnread === 0 && otherSeenMs > 0 && otherSeenMs >= lastMsgMs;
  };

  const isMessageSeenByRecipient = (msg: ChatMessage, conv: Conversation) => {
    const isCustomer = conv.customerId === user.uid;
    const otherUnread = isCustomer
      ? conv.unreadProviderCount
      : conv.unreadCustomerCount;
    const otherSeenMs = isCustomer
      ? (conv.providerLastSeenAt?.toMillis?.() ?? 0)
      : (conv.customerLastSeenAt?.toMillis?.() ?? 0);
    const msgMs = msg.createdAt?.toMillis?.() ?? 0;
    if (!msgMs) return false;
    return otherUnread === 0 && otherSeenMs >= msgMs;
  };

  function stripPostUrls(raw: string): string {
    return raw
      .replace(/https?:\/\/[^\s]*[?&]post=[a-zA-Z0-9_-]+[^\s]*/gi, '')
      .trim();
  }

  // Extract ?post= links cleanly so Preview + Link render ABOVE and typed message BELOW
  const renderMessageText = (rawText: string, isMine: boolean) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const tokens = rawText.split(urlRegex);
    const postCards: { url: string; postId: string }[] = [];
    const remainingTokens: string[] = [];

    for (const token of tokens) {
      if (/^https?:\/\//i.test(token)) {
        let postId: string | null = null;
        try {
          const parsed = new URL(token);
          postId = parsed.searchParams.get('post');
        } catch {
          const match = token.match(/[?&]post=([a-zA-Z0-9_-]+)/);
          postId = match ? match[1] : null;
        }
        if (postId) {
          postCards.push({ url: token, postId });
          continue;
        }
      }
      remainingTokens.push(token);
    }

    const bodyText = remainingTokens.join('').replace(/^\s*\n+/, '').trim();

    return (
      <div className="space-y-2">
        {/* TOP: Linked Post Preview + URL */}
        {postCards.map(({ url, postId }, idx) => {
          const linkedListing = providerMap.get(postId);
          const thumb =
            linkedListing?.profilePhotoUrl ||
            linkedListing?.galleryUrls?.[0] ||
            (selectedConversation?.providerId === postId
              ? selectedConversation.providerPhotoUrl || ''
              : '');
          const title =
            linkedListing?.businessName ||
            (selectedConversation?.providerId === postId
              ? selectedConversation.providerName
              : '') ||
            (language === 'bn' ? 'পোস্টের বিস্তারিত' : 'Listing Preview');
          const rate =
            linkedListing?.startingRate ||
            (selectedConversation?.providerId === postId
              ? selectedConversation.providerRate
              : '');
          const loc = linkedListing
            ? `${linkedListing.upazila}, ${linkedListing.district}`
            : selectedConversation?.providerId === postId
              ? selectedConversation.providerLocation || ''
              : '';

          return (
            <div
              key={`${postId}-${idx}`}
              className={`overflow-hidden rounded-lg border text-left ${
                isMine
                  ? 'border-white/25 bg-white/10 text-white'
                  : 'border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5 p-2">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                  <SafeImage
                    src={thumb}
                    alt={title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{title}</p>
                  {rate && (
                    <p
                      className={`truncate text-[11px] font-semibold ${
                        isMine
                          ? 'text-blue-100'
                          : 'text-[#2563EB] dark:text-blue-400'
                      }`}
                    >
                      {rate}
                    </p>
                  )}
                  {loc && (
                    <p
                      className={`truncate text-[11px] ${
                        isMine
                          ? 'text-blue-100/80'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {loc}
                    </p>
                  )}
                </div>
              </div>
              <div
                className={`flex items-center justify-between gap-2 border-t px-2.5 py-1.5 text-[11px] ${
                  isMine
                    ? 'border-white/15 bg-black/10'
                    : 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60'
                }`}
              >
                <span className="truncate opacity-80">{url}</span>
                {onViewProvider && (
                  <button
                    type="button"
                    onClick={() => onViewProvider(postId)}
                    className={`inline-flex shrink-0 cursor-pointer items-center gap-1 rounded px-2 py-0.5 font-bold ${
                      isMine
                        ? 'bg-white text-[#2563EB] hover:bg-blue-50'
                        : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                    }`}
                  >
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    <span>{language === 'bn' ? 'পোস্ট দেখুন' : 'View'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* BOTTOM: User's Typed Message Text */}
        {bodyText && (
          <div className="whitespace-pre-wrap leading-relaxed break-words">
            {bodyText.split(urlRegex).map((part, idx) =>
              /^https?:\/\//i.test(part) ? (
                <a
                  key={idx}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`underline ${
                    isMine
                      ? 'text-blue-100'
                      : 'text-[#2563EB] dark:text-blue-400'
                  }`}
                >
                  {part}
                </a>
              ) : (
                <span key={idx}>{part}</span>
              )
            )}
          </div>
        )}
      </div>
    );
  };

  const activePhoto =
    activeListing?.profilePhotoUrl ||
    activeListing?.galleryUrls?.[0] ||
    selectedConversation?.providerPhotoUrl ||
    '';
  const activeRate =
    activeListing?.startingRate || selectedConversation?.providerRate || '';
  const activeLocation = activeListing
    ? `${activeListing.upazila}, ${activeListing.district}`
    : selectedConversation?.providerLocation || '';
  const activePhone = activeListing?.phone?.trim() || '';
  const isViewerCustomer = selectedConversation
    ? selectedConversation.customerId === user.uid
    : true;
  const quickReplies =
    language === 'bn' ? QUICK_REPLIES_BN : QUICK_REPLIES_EN;

  const hasAnyInboxOrDraft =
    visibleConversations.length > 0 || Boolean(selectedConversation);

  return (
    <section className="min-h-[80vh] py-4 pb-20 sm:py-8 md:pb-8">
      <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-4 sm:mb-4 sm:px-0">
          <div>
            <h1 className="font-display text-xl font-bold text-slate-950 sm:text-2xl dark:text-slate-50">
              {t.chatTitle}
            </h1>
            {visibleConversations.length > 0 && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? `মোট ${localizeDigits(visibleConversations.length, language)}টি চ্যাট · ${localizeDigits(unreadInboxCount, language)}টি অপঠিত`
                  : `${visibleConversations.length} chats · ${unreadInboxCount} unread`}
              </p>
            )}
          </div>
        </div>

        {!isEmailVerified && (
          <div className="mx-4 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 sm:mx-0 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <span>{t.emailVerifyBody}</span>
            <button
              type="button"
              onClick={onOpenAuth}
              className="cursor-pointer rounded bg-[#2563EB] px-3 py-1 font-bold text-white"
            >
              {language === 'bn' ? 'ভেরিফাই করুন' : 'Verify'}
            </button>
          </div>
        )}

        {!hasAnyInboxOrDraft ? (
          <div className="border-y border-slate-200 bg-white p-8 text-center sm:rounded-lg sm:border dark:border-slate-800 dark:bg-[#111827]">
            <MessageSquare
              className="mx-auto h-10 w-10 text-[#2563EB] dark:text-blue-400"
              aria-hidden="true"
            />
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-600 dark:text-slate-400">
              {t.chatEmpty}
            </p>
            <button
              type="button"
              onClick={onBrowseProviders}
              className="mt-5 min-h-9 cursor-pointer rounded-md bg-[#2563EB] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
            >
              {t.navBrowse}
            </button>
          </div>
        ) : (
          <div className="grid min-h-[540px] grid-cols-1 overflow-hidden border-y border-slate-200 bg-white sm:rounded-lg sm:border md:h-[78vh] md:grid-cols-12 dark:border-slate-800 dark:bg-[#111827]">
            {/* Inbox Sidebar */}
            <aside
              className={`flex flex-col overflow-hidden border-b border-slate-200 md:col-span-5 md:flex md:border-r md:border-b-0 lg:col-span-4 dark:border-slate-800 ${
                selectedConversation ? 'hidden' : 'flex'
              }`}
            >
              {/* Search & Filter Tabs */}
              <div className="space-y-2 border-b border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-[#0B1120]">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={inboxSearch}
                    onChange={(e) => setInboxSearch(e.target.value)}
                    placeholder={
                      language === 'bn'
                        ? 'নাম বা পোস্ট খুঁজুন...'
                        : 'Search chats...'
                    }
                    className="h-8.5 w-full rounded-md border border-slate-200 bg-white pr-3 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#111827] dark:text-slate-100"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  {(
                    [
                      {
                        id: 'all',
                        label: language === 'bn' ? 'সব' : 'All',
                      },
                      {
                        id: 'unread',
                        label:
                          language === 'bn'
                            ? `অপঠিত (${localizeDigits(unreadInboxCount, language)})`
                            : `Unread (${unreadInboxCount})`,
                      },
                      {
                        id: 'read',
                        label: language === 'bn' ? 'পঠিত' : 'Read',
                      },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setInboxFilter(tab.id)}
                      className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                        inboxFilter === tab.id
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-white text-slate-600 hover:text-slate-900 dark:bg-[#111827] dark:text-slate-300 dark:hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 divide-y divide-slate-200 overflow-y-auto dark:divide-slate-800">
                {filteredConversations.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    {language === 'bn'
                      ? 'এই তালিকায় কোনো মেসেজ নেই।'
                      : 'No conversations match this filter.'}
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isActive = selectedConversation?.id === conv.id;
                    const isCustomer = conv.customerId === user.uid;
                    const partnerName = isCustomer
                      ? conv.providerName
                      : conv.customerName;
                    const unread = isCustomer
                      ? conv.unreadCustomerCount
                      : conv.unreadProviderCount;
                    const isUnread = unread > 0;
                    const lastFromMe = conv.lastSenderId === user.uid;
                    const seenByOther = isConvSeenByRecipient(conv);
                    const convListing = providerMap.get(conv.providerId);
                    const convThumb =
                      convListing?.profilePhotoUrl ||
                      convListing?.galleryUrls?.[0] ||
                      conv.providerPhotoUrl ||
                      '';
                    const isConfirmingDelete = confirmDeleteConvId === conv.id;

                    return (
                      <div
                        key={conv.id}
                        className={`group flex items-start gap-3 p-3.5 transition-colors ${
                          isActive
                            ? 'bg-blue-50/80 dark:bg-blue-950/40'
                            : isUnread
                              ? 'bg-blue-50/35 hover:bg-blue-50/60 dark:bg-blue-950/15 dark:hover:bg-blue-950/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmDeleteConvId(null);
                            onSelectConversation(conv.id);
                          }}
                          className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left"
                        >
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                            <SafeImage
                              src={convThumb}
                              alt={conv.providerName}
                              className="h-full w-full object-cover"
                            />
                            {isUnread && (
                              <span
                                aria-label="Unread"
                                className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full border border-white bg-[#2563EB] dark:border-slate-900"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className={`truncate text-sm ${
                                  isUnread
                                    ? 'font-extrabold text-slate-950 dark:text-white'
                                    : 'font-semibold text-slate-900 dark:text-slate-100'
                                }`}
                              >
                                {partnerName}
                              </p>
                              <span className="shrink-0 font-mono text-[11px] text-slate-400 tabular-nums">
                                {formatTime(conv.lastMessageAt)}
                              </span>
                            </div>

                            {!isCustomer && (
                              <p className="truncate text-[11px] font-medium text-[#2563EB] dark:text-blue-400">
                                {conv.providerName}
                              </p>
                            )}

                            <p
                              className={`mt-0.5 truncate text-xs ${
                                isUnread
                                  ? 'font-semibold text-slate-900 dark:text-slate-100'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {lastFromMe && conv.lastMessage
                                ? `${language === 'bn' ? 'আপনি: ' : 'You: '}${conv.lastMessage}`
                                : conv.lastMessage ||
                                  (language === 'bn'
                                    ? 'কথোপকথন শুরু করুন...'
                                    : 'Start chatting...')}
                            </p>

                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] font-semibold">
                              {isUnread ? (
                                <span className="rounded bg-[#2563EB] px-1.5 py-0.5 text-white">
                                  {language === 'bn'
                                    ? `অপঠিত (${localizeDigits(unread, language)})`
                                    : `Unread (${unread})`}
                                </span>
                              ) : (
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                  {language === 'bn' ? 'পঠিত' : 'Read'}
                                </span>
                              )}

                              {lastFromMe && (
                                <span
                                  className={`inline-flex items-center gap-0.5 ${
                                    seenByOther
                                      ? 'text-[#2563EB] dark:text-blue-400'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {seenByOther ? (
                                    <>
                                      <CheckCheck className="h-3 w-3" aria-hidden="true" />
                                      <span>
                                        {language === 'bn' ? 'সিন' : 'Seen'}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-3 w-3" aria-hidden="true" />
                                      <span>
                                        {language === 'bn' ? 'আনসিন' : 'Unseen'}
                                      </span>
                                    </>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Read/Unread & Delete Controls */}
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => void handleToggleReadUnread(conv)}
                            title={
                              isUnread
                                ? language === 'bn'
                                  ? 'পঠিত করুন'
                                  : 'Mark read'
                                : language === 'bn'
                                  ? 'অপঠিত করুন'
                                  : 'Mark unread'
                            }
                            aria-label={
                              isUnread ? 'Mark as read' : 'Mark as unread'
                            }
                            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:border-[#2563EB] hover:text-[#2563EB] dark:border-slate-700 dark:bg-[#0B1120] dark:text-slate-300"
                          >
                            {isUnread ? (
                              <MailOpen className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                          </button>

                          {isConfirmingDelete ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => void handleDeleteConversation(conv)}
                                className="cursor-pointer rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-red-700"
                              >
                                {language === 'bn' ? 'মুছুন' : 'Del'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteConvId(null)}
                                className="cursor-pointer rounded border border-slate-300 px-1 py-0.5 text-[10px] text-slate-600 dark:border-slate-700 dark:text-slate-300"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteConvId(conv.id)}
                              title={
                                language === 'bn'
                                  ? 'চ্যাট ডিলিট করুন'
                                  : 'Delete chat'
                              }
                              aria-label="Delete conversation"
                              className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:bg-[#0B1120] dark:text-slate-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Right Conversation Area */}
            <div
              className={`flex-col overflow-hidden md:col-span-7 md:flex lg:col-span-8 ${
                selectedConversation ? 'flex' : 'hidden'
              }`}
            >
              {!selectedConversation ? (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-400">
                    <MessageSquare className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 font-display text-base font-bold text-slate-900 dark:text-slate-100">
                    {language === 'bn'
                      ? 'আপনার মেসেজ ইনবক্স'
                      : 'Your Message Inbox'}
                  </h2>
                  <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {language === 'bn'
                      ? 'যেকোনো চ্যাট দেখতে তালিকা থেকে প্রেরক বা পোস্ট নির্বাচন করুন।'
                      : 'Select any sender or listing from your inbox to read and reply.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Conversation Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2.5 sm:px-4 dark:border-slate-800">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          onClearDraftAttachment(selectedConversation.id);
                          onSelectConversation(null);
                        }}
                        aria-label={
                          language === 'bn' ? 'ইনবক্সে ফিরুন' : 'Back to inbox'
                        }
                        className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-md border border-slate-200 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{language === 'bn' ? 'ইনবক্স' : 'Inbox'}</span>
                      </button>

                      <div className="min-w-0">
                        <p className="truncate font-display text-sm font-bold text-slate-950 dark:text-slate-50">
                          {isViewerCustomer
                            ? selectedConversation.providerName
                            : selectedConversation.customerName}
                        </p>
                        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {isViewerCustomer
                            ? activeLocation ||
                              (language === 'bn' ? 'সরাসরি চ্যাট' : 'Direct chat')
                            : selectedConversation.providerName}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {activePhone && (
                        <a
                          href={`tel:${activePhone}`}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <Phone
                            className="h-3.5 w-3.5 text-[#2563EB] dark:text-blue-400"
                            aria-hidden="true"
                          />
                          <span className="hidden sm:inline">{t.callNow}</span>
                        </a>
                      )}

                      {!isDraftMode && existingConversation && (
                        <button
                          type="button"
                          onClick={() =>
                            void handleToggleReadUnread(existingConversation)
                          }
                          title={
                            language === 'bn' ? 'অপঠিত করুন' : 'Mark unread'
                          }
                          className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-slate-200 px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="hidden lg:inline">
                            {language === 'bn' ? 'অপঠিত' : 'Unread'}
                          </span>
                        </button>
                      )}

                      {onViewProvider && selectedConversation.providerId && (
                        <button
                          type="button"
                          onClick={() =>
                            onViewProvider(selectedConversation.providerId)
                          }
                          className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-slate-200 px-2.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-50 dark:border-slate-700 dark:text-blue-400 dark:hover:bg-blue-950/40"
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{language === 'bn' ? 'পোস্ট' : 'Post'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Listing Context Strip */}
                  {selectedConversation.providerId && (
                    <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50/90 px-3 py-2 sm:px-4 dark:border-slate-800 dark:bg-[#0B1120]">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                        <SafeImage
                          src={activePhoto}
                          alt={selectedConversation.providerName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                          {activeListing?.businessName ||
                            selectedConversation.providerName}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                          {activeRate && (
                            <span className="font-bold text-[#2563EB] dark:text-blue-400">
                              {activeRate}
                            </span>
                          )}
                          {activeLocation && (
                            <span className="inline-flex items-center gap-0.5 text-slate-500 dark:text-slate-400">
                              <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                              <span className="truncate">{activeLocation}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setAttachPostInComposer((prev) => !prev)
                        }
                        className={`inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                          attachPostInComposer
                            ? 'bg-blue-100 text-[#2563EB] dark:bg-blue-950/70 dark:text-blue-300'
                            : 'border border-slate-200 bg-white text-slate-700 hover:border-[#2563EB] hover:text-[#2563EB] dark:border-slate-700 dark:bg-[#111827] dark:text-slate-300'
                        }`}
                      >
                        <Link2 className="h-3 w-3" aria-hidden="true" />
                        <span>
                          {attachPostInComposer
                            ? language === 'bn'
                              ? 'লিংক যুক্ত আছে'
                              : 'Link Attached'
                            : language === 'bn'
                              ? 'লিংক যুক্ত করুন'
                              : 'Attach Link'}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Messages Timeline */}
                  <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    {messagesLoading ? (
                      <div className="space-y-3 py-2">
                        <div className="sheba-shimmer h-12 w-2/3 rounded-lg" />
                        <div className="sheba-shimmer ml-auto h-10 w-1/2 rounded-lg" />
                        <div className="sheba-shimmer h-14 w-3/5 rounded-lg" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                        <p className="max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          {language === 'bn'
                            ? 'নিচ থেকে আপনার প্রশ্ন বা মেসেজ লিখে পাঠান — মেসেজ পাঠালে সাথে থাকা পোস্টের লিংক ও প্রিভিউ উপরে যাবে।'
                            : 'Write and send your message below — when attached, the post link & preview will appear above your message.'}
                        </p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isMine = msg.senderId === user.uid;
                        const seen =
                          isMine && existingConversation
                            ? isMessageSeenByRecipient(msg, existingConversation)
                            : false;
                        const confirmingMsgDel = confirmDeleteMsgId === msg.id;

                        const currentDateLabel = formatDateGroup(msg.createdAt);
                        const prevDateLabel =
                          idx > 0
                            ? formatDateGroup(messages[idx - 1].createdAt)
                            : '';
                        const showDateHeader =
                          currentDateLabel && currentDateLabel !== prevDateLabel;

                        return (
                          <div key={msg.id} className="space-y-3">
                            {showDateHeader && (
                              <div className="flex items-center justify-center py-1">
                                <span className="rounded bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                  {currentDateLabel}
                                </span>
                              </div>
                            )}

                            <div
                              className={`flex flex-col ${
                                isMine ? 'items-end' : 'items-start'
                              }`}
                            >
                              <div
                                className={`max-w-[85%] rounded-lg px-3.5 py-2 text-sm sm:max-w-[75%] ${
                                  isMine
                                    ? 'bg-[#2563EB] text-white'
                                    : 'border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-800 dark:bg-[#0B1120] dark:text-slate-100'
                                }`}
                              >
                                {msg.imageUrl && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setLightboxUrl(msg.imageUrl || null)
                                    }
                                    className="mb-2 block cursor-zoom-in overflow-hidden rounded-md"
                                  >
                                    <SafeImage
                                      src={msg.imageUrl}
                                      alt="Chat attachment"
                                      className="max-h-60 w-auto object-cover"
                                    />
                                  </button>
                                )}
                                {msg.text && renderMessageText(msg.text, isMine)}
                              </div>

                              <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                                <span className="font-mono tabular-nums">
                                  {formatTime(msg.createdAt)}
                                </span>

                                {isMine && (
                                  <span
                                    className={`inline-flex items-center gap-0.5 font-semibold ${
                                      seen
                                        ? 'text-[#2563EB] dark:text-blue-400'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    {seen ? (
                                      <>
                                        <CheckCheck
                                          className="h-3 w-3"
                                          aria-hidden="true"
                                        />
                                        <span>
                                          {language === 'bn' ? 'সিন' : 'Seen'}
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <Check
                                          className="h-3 w-3"
                                          aria-hidden="true"
                                        />
                                        <span>
                                          {language === 'bn' ? 'আনসিন' : 'Unseen'}
                                        </span>
                                      </>
                                    )}
                                  </span>
                                )}

                                {stripPostUrls(msg.text) && (
                                  <button
                                    type="button"
                                    onClick={() => void handleCopyMessage(msg)}
                                    title={language === 'bn' ? 'কপি' : 'Copy'}
                                    aria-label="Copy message"
                                    className="inline-flex cursor-pointer items-center gap-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                  >
                                    <Copy className="h-2.5 w-2.5" aria-hidden="true" />
                                    {copiedMsgId === msg.id && (
                                      <span className="text-[9px] text-emerald-500">
                                        {language === 'bn' ? 'কপি' : 'Copied'}
                                      </span>
                                    )}
                                  </button>
                                )}

                                {isMine &&
                                  (confirmingMsgDel ? (
                                    <span className="inline-flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void handleDeleteMessage(msg)
                                        }
                                        className="cursor-pointer font-bold text-red-600 hover:underline dark:text-red-400"
                                      >
                                        {language === 'bn' ? 'মুছুন' : 'Delete'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setConfirmDeleteMsgId(null)
                                        }
                                        className="cursor-pointer text-slate-500"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setConfirmDeleteMsgId(msg.id)
                                      }
                                      title={
                                        language === 'bn'
                                          ? 'মেসেজ ডিলিট করুন'
                                          : 'Delete message'
                                      }
                                      aria-label="Delete message"
                                      className="cursor-pointer text-slate-400 hover:text-red-500"
                                    >
                                      <Trash2
                                        className="h-3 w-3"
                                        aria-hidden="true"
                                      />
                                    </button>
                                  ))}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {errorMsg && (
                    <div className="mx-4 mb-2 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="flex-1">{errorMsg}</span>
                      <button
                        type="button"
                        onClick={() => setErrorMsg('')}
                        className="cursor-pointer p-0.5"
                        aria-label="Close error"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  )}

                  {/* Staged Listing Link Preview (Sends ONLY when user types & clicks Send) */}
                  {attachPostInComposer && selectedConversation.providerId && (
                    <div className="mx-3 mb-2 flex items-center gap-2.5 rounded-lg border border-blue-200 bg-blue-50/70 p-2 sm:mx-4 dark:border-blue-900/70 dark:bg-blue-950/30">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                        <SafeImage
                          src={activePhoto}
                          alt={selectedConversation.providerName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-bold text-slate-900 dark:text-slate-100">
                          {activeListing?.businessName ||
                            selectedConversation.providerName}
                          {activeRate ? ` · ${activeRate}` : ''}
                        </p>
                        <p className="truncate text-[10px] text-[#2563EB] dark:text-blue-300">
                          {language === 'bn'
                            ? 'মেসেজ পাঠালে এই লিংক ও প্রিভিউ উপরে যাবে'
                            : 'Post link & preview will appear above your message'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachPostInComposer(false);
                          onClearDraftAttachment(selectedConversation.id);
                        }}
                        aria-label="Remove attached post link"
                        className="cursor-pointer p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  )}

                  {/* Quick Reply Chips */}
                  {isViewerCustomer && messages.length < 2 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto px-3 pb-2 sm:px-4">
                      {quickReplies.map((phrase) => (
                        <button
                          key={phrase}
                          type="button"
                          onClick={() => handleQuickReply(phrase)}
                          className="shrink-0 cursor-pointer rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-slate-700 transition-colors hover:border-[#2563EB] hover:text-[#2563EB] dark:border-slate-700 dark:bg-[#0B1120] dark:text-slate-300"
                        >
                          {phrase}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Attached Photo Preview */}
                  {imagePreview && (
                    <div className="mx-3 mb-2 flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-2 sm:mx-4 dark:border-slate-800 dark:bg-[#0B1120]">
                      <div className="relative h-12 w-12 overflow-hidden rounded">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                        {sending && (
                          <div className="animate-paint-upload absolute inset-0 flex items-center justify-center bg-white/75 dark:bg-slate-900/75">
                            <Paintbrush className="animate-brush-float h-4 w-4 text-[#2563EB]" />
                          </div>
                        )}
                      </div>
                      <span className="flex-1 truncate text-xs text-slate-600 dark:text-slate-300">
                        {imageFile?.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="cursor-pointer p-1 text-slate-500 hover:text-slate-900"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}

                  {/* Message Composer */}
                  <form
                    onSubmit={handleSend}
                    className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-slate-800"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="chat-image-upload"
                    />
                    <label
                      htmlFor="chat-image-upload"
                      title={t.attachPhoto}
                      className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <ImagePlus className="h-4.5 w-4.5" aria-hidden="true" />
                    </label>

                    <input
                      ref={inputRef}
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={t.typeMessage}
                      className="min-h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#0B1120] dark:text-slate-100"
                    />

                    <button
                      type="submit"
                      disabled={sending || (!text.trim() && !imageFile)}
                      className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md bg-[#2563EB] px-4 py-2 text-sm font-semibold whitespace-nowrap text-white hover:bg-[#1D4ED8] disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">{t.sendMessage}</span>
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox for Chat Photos */}
      {lightboxUrl && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            aria-label="Close photo"
            className="absolute top-4 right-4 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <img
            src={lightboxUrl}
            alt="Attachment preview"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] w-auto max-w-full rounded-md object-contain"
          />
        </div>
      )}
    </section>
  );
}
