export interface User {
  id: number;
  role: UserRole;
  status: UserStatus;
  email: string;
  phone_no: string;
  name: string;
  registered_date: Date;
  password_hash: string;
  last_login?: Date;
  profile_picture_url?: string;
  bio?: string;
}

export type UserRole = 'admin' | 'moderator' | 'traveler' | 'travel_guide' | 'vendor';

export type UserStatus = 'pending' | 'active' | 'blocked';

export interface UserProfile extends User {
  guideProfile?: TravelGuideProfile;
  travelerProfile?: TravelerProfile;
  vendorProfile?: VendorProfile;
}

export interface TravelGuideProfile {
  id: number;
  userId: number;
  verification_documents: string[];
  years_of_experience?: number;
  languages_spoken: string[];
  packagesCount?: number;
}

export interface TravelerProfile {
  id: number;
  userId: number;
  hiddenPlacesCount?: number;
  downloadsCount?: number;
  reviewsCount?: number;
}

// Vendor Profile Interface
export interface VendorProfile {
  poisCount?: number;
  businessType?: BusinessType;
}

// Business Type Enum
export type BusinessType = 'hotel' | 'restaurant' | 'transport' | 'attraction' | 'shop' | 'other';

// User Filter Options
export interface UserFilterOptions {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'registered_date' | 'name' | 'last_login';
  sortOrder?: 'asc' | 'desc';
}






// // User Stats Interface
// export interface UserStats {
//   totalUsers: number;
//   activeUsers: number;
//   pendingUsers: number;
//   blockedUsers: number;
//   travelersCount: number;
//   guidesCount: number;
//   vendorsCount: number;
//   adminsCount: number;
//   moderatorsCount: number;
// }




