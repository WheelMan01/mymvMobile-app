import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://auto-specs-hub-1.preview.emergentagent.com';
const CACHE_KEY = 'app_logos_cache';
const CACHE_EXPIRY_KEY = 'app_logos_cache_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface LogosResponse {
  logo_light_bg: string | null;
  logo_dark_bg: string | null;
  logo_footer: string | null;
  logo_colored_bg: string | null;
}

interface LogosCache {
  logos: LogosResponse;
  timestamp: number;
}

export const fetchLogosFromAPI = async (): Promise<LogosResponse> => {
  try {
    const response = await axios.get(`${API_BASE}/api/settings`);
    
    if (response.data?.status === 'success' && response.data?.data) {
      return {
        logo_light_bg: response.data.data.logo_light_bg || null,
        logo_dark_bg: response.data.data.logo_dark_bg || null,
        logo_footer: response.data.data.logo_footer || null,
        logo_colored_bg: response.data.data.logo_colored_bg || null,
      };
    }
    
    throw new Error('Invalid API response');
  } catch (error) {
    console.error('Error fetching logos from API:', error);
    throw error;
  }
};

export const fetchLogosWithCache = async (): Promise<LogosResponse> => {
  try {
    // Try to get from cache first
    const cachedData = await AsyncStorage.getItem(CACHE_KEY);
    const cacheExpiry = await AsyncStorage.getItem(CACHE_EXPIRY_KEY);
    
    if (cachedData && cacheExpiry) {
      const expiry = parseInt(cacheExpiry, 10);
      const now = Date.now();
      
      // If cache is still valid
      if (now < expiry) {
        console.log('✅ Using cached logos');
        return JSON.parse(cachedData);
      }
    }
    
    // Cache expired or doesn't exist, fetch from API
    console.log('🔄 Fetching logos from API...');
    const logos = await fetchLogosFromAPI();
    
    // Save to cache
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(logos));
    await AsyncStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
    
    console.log('✅ Logos fetched and cached');
    return logos;
  } catch (error) {
    console.error('Error in fetchLogosWithCache:', error);
    
    // Try to return stale cache as fallback
    const cachedData = await AsyncStorage.getItem(CACHE_KEY);
    if (cachedData) {
      console.log('⚠️ Using stale cache as fallback');
      return JSON.parse(cachedData);
    }
    
    // Return empty logos if all fails
    return {
      logo_light_bg: null,
      logo_dark_bg: null,
      logo_footer: null,
      logo_colored_bg: null,
    };
  }
};

export const clearLogosCache = async (): Promise<void> => {
  await AsyncStorage.removeItem(CACHE_KEY);
  await AsyncStorage.removeItem(CACHE_EXPIRY_KEY);
  console.log('🗑️ Logos cache cleared');
};
