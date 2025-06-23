// src/modules/web/interface/authInterfaces.ts
import { UserRole, UserStatus } from '@prisma/client';

export interface IUser {
  id: number;
  email: string;
  phone_no: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  registered_date: Date;
  password_hash: string;
  last_login: Date | null;
  profile_picture_url: string | null;
  bio: string | null;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: UserRole;
    profile_picture_url: string | null;
  };
}