export interface User {
  name: string;
  email: string;
  userType: 1 | 2 | 3; //
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  userType: 1 | 2 | 3;
}

export interface ApiError {
  message: string;
}
