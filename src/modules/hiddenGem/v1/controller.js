import hiddenGemService from "./service.js";

class HiddenGemController {
    async getHiddenGemById(req, res) {
        try {
            const { guideId } = req.params;

            // console.log(guideId);
            
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
}

// Export the class instance
export default new HiddenGemController();