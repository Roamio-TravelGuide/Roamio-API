import { StorageRepository } from './repository.js';
import { generateTempId } from '../../../utils/helpers.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class StorageService {
  constructor() {
    this.repository = new StorageRepository();
  }

  // Temporary upload for cover images
  async tempCoverUpload(file, type, sessionId) {
    if (!file || !type || !sessionId) throw new Error('File, type and sessionId are required');

    const key = `temp/${sessionId}/cover/${Date.now()}-${file.originalname}`;
    await this.repository.uploadFile({
      file,
      key,
      contentType: file.mimetype
    });
    
    return {
      tempId: generateTempId(),
      key,
      type,
      media_type: 'image',
      format: file.mimetype,
      file_size: file.size
    };
  }

  // Temporary upload for stop media
  async tempUploadMedia(file, type, sessionId, stopIndex) {
    if (!file || !type || !sessionId || stopIndex === undefined) {
      throw new Error('File, type, sessionId and stopIndex are required');
    }

    const filename = `${Date.now()}-${file.originalname}`;
    const key = `temp/${sessionId}/stop_${stopIndex}/${type}/${filename}`;
    
    await this.repository.uploadFile({
      file,
      key,
      contentType: file.mimetype
    });
    
    return {
      tempId: generateTempId(),
      key,
      type,
      media_type: type === 'stop_audio' ? 'audio' : 'image',
      format: file.mimetype,
      file_size: file.size
    };
  }

//   async finalizeUploads(fileReferences, packageId, uploadedById) {
//     if (!fileReferences?.length || !packageId || !uploadedById) {
//       throw new Error('Invalid file references, package ID or uploader ID');
//     }

//     const results = await Promise.all(
//       fileReferences.map(async (ref) => {
//         const newKey = this._getPermanentKey(ref, packageId);
        
//         // 1. Move file in S3
//         await this.repository.moveFile(ref.key, newKey);
        
//         // 2. Create media record
//         const mediaRecord = await this.repository.createMediaRecord({
//           url: await this.repository.getSignedUrl(newKey),
//           s3_key: newKey,
//           media_type: ref.type === 'stop_audio' ? 'audio' : 'image',
//           duration_seconds: ref.duration_seconds,
//           uploaded_by_id: uploadedById,
//           file_size: ref.file_size,
//           format: ref.format
//         });

//         // 3. If this is a cover image, update the tour package
//         if (ref.type === 'cover') {
//           await prisma.tourPackage.update({
//             where: { id: parseInt(packageId) },
//             data: { cover_image_id: mediaRecord.id }
//           });
//         }

//         return {
//           ...ref,
//           permanent_url: mediaRecord.url,
//           media_id: mediaRecord.id,
//           s3Key: newKey
//         };
//       })
//     );

//   // Handle tour stop media relationships
//   const stopMedia = results.filter(r => r.type !== 'cover');
//   if (stopMedia.length > 0) {
//     await prisma.tourStopMedia.createMany({
//       data: stopMedia.map(media => ({
//         stop_id: media.stopIndex + 1,
//         media_id: media.media_id
//       })),
//       skipDuplicates: true
//     });
//   }

//   return results;
// }

