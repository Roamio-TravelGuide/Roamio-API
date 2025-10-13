import { hiddenGemRepository } from './repository.js';
import LocalFileStorage from "../../../utils/fileStorage.js";
import path from 'path';

class HiddenGemService {
    constructor() {
        this.hiddenGemRepository = hiddenGemRepository;
    }

    async getHiddenGemsByTravelerId(travelerId) {
        try {
            const hiddenPlaces = await this.hiddenGemRepository.findByTravelerId(travelerId);
            const totalCount = await this.hiddenGemRepository.countByTravelerId(travelerId);
            
            return {
                hiddenPlaces,
                totalCount
            };
        } catch (error) {
            console.error('getHiddenGemsByTravelerId service error:', error.message);
            throw error;
        }
    }

    async createNewHiddenGem({ hiddenGemData, imageFiles, userId }) {
        let hiddenGemId = null;
        let locationId = null;

        try {
            console.log('Creating new hidden gem for user:', userId);
            
            // Validate required fields
            this.validateHiddenGemData(hiddenGemData);

            // Get traveler profile (since schema requires traveler_id, not user_id)
            const traveler = await this.hiddenGemRepository.getTravelerByUserId(userId);
            const travelerId = traveler.id;

            console.log('Found traveler profile with ID:', travelerId);

            // Create initial hidden gem record
            const initialHiddenGem = await this.hiddenGemRepository.createInitialHiddenGem({
                ...hiddenGemData,
                traveler_id: travelerId
            });
            
            hiddenGemId = initialHiddenGem.id;
            locationId = initialHiddenGem.location_id;
            
            console.log('Initial hidden gem created with ID:', hiddenGemId, 'Location ID:', locationId);

            let primaryPictureId = null;

            // Handle image uploads
            if (imageFiles && imageFiles.length > 0) {
                console.log(`Processing ${imageFiles.length} images`);
                
                // Use first image as primary picture (as per schema structure)
                primaryPictureId = await this.processPrimaryImage(hiddenGemId, imageFiles[0], userId);
                
                // Update hidden gem with primary picture
                await this.hiddenGemRepository.updateHiddenGemWithPicture(hiddenGemId, primaryPictureId);
                
                // Process remaining images as additional media if needed
                if (imageFiles.length > 1) {
                    await this.processAdditionalImages(hiddenGemId, imageFiles.slice(1), userId);
                }
            }

            // Get complete hidden gem with images
            const completeHiddenGem = await this.hiddenGemRepository.getHiddenGemById(hiddenGemId);
            
            console.log('Hidden gem created successfully');
            return completeHiddenGem;

        } catch (error) {
            console.error('createNewHiddenGem service error:', error.message);
            
            // Cleanup: Delete created records if creation fails
            await this.cleanupFailedCreation(hiddenGemId, locationId);
            
            throw new Error(`Failed to create hidden gem: ${error.message}`);
        }
    }

    validateHiddenGemData(hiddenGemData) {
        const requiredFields = ['name', 'description', 'latitude', 'longitude', 'address'];
        const missingFields = requiredFields.filter(field => !hiddenGemData[field]);
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Validate coordinates
        const lat = parseFloat(hiddenGemData.latitude);
        const lng = parseFloat(hiddenGemData.longitude);
        
        if (isNaN(lat) || lat < -90 || lat > 90) {
            throw new Error('Invalid latitude value. Must be between -90 and 90.');
        }
        
        if (isNaN(lng) || lng < -180 || lng > 180) {
            throw new Error('Invalid longitude value. Must be between -180 and 180.');
        }

        // Validate name length
        if (hiddenGemData.name.length < 2 || hiddenGemData.name.length > 255) {
            throw new Error('Name must be between 2 and 255 characters.');
        }

        // Validate description length
        if (hiddenGemData.description && hiddenGemData.description.length > 1000) {
            throw new Error('Description must be less than 1000 characters.');
        }
    }

