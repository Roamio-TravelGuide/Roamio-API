export interface TourPackageFilters {
  status?: 'pending_approval' | 'published' | 'rejected';
  search?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

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
  guide?: {
    user: {
      id: number;
      name: string;
      email: string;
    };
    years_of_experience: number;
    languages_spoken: string[];
  };
}

export interface TourPackagesListResponse {
  packages: TourPackageResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface TourPackageStatistics {
  pending: number;
  published: number;
  rejected: number;
  total: number;
}

export interface UpdateStatusRequest {
  status: 'published' | 'rejected';
  rejection_reason?: string;
}

export interface CreateTourPackageRequest {
  title: string;
  description: string;
  price: number;
  duration_minutes: number;
  guide_id: number;
}