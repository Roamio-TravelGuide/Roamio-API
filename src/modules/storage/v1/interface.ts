// src/modules/storage/v1/types.ts

export type MediaType = 'image' | 'audio';

export interface IMedia {
  id: number;
  url: string;
  s3_key: string;
  media_type: MediaType;
  uploaded_by_id: number;
  file_size: bigint;
  format?: string;
  created_at: Date;
}

export interface IMediaUpload {
  file: Express.Multer.File;
  userId: number;
}

export interface IMediaResponse {
  success: boolean;
  data?: IMedia;
  error?: string;
}