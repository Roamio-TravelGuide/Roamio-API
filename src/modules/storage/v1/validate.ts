// src/modules/storage/v1/validate.ts
import { Request } from 'express';
import { IMediaUpload } from './interface';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'audio/mpeg'];

export function validateMediaUpload(req: Request): IMediaUpload | { error: string } {
  if (!req.file) {
    return { error: 'No file provided' };
  }

  if (!req.user?.id) {
    return { error: 'Unauthorized' };
  }

  if (req.file.size > MAX_FILE_SIZE) {
    return { error: 'File size exceeds 10MB limit' };
  }

  if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
    return { error: 'Only JPEG, PNG, and MP3 files are allowed' };
  }

  return {
    file: req.file,
    userId: req.user.id
  };
}