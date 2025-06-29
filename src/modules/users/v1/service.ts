import { UserRepository } from './repository';
import { User, UserFilterOptions } from './interface';

export class UserService {
    private userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
    }

    public async getAllUsers(filterOptions?: UserFilterOptions): Promise<Partial<User>[]> {
        return this.userRepository.getAllUsers(filterOptions);
    }

    public async updateUserStatus(userId: number, status: 'active' | 'blocked'): Promise<void> {
        return this.userRepository.updateUserStatus(userId, status);
    }
}