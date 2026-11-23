import { useEffect, useState, type FormEvent } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { AlertCircle, CheckCircle2, Mail, X } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { ensureUserProfile, useApp } from '../context/AppContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type AuthTab = 'login' | 'register' | 'reset';

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { language, user, refreshAuthUser } = useApp();
  const [tab, setTab] = useState<AuthTab>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    setSuccessMsg('');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const mapAuthError = (err: unknown): string => {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/operation-not-allowed') {
      return language === 'bn'
        ? 'ইমেইল/পাসওয়ার্ড লগইন এই প্রোজেক্টে এখনো সক্রিয় করা হয়নি। দ্রুত প্রবেশ করতে Google দিয়ে সাইন ইন করুন।'
        : 'Email/Password sign-in is not enabled yet. Please use Google Sign-In.';
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return language === 'bn'
        ? 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।'
        : 'Incorrect email or password.';
    }
    if (code === 'auth/email-already-in-use') {
      return language === 'bn'
        ? 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট তৈরি করা হয়েছে।'
        : 'An account already exists with this email.';
    }
    if (code === 'auth/weak-password') {
      return language === 'bn'
        ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
        : 'Password must be at least 6 characters.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return language === 'bn'
        ? 'সাইন-ইন উইন্ডোটি বন্ধ করা হয়েছে।'
        : 'Sign-in popup was closed.';
    }
    if (code === 'auth/popup-blocked') {
      return language === 'bn'
        ? 'ব্রাউজার পপআপ ব্লক করেছে। অনুগ্রহ করে পপআপ অনুমতি দিন।'
        : 'Popup was blocked by browser. Please allow popups and try again.';
    }
    return err instanceof Error ? err.message : String(err);
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await ensureUserProfile(cred.user, language);
      onClose();
      onSuccess?.();
    } catch (err) {
      setErrorMsg(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (tab === 'login') {
        const cred = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        if (cred.user.emailVerified) {
          await ensureUserProfile(cred.user, language);
          onClose();
          onSuccess?.();
        } else {
          setSuccessMsg(
            language === 'bn'
              ? 'লগইন সফল হয়েছে। অনুগ্রহ করে আপনার ইমেইলে পাঠানো ভেরিফিকেশন লিংক যাচাই করুন।'
              : 'Signed in. Please verify your email using the link sent to your inbox.'
          );
        }
      } else if (tab === 'register') {
        if (!name.trim()) {
          setErrorMsg(
            language === 'bn'
              ? 'অনুগ্রহ করে আপনার নাম লিখুন।'
              : 'Please enter your name.'
          );
          setLoading(false);
          return;
        }
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        await updateProfile(cred.user, { displayName: name.trim() });
        await sendEmailVerification(cred.user);
        setSuccessMsg(
          language === 'bn'
            ? 'অ্যাকাউন্ট তৈরি হয়েছে! আপনার ইমেইলে ভেরিফিকেশন লিংক পাঠানো হয়েছে। লিংকটি নিশ্চিত করে "ভেরিফাই হয়েছে, রিফ্রেশ" বাটনে ক্লিক করুন।'
            : 'Account created! A verification link has been sent to your email. Click it, then click Refresh Status.'
        );
      } else {
        await sendPasswordResetEmail(auth, email.trim());
        setSuccessMsg(
          language === 'bn'
            ? 'পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।'
            : 'Password reset email sent. Check your inbox.'
        );
      }
    } catch (err) {
      setErrorMsg(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user) return;
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await sendEmailVerification(user);
      setSuccessMsg(
        language === 'bn'
          ? 'নতুন ভেরিফিকেশন ইমেইল পাঠানো হয়েছে।'
          : 'Verification email sent again.'
      );
    } catch (err) {
      setErrorMsg(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#111827]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="auth-modal-title"
              className="font-display text-xl font-bold text-slate-950 dark:text-slate-50"
            >
              {tab === 'login'
                ? language === 'bn'
                  ? 'ShebaFinder লগইন'
                  : 'Sign in to ShebaFinder'
                : tab === 'register'
                  ? language === 'bn'
                    ? 'নতুন অ্যাকাউন্ট তৈরি'
                    : 'Create Free Account'
                  : language === 'bn'
                    ? 'পাসওয়ার্ড পুনরুদ্ধার'
                    : 'Reset Password'}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {language === 'bn'
                ? 'সবাই বিনামূল্যে সেবা, বাসা ভাড়া ও পণ্যের বিজ্ঞাপন দিতে পারবেন'
                : 'One free account to browse, message, and post any listing'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {user && !user.emailVerified && (
          <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3.5 text-xs dark:border-amber-800 dark:bg-amber-950/30">
            <p className="font-semibold text-amber-900 dark:text-amber-300">
              {language === 'bn'
                ? 'আপনার ইমেইল ভেরিফিকেশন বাকি আছে'
                : 'Email verification pending'}
            </p>
            <p className="mt-1 leading-relaxed text-amber-800 dark:text-amber-200">
              {user.email}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleResendVerification()}
                disabled={loading}
                className="cursor-pointer rounded-md border border-amber-400 bg-white px-2.5 py-1.5 font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-slate-900 dark:text-amber-200"
              >
                {language === 'bn' ? 'লিংক আবার পাঠান' : 'Resend Link'}
              </button>
              <button
                type="button"
                onClick={() => {
                  void refreshAuthUser().then(async () => {
                    if (auth.currentUser?.emailVerified) {
                      await ensureUserProfile(auth.currentUser, language);
                      onClose();
                      onSuccess?.();
                    }
                  });
                }}
                className="cursor-pointer rounded-md bg-[#2563EB] px-2.5 py-1.5 font-semibold text-white hover:bg-[#1D4ED8]"
              >
                {language === 'bn' ? 'ভেরিফাই হয়েছে, রিফ্রেশ' : 'Refresh Status'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-5">
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleGoogleSignIn()}
            className="flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:bg-[#0B1120] dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <Mail className="h-4 w-4 text-[#2563EB] dark:text-blue-400" aria-hidden="true" />
            <span>
              {language === 'bn'
                ? 'Google অ্যাকাউন্ট দিয়ে দ্রুত প্রবেশ করুন'
                : 'Continue with Google'}
            </span>
          </button>
        </div>

        <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <span>{language === 'bn' ? 'অথবা ইমেইল দিয়ে' : 'or with email'}</span>
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="mb-4 flex rounded-md border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-[#0B1120]">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`min-h-8 flex-1 cursor-pointer rounded text-xs font-semibold transition-colors ${
              tab === 'login'
                ? 'bg-white text-slate-950 shadow-xs dark:bg-[#111827] dark:text-slate-50'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {language === 'bn' ? 'লগইন' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`min-h-8 flex-1 cursor-pointer rounded text-xs font-semibold transition-colors ${
              tab === 'register'
                ? 'bg-white text-slate-950 shadow-xs dark:bg-[#111827] dark:text-slate-50'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {language === 'bn' ? 'নিবন্ধন' : 'Register'}
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3.5 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3.5 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'register' && (
            <div>
              <label
                htmlFor="auth-name"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {language === 'bn' ? 'আপনার পুরো নাম' : 'Full Name'}
              </label>
              <input
                id="auth-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#0B1120] dark:text-slate-100"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {language === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'}
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#0B1120] dark:text-slate-100"
            />
          </div>

          {tab !== 'reset' && (
            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#0B1120] dark:text-slate-100"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="min-h-10 w-full cursor-pointer rounded-md bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-60"
          >
            {loading
              ? language === 'bn'
                ? 'অপেক্ষা করুন...'
                : 'Please wait...'
              : tab === 'login'
                ? language === 'bn'
                  ? 'লগইন করুন'
                  : 'Sign In'
                : tab === 'register'
                  ? language === 'bn'
                    ? 'অ্যাকাউন্ট তৈরি করুন'
                    : 'Create Account'
                  : language === 'bn'
                    ? 'রিসেট লিংক পাঠান'
                    : 'Send Reset Link'}
          </button>

          <div className="flex justify-between pt-1 text-xs">
            {tab === 'login' ? (
              <button
                type="button"
                onClick={() => {
                  setTab('reset');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="cursor-pointer font-medium text-[#2563EB] hover:underline dark:text-blue-400"
              >
                {language === 'bn'
                  ? 'পাসওয়ার্ড ভুলে গেছেন?'
                  : 'Forgot password?'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="cursor-pointer font-medium text-[#2563EB] hover:underline dark:text-blue-400"
              >
                {language === 'bn'
                  ? 'লগইনে ফিরে যান'
                  : 'Back to Sign In'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
