import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import Cookies from 'js-cookie';

export type UserRole = 'student' | 'alumni' | 'admin';

export interface User {
  rollNumber?: string;
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
  isApproved?: boolean;
  collegeName?: string;
  graduationYear?: number;
  company?: string;
  position?: string;
  bio?: string;
  skills?: string[];
  location?: string;
  linkedinProfile?: string;
  githubProfile?: string;
  profileImage?: string;
  resume?: string;
  applicationStatus?: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  isLoading: boolean;
  isAuthLoaded: boolean;
  updateUserContext: (updatedUserData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_COOKIE_NAME = 'alumni-portal-user';
const JWT_TOKEN_COOKIE_NAME = 'alumni-portal-jwt';
const COOKIE_EXPIRATION_DAYS = 30;

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080');

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  useEffect(() => {
    const storedUser = Cookies.get(USER_COOKIE_NAME);
    const storedToken = Cookies.get(JWT_TOKEN_COOKIE_NAME);

    if (storedUser && storedToken) {
      try {
        const userData: User = JSON.parse(storedUser);
        setUser({ ...userData, token: storedToken });
      } catch {
        Cookies.remove(USER_COOKIE_NAME);
        Cookies.remove(JWT_TOKEN_COOKIE_NAME);
      }
    }

    setIsLoading(false);
    setIsAuthLoaded(true);
  }, []);

  const updateUserContext = useCallback((updatedUserData: User) => {
    const token = updatedUserData.token || user?.token || null;
    const userToStore = { ...updatedUserData };
    delete userToStore.token;

    setUser({ ...updatedUserData, token: token || undefined });

    Cookies.set(USER_COOKIE_NAME, JSON.stringify(userToStore), {
      expires: COOKIE_EXPIRATION_DAYS,
      secure: window.location.protocol === 'https:',
      sameSite: 'Lax',
    });

    if (token) {
      Cookies.set(JWT_TOKEN_COOKIE_NAME, token, {
        expires: COOKIE_EXPIRATION_DAYS,
        secure: window.location.protocol === 'https:',
        sameSite: 'Lax',
      });
    }
  }, [user]);

  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    setIsLoading(true);

    try {
      const apiUrl = API_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let data;
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (err) {
        console.error('Invalid JSON response from server:', text);
        throw new Error(`Invalid server response (Status: ${response.status}). Body: ${text.substring(0, 100)}`);
      }

      if (!response.ok) {
        // Here we handle the specific case of an unapproved user
        if (response.status === 403 && data.user) {
          const unapprovedUser: User = data.user;
          // Set the user in the context, but do not issue a token
          setUser(unapprovedUser);
          setIsLoading(false);
          return unapprovedUser;
        }
        throw new Error(data.message || 'Invalid credentials.');
      }

      const loggedInUser: User = data.user;
      const jwtToken: string = data.token;

      const userWithToken: User = { ...loggedInUser, token: jwtToken };
      setUser(userWithToken);

      Cookies.set(USER_COOKIE_NAME, JSON.stringify(loggedInUser), {
        expires: COOKIE_EXPIRATION_DAYS,
        secure: window.location.protocol === 'https:',
        sameSite: 'Lax',
      });

      Cookies.set(JWT_TOKEN_COOKIE_NAME, jwtToken, {
        expires: COOKIE_EXPIRATION_DAYS,
        secure: window.location.protocol === 'https:',
        sameSite: 'Lax',
      });

      setIsLoading(false);
      return userWithToken;
    } catch (error) {
      setUser(null);
      setIsLoading(false);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    Cookies.remove(USER_COOKIE_NAME);
    Cookies.remove(JWT_TOKEN_COOKIE_NAME);
    setIsLoading(false);
  }, []);

  const contextValue = { user, login, logout, isLoading, isAuthLoaded, updateUserContext };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
