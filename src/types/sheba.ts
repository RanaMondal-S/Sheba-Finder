import type { Timestamp } from 'firebase/firestore';

export type Language = 'bn' | 'en';
export type ThemeMode = 'light' | 'dark';
export type UserRole = 'customer' | 'provider';
export type ListingType = 'service' | 'house-rent' | 'secondhand';

export type AppView =
  | 'home'
  | 'services'
  | 'browse'
  | 'house-rent'
  | 'secondhand'
  | 'provider'
  | 'chat'
  | 'favorites'
  | 'profile'
  | 'create-post'
  | 'provider-dashboard'
  | 'admin';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  role: UserRole;
  preferredLanguage?: Language;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AdminUser {
  uid: string;
  email: string;
  grantedBy?: string;
  createdAt?: Timestamp;
}

export interface ServiceCategory {
  id: string;
  slug: string;
  nameBn: string;
  nameEn: string;
  descriptionBn?: string;
  descriptionEn?: string;
  iconName?: string;
  image?: string;
  listingType?: ListingType;
  active: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface LocationEntry {
  id: string;
  divisionEn: string;
  divisionBn: string;
  districtEn: string;
  districtBn: string;
  upazilaEn: string;
  upazilaBn: string;
  active: boolean;
  createdAt?: Timestamp;
}

export type ProviderApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

export interface ProviderProfile {
  id: string;
  ownerId: string;
  listingType?: ListingType;
  businessName: string;
  ownerName: string;
  categorySlug: string;
  categoryNameBn: string;
  categoryNameEn: string;
  customCategory?: string;
  division: string;
  district: string;
  upazila: string;
  serviceAreas?: string[];
  tags?: string[];
  condition?: string;
  propertySpec?: string;
  specItems?: string[];
  addressNote?: string;
  experienceYears: number;
  bio: string;
  startingRate?: string;
  phone?: string;
  whatsapp?: string;
  profilePhotoUrl?: string;
  galleryUrls?: string[];
  status: ProviderApprovalStatus;
  verificationStatus: VerificationStatus;
  verificationNote?: string;
  isDemo: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ProviderService {
  id: string;
  providerId: string;
  ownerId: string;
  title: string;
  description: string;
  priceEstimate?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Review {
  id: string;
  providerId: string;
  authorId: string;
  authorName: string;
  rating: number;
  comment: string;
  status: 'published' | 'hidden';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Favorite {
  providerId: string;
  businessName: string;
  categoryNameBn?: string;
  categoryNameEn?: string;
  district?: string;
  createdAt?: Timestamp;
}

export interface ReportItem {
  id: string;
  providerId: string;
  providerName: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  details: string;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  adminNote?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  providerId: string;
  providerOwnerId: string;
  providerName: string;
  providerPhotoUrl?: string;
  providerRate?: string;
  providerLocation?: string;
  lastMessage: string;
  lastSenderId?: string;
  unreadCustomerCount: number;
  unreadProviderCount: number;
  customerLastSeenAt?: Timestamp;
  providerLastSeenAt?: Timestamp;
  hiddenForCustomer?: boolean;
  hiddenForProvider?: boolean;
  lastMessageAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  customerId: string;
  providerOwnerId: string;
  senderId: string;
  senderName: string;
  text: string;
  imageUrl?: string;
  createdAt?: Timestamp;
}

export interface NotificationItem {
  id: string;
  userId: string;
  titleBn: string;
  titleEn: string;
  bodyBn?: string;
  bodyEn?: string;
  type: 'message' | 'approval' | 'verification' | 'review' | 'system';
  conversationId?: string;
  providerId?: string;
  read: boolean;
  createdAt?: Timestamp;
}
