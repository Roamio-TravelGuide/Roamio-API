// src/modules/storage/v1/controller.ts
import { Request, Response } from 'express';
import { MediaService } from './service';
import { validateMediaUpload } from './validate';
import { IMediaResponse } from './interface';

export class MediaController {
  static async upload(req: Request, res: Response) {
    const validation = validateMediaUpload(req);
    
    if ('error' in validation) {
      return res.status(400).json({ 
        success: false, 
        error: validation.error 
      });
    }

    const result = await MediaService.upload(validation);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(201).json(result);
  }
}