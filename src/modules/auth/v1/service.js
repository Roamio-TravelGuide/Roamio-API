import { AuthRepository } from "./repository.js";
import {
  comparePasswords,
  generateToken,
  hashPassword,
} from "../../../utils/index.js";

class AuthService {
  constructor() {
    this.authRepository = new AuthRepository();
  }

  async login(loginData) {
    const user = await this.authRepository.findUserByEmail(loginData.email);

    if (!user) throw new Error("User not found");

    const isPasswordValid = await comparePasswords(
      loginData.password,
      user.password_hash
    );
    if (!isPasswordValid) throw new Error("Invalid credentials");

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile_picture_url: user.profile_picture_url,
      },
    };
  }

  async signup(userData) {
    const existingUser = await this.authRepository.findUserByEmail(
      userData.email
    );
    if (existingUser) {
      throw new Error("User already exists");
    }
    if(!userData.password){
      throw new Error('Password is required');
    }

    const hashedPassword = await hashPassword(userData.password);
    // Prepare the user data for creation
    const userToCreate = {
      ...userData,
      password_hash: hashedPassword,
    };

    // Create the user with role-specific data
    const user = await this.authRepository.createUser(userToCreate);

    // Generate token for immediate login after signup
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile_picture_url: user.profile_picture_url,
      },
    };
  }
}

export { AuthService };
