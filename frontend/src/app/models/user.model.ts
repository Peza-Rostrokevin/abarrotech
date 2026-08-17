export type Role = 'admin' | 'vendedor';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  token?: string;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  inviteToken: string;
}
