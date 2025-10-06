import { TravellerRepository } from "./repository.js";

export class TravellerService {
  constructor() {
    this.travellerRepository = new TravellerRepository();
  }

  async getMyTrips(travelerId) {
    return await this.travellerRepository.getPackagesForTraveler(travelerId);
  }
}