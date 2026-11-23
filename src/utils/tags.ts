import type { Language, ListingType, ProviderProfile } from '../types/sheba';

/**
 * Normalizes a user-typed hashtag into a clean slug-like tag without leading '#'.
 * Supports both English and Bengali Unicode characters.
 */
export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .replace(/^#+/, '')
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}_-]/gu, '')
    .toLowerCase()
    .slice(0, 32);
}

export function formatTag(tag: string): string {
  const clean = normalizeTag(tag);
  return clean ? `#${clean}` : '';
}

export const SUGGESTED_TAGS_BY_TYPE: Record<
  ListingType,
  { tag: string; labelBn: string; labelEn: string }[]
> = {
  service: [
    { tag: 'ac-repair', labelBn: '#ac-repair', labelEn: '#ac-repair' },
    { tag: 'electrician', labelBn: '#electrician', labelEn: '#electrician' },
    { tag: 'plumber', labelBn: '#plumber', labelEn: '#plumber' },
    { tag: 'home-service', labelBn: '#home-service', labelEn: '#home-service' },
    { tag: 'emergency', labelBn: '#emergency', labelEn: '#emergency' },
    { tag: 'painting', labelBn: '#painting', labelEn: '#painting' },
    { tag: 'cleaning', labelBn: '#cleaning', labelEn: '#cleaning' },
    { tag: 'verified-pro', labelBn: '#verified-pro', labelEn: '#verified-pro' },
  ],
  'house-rent': [
    { tag: 'family-flat', labelBn: '#family-flat', labelEn: '#family-flat' },
    { tag: 'bachelor', labelBn: '#bachelor', labelEn: '#bachelor' },
    { tag: 'sublet', labelBn: '#sublet', labelEn: '#sublet' },
    { tag: '2bed', labelBn: '#2bed', labelEn: '#2bed' },
    { tag: '3bed', labelBn: '#3bed', labelEn: '#3bed' },
    { tag: 'lift-gas', labelBn: '#lift-gas', labelEn: '#lift-gas' },
    { tag: 'office-space', labelBn: '#office-space', labelEn: '#office-space' },
    { tag: 'to-let', labelBn: '#to-let', labelEn: '#to-let' },
  ],
  secondhand: [
    { tag: 'used-phone', labelBn: '#used-phone', labelEn: '#used-phone' },
    { tag: 'furniture', labelBn: '#furniture', labelEn: '#furniture' },
    { tag: 'laptop', labelBn: '#laptop', labelEn: '#laptop' },
    { tag: 'fridge-ac', labelBn: '#fridge-ac', labelEn: '#fridge-ac' },
    { tag: 'bike', labelBn: '#bike', labelEn: '#bike' },
    { tag: 'like-new', labelBn: '#like-new', labelEn: '#like-new' },
    { tag: 'urgent-sell', labelBn: '#urgent-sell', labelEn: '#urgent-sell' },
    { tag: 'negotiable', labelBn: '#negotiable', labelEn: '#negotiable' },
  ],
};

/**
 * Extracts trending hashtags across all approved listings, falling back to popular defaults.
 */
export function getTrendingTags(
  posts: ProviderProfile[],
  limit = 12
): { tag: string; count: number }[] {
  const counts = new Map<string, number>();

  for (const post of posts) {
    const postTags = post.tags || [];
    for (const raw of postTags) {
      const clean = normalizeTag(raw);
      if (!clean) continue;
      counts.set(clean, (counts.get(clean) || 0) + 1);
    }
  }

  const defaults = [
    'ac-repair',
    'family-flat',
    'used-phone',
    'bachelor',
    'furniture',
    'electrician',
    'plumber',
    'sublet',
    'laptop',
    'home-service',
  ];

  for (const def of defaults) {
    if (!counts.has(def)) {
      counts.set(def, 0);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

/**
 * Finds related listings prioritizing overlapping #tags, then category, listingType, and district.
 */
export function getRelatedByTags(
  target: ProviderProfile,
  allPosts: ProviderProfile[],
  limit = 4
): { post: ProviderProfile; matchedTags: string[]; score: number }[] {
  const targetTags = new Set((target.tags || []).map(normalizeTag).filter(Boolean));
  const targetType = target.listingType || 'service';

  const scored = allPosts
    .filter((p) => p.id !== target.id && p.status === 'approved')
    .map((post) => {
      const postTags = (post.tags || []).map(normalizeTag).filter(Boolean);
      const matchedTags = postTags.filter((t) => targetTags.has(t));
      let score = matchedTags.length * 6;
      if (post.categorySlug === target.categorySlug) score += 3;
      if ((post.listingType || 'service') === targetType) score += 2;
      if (post.district === target.district) score += 1;
      return { post, matchedTags, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

/**
 * Suggests relevant #tags based on current keyword search or active listingType.
 */
export function getTagSuggestionsForQuery(
  posts: ProviderProfile[],
  queryText: string,
  listingType?: ListingType
): string[] {
  const q = normalizeTag(queryText);
  const all = new Set<string>();

  for (const p of posts) {
    if (listingType && (p.listingType || 'service') !== listingType) continue;
    for (const tag of p.tags || []) {
      const clean = normalizeTag(tag);
      if (clean) all.add(clean);
    }
  }

  const defaults = listingType
    ? SUGGESTED_TAGS_BY_TYPE[listingType].map((s) => s.tag)
    : [
        ...SUGGESTED_TAGS_BY_TYPE.service.map((s) => s.tag),
        ...SUGGESTED_TAGS_BY_TYPE['house-rent'].map((s) => s.tag),
        ...SUGGESTED_TAGS_BY_TYPE.secondhand.map((s) => s.tag),
      ];

  for (const d of defaults) all.add(d);

  const list = Array.from(all);
  if (!q) return list.slice(0, 8);
  const matched = list.filter((tag) => tag.includes(q));
  return (matched.length > 0 ? matched : list).slice(0, 8);
}

export function getListingTypeLabel(
  type: ListingType | undefined,
  lang: Language
): string {
  const resolved = type || 'service';
  if (resolved === 'house-rent') {
    return lang === 'bn' ? 'বাসা ভাড়া' : 'House Rent';
  }
  if (resolved === 'secondhand') {
    return lang === 'bn' ? 'সেকেন্ড হ্যান্ড' : 'Second-Hand';
  }
  return lang === 'bn' ? 'সেবা / সার্ভিস' : 'Service';
}
