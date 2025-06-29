// Filters for querying tour packages
export interface TourPackageFilters {
  status?: 'pending_approval' | 'published' | 'rejected';
  search?: string;
  location?: string; // filter by location name or ID
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// Guide's basic user information
export interface GuideUserInfo {
  id: number;
  name: string;
  email: string;
}

// Travel guide information returned with a package
export interface TravelGuideInfo {
  user: GuideUserInfo;
  years_of_experience: number;
  languages_spoken: string[];
}

// Response interface for individual media
export interface MediaItem {
  id: number;
  url: string;
  duration_seconds?: number;
  media_type: 'image' | 'video' | 'audio'; // assuming enum values
  uploaded_by_id: number;
  file_size?: number;
  format?: string;
}

// Response interface for individual tour stop
export interface TourStopResponse {
  id: number;
  sequence_no: number;
  stop_name: string;
  description?: string | null;
  location_id?: number | null;
  media: MediaItem[];
}

// Main tour package response object
export interface TourPackageResponse {
  id: number;
  title: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  status: 'pending_approval' | 'published' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  guide_id: number;
  guide?: TravelGuideInfo;
  tour_stops?: TourStopResponse[]; // optional, only if populated
}

// Paginated response for tour package list
export interface TourPackagesListResponse {
  packages: TourPackageResponse[];
  total: number;
  page: number;
  limit: number;
}

// Statistics object for dashboard views, etc.
export interface TourPackageStatistics {
  pending: number;
  published: number;
  rejected: number;
  total: number;
}

// Payload for updating package status
export interface UpdateStatusRequest {
  status: 'published' | 'rejected';
  rejection_reason?: string;
}

// Payload for creating a new tour package
export interface CreateTourPackageRequest {
  title: string;
  description: string;
  price: number;
  duration_minutes: number;
  guide_id: number;
}
