import { AuthRepository } from './repository.js';
import { comparePasswords, generateToken } from '../../../utils/index.js';

class AuthService {
  constructor() {
    this.authRepository = new AuthRepository();
  }

  async login(loginData) {
    const user = await this.authRepository.findUserByEmail(loginData.email);
    
    if (!user) throw new Error('User not found');
    
    const isPasswordValid = await comparePasswords(loginData.password, user.password_hash);
    if (!isPasswordValid) throw new Error('Invalid credentials');
    
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile_picture_url: user.profile_picture_url
      }
    };
  }
}

export { AuthService };