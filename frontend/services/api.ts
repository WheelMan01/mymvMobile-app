import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage'; // DEV ONLY
import { Platform } from 'react-native';

// CRITICAL: This is the SHARED backend API used by both web and mobile apps
// This URL points to the web workspace's backend (Job: 961c0d08...)
// DO NOT CHANGE THIS URL unless instructed by the web developer
const DEFAULT_API_URL = 'https://tokenfix-2.preview.emergentagent.com';
let API_URL = DEFAULT_API_URL;

// Validate and sanitize API URL
const validateApiUrl = (url: string): string => {
  // Fix common issues from fork/copy errors
  if (url.includes('.cc')) {
    console.warn('⚠️ Fixing malformed URL: .cc → .com');
    url = url.replace('.cc', '.com');
  }
  if (url.includes('apicache.fix')) {
    console.warn('⚠️ Fixing malformed URL: apicache.fix → apicache-fix');
    url = url.replace('apicache.fix', 'apicache-fix');
  }
  return url;
};

// DEV ONLY: Load dev configuration
export const loadDevConfig = async () => {
  try {
    const devUrl = await AsyncStorage.getItem('DEV_API_URL');
    if (devUrl) {
      // Validate and fix if needed
      const validUrl = validateApiUrl(devUrl);
      if (validUrl !== devUrl) {
        console.log('🔧 DEV: Auto-fixing malformed URL in AsyncStorage');
        await AsyncStorage.setItem('DEV_API_URL', validUrl);
      }
      API_URL = validUrl;
      console.log('🔧 DEV: Using configured API URL:', API_URL);
    } else {
      console.log('🔧 DEV: Using default API URL:', API_URL);
    }
  } catch (error) {
    console.log('Using default API URL');
  }
};

// Call this on app startup
loadDevConfig();

// Log to verify correct URL is being used
console.log('🔗 [POST-FORK-FIX-v3] Mobile App Backend URL:', DEFAULT_API_URL);
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

// Get current API URL dynamically
const getCurrentApiUrl = async () => {
  try {
    const devUrl = await AsyncStorage.getItem('DEV_API_URL');
    if (devUrl) {
      // Validate and auto-fix if needed
      return validateApiUrl(devUrl);
    }
    return DEFAULT_API_URL;
  } catch (error) {
    return DEFAULT_API_URL;
  }
};

const api = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token AND dynamic baseURL
api.interceptors.request.use(
  async (config) => {
    // CRITICAL: Set baseURL dynamically from AsyncStorage
    const currentApiUrl = await getCurrentApiUrl();
    config.baseURL = `${currentApiUrl}/api`;
    console.log('🔗 Request to:', config.baseURL + config.url);
    
    // DEV ONLY: Try dev token first
    try {
      const devToken = await AsyncStorage.getItem('DEV_TOKEN');
      if (devToken) {
        config.headers.Authorization = `Bearer ${devToken}`;
        console.log('🔧 DEV: Using configured auth token');
        return config;
      }
    } catch (error) {
      console.log('No dev token');
    }
    
    // Fall back to normal auth token
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

export { API_URL };
export default api;
