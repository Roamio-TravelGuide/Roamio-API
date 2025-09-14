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
}

// Export the class instance
export default new HiddenGemController();