// In service.js - Update finalizeUploads method
  async finalizeUploads(fileReferences, packageId, uploadedById) {
    if (!fileReferences?.length || !packageId || !uploadedById) {
      throw new Error('Invalid file references, package ID or uploader ID');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Verify stops exist first
      const tourStops = await tx.tourStop.findMany({
        where: { package_id: parseInt(packageId) },
        orderBy: { sequence_no: 'asc' },
        select: { id: true, sequence_no: true }
      });

      if (tourStops.length === 0) {
        throw new Error(`Cannot finalize media - no stops found for package ${packageId}`);
      }

      // 2. Process all files
      const results = await Promise.all(
        fileReferences.map(async (ref) => {
          const newKey = this._getPermanentKey(ref, packageId);
          
          // Move file in S3
          await this.repository.moveFile(ref.key, newKey);
          
          // Create media record
          const mediaRecord = await tx.media.create({
            data: {
              url: await this.repository.getFileUrl(newKey),
              s3_key: newKey,
              media_type: ref.type === 'stop_audio' ? 'audio' : 'image',
              duration_seconds: ref.duration_seconds || 0,
              uploaded_by_id: parseInt(uploadedById),
              file_size: ref.file_size,
              format: ref.format
            }
          });

          // Handle cover image separately
          if (ref.type === 'cover') {
            await tx.tourPackage.update({
              where: { id: parseInt(packageId) },
              data: { cover_image_id: mediaRecord.id }
            });
            return { ...ref, media_id: mediaRecord.id };
          }

          // Link media to stop
          const stopIndex = ref.stopIndex;
          if (stopIndex >= tourStops.length) {
            throw new Error(`Stop index ${stopIndex} out of range`);
          }

          await tx.tourStopMedia.create({
            data: {
              stop_id: tourStops[stopIndex].id,
              media_id: mediaRecord.id
            }
          });

          return { ...ref, media_id: mediaRecord.id };
        })
      );

      return results;
    });
  }
  // Generate pre-signed URL for viewing
  async getFileUrl(s3Key, expiresIn = 3600) {
    return this.repository.getSignedUrl(s3Key, expiresIn);
  }

  // Get signed URLs for tour package media (for moderators)
  async getTourPackageMediaUrls(packageId) {
    try {
      // Get all media for the tour package including cover image and tour stop media
      const tourPackage = await prisma.tourPackage.findUnique({
        where: { id: parseInt(packageId) },
        include: {
          cover_image: true,
          tour_stops: {
            orderBy: { sequence_no: 'asc' },
            include: {
              media: {
                include: {
                  media: true
                }
              }
            }
          }
        }
      });

      if (!tourPackage) {
        throw new Error('Tour package not found');
      }

      const mediaWithUrls = {};

      // Generate URL for cover image if it exists
      if (tourPackage.cover_image?.s3_key) {
        try {
          // Check if s3_key is valid
          if (tourPackage.cover_image.s3_key === 'undefined' || tourPackage.cover_image.s3_key === '') {
            console.warn(`Cover image ${tourPackage.cover_image.id} has invalid s3_key: "${tourPackage.cover_image.s3_key}"`);
            mediaWithUrls.cover_image = {
              ...tourPackage.cover_image,
              url: tourPackage.cover_image.url // Use existing URL
            };
          } else {
            const coverImageUrl = await this.repository.getSignedUrl(tourPackage.cover_image.s3_key, 7200); // 2 hours
            mediaWithUrls.cover_image = {
              ...tourPackage.cover_image,
              url: coverImageUrl
            };
          }
        } catch (error) {
          console.error(`Failed to generate URL for cover image: ${error.message}`);
          mediaWithUrls.cover_image = {
            ...tourPackage.cover_image,
            url: tourPackage.cover_image.url // Fallback to existing URL
          };
        }
      }

      // Generate URLs for tour stop media
      mediaWithUrls.tour_stops = await Promise.all(
        tourPackage.tour_stops.map(async (stop) => {        const mediaWithSignedUrls = await Promise.all(
          stop.media.map(async (stopMedia) => {
            try {
              // Check if s3_key is valid
              if (!stopMedia.media.s3_key || stopMedia.media.s3_key === 'undefined' || stopMedia.media.s3_key === '') {
                console.warn(`Media ${stopMedia.media.id} has invalid s3_key: "${stopMedia.media.s3_key}"`);
                return {
                  ...stopMedia.media,
                  url: stopMedia.media.url // Use existing URL (might be external URL from seed data)
                };
              }
              
              const signedUrl = await this.repository.getSignedUrl(stopMedia.media.s3_key, 7200); // 2 hours
              return {
                ...stopMedia.media,
                url: signedUrl
              };
            } catch (error) {
              console.error(`Failed to generate URL for media ${stopMedia.media.id}: ${error.message}`);
              return {
                ...stopMedia.media,
                url: stopMedia.media.url // Fallback to existing URL
              };
            }
          })
        );

          return {
            ...stop,
            media: mediaWithSignedUrls
          };
        })
      );

      return mediaWithUrls;
    } catch (error) {
      console.error('Error generating tour package media URLs:', error);
      throw new Error('Failed to retrieve tour media URLs');
    }
  }

  // Get signed URLs for specific media files
  async getMediaUrls(mediaIds) {
    try {
      const mediaRecords = await prisma.media.findMany({
        where: {
          id: {
            in: mediaIds.map(id => parseInt(id))
          }
        }
      });

      const mediaWithUrls = await Promise.all(
        mediaRecords.map(async (media) => {
          try {
            // Check if s3_key is valid
            if (!media.s3_key || media.s3_key === 'undefined' || media.s3_key === '') {
              console.warn(`Media ${media.id} has invalid s3_key: "${media.s3_key}"`);
              return {
                ...media,
                url: media.url // Use existing URL
              };
            }
            
            const signedUrl = await this.repository.getSignedUrl(media.s3_key, 3600); // 1 hour
            return {
              ...media,
              url: signedUrl
            };
          } catch (error) {
            console.error(`Failed to generate URL for media ${media.id}: ${error.message}`);
            return {
              ...media,
              url: media.url // Fallback to existing URL
            };
          }
        })
      );

      return mediaWithUrls;
    } catch (error) {
      console.error('Error generating media URLs:', error);
      throw new Error('Failed to retrieve media URLs');
    }
  }
  
  _getPermanentKey(fileRef, packageId) {
    if (!fileRef?.key) {
      throw new Error('Invalid file reference - missing key property');
    }
    
    const filename = fileRef.key.split('/').pop();
    const timestamp = Date.now();
    
    switch (fileRef.type) {
      case 'cover':
        return `packages/${packageId}/cover/${timestamp}_${filename}`;
      case 'stop_audio':
        return `packages/${packageId}/stops/${fileRef.stopIndex}/audio/${timestamp}_${filename}`;
      case 'stop_image':
        return `packages/${packageId}/stops/${fileRef.stopIndex}/images/${timestamp}_${filename}`;
      default:
        throw new Error(`Invalid file type: ${fileRef.type}`);
    }
  } 
}

