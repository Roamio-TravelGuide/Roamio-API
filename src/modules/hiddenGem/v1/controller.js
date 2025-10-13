import hiddenGemService from "./service.js";

class HiddenGemController {
    async getHiddenGemById(req, res) {
        try {
            const { guideId } = req.params;
            
            const result = await hiddenGemService.getHiddenGemsByTravelerId(guideId);
            
            res.status(200).json({
                success: true,
                data: result.hiddenPlaces,
                total: result.totalCount
            });
        } catch (error) {
            console.error('getHiddenGemById controller error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch hidden gems',
                error: error.message
            });
        }
    }

    async createNewHiddenGem(req, res) {
        try {
            console.log('Creating new hidden gem request received');
            
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }

            // Extract data from request
            const { name, description, latitude, longitude, address } = req.body;
            const imageFiles = req.files || [];

            console.log('Request data:', {
                name,
                description: description ? `${description.substring(0, 50)}...` : 'empty',
                latitude,
                longitude,
                address,
                imageCount: imageFiles.length,
                userId
            });

            // Validate required fields
            if (!name || !latitude || !longitude || !address) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: name, latitude, longitude, address'
                });
            }

            const hiddenGemData = {
                name: name.trim(),
                description: description ? description.trim() : null,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                address: address.trim()
            };

            // Call service to create hidden gem
            const result = await hiddenGemService.createNewHiddenGem({
                hiddenGemData,
                imageFiles,
                userId
            });

            res.status(201).json({
                success: true,
                message: 'Hidden gem created successfully',
                data: {
                    id: result.id,
                    title: result.title,
                    description: result.description,
                    status: result.status,
                    location: result.location,
                    picture: result.picture,
                    created_at: result.created_at,
                    traveler: {
                        id: result.traveler.id,
                        user: {
                            name: result.traveler.user.name,
                            profile_picture_url: result.traveler.user.profile_picture_url
                        }
                    }
                }
            });

        } catch (error) {
            console.error('createNewHiddenGem controller error:', error.message);
            
            const statusCode = error.message.includes('Missing required fields') || 
                             error.message.includes('Invalid') ||
                             error.message.includes('must be') ? 400 : 
                             error.message.includes('not found') ? 404 : 500;
            
            res.status(statusCode).json({
                success: false,
                message: 'Failed to create hidden gem',
                error: error.message
            });
        }
    }

     async getHiddenGemsForModeration(req, res) {
        try {
            const {
                status = 'pending',
                search = '',
                location = 'all',
                page = 1,
                limit = 10,
                sortBy = 'created_at',
                sortOrder = 'desc'
            } = req.query;

            const filters = {
                status,
                search,
                location,
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy,
                sortOrder
            };

            const result = await hiddenGemService.getHiddenGemsForModeration(filters);
            
            res.status(200).json({
                success: true,
                data: result.hiddenPlaces,
                pagination: {
                    totalCount: result.totalCount,
                    totalPages: result.totalPages,
                    currentPage: result.currentPage,
                    hasNextPage: result.hasNextPage,
                    hasPrevPage: result.hasPrevPage
                }
            });
        } catch (error) {
            console.error('getHiddenGemsForModeration controller error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch hidden gems for moderation',
                error: error.message
            });
        }
    }

    // NEW CONTROLLER: Update hidden gem status
    async updateHiddenGemStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, rejectionReason } = req.body;

            if (!id || !status) {
                return res.status(400).json({
                    success: false,
                    message: 'Hidden gem ID and status are required'
                });
            }

            const updatedGem = await hiddenGemService.updateHiddenGemStatus(id, {
                status,
                rejectionReason
            });

            res.status(200).json({
                success: true,
                message: `Hidden gem ${status} successfully`,
                data: updatedGem
            });
        } catch (error) {
            console.error('updateHiddenGemStatus controller error:', error.message);
            
            const statusCode = error.message.includes('Invalid status') || 
                             error.message.includes('Rejection reason is required') ? 400 : 500;
            
            res.status(statusCode).json({
                success: false,
                message: 'Failed to update hidden gem status',
                error: error.message
            });
        }
    }

    // NEW CONTROLLER: Get moderation statistics
    async getModerationStats(req, res) {
        try {
            const stats = await hiddenGemService.getModerationStats();
            
            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('getModerationStats controller error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch moderation statistics',
                error: error.message
            });
        }
    }
}

// Export the class instance
export default new HiddenGemController();