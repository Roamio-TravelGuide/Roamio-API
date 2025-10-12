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

    async updateProfile(userId, profileData) {
        try {
            const updatedUser = await this.userRepository.updateProfile(userId, profileData);
            return {
                success: true,
                message: "Profile updated successfully",
                data: updatedUser
            };
        } catch (error) {
            console.error("Profile update error:", error);
            throw new Error("Failed to update profile: " + error.message);
        }
    }

    async getTravelerProfile(userId){
        return this.userRepository.getTravelerProfile(userId);
    }

    async getGuidePerformance(userId){
        return this.userRepository.getGuidePerformance(userId);
    }

    async getGuideDocuments(userId) {
        return this.userRepository.getGuideDocuments(userId);
    }
}