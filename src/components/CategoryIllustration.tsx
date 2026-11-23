interface CategoryIllustrationProps {
  slug: string;
  className?: string;
}

/**
 * Custom crisp multi-tone SVG illustrations for every marketplace category.
 * Fast inline vectors with zero external image round-trips.
 */
export function CategoryIllustration({
  slug,
  className = 'h-11 w-11',
}: CategoryIllustrationProps) {
  switch (slug) {
    case 'electrician':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <rect x="6" y="6" width="36" height="36" rx="8" fill="#EFF6FF" />
          <path
            d="M27 10L15 26H24L21 38L33 22H24L27 10Z"
            fill="#2563EB"
            stroke="#1E40AF"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="36" cy="14" r="2.5" fill="#F59E0B" />
        </svg>
      );

    case 'ac-technician':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <rect x="6" y="10" width="36" height="16" rx="4" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.8" />
          <rect x="11" y="20" width="26" height="2.5" rx="1.2" fill="#1D4ED8" />
          <circle cx="36" cy="15" r="1.5" fill="#10B981" />
          <path d="M15 31C15 34 13 36 15 38" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
          <path d="M24 31C24 34 22 36 24 38" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
          <path d="M33 31C33 34 31 36 33 38" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'plumber':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path d="M10 18H26C28.5 18 30 19.5 30 22V28" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" />
          <rect x="8" y="14" width="5" height="8" rx="1.5" fill="#1E40AF" />
          <rect x="26" y="27" width="8" height="4" rx="1.5" fill="#1E40AF" />
          <path d="M18 12H24" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
          <path d="M21 12V16" stroke="#1E40AF" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M30 34C30 34 33.5 37.5 33.5 39.5C33.5 41.4 31.9 43 30 43C28.1 43 26.5 41.4 26.5 39.5C26.5 37.5 30 34 30 34Z" fill="#38BDF8" />
        </svg>
      );

    case 'painter':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <rect x="9" y="10" width="24" height="10" rx="3" fill="#2563EB" />
          <path d="M33 15H37C38.5 15 39 16 39 17.5V21C39 22.5 38 23.5 36.5 23.5H24V28" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />
          <rect x="21" y="28" width="6" height="11" rx="2" fill="#1E293B" />
          <rect x="13" y="12" width="16" height="2.5" rx="1.2" fill="#93C5FD" />
        </svg>
      );

    case 'mechanic':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <circle cx="24" cy="24" r="13" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2.2" />
          <circle cx="24" cy="24" r="5" fill="#DBEAFE" stroke="#1E40AF" strokeWidth="1.8" />
          <path d="M16 14L32 34" stroke="#3B82F6" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M32 14L16 34" stroke="#64748B" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );

    case 'cleaner':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path d="M27 10L21 25" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
          <path d="M15 24L27 28L23 39L10 34L15 24Z" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M34 14L35.5 17.5L39 19L35.5 20.5L34 24L32.5 20.5L29 19L32.5 17.5L34 14Z" fill="#F59E0B" />
          <circle cx="35" cy="31" r="2" fill="#60A5FA" />
        </svg>
      );

    case 'computer-tech':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <rect x="9" y="11" width="30" height="20" rx="3" fill="#1E293B" stroke="#2563EB" strokeWidth="2" />
          <rect x="13" y="15" width="22" height="12" rx="1.5" fill="#DBEAFE" />
          <path d="M5 34H43L40 37H8L5 34Z" fill="#64748B" />
          <path d="M20 21L23 23.5L28 18.5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'tutor':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path d="M8 14C8 12.5 9.2 11.5 10.7 11.8L24 14.5V37L10.2 34.3C9 34 8 33 8 31.7V14Z" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.8" />
          <path d="M40 14C40 12.5 38.8 11.5 37.3 11.8L24 14.5V37L37.8 34.3C39 34 40 33 40 31.7V14Z" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.8" />
          <path d="M13 19H20M13 24H19M28 19H35M28 24H34" stroke="#1E40AF" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case 'construction':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <rect x="8" y="28" width="14" height="8" rx="1.5" fill="#93C5FD" stroke="#2563EB" strokeWidth="1.5" />
          <rect x="24" y="28" width="16" height="8" rx="1.5" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
          <rect x="14" y="19" width="18" height="8" rx="1.5" fill="#3B82F6" stroke="#1E40AF" strokeWidth="1.5" />
          <path d="M20 11H28L26 17H22L20 11Z" fill="#F59E0B" />
        </svg>
      );

    case 'carpenter':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path d="M12 31L31 12L36 17L17 36L12 31Z" fill="#CBD5E1" stroke="#334155" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M31 12L34 9C35.5 7.5 37.5 8 38.5 9.5C39.5 11 39 13 37.5 14.5L36 17" fill="#2563EB" />
          <rect x="11" y="32" width="26" height="5" rx="1.5" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
        </svg>
      );

    case 'appliance-repair':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <rect x="13" y="8" width="22" height="32" rx="3" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2" />
          <line x1="13" y1="21" x2="35" y2="21" stroke="#2563EB" strokeWidth="1.8" />
          <line x1="18" y1="13" x2="18" y2="17" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" />
          <line x1="18" y1="25" x2="18" y2="32" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'pest-control':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path d="M24 9L37 14V24C37 31.5 31.4 37.5 24 40C16.6 37.5 11 31.5 11 24V14L24 9Z" fill="#DBEAFE" stroke="#2563EB" strokeWidth="2" strokeLinejoin="round" />
          <path d="M19 24L22.5 27.5L30 20" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'house-rent-family':
    case 'house-rent-sublet':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path d="M8 23L24 10L40 23" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13 20V37H35V20" fill="#EFF6FF" stroke="#1E40AF" strokeWidth="2" strokeLinejoin="round" />
          <rect x="20" y="26" width="8" height="11" rx="1" fill="#2563EB" />
        </svg>
      );

    case 'house-rent-bachelor':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <rect x="9" y="13" width="30" height="24" rx="3" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2" />
          <path d="M14 29H34" stroke="#1E40AF" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="14" y="21" width="9" height="6" rx="1.5" fill="#93C5FD" />
          <rect x="25" y="21" width="9" height="6" rx="1.5" fill="#2563EB" />
        </svg>
      );

    case 'house-rent-office':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <rect x="12" y="9" width="24" height="30" rx="2" fill="#DBEAFE" stroke="#2563EB" strokeWidth="2" />
          <rect x="17" y="14" width="5" height="4" rx="0.8" fill="#1D4ED8" />
          <rect x="26" y="14" width="5" height="4" rx="0.8" fill="#1D4ED8" />
          <rect x="17" y="22" width="5" height="4" rx="0.8" fill="#1D4ED8" />
          <rect x="26" y="22" width="5" height="4" rx="0.8" fill="#1D4ED8" />
          <rect x="21" y="31" width="6" height="8" fill="#1E293B" />
        </svg>
      );

    case 'secondhand-electronics':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <rect x="15" y="8" width="18" height="32" rx="3.5" fill="#1E293B" stroke="#2563EB" strokeWidth="2" />
          <rect x="18" y="12" width="12" height="21" rx="1.5" fill="#DBEAFE" />
          <circle cx="24" cy="36.5" r="1.4" fill="#60A5FA" />
        </svg>
      );

    case 'secondhand-furniture':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <path d="M12 22C12 16.5 16 14 24 14C32 14 36 16.5 36 22V28H12V22Z" fill="#DBEAFE" stroke="#2563EB" strokeWidth="2" />
          <rect x="9" y="23" width="30" height="8" rx="2.5" fill="#2563EB" />
          <line x1="14" y1="31" x2="14" y2="37" stroke="#1E40AF" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="34" y1="31" x2="34" y2="37" stroke="#1E40AF" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'secondhand-appliances':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <rect x="8" y="11" width="32" height="21" rx="3" fill="#1E293B" stroke="#2563EB" strokeWidth="2" />
          <rect x="12" y="15" width="24" height="13" rx="1.5" fill="#DBEAFE" />
          <path d="M24 32V37M17 37H31" stroke="#475569" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );

    case 'secondhand-vehicles':
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <circle cx="14" cy="31" r="6" fill="#EFF6FF" stroke="#1E40AF" strokeWidth="2.2" />
          <circle cx="34" cy="31" r="6" fill="#EFF6FF" stroke="#1E40AF" strokeWidth="2.2" />
          <path d="M14 31L21 20H29L34 31M21 20L18 15H15M29 20L32 15H35" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'service-others':
    case 'house-rent-others':
    case 'secondhand-others':
    default:
      return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="3" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.8" />
          <rect x="26" y="9" width="13" height="13" rx="3" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.8" />
          <rect x="9" y="26" width="13" height="13" rx="3" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.8" />
          <rect x="26" y="26" width="13" height="13" rx="3" fill="#2563EB" />
          <path d="M32.5 29.5V35.5M29.5 32.5H35.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
}
