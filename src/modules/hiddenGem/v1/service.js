import { hiddenGemRepository } from './repository.js';

class HiddenGemService {
    constructor() {
        this.hiddenGemRepository = hiddenGemRepository; // Fixed: should be repository, not self-instantiation
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
}

export default new HiddenGemService();