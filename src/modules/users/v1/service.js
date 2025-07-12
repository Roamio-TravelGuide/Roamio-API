import { UserRepository } from './repository';

class UserService {
    constructor() {
        this.userRepository = new UserRepository();
    }

    async getAllUsers(filterOptions) {
        return this.userRepository.getAllUsers(filterOptions);
    }

    async updateUserStatus(userId, status) {
        return this.userRepository.updateUserStatus(userId, status);
    }
}

module.exports = { UserService };