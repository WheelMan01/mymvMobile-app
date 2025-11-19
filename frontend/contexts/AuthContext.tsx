import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { Platform } from 'react-native';

// Use environment variable directly - more reliable across platforms
const API_URL = 'https://vehicle-photo-app.preview.emergentagent.com';
console.log('🔧 AuthContext API_URL:', API_URL);

// Helper functions for storage (supports both native and web)
const setStorageItem = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getStorageItem = async (key: string) => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const deleteStorageItem = async (key: string) => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  mobile?: string;
  member_id?: string;
  member_number?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  pinLogin: (email: string, pin: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await getStorageItem('auth_token');
      const storedUser = await getStorageItem('user_data');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verify token is still valid
        try {
          const response = await axios.get(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setUser(response.data);
        } catch (error) {
          // Token invalid, clear storage
          await deleteStorageItem('auth_token');
          await deleteStorageItem('user_data');
          setToken(null);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      
      const { access_token, user: userData } = response.data;
      
      await setStorageItem('auth_token', access_token);
      await setStorageItem('user_data', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const pinLogin = async (email: string, pin: string) => {
    try {
      const url = `${API_URL}/api/auth/pin-login`;
      console.log('=== PIN Login Debug ===');
      console.log('URL:', url);
      console.log('Email:', email);
      console.log('PIN:', pin);
      
      const response = await axios.post(url, {
        email: email.toLowerCase().trim(),
        pin
      });
      
      console.log('Success! Response:', response.data);
      
      const { access_token, user: userData } = response.data;
      
      if (!access_token) {
        throw new Error('No access token received from server');
      }
      
      await setStorageItem('auth_token', access_token);
      await setStorageItem('user_data', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
    } catch (error: any) {
      console.error('=== PIN Login Error ===');
      console.error('Full error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error message:', error.message);
      
      // Extract error message properly
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        }
      } else if (error.message && error.message !== 'Network Error') {
        errorMessage = error.message;
      }
      
      console.error('Final error message:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const register = async (email: string, password: string, fullName: string, phone: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        full_name: fullName,
        phone
      });
      
      const { access_token, user: userData } = response.data;
      
      await setStorageItem('auth_token', access_token);
      await setStorageItem('user_data', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const logout = async () => {
    await deleteStorageItem('auth_token');
    await deleteStorageItem('user_data');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, pinLogin, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};