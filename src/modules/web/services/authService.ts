// src/modules/web/services/authService.ts
import { AuthRepository } from '../repositories/authRepository';
import { ILoginRequest, ILoginResponse } from '../interface/authInterfaces';
import { comparePasswords, generateToken } from '../../../utils/index';

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  async login(loginData: ILoginRequest): Promise<ILoginResponse> {
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