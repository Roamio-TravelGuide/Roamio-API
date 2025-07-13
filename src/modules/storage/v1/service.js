import { StorageRepository } from "./repository.js";
import { generateTempId } from "../../../utils/helpers.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class StorageService {
  constructor() {
    this.repository = new StorageRepository();
  }

  // Temporary upload for cover images
  async tempCoverUpload(file, type, sessionId) {
    if (!file || !type || !sessionId)
      throw new Error("File, type and sessionId are required");

    const key = `temp/${sessionId}/cover/${Date.now()}-${file.originalname}`;
    await this.repository.uploadFile({
      file,
      key,
      contentType: file.mimetype,
    });

    return {
      tempId: generateTempId(),
      key,
      type,
      media_type: "image",
      format: file.mimetype,
      file_size: file.size,
    };
  }

  // Temporary upload for stop media
  async tempUploadMedia(file, type, sessionId, stopIndex) {
    if (!file || !type || !sessionId || stopIndex === undefined) {
      throw new Error("File, type, sessionId and stopIndex are required");
    }

    const filename = `${Date.now()}-${file.originalname}`;
    const key = `temp/${sessionId}/stop_${stopIndex}/${type}/${filename}`;

    await this.repository.uploadFile({
      file,
      key,
      contentType: file.mimetype,
    });

    return {
      tempId: generateTempId(),
      key,
      type,
      media_type: type === "stop_audio" ? "audio" : "image",
      format: file.mimetype,
      file_size: file.size,
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
      throw new Error("Invalid file references, package ID or uploader ID");
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Verify stops exist first
      const tourStops = await tx.tourStop.findMany({
        where: { package_id: parseInt(packageId) },
        orderBy: { sequence_no: "asc" },
        select: { id: true, sequence_no: true },
      });

      if (tourStops.length === 0) {
        throw new Error(
          `Cannot finalize media - no stops found for package ${packageId}`
        );
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
              media_type: ref.type === "stop_audio" ? "audio" : "image",
              duration_seconds: ref.duration_seconds || 0,
              uploaded_by_id: parseInt(uploadedById),
              file_size: ref.file_size,
              format: ref.format,
            },
          });

          // Handle cover image separately
          if (ref.type === "cover") {
            await tx.tourPackage.update({
              where: { id: parseInt(packageId) },
              data: { cover_image_id: mediaRecord.id },
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
              media_id: mediaRecord.id,
            },
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

  _getPermanentKey(fileRef, packageId) {
    if (!fileRef?.key) {
      throw new Error("Invalid file reference - missing key property");
    }

    const filename = fileRef.key.split("/").pop();
    const timestamp = Date.now();

    switch (fileRef.type) {
      case "cover":
        return `packages/${packageId}/cover/${timestamp}_${filename}`;
      case "stop_audio":
        return `packages/${packageId}/stops/${fileRef.stopIndex}/audio/${timestamp}_${filename}`;
      case "stop_image":
        return `packages/${packageId}/stops/${fileRef.stopIndex}/images/${timestamp}_${filename}`;
      default:
        throw new Error(`Invalid file type: ${fileRef.type}`);
    }
  }
  // Get all media URLs for a tour package (for moderators)
  async getTourPackageMediaUrls(packageId) {
    try {
      const package_id = parseInt(packageId);

      // Get all media associated with this tour package
      const tourPackageData = await prisma.tourPackage.findUnique({
        where: { id: package_id },
        include: {
          cover_image: true,
          tour_stops: {
            include: {
              media: {
                include: {
                  media: true,
                },
              },
            },
            orderBy: { sequence_no: "asc" },
          },
        },
      });

      if (!tourPackageData) {
        throw new Error(`Tour package with ID ${packageId} not found`);
      }

      const result = {
        cover_image: null,
        tour_stops: [],
      };

      // Add cover image if exists
      if (tourPackageData.cover_image) {
        const coverUrl = await this.getFileUrl(
          tourPackageData.cover_image.s3_key
        );
        result.cover_image = {
          id: tourPackageData.cover_image.id,
          media_type: tourPackageData.cover_image.media_type,
          url: coverUrl,
          s3_key: tourPackageData.cover_image.s3_key,
          format: tourPackageData.cover_image.format,
          file_size: tourPackageData.cover_image.file_size,
        };
      }

      // Process tour stops
      for (const stop of tourPackageData.tour_stops) {
        const stopMedia = [];

        for (const tourStopMedia of stop.media) {
          const mediaUrl = await this.getFileUrl(tourStopMedia.media.s3_key);
          stopMedia.push({
            id: tourStopMedia.media.id,
            media_type: tourStopMedia.media.media_type,
            url: mediaUrl,
            s3_key: tourStopMedia.media.s3_key,
            format: tourStopMedia.media.format,
            file_size: tourStopMedia.media.file_size,
            duration_seconds: tourStopMedia.media.duration_seconds,
            width: tourStopMedia.media.width,
            height: tourStopMedia.media.height,
          });
        }

        result.tour_stops.push({
          id: stop.id,
          sequence_no: stop.sequence_no,
          stop_name: stop.stop_name,
          description: stop.description,
          media: stopMedia,
        });
      }

      return result;
    } catch (error) {
      console.error("Error in getTourPackageMediaUrls:", error);
      throw error;
    }
  }

  // Get signed URLs for specific media files by IDs
  async getMediaUrls(mediaIds) {
    try {
      const ids = mediaIds.map((id) => parseInt(id));

      const mediaRecords = await prisma.media.findMany({
        where: {
          id: { in: ids },
        },
      });

      if (mediaRecords.length === 0) {
        throw new Error("No media found with provided IDs");
      }

      const mediaWithUrls = await Promise.all(
        mediaRecords.map(async (media) => {
          const url = await this.getFileUrl(media.s3_key);
          return {
            id: media.id,
            media_type: media.media_type,
            url: url,
            s3_key: media.s3_key,
            format: media.format,
            file_size: media.file_size,
            duration_seconds: media.duration_seconds,
          };
        })
      );
      return mediaWithUrls;
    } catch (error) {
      console.error("Error in getMediaUrls:", error);
      throw error;
    }
  }

  async deleteTempCover(key){
    try {
      // console.log(key);
      const exists = await this.repository.checkFileExists(key);
      if (!exists) {
        throw new Error('File not found');
      }
      
      await this.repository.deleteFile(key);
      
      // You might also want to clean up any database records here
      // For example:
      // await this.tempUploadRepository.deleteByKey(key);
      
      return true;
    } catch (error) {
      console.error('StorageService.deleteTempCover error:', error);
      throw error;
    }
  }

  // Add to StorageService class in service.js
async uploadVendorLogo(userId, file) {
  if (!file.mimetype.startsWith('image/')) {
    throw new Error('Only image files are allowed for logos');
  }

  const { key, url } = await this.repository.uploadVendorMedia({
    file,
    userId,
    mediaType: 'LOGO'
  });

  // Create media record
  await prisma.media.create({
    data: {
      url,
      s3_key: key,
      media_type: 'VENDOR_LOGO',
      uploaded_by_id: userId,
      file_size: file.size,
      format: file.mimetype
    }
  });

  return { logoUrl: url };
}

async uploadVendorGalleryImage(userId, file) {
  if (!file.mimetype.startsWith('image/')) {
    throw new Error('Only image files are allowed for gallery');
  }

  const { key, url } = await this.repository.uploadVendorMedia({
    file,
    userId,
    mediaType: 'GALLERY'
  });

  // Create media record
  await prisma.media.create({
    data: {
      url,
      s3_key: key,
      media_type: 'VENDOR_GALLERY',
      uploaded_by_id: userId,
      file_size: file.size,
      format: file.mimetype
    }
  });

  return { imageUrl: url, imageId: key };
}

async getVendorMediaUrls(userId) {
  const mediaRecords = await this.repository.getVendorMedia(userId);
  
  return Promise.all(
    mediaRecords.map(async (media) => ({
      ...media,
      url: await this.getFileUrl(media.s3_key)
    }))
  );
}
}
