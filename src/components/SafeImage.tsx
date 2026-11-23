import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  eager?: boolean;
}

export function SafeImage({
  src,
  alt,
  className = '',
  fallbackTitle,
  eager = false,
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(
    () => eager || typeof IntersectionObserver === 'undefined'
  );
  const imgRef = useRef<HTMLImageElement | null>(null);
  const placeholderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHasError(false);
    setLoaded(false);
  }, [src]);

  useEffect(() => {
    if (eager || inView) return;
    const node = placeholderRef.current || imgRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: '260px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [eager, inView]);

  if (!src || hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center gap-2 bg-slate-100 p-4 text-center text-slate-400 dark:bg-slate-800 dark:text-slate-500 ${className}`}
      >
        <ImageIcon className="h-7 w-7 stroke-[1.5]" aria-hidden="true" />
        <p className="max-w-xs text-xs font-medium text-slate-600 dark:text-slate-300">
          {fallbackTitle || alt}
        </p>
      </div>
    );
  }

  if (!inView) {
    return (
      <div
        ref={placeholderRef}
        aria-label={alt}
        className={`sheba-shimmer ${className}`}
      />
    );
  }

  return (
    <>
      {!loaded && (
        <div aria-hidden="true" className={`sheba-shimmer ${className}`} />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={eager ? 'high' : 'low'}
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(true);
          setHasError(true);
        }}
        className={`${className} transition-opacity duration-200 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </>
  );
}
