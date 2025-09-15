import { UserRepository } from './repository.js';

export class UserService {
    constructor() {
        this.userRepository = new UserRepository();
    }

    async getAllUsers(filterOptions) {
        return this.userRepository.getAllUsers(filterOptions);
    }

    async updateUserStatus(userId, status) {
        return this.userRepository.updateUserStatus(userId, status);
    }

    async getGuideProfile(userId){
        return this.userRepository.getGuideProfile(userId);
    }

    async getGuidePerformance(userId){
        return this.userRepository.getGuidePerformance(userId);
    }

    async getGuideDocuments(userId) {
        return this.userRepository.getGuideDocuments(userId);
    }
}