import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// CRITICAL: This is the SHARED backend API used by both web and mobile apps
// This URL points to the web workspace's backend (Job: 961c0d08...)
// DO NOT CHANGE THIS URL unless instructed by the web developer
export const API_URL = 'https://app-bridge-api.preview.emergentagent.com';

// Log to verify correct URL is being used
console.log('🔗 Mobile App Backend URL:', API_URL);
console.log('✅ Connected to shared backend (web workspace)');

// Storage helpers that work on both web and native
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

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await getStorageItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      deleteStorageItem('auth_token');
      deleteStorageItem('user_data');
    }
    return Promise.reject(error);
  }
);

export default api;
