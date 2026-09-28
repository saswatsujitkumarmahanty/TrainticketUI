export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}
 
export interface LoginRequest {
  email: string;
  password: string;
}
 
export interface AuthResponse {
  token: string;
  expiresAtUtc: string;
  fullName: string;
  email: string;
}