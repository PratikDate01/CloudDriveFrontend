const API_BASE_URL = (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:4000/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profile_exists?: boolean;
  };
  error?: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profile?: any;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Login
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const raw = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    // Normalize user keys if present
    if (raw.user) {
      raw.user = {
        id: (raw.user as any).id,
        email: (raw.user as any).email,
        firstName: (raw.user as any).first_name,
        lastName: (raw.user as any).last_name,
      } as any;
    }
    return raw;
  }

  // Register
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const raw = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (raw.user) {
      raw.user = {
        id: (raw.user as any).id,
        email: (raw.user as any).email,
        firstName: (raw.user as any).first_name,
        lastName: (raw.user as any).last_name,
      } as any;
    }
    return raw;
  }

  // Get currently logged-in user
  async getCurrentUser(): Promise<{ success: boolean; user: User }> {
    const raw = await this.request<{ success: boolean; user: any }>('/auth/me');
    // Normalize snake_case from backend to camelCase for frontend consistency
    const u = raw.user;
    const user: User = {
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      profile: u.profile,
    };
    return { success: raw.success, user };
  }

  // Logout
  async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth');
  }

  // Set token
  setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth', 'true');
  }

  // Clear token
  clearAuthToken(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth');
  }

  // Check authentication
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  // Google OAuth login
  async googleLogin(): Promise<AuthResponse> {
    try {
      const response = await this.request<AuthResponse>('/auth/google', {
        method: 'GET',
      });
      if (response.token) {
        this.setAuthToken(response.token);
      }
      return response;
    } catch (error: any) {
      console.error('Google login failed:', error);
      return { success: false, message: 'Google login failed', error: error.message };
    }
  }
}

export const apiService = new ApiService();