    async processPrimaryImage(hiddenGemId, imageFile, userId) {
        try {
            console.log('Processing primary image for hidden gem:', hiddenGemId);
            
            // Store image in hidden-gems folder structure
            const storageResult = await LocalFileStorage.storeHiddenGemImage(
                hiddenGemId,
                imageFile.buffer,
                imageFile.originalname
            );

            // Create media record
            const mediaRecord = await this.hiddenGemRepository.createMedia({
                url: storageResult.url,
                media_type: 'image',
                uploaded_by_id: userId,
                file_size: imageFile.size,
                format: path.extname(imageFile.originalname).replace('.', ''),
                width: null, // You can extract these with image processing libraries
                height: null,
                duration_seconds: null,
            });

            console.log('Primary image processed successfully, media ID:', mediaRecord.id);
            return mediaRecord.id;

        } catch (fileError) {
            console.error('Failed to process primary image:', fileError.message);
            throw new Error(`Failed to upload primary image: ${fileError.message}`);
        }
    }

    async processAdditionalImages(hiddenGemId, imageFiles, userId) {
        try {
            console.log(`Processing ${imageFiles.length} additional images`);
            
            for (let i = 0; i < imageFiles.length; i++) {
                const file = imageFiles[i];
                
                // Store additional images
                const storageResult = await LocalFileStorage.storeHiddenGemImage(
                    hiddenGemId,
                    file.buffer,
                    file.originalname
                );

                // Create media records for additional images
                await this.hiddenGemRepository.createMedia({
                    url: storageResult.url,
                    media_type: 'image',
                    uploaded_by_id: userId,
                    file_size: file.size,
                    format: path.extname(file.originalname).replace('.', ''),
                    width: null,
                    height: null,
                    duration_seconds: null,
                });

                console.log(`Additional image ${i + 1} processed successfully`);
            }

        } catch (fileError) {
            console.error('Failed to process additional images:', fileError.message);
            // Don't throw error for additional images - primary image is what matters
            console.warn('Additional images failed to upload, but hidden gem creation continues');
        }
    }

    async cleanupFailedCreation(hiddenGemId, locationId) {
        try {
            if (hiddenGemId) {
                // Delete hidden place record
                await prisma.hiddenPlace.deleteMany({
                    where: { id: hiddenGemId }
                });
                console.log('Cleaned up hidden place record:', hiddenGemId);
            }
            
            if (locationId) {
                // Delete location record
                await prisma.location.deleteMany({
                    where: { id: locationId }
                });
                console.log('Cleaned up location record:', locationId);
            }
            
            // Delete uploaded files
            if (hiddenGemId) {
                await LocalFileStorage.deleteHiddenGemFiles(hiddenGemId);
            }
        } catch (cleanupError) {
            console.error('Cleanup error during failed creation:', cleanupError.message);
        }
    }

    async getHiddenGemsForModeration(filters = {}) {
        try {
            const {
                status = 'pending',
                search = '',
                location = 'all',
                page = 1,
                limit = 10,
                sortBy = 'created_at',
                sortOrder = 'desc'
            } = filters;

            const result = await this.hiddenGemRepository.findForModeration({
                status,
                search,
                location,
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy,
                sortOrder
            });

            return result;
        } catch (error) {
            console.error('getHiddenGemsForModeration service error:', error.message);
            throw error;
        }
    }

    // NEW METHOD: Update hidden gem status (approve/reject)
    async updateHiddenGemStatus(hiddenGemId, statusData) {
        try {
            const { status, rejectionReason } = statusData;

            if (!['pending', 'approved', 'rejected', 'draft'].includes(status)) {
                throw new Error('Invalid status. Must be: pending, approved, rejected, or draft');
            }

            if (status === 'rejected' && !rejectionReason) {
                throw new Error('Rejection reason is required when rejecting a hidden gem');
            }

            const updatedGem = await this.hiddenGemRepository.updateStatus({
                hiddenGemId: parseInt(hiddenGemId),
                status,
                rejectionReason,
                verifiedAt: status === 'approved' ? new Date() : null
            });

            return updatedGem;
        } catch (error) {
            console.error('updateHiddenGemStatus service error:', error.message);
            throw error;
        }
    }

    // NEW METHOD: Get moderation statistics
    async getModerationStats() {
        try {
            const stats = await this.hiddenGemRepository.getModerationStats();
            return stats;
        } catch (error) {
            console.error('getModerationStats service error:', error.message);
            throw error;
        }
    }
}

export default new HiddenGemService();