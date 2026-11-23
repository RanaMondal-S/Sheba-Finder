interface CardSkeletonGridProps {
  variant?: 'horizontal' | 'grid';
  count?: number;
  className?: string;
}

export function CardSkeletonGrid({
  variant = 'horizontal',
  count = 6,
  className,
}: CardSkeletonGridProps) {
  const items = Array.from({ length: count }, (_, idx) => idx);

  if (variant === 'grid') {
    return (
      <div
        aria-busy="true"
        className={
          className ||
          'grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
        }
      >
        {items.map((idx) => (
          <div
            key={idx}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-[#111827]"
          >
            <div className="sheba-shimmer aspect-[4/3] w-full" />
            <div className="space-y-2 p-2.5 sm:p-3">
              <div className="sheba-shimmer h-2.5 w-16 rounded" />
              <div className="sheba-shimmer h-3.5 w-5/6 rounded" />
              <div className="sheba-shimmer h-3.5 w-2/3 rounded" />
              <div className="sheba-shimmer h-4 w-24 rounded" />
              <div className="flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                <div className="sheba-shimmer h-2.5 w-14 rounded" />
                <div className="sheba-shimmer h-5 w-12 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      aria-busy="true"
      className={
        className || 'grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'
      }
    >
      {items.map((idx) => (
        <div
          key={idx}
          className="flex items-stretch gap-3 rounded-lg border border-slate-200 bg-white p-2.5 shadow-xs sm:p-3 dark:border-slate-800 dark:bg-[#111827]"
        >
          <div className="sheba-shimmer h-24 w-24 shrink-0 rounded-md sm:h-26 sm:w-26" />
          <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
            <div className="space-y-2">
              <div className="sheba-shimmer h-2.5 w-28 rounded" />
              <div className="sheba-shimmer h-4 w-4/5 rounded" />
              <div className="sheba-shimmer h-3.5 w-24 rounded" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="sheba-shimmer h-2.5 w-20 rounded" />
              <div className="sheba-shimmer h-5 w-14 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileDetailSkeleton() {
  return (
    <div
      aria-busy="true"
      className="mx-auto max-w-6xl space-y-5 px-3 py-5 sm:px-6 lg:px-8"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="sheba-shimmer aspect-[4/3] w-full rounded-lg lg:col-span-6" />
        <div className="space-y-3 lg:col-span-6">
          <div className="sheba-shimmer h-4 w-32 rounded" />
          <div className="sheba-shimmer h-8 w-4/5 rounded" />
          <div className="sheba-shimmer h-4 w-48 rounded" />
          <div className="sheba-shimmer h-7 w-36 rounded" />
          <div className="space-y-2 pt-3">
            <div className="sheba-shimmer h-3.5 w-full rounded" />
            <div className="sheba-shimmer h-3.5 w-5/6 rounded" />
            <div className="sheba-shimmer h-3.5 w-2/3 rounded" />
          </div>
          <div className="flex gap-2.5 pt-4">
            <div className="sheba-shimmer h-11 flex-1 rounded-md" />
            <div className="sheba-shimmer h-11 w-28 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatInboxSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div aria-busy="true" className="divide-y divide-slate-200 dark:divide-slate-800">
      {Array.from({ length: count }, (_, idx) => (
        <div key={idx} className="flex items-center gap-3 p-3.5">
          <div className="sheba-shimmer h-11 w-11 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="sheba-shimmer h-3.5 w-32 rounded" />
              <div className="sheba-shimmer h-2.5 w-12 rounded" />
            </div>
            <div className="sheba-shimmer h-3 w-3/4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
