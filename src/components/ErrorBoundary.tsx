import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ShebaFinder ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900 dark:bg-[#090D16] dark:text-slate-100">
          <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-6 w-6 shrink-0" aria-hidden="true" />
              <h1 className="font-display text-xl font-bold text-slate-950 dark:text-slate-50">
                সাময়িক একটি ত্রুটি ঘটেছে / Something went wrong
              </h1>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              তথ্য লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে পৃষ্ঠাটি রিলোড করুন অথবা
              পুনরায় চেষ্টা করুন।
            </p>
            {this.state.errorMessage && (
              <pre className="mt-4 max-h-36 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700 dark:border-slate-800 dark:bg-[#090D16] dark:text-slate-300">
                {this.state.errorMessage}
              </pre>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>রিলোড করুন / Reload</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
